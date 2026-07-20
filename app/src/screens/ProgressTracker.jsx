import { useApp } from '../context/AppContext'
import { nrsHistory, dlqiHistory, adherenceHistory, milestones } from '../data/mockData'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="font-semibold text-gray-700">{label}</p>
        <p className="text-primary font-bold">NRS: {payload[0].value}/10</p>
      </div>
    )
  }
  return null
}

export default function ProgressTracker() {
  const { patient, nrsScore } = useApp()

  const chartData = nrsHistory
    .map((d) => ({
      ...d,
      value: d.value ?? nrsScore,
    }))
    .slice(-10)

  const dlqiImprovement = patient.dlqiBaseline - patient.dlqiCurrent
  const dlqiPct = Math.round((dlqiImprovement / patient.dlqiBaseline) * 100)

  return (
    <div className="bg-[#f5f8fa] pb-6 screen-enter">
      {/* Header */}
      <div className="bg-white px-5 pt-2 pb-5">
        <h1 className="text-[26px] font-bold text-gray-900">My Progress</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Week {patient.weekOnTherapy} · {patient.name} {patient.lastName}</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* NRS trend chart */}
        <div className="card px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[15px]">Itch Score Trend</h3>
              <p className="text-[12px] text-green-500 font-medium mt-0.5">↓ Down 3 points since starting</p>
            </div>
            <div className="text-right">
              <span className="text-[22px] font-bold text-gray-900">{nrsScore}</span>
              <span className="text-[13px] text-gray-400">/10</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2DC8CE"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2DC8CE', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* DLQI + Adherence row */}
        <div className="grid grid-cols-2 gap-3">
          {/* DLQI */}
          <div className="card px-3 py-3">
            <p className="text-[12px] text-gray-400 font-medium mb-2">DLQI Score</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-[22px] font-bold text-gray-900">{patient.dlqiCurrent}</span>
              <span className="text-[12px] text-gray-400 mb-1">/30</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] text-green-600 font-semibold">−{dlqiImprovement} pts ({dlqiPct}%)</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">From baseline: {patient.dlqiBaseline}</p>
            {/* Mini bar comparison */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-gray-400 w-12">Baseline</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-300 rounded-full" style={{ width: `${(patient.dlqiBaseline / 30) * 100}%` }} />
                </div>
                <span className="text-[9px] text-gray-500 w-4">{patient.dlqiBaseline}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-gray-400 w-12">Week 4</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(patient.dlqiCurrent / 30) * 100}%` }} />
                </div>
                <span className="text-[9px] text-gray-500 w-4">{patient.dlqiCurrent}</span>
              </div>
            </div>
          </div>

          {/* Adherence */}
          <div className="card px-3 py-3">
            <p className="text-[12px] text-gray-400 font-medium mb-2">Dose Adherence</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-[22px] font-bold text-gray-900">{patient.adherenceRate}%</span>
            </div>
            <p className="text-[11px] text-gray-500">{patient.daysConfirmed}/{patient.totalDays} days</p>

            {/* Dot grid */}
            <div className="grid grid-cols-7 gap-1 mt-3">
              {adherenceHistory.map((confirmed, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-sm"
                  style={{ background: confirmed ? '#2DC8CE' : '#FEE2E2' }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <span className="text-[9px] text-gray-400">Confirmed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-100" />
                <span className="text-[9px] text-gray-400">Missed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <h3 className="font-bold text-gray-900 text-[15px] mb-3">Milestones</h3>
          <div className="space-y-2">
            {milestones.map((m) => (
              <div
                key={m.id}
                className={`card px-4 py-3 flex items-center gap-3 ${!m.earned ? 'opacity-50' : ''}`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[20px] flex-shrink-0"
                  style={{ background: m.earned ? '#E3F7F9' : '#f1f5f9' }}
                >
                  {m.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-[13px]">{m.label}</p>
                  <p className="text-[11px] text-gray-400">{m.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {m.earned ? (
                    <div className="flex flex-col items-end">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-[10px] text-gray-400 mt-0.5">{m.date}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400">{m.date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Health Report teaser */}
        <div className="card px-4 py-4 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2DC8CE" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-[14px]">My Health Report</p>
              <p className="text-[12px] text-gray-400">Auto-generated summary for your next HCP visit</p>
            </div>
            <span className="text-[11px] text-gray-300 font-medium">Phase 2</span>
          </div>
        </div>
      </div>
    </div>
  )
}
