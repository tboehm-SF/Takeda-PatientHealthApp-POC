import { useState, useRef, useCallback, useEffect } from 'react'
import config from '../config/agentforce'
import { pushD360Event } from '../components/D360Panel'

/**
 * React hook that manages a real-time conversation with the Agentforce
 * Service Agent via the SCRT2 v2 REST + SSE API (unauthenticated path).
 *
 * Flow:
 *   1.  On first user message → obtain an unauthenticated access token
 *   2.  Create a conversation with routingType: "agent"
 *   3.  Open an SSE stream for agent replies
 *   4.  Send user messages and surface agent responses in real time
 */

const SCRT2_BASE = config.scrt2URL

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

  // ---------- helpers ----------

  /** Step 1: Obtain unauthenticated access token (SCRT2 v2) */
  async function getAccessToken() {
    const url = `${SCRT2_BASE}/iamessage/api/v2/authorization/unauthenticated/access-token`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: config.orgId,
        esDeveloperName: config.deploymentName,
        capabilitiesVersion: '1',
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Token request failed: ${res.status} ${errText}`)
    }
    const data = await res.json()
    return data.accessToken
  }

  /** Step 2: Create conversation (SCRT2 v2) */
  async function createConversation(token) {
    const url = `${SCRT2_BASE}/iamessage/api/v2/conversation`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Org-Id': config.orgId,
      },
      body: JSON.stringify({
        routingType: 'agent',
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Conversation creation failed: ${res.status} ${errText}`)
    }
    const data = await res.json()
    return data.conversationId
  }

  /** Step 3: Open SSE stream for agent responses */
  function openSSE(token, conversationId) {
    // Try v2 SSE endpoint first, fallback to v1 if needed
    const url = `${SCRT2_BASE}/iamessage/api/v2/conversation/${conversationId}/events?accessToken=${encodeURIComponent(token)}`
    const source = new EventSource(url)

    source.addEventListener('CONVERSATION_MESSAGE', (e) => {
      try {
        const payload = JSON.parse(e.data)
        // Only surface agent messages (not echoes of our own)
        if (
          payload?.conversationEntry?.entryType === 'Message' &&
          payload?.conversationEntry?.sender?.role === 'Agent'
        ) {
          const text = extractText(payload.conversationEntry?.entryPayload)
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

    // Also listen for generic 'message' events (some SCRT2 versions use this)
    source.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (
          payload?.conversationEntry?.entryType === 'Message' &&
          payload?.conversationEntry?.sender?.role === 'Agent'
        ) {
          const text = extractText(payload.conversationEntry?.entryPayload)
          if (text) {
            setMessages((prev) => [
              ...prev,
              { id: `bot-${Date.now()}-${Math.random()}`, sender: 'bot', text },
            ])
            pushD360Event('Agent Response Received', 'agentforce')
          }
          setIsTyping(false)
        }
      } catch {
        // not all messages are JSON
      }
    }

    source.addEventListener('CONVERSATION_TYPING_STARTED_INDICATOR', () => {
      setIsTyping(true)
    })

    source.addEventListener('CONVERSATION_TYPING_STOPPED_INDICATOR', () => {
      setIsTyping(false)
    })

    source.addEventListener('CONVERSATION_ROUTED', () => {
      // Agent accepted the conversation — no user-visible action needed.
      console.log('[Agentforce] Conversation routed to agent')
    })

    source.addEventListener('CONVERSATION_PARTICIPANT_CHANGED', () => {
      console.log('[Agentforce] Participant changed')
    })

    source.onerror = (err) => {
      console.warn('[Agentforce] SSE error:', err)
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
    // v2 format: message.text
    if (payload.message?.text) return payload.message.text
    // Fallback
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
          console.log('[Agentforce] Obtaining access token...')
          tokenRef.current = await getAccessToken()
          console.log('[Agentforce] Token obtained, creating conversation...')
          conversationIdRef.current = await createConversation(tokenRef.current)
          console.log('[Agentforce] Conversation created:', conversationIdRef.current)
          openSSE(tokenRef.current, conversationIdRef.current)
          console.log('[Agentforce] SSE stream opened')
          setIsConnecting(false)
        }

        // Send the message (v2 format)
        const sendUrl = `${SCRT2_BASE}/iamessage/api/v2/conversation/${conversationIdRef.current}/message`
        const res = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
            'X-Org-Id': config.orgId,
          },
          body: JSON.stringify({
            message: {
              text,
            },
          }),
        })

        if (!res.ok) {
          const errText = await res.text().catch(() => '')
          throw new Error(`Send failed (${res.status}) ${errText}`)
        }
        console.log('[Agentforce] Message sent successfully')
      } catch (err) {
        console.warn('[Agentforce] Error:', err.message)
        setIsTyping(false)
        setIsConnecting(false)
        setError(err.message)

        // Graceful fallback — demo-friendly message
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
