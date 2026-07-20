import { useState } from 'react'

export default function ContentCard({ item, size = 'default' }) {
  const [saved, setSaved] = useState(false)

  if (size === 'compact') {
    return (
      <div className="card flex gap-3 p-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.gradient} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <span className={`pill ${item.tagColor} text-[10px] mb-1`}>{item.tag}</span>
          <p className="font-semibold text-[13px] text-gray-900 leading-tight line-clamp-2">{item.title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{item.readTime} read</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex-shrink-0" style={{ width: '200px' }}>
      <div className={`h-24 bg-gradient-to-br ${item.gradient} relative`}>
        <div className="absolute top-2 left-2">
          <span className="pill bg-white/90 text-gray-700 text-[10px]">{item.tag}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setSaved(!saved) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? '#2DC8CE' : 'none'} stroke={saved ? '#2DC8CE' : '#666'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <p className="font-semibold text-[13px] text-gray-900 leading-snug line-clamp-2">{item.title}</p>
        <p className="text-[11px] text-gray-400 mt-1">{item.readTime} read</p>
      </div>
    </div>
  )
}
