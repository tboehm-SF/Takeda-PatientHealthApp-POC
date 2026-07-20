import { useApp } from '../context/AppContext'
import { pushD360Event } from './D360Panel'

const tabs = [
  {
    id: 'home',
    label: 'Home',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke={active ? '#2DC8CE' : '#94a3b8'}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={active ? '#E3F7F9' : 'none'}
        />
        <path d="M9 21V12h6v9" stroke={active ? '#2DC8CE' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'checkin',
    label: 'Check-in',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={active ? '#2DC8CE' : '#94a3b8'} strokeWidth="1.8" fill={active ? '#E3F7F9' : 'none'} />
        <path d="M12 7v5l3 3" stroke={active ? '#2DC8CE' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'education',
    label: 'Education',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 19V6a1 1 0 011-1h14a1 1 0 011 1v13"
          stroke={active ? '#2DC8CE' : '#94a3b8'}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M4 19h16" stroke={active ? '#2DC8CE' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 10h8M8 13h5" stroke={active ? '#2DC8CE' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 18l4-5 4 3 4-6 4 2"
          stroke={active ? '#2DC8CE' : '#94a3b8'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4 4v16h16" stroke={active ? '#2DC8CE' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'support',
    label: 'Support',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          stroke={active ? '#2DC8CE' : '#94a3b8'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? '#E3F7F9' : 'none'}
        />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { currentScreen, setCurrentScreen } = useApp()

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-100">
      <div className="flex">
        {tabs.map((tab) => {
          const active = currentScreen === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { pushD360Event(`Nav: ${tab.label}`, 'click'); setCurrentScreen(tab.id) }}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 focus:outline-none"
            >
              {tab.icon(active)}
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? '#2DC8CE' : '#94a3b8' }}
              >
                {tab.label}
              </span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
