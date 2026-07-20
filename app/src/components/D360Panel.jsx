import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

/**
 * RT D360 — Real-time Data Cloud 360 floating debug panel.
 *
 * Sits OUTSIDE the phone frame so it's only visible in the desktop
 * web view (demo/presentation mode). Shows live Data Cloud signals,
 * identity resolution status, consent, and an event log.
 */

// Lightweight in-memory event bus so any component can push events
const listeners = new Set()
const eventLog = []

// Beacon session + device state (mirrors c360a pattern)
let _beaconSessionId = null
let _beaconDeviceId = null

function getBeaconIds() {
  if (!_beaconSessionId) {
    _beaconSessionId = sessionStorage.getItem('d360_session') ||
      (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 18))
    sessionStorage.setItem('d360_session', _beaconSessionId)
  }
  _beaconDeviceId = _beaconDeviceId || 'T4K3D4'
  return { sessionId: _beaconSessionId, deviceId: _beaconDeviceId }
}

export function setBeaconDeviceId(id) {
  _beaconDeviceId = id
}

export function pushD360Event(name, type = 'engagement', detail) {
  const entry = {
    name,
    type,
    detail,
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ts: Date.now(),
  }
  eventLog.unshift(entry)
  if (eventLog.length > 30) eventLog.length = 30
  listeners.forEach((fn) => fn([...eventLog]))

  // ──── Structured beacon-style console logging (mirrors c360a debug output) ────
  const { sessionId, deviceId } = getBeaconIds()
  const eventId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const dateTime = new Date().toISOString()

  // Header line
  console.log(
    `%c[Beacon]%c Sent event: %c${name}`,
    'color: #2dc8ce; font-weight: bold;',
    'color: inherit;',
    'color: #22c55e; font-weight: bold;',
    { interaction: { name, type }, source: { channel: 'PatientApp', url: window.location.href }, user: { sessionId, deviceId, isAnonymous: !detail?.email } },
  )

  // Structured Data Cloud translation (same format as c360a [DEBUG] output)
  const dcEvent = {
    eventType: type,
    eventId,
    dateTime,
    sessionId,
    deviceId,
    interactionName: name,
    sourceUrl: window.location.href,
    sourceChannel: 'PatientApp',
    category: type === 'identity_resolution' ? 'Profile' : type === 'consent' ? 'Consent' : 'Engagement',
  }

  if (type === 'identity' || type === 'identity_resolution') {
    dcEvent.isAnonymous = name.includes('Anonymous') ? 1 : 0
  }
  if (detail) {
    dcEvent.detail = detail
  }

  console.log(
    `%c[Beacon]%c Events translated for Data Cloud:`,
    'color: #0984e3; font-weight: bold;',
    'color: inherit;',
    JSON.stringify([dcEvent], null, 2),
  )
}

function useD360Events() {
  const [events, setEvents] = useState(() => [...eventLog])
  useEffect(() => {
    listeners.add(setEvents)
    return () => listeners.delete(setEvents)
  }, [])
  return events
}

// ─────────── Beacon / session ID ───────────
function getSessionId() {
  return getBeaconIds().sessionId
}

const SCREEN_LABELS = {
  home: 'Home Dashboard',
  checkin: 'Daily Check-In',
  education: 'Education Hub',
  progress: 'Progress Tracker',
  support: 'Support Center',
}

const SCREEN_ZONES = {
  home: 'hero_greeting, dose_tracker, nrs_prompt, treatment_progress',
  checkin: 'nrs_slider, psodisk_wheel, body_map',
  education: 'article_grid, clinical_articles, patient_articles',
  progress: 'bsa_chart, nrs_trend, psodisk_radar',
  support: 'agentforce_chat, nurse_line, refill_mgmt, faq',
}

export default function D360Panel() {
  const [open, setOpen] = useState(false)
  const { currentScreen, profile, todayDoseConfirmed, checkInSubmitted, syncingState, nrsScore } = useApp()
  const events = useD360Events()
  const prevScreen = useRef(currentScreen)
  const sessionId = useRef(getSessionId())

  // Track screen changes as events
  useEffect(() => {
    if (currentScreen !== prevScreen.current) {
      pushD360Event(`${SCREEN_LABELS[currentScreen] || currentScreen} View`, 'screenView')
      prevScreen.current = currentScreen
    }
  }, [currentScreen])

  // Sync device ID to beacon on profile change
  useEffect(() => {
    setBeaconDeviceId(profile.deviceId)
  }, [profile.deviceId])

  // Track initial page view + beacon init
  useEffect(() => {
    const { sessionId, deviceId } = getBeaconIds()
    setBeaconDeviceId(profile.deviceId)

    // Beacon initialization log (mirrors c360a SDK init)
    console.log(
      '%c[Beacon] ══════════════════════════════════════',
      'color: #0984e3;',
    )
    console.log(
      '%c[Beacon] 📊 Data Layer initialized',
      'color: #0984e3; font-weight: bold;',
    )
    console.log(
      `%c[Beacon] 🔑 Session: %c${sessionId.slice(0, 16)}`,
      'color: #0984e3;',
      'color: #a78bfa; font-weight: bold;',
    )
    console.log(
      `%c[Beacon] 📱 Device: %c${profile.deviceId}`,
      'color: #0984e3;',
      'color: #60a5fa; font-weight: bold;',
    )
    console.log(
      `%c[Beacon] 👤 Identity: %c${profile.email ? 'KNOWN' : 'ANONYMOUS'}`,
      'color: #0984e3;',
      `color: ${profile.email ? '#22c55e' : '#facc15'}; font-weight: bold;`,
    )
    console.log(
      `%c[Beacon] 🛡️  Consent: %c${profile.emailConsent ? 'GRANTED' : 'PENDING'}`,
      'color: #0984e3;',
      `color: ${profile.emailConsent ? '#22c55e' : '#facc15'}; font-weight: bold;`,
    )
    console.log(
      '%c[Beacon] 📏 Scroll tracking: %cACTIVE',
      'color: #0984e3;',
      'color: #00b894; font-weight: bold;',
    )
    console.log(
      '%c[Beacon] ⏱️  Time tracking: %cACTIVE',
      'color: #0984e3;',
      'color: #00b894; font-weight: bold;',
    )
    console.log(
      '%c[Beacon] 🖱️  Click tracking: %cACTIVE',
      'color: #0984e3;',
      'color: #00b894; font-weight: bold;',
    )
    console.log(
      '%c[Beacon] ══════════════════════════════════════',
      'color: #0984e3;',
    )

    // Attach anonymous identity log (mirrors c360a)
    console.log(
      `%c[Beacon] Attaching ${profile.email ? 'known' : 'anonymous'} identity: %c${deviceId.slice(0, 16)}`,
      'color: #6c5ce7; font-weight: bold;',
      'color: #a78bfa;',
    )

    pushD360Event(`${SCREEN_LABELS[currentScreen] || currentScreen} View`, 'screenView')
    // Engaged visit after 15s
    const timer = setTimeout(() => pushD360Event('Engaged Visit (15s)', 'engagement'), 15000)
    return () => clearTimeout(timer)
  }, [])

  // Track dose confirmation
  useEffect(() => {
    if (todayDoseConfirmed) pushD360Event('Dose Confirmed', 'adherence')
  }, [todayDoseConfirmed])

  // Track check-in submission
  useEffect(() => {
    if (checkInSubmitted) pushD360Event('Check-In Submitted', 'healthData')
  }, [checkInSubmitted])

  // Track Data Cloud sync
  useEffect(() => {
    if (syncingState === 'syncing') pushD360Event('Data Cloud Sync Started', 'dataSync')
    if (syncingState === 'done') pushD360Event('Data Cloud Sync Complete', 'dataSync')
  }, [syncingState])

  // Track profile changes (identity resolution)
  const prevProfile = useRef(profile)
  useEffect(() => {
    if (prevProfile.current !== profile && prevProfile.current.deviceId !== profile.deviceId) {
      // Device ID change already tracked by ProfileModal
    }
    prevProfile.current = profile
  }, [profile])

  const isKnown = Boolean(profile.email && profile.emailConsent)
  const consentStatus = profile.emailConsent ? 'granted' : 'pending'

  return (
    <>
      {/* Badge (collapsed) */}
      {!open && (
        <div className="d360-badge" onClick={() => setOpen(true)}>
          <span className="d360-dot ok" />
          <span>RT D360</span>
        </div>
      )}

      {/* Expanded panel */}
      <div className={`d360-panel ${open ? 'open' : ''}`}>
        <div className="d360-hdr">
          <div className="d360-hdr-left">
            <span className="d360-dot ok" style={{ animation: 'none' }} />
            <h3>RT D360</h3>
          </div>
          <button className="d360-close" onClick={() => setOpen(false)} title="Close">×</button>
        </div>
        <div className="d360-body">
          {/* SDK Status */}
          <Section icon="⚡" title="SDK Status">
            <Row label="SDK loaded" value={<Green>✓ Active</Green>} />
            <Row label="Beacon" value={<span title={sessionId.current}>{sessionId.current.slice(0, 8)}…</span>} />
            <Row label="Data Cloud" value={
              syncingState === 'syncing'
                ? <span style={{ color: '#facc15' }}>⏳ Syncing…</span>
                : <Green>✓ Connected</Green>
            } />
          </Section>

          {/* Identity */}
          <Section icon="🔑" title="Identity Resolution">
            <Row label="Session ID" value={<span style={{ color: '#a78bfa', fontWeight: 600 }} title={sessionId.current}>{sessionId.current.slice(0, 8)}…</span>} />
            <Row label="Device ID" value={<span style={{ color: '#60a5fa', fontWeight: 600 }}>{profile.deviceId}</span>} />
            <Row label="Patient" value={
              profile.firstName
                ? `${profile.firstName} ${profile.lastName}`
                : <span style={{ color: '#71717a', fontStyle: 'italic' }}>— Not identified</span>
            } />
            <Row label="Email" value={
              profile.email
                ? <span style={{ color: '#34d399' }}>{profile.email}</span>
                : <span style={{ color: '#71717a', fontStyle: 'italic' }}>— None</span>
            } />
            <Row label="Status" value={
              isKnown
                ? <span className="d360-id-badge known">🟢 KNOWN</span>
                : <span className="d360-id-badge anon">🟡 ANONYMOUS</span>
            } />
          </Section>

          {/* Current Screen */}
          <Section icon="📄" title="Current Screen">
            <Row label="Screen" value={SCREEN_LABELS[currentScreen] || currentScreen} />
            <Row label="Content Zones" value={SCREEN_ZONES[currentScreen] || '—'} />
          </Section>

          {/* Consent */}
          <Section icon="🛡️" title="Consent">
            <Row label="Email" value={
              consentStatus === 'granted'
                ? <span className="d360-consent-badge granted">✓ Granted</span>
                : <span className="d360-consent-badge pending">⏳ Pending</span>
            } />
          </Section>

          {/* Health Signals */}
          <Section icon="💊" title="Health Signals">
            <Row label="Dose Today" value={
              todayDoseConfirmed
                ? <Green>✓ Confirmed</Green>
                : <span style={{ color: '#71717a' }}>— Not yet</span>
            } />
            <Row label="NRS Score" value={nrsScore != null ? `${nrsScore}/10` : '—'} />
            <Row label="Check-In" value={
              checkInSubmitted
                ? <Green>✓ Complete</Green>
                : <span style={{ color: '#71717a' }}>— Pending</span>
            } />
          </Section>

          {/* Event Log */}
          <Section icon="📡" title={`Event Log (${events.length})`}>
            {events.length === 0 && (
              <div style={{ color: '#71717a', fontSize: 11, padding: '4px 0' }}>No events yet</div>
            )}
            {events.map((evt, i) => (
              <div key={evt.ts + i} className="d360-evt">
                <div className="d360-evt-hdr">
                  <span className="d360-evt-name">{evt.name}</span>
                  <span className="d360-evt-time">{evt.time}</span>
                </div>
                <div className="d360-evt-type">{evt.type}</div>
              </div>
            ))}
          </Section>
        </div>
      </div>
    </>
  )
}

// ─────── tiny sub-components ───────

function Section({ icon, title, children }) {
  return (
    <div className="d360-sec">
      <div className="d360-sec-title">{icon} {title}</div>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="d360-row">
      <span className="d360-label">{label}</span>
      <span className="d360-val">{value}</span>
    </div>
  )
}

function Green({ children }) {
  return <span style={{ color: '#22c55e' }}>{children}</span>
}
