import { useState, useRef, useEffect } from 'react'
import useAgentforceChat from '../hooks/useAgentforceChat'

const QUICK_REPLIES = [
  'How does zasocitinib work?',
  'I missed a dose — what now?',
  'Is this side effect normal?',
  'Tips for managing itch',
]

export default function AgentforceChat({ isFullScreen = false, isInline = false, onClose }) {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, sendMessage, isConnecting, isTyping } =
    useAgentforceChat()
  const [input, setInput] = useState('')

  function handleQuickReply(text) {
    sendMessage(text)
  }

  function handleSend() {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  // Inline mode: renders just the chat window, no header or bubble.
  // The parent (SupportScreen) provides its own header + collapse button.
  if (isInline) {
    return (
      <ChatWindow
        messages={messages}
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onQuickReply={handleQuickReply}
        isConnecting={isConnecting}
        isTyping={isTyping}
      />
    )
  }

  if (isFullScreen) {
    return (
      <ChatWindow
        messages={messages}
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onQuickReply={handleQuickReply}
        onClose={onClose}
        isFullScreen
        isConnecting={isConnecting}
        isTyping={isTyping}
      />
    )
  }

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-20 right-4 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center pulse-ring"
          style={{ background: 'linear-gradient(135deg, #1a8b91, #2dc8ce)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
              fill="white"
            />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full border-2 border-white text-white text-[8px] flex items-center justify-center font-bold">
            1
          </span>
        </button>
      )}

      {/* Inline chat panel */}
      {isOpen && (
        <div
          className="absolute bottom-16 right-3 left-3 z-40 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ maxHeight: '420px' }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #1a8b91, #2dc8ce)' }}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AI Support</p>
              <p className="text-white/70 text-[10px]">
                Powered by Agentforce
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto text-white/80 hover:text-white"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ChatWindow
            messages={messages}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onQuickReply={handleQuickReply}
            compact
            isConnecting={isConnecting}
            isTyping={isTyping}
          />
        </div>
      )}
    </>
  )
}

function ChatWindow({
  messages,
  input,
  setInput,
  onSend,
  onQuickReply,
  onClose,
  compact,
  isFullScreen,
  isConnecting,
  isTyping,
}) {
  const scrollRef = useRef(null)

  // Auto-scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  return (
    <div className="flex flex-col" style={{ height: compact ? '340px' : '100%' }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #1a8b91, #2dc8ce)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                msg.sender === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
              }`}
              style={msg.sender === 'user' ? { background: '#2DC8CE' } : {}}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing / connecting indicator */}
        {(isTyping || isConnecting) && (
          <div className="flex justify-start">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #1a8b91, #2dc8ce)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
              </svg>
            </div>
            <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              {isConnecting && (
                <span className="ml-2 text-[11px] text-gray-400">Connecting…</span>
              )}
            </div>
          </div>
        )}

        {/* Quick replies — only show after the welcome message and before user sends anything */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => onQuickReply(q)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-primary text-primary font-medium bg-white hover:bg-primary-light transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 bg-white border-t border-gray-100">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="Ask me anything..."
          className="flex-1 text-[13px] px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary"
          disabled={isConnecting}
        />
        <button
          onClick={onSend}
          disabled={isConnecting || !input.trim()}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          style={{ background: '#2DC8CE' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path
              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
