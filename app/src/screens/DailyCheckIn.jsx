import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { psodiskDomains } from '../data/mockData'

const NRS_LABELS = ['No itch', '', '', 'Mild', '', 'Moderate', '', 'Severe', '', '', 'Worst possible']
const NRS_COLOR = (v) => {
  if (v <= 3) return '#22C55E'
  if (v <= 6) return '#F59E0B'
  return '#EF4444'
}

const cetDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(new Date())

export default function DailyCheckIn() {
  const { patient, nrsScore, psodiskScores, setPsodiskScores, saveNrsScore, submitCheckIn, checkInSubmitted } = useApp()

  const [localNrs, setLocalNrs] = useState(nrsScore)
  const [psodiskStep, setPsodiskStep] = useState(null) // null = not started; 0-9 = in progress; 'done' = complete
  const [localPsodisk, setLocalPsodisk] = useState({ ...psodiskScores })
  const [nrsSaved, setNrsSaved] = useState(false)

  const psodiskDone = psodiskStep === 'done'
  const psodiskStarted = psodiskStep !== null

  function handleSaveNrs() {
    saveNrsScore(localNrs)
    setNrsSaved(true)
    setTimeout(() => setNrsSaved(false), 2000)
  }

  function handleSubmit() {
    submitCheckIn(localNrs, localPsodisk)
  }

  // PsOdisk full-screen flow
  if (psodiskStep !== null && psodiskStep !== 'done') {
    const domain = psodiskDomains[psodiskStep]
    const currentVal = localPsodisk[domain.key]
    const isLast = psodiskStep === psodiskDomains.length - 1

    return (
      <div className="flex flex-col min-h-full bg-white screen-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => setPsodiskStep(psodiskStep === 0 ? null : psodiskStep - 1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="font-semibold text-gray-700 text-[15px]">
            PsOdisk {psodiskStep + 1}/{psodiskDomains.length}
          </span>
          <button onClick={() => setPsodiskStep(null)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 px-5 mb-4">
          {psodiskDomains.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full flex-1 transition-all"
              style={{ background: i <= psodiskStep ? '#2DC8CE' : '#e2e8f0' }}
            />
          ))}
        </div>

        {/* Illustration area */}
        <div
          className="mx-5 rounded-2xl flex items-center justify-center mb-6"
          style={{
            height: '140px',
            background: psodiskStep < 4
              ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)'
              : psodiskStep < 7
              ? 'linear-gradient(135deg, #EDE9FE, #DDD6FE)'
              : 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
          }}
        >
          <PsodiskDomainIcon domain={domain.key} step={psodiskStep} />
        </div>

        {/* Question */}
        <div className="px-5 mb-6">
          <h2 className="text-[20px] font-bold text-gray-900 leading-snug mb-2">{domain.label}</h2>
          <p className="text-[14px] text-gray-500 leading-relaxed">{domain.description}</p>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between px-5 mb-3">
          <span className="text-[11px] text-gray-400 font-medium">0 = Not affected</span>
          <span className="text-[11px] text-gray-400 font-medium">10 = Severely affected</span>
        </div>

        {/* Number grid */}
        <div className="px-5 grid grid-cols-6 gap-2 mb-6">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              className={`num-btn ${currentVal === n ? 'selected' : ''}`}
              onClick={() => setLocalPsodisk((prev) => ({ ...prev, [domain.key]: n }))}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Next */}
        <div className="px-5 mt-auto pb-4">
          <button
            onClick={() => {
              if (isLast) {
                setPsodiskScores(localPsodisk)
                setPsodiskStep('done')
              } else {
                setPsodiskStep(psodiskStep + 1)
              }
            }}
            disabled={currentVal === undefined}
            className="w-full py-4 rounded-2xl font-bold text-white text-[16px] transition-opacity disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1a8b91, #2dc8ce)' }}
          >
            {isLast ? 'Complete PsOdisk' : 'Next →'}
          </button>
        </div>
      </div>
    )
  }

  // Main check-in screen
  return (
    <div className="bg-[#f5f8fa] pb-6 screen-enter">
      {/* Header */}
      <div className="bg-white px-5 pt-2 pb-5">
        <h1 className="text-[26px] font-bold text-gray-900">Daily Check-in</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">{cetDate} · Takes &lt;2 min</p>

        {/* Streak */}
        <div className="flex items-center gap-2 mt-3 bg-orange-50 rounded-xl px-3 py-2">
          <span className="text-[18px]">🔥</span>
          <span className="text-[13px] font-semibold text-orange-600">{patient.streakDays}-day streak</span>
          <span className="text-[12px] text-orange-400">— keep it up!</span>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* NRS Section */}
        <div className="card px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900 text-[15px]">Itch Score (NRS)</h3>
            <div
              className="text-[26px] font-bold"
              style={{ color: NRS_COLOR(localNrs) }}
            >
              {localNrs}
              <span className="text-[14px] text-gray-300">/10</span>
            </div>
          </div>
          <p className="text-[12px] text-gray-400 mb-4">
            How would you rate your itch right now?
          </p>

          <div className="relative">
            <input
              type="range"
              min={0}
              max={10}
              value={localNrs}
              onChange={(e) => setLocalNrs(Number(e.target.value))}
              className="nrs-slider w-full"
              style={{ '--fill': `${localNrs * 10}%` }}
            />
          </div>

          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-gray-400">No itch</span>
            <span className="text-[10px] text-gray-400 font-medium" style={{ color: NRS_COLOR(localNrs) }}>
              {NRS_LABELS[localNrs]}
            </span>
            <span className="text-[10px] text-gray-400">Worst possible</span>
          </div>

          <div className="mt-4 flex justify-end">
            {nrsSaved ? (
              <div className="flex items-center gap-1.5 text-green-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-[13px] font-semibold">Score saved</span>
              </div>
            ) : (
              <button
                onClick={handleSaveNrs}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #1a8b91, #2dc8ce)' }}
              >
                Save NRS score
              </button>
            )}
          </div>
        </div>

        {/* PsOdisk section */}
        <div className="card px-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-gray-900 text-[15px]">PsOdisk Assessment</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">10 domains · &lt;90 seconds</p>
            </div>
            {psodiskDone && (
              <div className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-[11px] font-semibold text-green-600">Done</span>
              </div>
            )}
          </div>

          {psodiskDone ? (
            <div className="space-y-1.5">
              {psodiskDomains.slice(0, 5).map((d) => (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 w-28 truncate">{d.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(localPsodisk[d.key] / 10) * 100}%`,
                        background: localPsodisk[d.key] >= 7 ? '#EF4444' : localPsodisk[d.key] >= 4 ? '#F59E0B' : '#22C55E',
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600 w-4 text-right">
                    {localPsodisk[d.key]}
                  </span>
                </div>
              ))}
              <button
                onClick={() => setPsodiskStep(0)}
                className="text-[12px] text-primary font-semibold mt-1"
              >
                Edit scores
              </button>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-gray-500 mb-3 leading-relaxed">
                Rate 10 aspects of how psoriasis has affected you. Your answers personalise your Education Hub content.
              </p>
              <button
                onClick={() => setPsodiskStep(0)}
                className="w-full py-3 rounded-xl font-semibold text-[14px] border-2 border-primary text-primary"
              >
                Start PsOdisk →
              </button>
            </>
          )}
        </div>

        {/* Submit */}
        {checkInSubmitted ? (
          <div className="card px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-[14px]">Check-in submitted</p>
              <p className="text-[12px] text-gray-400">Your Education Hub has been updated</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!psodiskDone}
            className="w-full py-4 rounded-2xl font-bold text-white text-[16px] transition-opacity disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1a8b91, #2dc8ce)' }}
          >
            {psodiskDone
              ? 'Submit'
              : 'Complete PsOdisk to submit'}
          </button>
        )}

        {!psodiskDone && (
          <p className="text-center text-[12px] text-gray-400">
            Complete the PsOdisk to unlock personalised content
          </p>
        )}
      </div>
    </div>
  )
}

function PsodiskDomainIcon({ domain, step }) {
  const icons = {
    itch: '🌡',
    pain: '⚡',
    scaling: '❄️',
    fatigue: '😴',
    sleep: '🌙',
    emotional: '💜',
    body: '🪞',
    social: '👥',
    work: '💼',
    overall: '⭐',
  }
  return (
    <div className="text-center">
      <div className="text-[52px]">{icons[domain] || '📊'}</div>
    </div>
  )
}
