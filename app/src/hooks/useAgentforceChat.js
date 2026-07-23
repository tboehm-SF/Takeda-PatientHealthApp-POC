import { useState, useRef, useCallback, useEffect } from 'react'
import config from '../config/agentforce'
import { pushD360Event } from '../components/D360Panel'

/**
 * React hook that manages a real-time conversation with the Agentforce
 * Service Agent via the SCRT2 REST API (unauthenticated path).
 *
 * Optimised flow:
 *   1.  On mount → pre-warm: obtain an access token + create a conversation
 *       so the session is ready before the user's first message
 *   2.  Connect to the SSE event-router endpoint for instant, push-based
 *       delivery of agent responses (replaces polling)
 *   3.  Fall back to polling only if SSE fails (e.g. CORS / proxy issues)
 *   4.  Send user messages via v1 StaticContentMessage format
 */

const SCRT2_BASE = config.scrt2URL

// Polling fallback constants (only used if SSE fails)
const POLL_INTERVAL_MS = 2000
const POLL_FAST_MS = 800
const POLL_FAST_COUNT = 8

export default function useAgentforceChat() {
  const [messages, setMessages] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)

  // Refs survive re-renders; cleared on unmount.
  const tokenRef = useRef(null)
  const conversationIdRef = useRef(null)
  const abortRef = useRef(null)          // SSE AbortController
  const pollingRef = useRef(null)        // fallback polling timer
  const seenEntryIdsRef = useRef(new Set())
  const pollCountRef = useRef(0)
  const hasReceivedWelcomeRef = useRef(false)
  const sessionReadyRef = useRef(null)   // resolves when pre-warm finishes
  const usingSSERef = useRef(false)      // true once SSE is active

  // ──────────────────── helpers ────────────────────

  /** Obtain unauthenticated access token (SCRT2 v1) */
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

  /** Create conversation (SCRT2 v1) */
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

  // ──────────────────── SSE (primary) ────────────────────

  /**
   * Connect to the SCRT2 SSE event-router using fetch + ReadableStream.
   * We can't use the native EventSource API because it doesn't support
   * custom Authorization headers. Instead we stream the response body
   * manually and parse SSE frames ourselves.
   */
  function connectSSE(token, conversationId) {
    const controller = new AbortController()
    abortRef.current = controller

    const sseUrl = `${SCRT2_BASE}/eventrouter/v1/sse`

    ;(async () => {
      try {
        const res = await fetch(sseUrl, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
            'X-Org-Id': config.orgId,
          },
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          console.warn('[Agentforce] SSE connection failed, falling back to polling')
          startPolling(token, conversationId)
          return
        }

        usingSSERef.current = true
        console.log('[Agentforce] SSE connected ✓')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE frames are separated by double newlines
          const frames = buffer.split('\n\n')
          // Keep the last (possibly incomplete) chunk
          buffer = frames.pop() || ''

          for (const frame of frames) {
            if (!frame.trim()) continue
            handleSSEFrame(frame)
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return // intentional teardown
        console.warn('[Agentforce] SSE stream error, falling back to polling:', err.message)
        if (!usingSSERef.current) {
          startPolling(token, conversationId)
        }
      }
    })()
  }

  /** Parse and act on a single SSE frame */
  function handleSSEFrame(frame) {
    let eventType = ''
    let dataLines = []

    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
    }

    if (dataLines.length === 0) return

    let data
    try {
      data = JSON.parse(dataLines.join('\n'))
    } catch {
      return // not valid JSON — skip
    }

    const entryType = eventType || data?.conversationEntry?.entryType || data?.entryType || ''

    switch (entryType) {
      case 'CONVERSATION_MESSAGE':
      case 'Message':
        handleIncomingMessage(data)
        break

      case 'CONVERSATION_TYPING_STARTED_INDICATOR':
      case 'TypingStartedIndicator':
        setIsTyping(true)
        break

      case 'CONVERSATION_TYPING_STOPPED_INDICATOR':
      case 'TypingStoppedIndicator':
        // Only clear typing if we already have at least one bot response
        if (hasReceivedWelcomeRef.current) {
          setIsTyping(false)
        }
        break

      case 'CONVERSATION_ROUTING_RESULT':
      case 'RoutingResult':
        console.log('[Agentforce] Routing result received')
        break

      default:
        // Silently ignore other event types
        break
    }
  }

  /** Process an incoming message from either SSE or polling */
  function handleIncomingMessage(data) {
    // Normalise: SSE wraps in conversationEntry, polling doesn't
    const entry = data?.conversationEntry || data
    const role = entry?.sender?.role
    const entryId =
      entry?.identifier ||
      entry?.id ||
      JSON.stringify(entry?.sender) + entry?.transcriptedTimestamp

    // Deduplicate
    if (entryId && seenEntryIdsRef.current.has(entryId)) return
    if (entryId) seenEntryIdsRef.current.add(entryId)

    // Only surface bot/agent messages (not our own echoes)
    if (role !== 'Chatbot' && role !== 'Agent') return

    const text = extractText(entry?.entryPayload)
    if (!text) return

    // The first bot message is the welcome greeting — skip it because
    // we already show a static welcome in the UI
    if (!hasReceivedWelcomeRef.current) {
      hasReceivedWelcomeRef.current = true
      return
    }

    setIsTyping(false)
    setMessages((prev) => [
      ...prev,
      { id: `bot-${Date.now()}-${Math.random()}`, sender: 'bot', text },
    ])
    pushD360Event('Agent Response Received', 'agentforce')
  }

  // ──────────────────── Polling (fallback) ────────────────────

  /** Fall back to polling the v2 entries endpoint if SSE can't connect */
  function startPolling(token, conversationId) {
    if (pollingRef.current) clearTimeout(pollingRef.current)
    pollCountRef.current = 0
    console.log('[Agentforce] Using polling fallback')

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
          const entryId =
            entry.identifier ||
            entry.id ||
            JSON.stringify(entry.sender) + entry.transcriptedTimestamp
          if (seenEntryIdsRef.current.has(entryId)) continue
          seenEntryIdsRef.current.add(entryId)

          const role = entry.sender?.role
          if (
            entry.entryType === 'Message' &&
            (role === 'Chatbot' || role === 'Agent')
          ) {
            const text = extractText(entry.entryPayload)
            if (text) {
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
          pollCountRef.current = 0
        }
        pollCountRef.current++
      } catch (err) {
        console.warn('[Agentforce] Poll error:', err.message)
      }
    }

    const scheduleNext = () => {
      const delay =
        pollCountRef.current < POLL_FAST_COUNT ? POLL_FAST_MS : POLL_INTERVAL_MS
      pollingRef.current = setTimeout(async () => {
        await poll()
        scheduleNext()
      }, delay)
    }

    setTimeout(() => {
      poll()
      scheduleNext()
    }, 300)
  }

  // ──────────────────── Payload helpers ────────────────────

  /** Pull plain text from the SCRT2 entry payload (handles multiple formats). */
  function extractText(payload) {
    if (!payload) return ''
    if (typeof payload === 'string') {
      try {
        return extractText(JSON.parse(payload))
      } catch {
        return payload
      }
    }
    if (typeof payload.text === 'string') return payload.text
    if (payload.abstractMessage?.text) return payload.abstractMessage.text
    if (payload.abstractMessage?.staticContent?.text)
      return payload.abstractMessage.staticContent.text
    if (payload.message?.text) return payload.message.text
    return ''
  }

  // ──────────────────── Pre-warm ────────────────────

  /**
   * Pre-warm the session on mount: obtain the access token and create the
   * conversation in the background so there's no delay on the first message.
   */
  useEffect(() => {
    let cancelled = false

    const warmUp = async () => {
      try {
        console.log('[Agentforce] Pre-warming session…')
        const token = await getAccessToken()
        if (cancelled) return

        const conversationId = await createConversation(token)
        if (cancelled) return

        tokenRef.current = token
        conversationIdRef.current = conversationId
        console.log('[Agentforce] Session ready:', conversationId)

        // Try SSE first, fall back to polling
        connectSSE(token, conversationId)
      } catch (err) {
        console.warn('[Agentforce] Pre-warm failed (will retry on first message):', err.message)
        // Not fatal — sendMessage will lazy-init if pre-warm didn't finish
      }
    }

    // Wrap in a promise so sendMessage can await it
    sessionReadyRef.current = warmUp()

    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────── public API ────────────────────

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim()) return
      const userMsg = { id: `user-${Date.now()}`, sender: 'user', text }
      setMessages((prev) => [...prev, userMsg])
      setError(null)
      setIsTyping(true)
      pushD360Event('Chat Message Sent', 'agentforce')

      try {
        // Wait for pre-warm if it's still in progress
        if (sessionReadyRef.current) {
          await sessionReadyRef.current
        }

        // Lazy-init if pre-warm failed or hasn't finished
        if (!tokenRef.current || !conversationIdRef.current) {
          setIsConnecting(true)
          console.log('[Agentforce] Lazy-init: obtaining access token…')
          tokenRef.current = await getAccessToken()
          conversationIdRef.current = await createConversation(tokenRef.current)
          connectSSE(tokenRef.current, conversationIdRef.current)
          // Brief pause to let the welcome dialog settle
          await new Promise((r) => setTimeout(r, 800))
          setIsConnecting(false)
        } else {
          // Reset poll counter for fast polling after new message (fallback mode)
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
        console.log('[Agentforce] Message sent ✓')
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

  // Cleanup SSE + polling on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [])

  return { messages, sendMessage, isConnecting, isTyping, error }
}
