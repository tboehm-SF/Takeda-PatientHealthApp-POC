import { useState, useEffect } from 'react'
import { pushD360Event } from '../components/D360Panel'

export default function SupportScreen() {
  const [sdkReady, setSdkReady] = useState(false)
  const [chatLaunched, setChatLaunched] = useState(false)

  // Listen for the SDK's button-created event (signals readiness)
  useEffect(() => {
    function onReady() {
      setSdkReady(true)
    }
    window.addEventListener('onEmbeddedMessagingReady', onReady)
    window.addEventListener('onEmbeddedMessagingButtonCreated', onReady)
    // Also check if already ready
    if (window.embeddedservice_bootstrap?.utilAPI) {
      setSdkReady(true)
    }
    return () => {
      window.removeEventListener('onEmbeddedMessagingReady', onReady)
      window.removeEventListener('onEmbeddedMessagingButtonCreated', onReady)
    }
  }, [])

  function handleLaunchChat() {
    pushD360Event('AI Chat Launch', 'click')
    setChatLaunched(true)

    const launch = () => {
      if (window.embeddedservice_bootstrap?.utilAPI?.launchChat) {
        window.embeddedservice_bootstrap.utilAPI
          .launchChat()
          .then(() => console.log('[Agentforce] Chat launched'))
          .catch((err) => console.warn('[Agentforce] Chat launch error:', err))
      } else {
        console.warn('[Agentforce] SDK not ready — retrying in 1s')
        setTimeout(launch, 1000)
      }
    }
    launch()
  }

  return (
    <div className="bg-[#f5f8fa] pb-6 screen-enter">
      {/* Header */}
      <div className="bg-white px-5 pt-2 pb-5">
        <h1 className="text-[26px] font-bold text-gray-900">Support</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Help is always close by</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Agentforce AI chat — launch card */}
        <button
          onClick={handleLaunchChat}
          className="w-full text-left"
        >
          <div
            className="rounded-2xl p-4 text-white"
            style={{ background: 'linear-gradient(135deg, #1a8b91, #2dc8ce)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-[16px]">AI Support Assistant</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-300" />
                  <p className="text-white/80 text-[12px]">Available 24/7 · Powered by Agentforce</p>
                </div>
              </div>
            </div>
            <p className="text-white/80 text-[13px] leading-relaxed">
              Ask me anything about zasocitinib, managing symptoms, or your treatment journey. I'm here whenever you need support.
            </p>
            <div className="mt-3 flex gap-2">
              {['Missed dose?', 'Side effects', 'How it works'].map((q) => (
                <span key={q} className="text-[11px] px-2.5 py-1 rounded-full bg-white/20 font-medium">
                  {q}
                </span>
              ))}
            </div>
          </div>
        </button>

        {chatLaunched && (
          <div className="text-center text-[12px] text-gray-400 py-1">
            Chat window opened — look for the Agentforce chat overlay
          </div>
        )}

        {/* Nurse specialist */}
        <div className="card px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.9a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-[15px]">Dermatology Nurse Specialist</p>
              <p className="text-[12px] text-gray-400">Mon–Fri · 9:00–17:00</p>
            </div>
          </div>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-3">
            Speak directly with a qualified dermatology nurse for clinical questions about your treatment.
          </p>
          <button onClick={() => pushD360Event('Call Nurse Line', 'click')} className="w-full py-3 rounded-xl bg-blue-50 text-blue-600 font-semibold text-[14px] flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.9a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            Call nurse line
          </button>
        </div>

        {/* Refill management */}
        <div className="card px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2DC8CE" strokeWidth="1.8" strokeLinecap="round">
                <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path d="M16 3H8v4h8V3zM8 17v4M16 17v4" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-[15px]">Refill Management</p>
              <p className="text-[12px] text-gray-400">Next refill · 14 days</p>
            </div>
            <span className="pill bg-amber-100 text-amber-700">Due soon</span>
          </div>
          <div className="flex items-center gap-3 bg-amber-50 rounded-xl px-3 py-2.5 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-[12px] text-amber-700 font-medium">
              You have approximately 14 days of zasocitinib remaining
            </p>
          </div>
          <button onClick={() => pushD360Event('Request Refill', 'click')} className="w-full py-3 rounded-xl border-2 border-primary text-primary font-semibold text-[14px]">
            Request refill
          </button>
        </div>

        {/* FAQ */}
        <div className="card px-4 py-4">
          <h3 className="font-bold text-gray-900 text-[15px] mb-3">Frequently asked</h3>
          <div className="space-y-2">
            {[
              'Can I drink alcohol while taking zasocitinib?',
              'What if I have a cold while on treatment?',
              'How do I store my medication?',
              'Are there any foods I should avoid?',
            ].map((q) => (
              <button key={q} onClick={() => pushD360Event(`FAQ: ${q.slice(0, 30)}…`, 'click')} className="w-full text-left flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <p className="text-[13px] text-gray-700 pr-3">{q}</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
