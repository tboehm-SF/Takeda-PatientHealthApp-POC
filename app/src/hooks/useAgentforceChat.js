import { useState, useRef, useCallback, useEffect } from 'react'
import config from '../config/agentforce'
import { pushD360Event } from '../components/D360Panel'

/**
 * React hook that manages a real-time conversation with the Agentforce
 * Service Agent via the SCRT2 REST API (unauthenticated path).
 *
 * Flow:
 *   1.  On first user message → obtain an unauthenticated access token (v1)
 *   2.  Create a conversation (v1)
 *   3.  Poll the v2 entries endpoint for agent responses
 *   4.  Send user messages via v1 and surface agent responses via polling
 */

const SCRT2_BASE = config.scrt2URL
const POLL_INTERVAL_MS = 2000
const POLL_FAST_MS = 1000
const POLL_FAST_COUNT = 5

export default function useAgentforceChat() {
  const [messages, setMessages] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)

  // Refs survive re-renders; cleared on unmount.
  const tokenRef = useRef(null)
  const conversationIdRef = useRef(null)
  const pollingRef = useRef(null)
  const seenEntryIdsRef = useRef(new Set())
  const pollCountRef = useRef(0)
  const hasReceivedWelcomeRef = useRef(false)

  // ---------- helpers ----------

  /** Step 1: Obtain unauthenticated access token (SCRT2 v1) */
  async function getAccessToken() {
    const url = `${SCRT2_BASE}/iamessage/v1/authorization/unauthenticated/accessToken?clientName=Web_v1`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: config.orgId,
        developerName: config.deploymentName,
        capabilitiesVersion: '260',
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Token request failed: ${res.status} ${errText}`)
    }
    const data = await res.json()
    return data.accessToken
  }

  /** Step 2: Create conversation (SCRT2 v1) */
  async function createConversation(token) {
    const url = `${SCRT2_BASE}/iamessage/v1/conversation?clientName=Web_v1`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Conversation creation failed: ${res.status} ${errText}`)
    }
    const data = await res.json()
    return data.conversationId
  }

  /** Step 3: Poll the v2 entries endpoint for agent/chatbot responses */
  function startPolling(token, conversationId) {
    // Stop any existing polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
    }
    pollCountRef.current = 0

    const poll = async () => {
      try {
        const url = `${SCRT2_BASE}/iamessage/api/v2/conversation/${conversationId}/entries`
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Org-Id': config.orgId,
          },
        })
        if (!res.ok) return

        const data = await res.json()
        const entries = data.conversationEntries || []

        let foundNewBotMessage = false

        for (const entry of entries) {
          const entryId = entry.identifier || entry.id || JSON.stringify(entry.sender) + entry.transcriptedTimestamp

          // Skip already-processed entries
          if (seenEntryIdsRef.current.has(entryId)) continue

          // Mark as seen
          seenEntryIdsRef.current.add(entryId)

          // Only surface bot/agent messages (not our own echoes)
          const role = entry.sender?.role
          if (
            entry.entryType === 'Message' &&
            (role === 'Chatbot' || role === 'Agent')
          ) {
            const text = extractText(entry.entryPayload)
            if (text) {
              // The first bot message is the welcome greeting — show it but
              // keep the typing indicator active for the real answer
              if (!hasReceivedWelcomeRef.current) {
                hasReceivedWelcomeRef.current = true
                continue
              }
              foundNewBotMessage = true
              setMessages((prev) => [
                ...prev,
                { id: `bot-${Date.now()}-${Math.random()}`, sender: 'bot', text },
              ])
              pushD360Event('Agent Response Received', 'agentforce')
            }
          }
        }

        if (foundNewBotMessage) {
          setIsTyping(false)
          // Reset to fast polling for follow-up responses
          pollCountRef.current = 0
        }

        pollCountRef.current++
      } catch (err) {
        console.warn('[Agentforce] Poll error:', err.message)
      }
    }

    // Use recursive setTimeout instead of setInterval so the delay
    // adapts dynamically (fast for the first few polls, then slower)
    const scheduleNext = () => {
      const delay = pollCountRef.current < POLL_FAST_COUNT
        ? POLL_FAST_MS
        : POLL_INTERVAL_MS
      pollingRef.current = setTimeout(async () => {
        await poll()
        scheduleNext()
      }, delay)
    }

    // Initial poll after a brief delay to let the server process
    setTimeout(() => {
      poll()
      scheduleNext()
    }, 500)
  }

  /** Pull plain text from the SCRT2 entry payload (handles multiple formats). */
  function extractText(payload) {
    if (!payload) return ''
    // v1/v2 format: entryPayload may be a JSON string
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload)
        return extractText(parsed)
      } catch {
        return payload
      }
    }
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
          startPolling(tokenRef.current, conversationIdRef.current)
          console.log('[Agentforce] Polling started')
          // Brief pause to let the welcome dialog settle before sending
          await new Promise((r) => setTimeout(r, 1500))
          setIsConnecting(false)
        } else {
          // Reset poll counter for fast polling after new message
          pollCountRef.current = 0
        }

        // Send the message (v1 StaticContentMessage format)
        const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const sendUrl = `${SCRT2_BASE}/iamessage/v1/conversation/${conversationIdRef.current}/message?clientName=Web_v1`
        const res = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({
            id: msgId,
            messageType: 'StaticContentMessage',
            staticContent: {
              formatType: 'Text',
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [])

  return { messages, sendMessage, isConnecting, isTyping, error }
}
