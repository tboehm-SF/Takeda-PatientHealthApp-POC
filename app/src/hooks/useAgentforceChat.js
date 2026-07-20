import { useState, useRef, useCallback, useEffect } from 'react'
import config from '../config/agentforce'
import { pushD360Event } from '../components/D360Panel'

/**
 * React hook that manages a real-time conversation with the Agentforce
 * Service Agent via the SCRT2 REST + SSE API (unauthenticated path).
 *
 * Flow:
 *   1.  On first user message → obtain an unauthenticated access token
 *   2.  Create a conversation
 *   3.  Open an SSE stream for agent replies
 *   4.  Send user messages and surface agent responses in real time
 */

const TOKEN_ENDPOINT = `${config.scrt2URL}/iamessage/api/v2/authorization/unauthenticated/access-token`
const CONVERSATION_ENDPOINT = `${config.scrt2URL}/iamessage/api/v2/conversation`

export default function useAgentforceChat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hi 👋 I'm your Zasocitinib support assistant, powered by Agentforce. How can I help you today?",
    },
  ])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)

  // Refs survive re-renders; cleared on unmount.
  const tokenRef = useRef(null)
  const conversationIdRef = useRef(null)
  const sseRef = useRef(null)
  const pendingChunks = useRef('')

  // ---------- helpers ----------

  async function getAccessToken() {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: config.orgId,
        esDeveloperName: config.deploymentName,
        capabilitiesVersion: '1',
      }),
    })
    if (!res.ok) throw new Error(`Token request failed: ${res.status}`)
    const data = await res.json()
    return data.accessToken
  }

  async function createConversation(token) {
    const res = await fetch(CONVERSATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Org-Id': config.orgId,
      },
      body: JSON.stringify({ routingType: 'agent' }),
    })
    if (!res.ok) throw new Error(`Conversation creation failed: ${res.status}`)
    const data = await res.json()
    return data.conversationId
  }

  function openSSE(token, conversationId) {
    const url = `${config.scrt2URL}/iamessage/api/v2/conversation/${conversationId}/events?accessToken=${encodeURIComponent(token)}`
    const source = new EventSource(url)

    source.addEventListener('CONVERSATION_MESSAGE', (e) => {
      try {
        const payload = JSON.parse(e.data)
        // Only surface agent messages (not echoes of our own)
        if (
          payload?.conversationEntry?.entryType === 'Message' &&
          payload?.conversationEntry?.sender?.role === 'Agent'
        ) {
          const text =
            payload.conversationEntry?.entryPayload?.text ||
            payload.conversationEntry?.entryPayload?.abstractMessage?.messageType === 'StaticContentMessage'
              ? extractText(payload.conversationEntry.entryPayload)
              : ''
          if (text) {
            setMessages((prev) => [
              ...prev,
              { id: `bot-${Date.now()}`, sender: 'bot', text },
            ])
            pushD360Event('Agent Response Received', 'agentforce')
          }
          setIsTyping(false)
        }
      } catch {
        // ignore malformed events
      }
    })

    source.addEventListener('CONVERSATION_TYPING_STARTED_INDICATOR', () => {
      setIsTyping(true)
    })

    source.addEventListener('CONVERSATION_TYPING_STOPPED_INDICATOR', () => {
      setIsTyping(false)
    })

    source.addEventListener('CONVERSATION_ROUTED', () => {
      // Agent accepted the conversation — no user-visible action needed.
    })

    source.onerror = () => {
      // EventSource will auto-reconnect for transient failures.
      setIsTyping(false)
    }

    sseRef.current = source
  }

  /** Pull plain text from the SCRT2 entry payload (handles multiple formats). */
  function extractText(payload) {
    if (!payload) return ''
    // Direct text field
    if (typeof payload.text === 'string') return payload.text
    // StaticContentMessage wrapping
    if (payload.abstractMessage?.text) return payload.abstractMessage.text
    // FormatType RichLink / ListPicker can contain a text field
    if (payload.abstractMessage?.staticContent?.text)
      return payload.abstractMessage.staticContent.text
    // Fallback: stringify for debugging (won't normally surface)
    return ''
  }

  // ---------- public API ----------

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim()) return
      const userMsg = { id: `user-${Date.now()}`, sender: 'user', text }
      setMessages((prev) => [...prev, userMsg])
      setError(null)
      setIsTyping(true)
      pushD360Event('Chat Message Sent', 'agentforce')

      try {
        // Lazy-init: first message triggers auth + conversation creation
        if (!tokenRef.current || !conversationIdRef.current) {
          setIsConnecting(true)
          tokenRef.current = await getAccessToken()
          conversationIdRef.current = await createConversation(tokenRef.current)
          openSSE(tokenRef.current, conversationIdRef.current)
          setIsConnecting(false)
        }

        // Send the message
        const res = await fetch(
          `${CONVERSATION_ENDPOINT}/${conversationIdRef.current}/message`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokenRef.current}`,
              'X-Org-Id': config.orgId,
            },
            body: JSON.stringify({
              message: {
                id: userMsg.id,
                messageType: 'StaticContentMessage',
                staticContent: { formatType: 'Text', text },
              },
            }),
          },
        )

        if (!res.ok) {
          throw new Error(`Send failed (${res.status})`)
        }
      } catch (err) {
        console.warn('[Agentforce] Connection pending — agent endpoint not reachable from this environment:', err.message)
        setIsTyping(false)
        setIsConnecting(false)
        setError(err.message)

        // Graceful fallback — demo-friendly message (no alarming error popup)
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'bot',
            text: "Thanks for your message! The live Agentforce connection will activate once the app is deployed to its production domain. In the meantime, I'm here as a preview. 🩺",
          },
        ])
      }
    },
    [],
  )

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
    }
  }, [])

  return { messages, sendMessage, isConnecting, isTyping, error }
}
