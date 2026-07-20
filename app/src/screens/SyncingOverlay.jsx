const STATES = {
  syncing: {
    icon: <SpinnerIcon />,
    title: 'Syncing with Salesforce...',
    sub: 'Sending your check-in data',
    color: '#2DC8CE',
  },
  personalising: {
    icon: <SparkleIcon />,
    title: 'Personalising your content',
    sub: 'Analysing your NRS and PsOdisk scores',
    color: '#7C3AED',
  },
  done: {
    icon: <CheckIcon />,
    title: 'Content updated',
    sub: 'Your Education Hub reflects today\'s data',
    color: '#22C55E',
  },
}

export default function SyncingOverlay({ state }) {
  const config = STATES[state]
  if (!config) return null

  return (
    <div className="syncing-overlay">
      <div className="bg-white rounded-2xl p-6 mx-6 text-center shadow-2xl">
        {/* SF logo bar */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <SalesforceLogoMini />
          <span className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase">Salesforce</span>
        </div>

        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${config.color}18` }}>
          {config.icon}
        </div>

        <p className="font-bold text-gray-900 text-[17px] mb-1">{config.title}</p>
        <p className="text-gray-400 text-[13px]">{config.sub}</p>

        {state !== 'done' && (
          <div className="flex justify-center gap-1.5 mt-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                style={{
                  animation: `bounceDelay 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}

        <style>{`
          @keyframes bounceDelay {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
            40% { transform: scale(1.2); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg className="spin-slow" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2DC8CE" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="#7C3AED">
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.26L4 11l5.91-1.74L12 2z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function SalesforceLogoMini() {
  return (
    <svg width="24" height="17" viewBox="0 0 50 35" fill="none">
      <path d="M20.7 4.7a9.1 9.1 0 016.7-2.9 9.2 9.2 0 017.6 4.1 7 7 0 012.5-.5 7 7 0 017 7 7 7 0 01-1.2 3.9A6.3 6.3 0 0145 20a6.3 6.3 0 01-6.3 6.3H12.6a7.9 7.9 0 01-.7-15.7 9.3 9.3 0 018.8-5.9z" fill="#00A1E0"/>
    </svg>
  )
}
