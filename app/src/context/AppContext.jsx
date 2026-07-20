import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

// Initial "unchecked-in" NRS and PsOdisk values (yesterday's data)
const DEFAULT_NRS = 5
const DEFAULT_PSODISK = {
  itch: 5,
  pain: 3,
  scaling: 4,
  fatigue: 4,
  sleep: 5,
  emotional: 5,
  body: 5,
  social: 4,
  work: 3,
  overall: 4,
}

const DEFAULT_PROFILE = {
  deviceId: 'T4K3D4',
  firstName: '',
  lastName: '',
  age: 34,
  email: '',
  emailConsent: false,
  treatmentStartDate: '2026-06-17', // gives Week 4 from 2026-07-14
}

function computeWeekOnTherapy(startDate) {
  const days = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.floor(days / 7) + 1)
}

function treatmentPhaseLabel(week) {
  if (week <= 4) return 'Early response phase'
  if (week <= 16) return 'Active treatment phase'
  return 'Maintenance phase'
}

const PROFILE_VERSION = 3 // bump to force-reset cached profiles

function loadProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem('zaso_profile'))
    const storedVersion = Number(localStorage.getItem('zaso_profile_v') || 0)
    if (stored && storedVersion >= PROFILE_VERSION) {
      return { ...DEFAULT_PROFILE, ...stored }
    }
    // Version mismatch — clear stale cache and start fresh
    localStorage.removeItem('zaso_profile')
    localStorage.setItem('zaso_profile_v', String(PROFILE_VERSION))
    return DEFAULT_PROFILE
  } catch {
    return DEFAULT_PROFILE
  }
}

// Mock clinical data — not user-editable
const PATIENT_BASE = {
  doseLabel: 'zasocitinib 15mg',
  doseTime: '08:00',
  streakDays: 26,
  dlqiBaseline: 18,
  dlqiCurrent: 12,
  adherenceRate: 93,
  daysConfirmed: 26,
  totalDays: 28,
}

export function AppProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('home')

  // User-editable profile, persisted to localStorage
  const [profile, setProfile] = useState(loadProfile)
  const [profileOpen, setProfileOpen] = useState(false)

  function updateProfile(newProfile) {
    setProfile(newProfile)
    localStorage.setItem('zaso_profile', JSON.stringify(newProfile))
    localStorage.setItem('zaso_profile_v', String(PROFILE_VERSION))
  }

  // patient merges editable identity with mock clinical data + computed week
  const weekOnTherapy = computeWeekOnTherapy(profile.treatmentStartDate)
  const patient = {
    ...PATIENT_BASE,
    name: profile.firstName,
    lastName: profile.lastName,
    weekOnTherapy,
    treatmentPhase: treatmentPhaseLabel(weekOnTherapy),
  }

  // Today's check-in state
  const [todayDoseConfirmed, setTodayDoseConfirmed] = useState(false)
  const [checkInSubmitted, setCheckInSubmitted] = useState(false)
  const [nrsScore, setNrsScore] = useState(DEFAULT_NRS)
  const [psodiskScores, setPsodiskScores] = useState(DEFAULT_PSODISK)
  // Locked at session start so NRS save and PsOdisk submit share the same upsert key
  const [checkInSessionTime] = useState(() => new Date().toISOString())

  // Syncing UI state
  const [syncingState, setSyncingState] = useState(null) // null | 'syncing' | 'personalising' | 'done'

  function syncToDC(nrs, psodisk) {
    fetch('/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: profile.deviceId,
        checkInDatetime: checkInSessionTime,
        weekOnTherapy: patient.weekOnTherapy,
        nrsScore: nrs,
        psodiskScores: psodisk ?? null,
      }),
    }).catch(err => console.warn('DC sync failed (non-blocking):', err.message))
  }

  function saveNrsScore(nrs) {
    setNrsScore(nrs)
    syncToDC(nrs, null)
  }

  // Triggers the Salesforce sync animation and sends full record to Data Cloud
  function submitCheckIn(nrs, psodisk) {
    setNrsScore(nrs)
    setPsodiskScores(psodisk)
    setSyncingState('syncing')
    syncToDC(nrs, psodisk)

    setTimeout(() => setSyncingState('personalising'), 1500)
    setTimeout(() => setSyncingState('done'), 3000)
    setTimeout(() => {
      setSyncingState(null)
      setCheckInSubmitted(true)
      setCurrentScreen('education')
    }, 3800)
  }

  function confirmDose() {
    setTodayDoseConfirmed(true)
    fetch('/adherence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: profile.deviceId,
        doseDatetime: new Date().toISOString(),
        doseConfirmed: true,
        weekOnTherapy: patient.weekOnTherapy,
      }),
    }).catch(err => console.warn('DC adherence sync failed (non-blocking):', err.message))
  }

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        profile,
        updateProfile,
        profileOpen,
        setProfileOpen,
        patient,
        todayDoseConfirmed,
        confirmDose,
        checkInSubmitted,
        nrsScore,
        setNrsScore,
        psodiskScores,
        setPsodiskScores,
        syncingState,
        saveNrsScore,
        submitCheckIn,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
