import { useApp } from '../context/AppContext'
import { nrsHistory } from '../data/mockData'
import { getForYouNow } from '../data/contentLibrary'
import ContentCard from '../components/ContentCard'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

const STAGE_STEPS = ['Start', 'Wk 1', 'Wk 4', 'Wk 8', 'Wk 12', 'Wk 16', 'Wk 16+']

const cetDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(new Date())

export default function HomeScreen() {
  const { patient, profile, setProfileOpen, todayDoseConfirmed, confirmDose, nrsScore, psodiskScores, checkInSubmitted, setCurrentScreen } = useApp()

  const forYouNow = getForYouNow(nrsScore, psodiskScores, patient.weekOnTherapy).slice(0, 2)

  const chartData = nrsHistory.map((d) => ({ ...d, value: d.value ?? nrsScore })).filter((d) => d.value !== null)

  const dlqiImprovement = patient.dlqiBaseline - patient.dlqiCurrent

  return (
    <>
    <div className="bg-[#f5f8fa] pb-4 screen-enter">
      {/* Header */}
      <div className="bg-white px-5 pt-2 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] text-gray-400 font-medium">{cetDate}</p>
            <h1 className="text-[26px] font-bold text-gray-900 mt-0.5">
              Good morning{patient.name ? `, ${patient.name}` : ''}
            </h1>
          </div>
          <button
            onClick={() => setProfileOpen(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-[15px] mt-1 active:opacity-80 transition-opacity"
          >
            {profile.firstName && profile.lastName
              ? `${profile.firstName[0]}${profile.lastName[0]}`
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
          </button>
        </div>

        {/* Journey stage progress */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min((patient.weekOnTherapy / 16) * 100, 100)}%`,
                background: 'linear-gradient(to right, #2DC8CE, #1A8B91)',
              }}
            />
          </div>
          <span className="text-[12px] font-semibold text-primary whitespace-nowrap">
            {patient.weekOnTherapy <= 16 ? `Week ${patient.weekOnTherapy} of 16` : `Week ${patient.weekOnTherapy}`}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">{patient.treatmentPhase}</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Daily dose CTA */}
        {todayDoseConfirmed ? (
          <div className="card px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-[14px]">{patient.doseLabel}</p>
              <p className="text-[12px] text-green-600 font-medium">Dose confirmed today ✓</p>
            </div>
            <span className="text-[11px] font-bold text-gray-300">{patient.doseTime}</span>
          </div>
        ) : (
          <div className="cta-card px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-[12px] font-medium uppercase tracking-wide">Today's dose</p>
                <p className="text-white font-bold text-[17px] mt-0.5">{patient.doseLabel}</p>
                <p className="text-white/60 text-[12px] mt-0.5">{patient.doseTime} · once daily</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={confirmDose}
                  className="flex items-center gap-1.5 bg-white text-primary font-bold text-[13px] px-4 py-2 rounded-full shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Confirm
                </button>
                <button className="text-white/60 text-[11px]">Missed dose</button>
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-[22px] font-bold text-gray-900">🔥</p>
            <p className="text-[16px] font-bold text-orange-500">{patient.streakDays}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Day streak</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-[16px] font-bold text-primary mt-1">{patient.adherenceRate}%</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Adherence</p>
            <p className="text-[10px] text-gray-300">{patient.daysConfirmed}/{patient.totalDays} days</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-[16px] font-bold text-purple-500 mt-1">−{dlqiImprovement}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">DLQI pts</p>
            <p className="text-[10px] text-gray-300">from baseline</p>
          </div>
        </div>

        {/* NRS sparkline card */}
        <div className="card px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-900 text-[14px]">Itch score (NRS)</p>
              <p className="text-[12px] text-gray-400">Last 13 days</p>
            </div>
            <div className="text-right">
              <span className="text-[24px] font-bold text-gray-900">{nrsScore}</span>
              <span className="text-[14px] text-gray-400">/10</span>
              <p className="text-[11px] text-green-500 font-medium">↓ Trending down</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2DC8CE"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <button
            onClick={() => setCurrentScreen('checkin')}
            className="mt-2 text-[12px] font-semibold text-primary"
          >
            Log today's score →
          </button>
        </div>

        {/* Daily Check-in prompt */}
        {!checkInSubmitted && (
          <button
            onClick={() => setCurrentScreen('checkin')}
            className="w-full card px-4 py-4 flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2DC8CE" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-[14px]">Complete today's check-in</p>
              <p className="text-[12px] text-gray-400">Log NRS + PsOdisk to personalise your content</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {/* For You Now */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-[16px]">
              For You Now
              {checkInSubmitted && (
                <span className="ml-2 text-[11px] font-medium text-primary bg-primary-light px-2 py-0.5 rounded-full">
                  ✦ Updated
                </span>
              )}
            </h2>
            <button onClick={() => setCurrentScreen('education')} className="text-[12px] font-semibold text-primary">See all</button>
          </div>
          <div className="space-y-2">
            {forYouNow.map((item) => (
              <ContentCard key={item.id} item={item} size="compact" />
            ))}
          </div>
        </div>

        {/* Upcoming appointment teaser */}
        <div className="card px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-[13px]">Dermatology review</p>
            <p className="text-[12px] text-gray-400">In 14 days · Dr Patel · Week 6</p>
          </div>
          <span className="ml-auto text-[11px] text-primary font-semibold">Prepare →</span>
        </div>
      </div>
    </div>

    </>
  )
}
