export default function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-16 pb-1 bg-white flex-shrink-0">
      <span className="text-[15px] font-semibold text-gray-900 tracking-tight">9:41</span>
      <div className="flex items-center gap-1.5">
        {/* Signal bars */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="6" width="3" height="6" rx="1" fill="#1c1c1e" />
          <rect x="4.5" y="4" width="3" height="8" rx="1" fill="#1c1c1e" />
          <rect x="9" y="2" width="3" height="10" rx="1" fill="#1c1c1e" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#1c1c1e" opacity="0.3" />
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 10a1 1 0 100-2 1 1 0 000 2z" fill="#1c1c1e" />
          <path d="M4.9 7.1a4.4 4.4 0 016.2 0" stroke="#1c1c1e" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 4.2a8.1 8.1 0 0112 0" stroke="#1c1c1e" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {/* Battery */}
        <div className="flex items-center gap-0.5">
          <div className="relative w-[25px] h-[12px] border-[1.5px] border-gray-800 rounded-[3px]">
            <div className="absolute inset-[1.5px] bg-gray-900 rounded-[1px]" style={{ right: '4px' }} />
          </div>
          <div className="w-[2px] h-[5px] bg-gray-800 rounded-r-sm" />
        </div>
      </div>
    </div>
  )
}
