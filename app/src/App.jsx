import { AppProvider, useApp } from './context/AppContext'
import StatusBar from './components/StatusBar'
import BottomNav from './components/BottomNav'

import ProfileModal from './components/ProfileModal'
import D360Panel from './components/D360Panel'
import DemoPersonas from './components/DemoPersonas'
import HomeScreen from './screens/HomeScreen'
import DailyCheckIn from './screens/DailyCheckIn'
import EducationHub from './screens/EducationHub'
import ProgressTracker from './screens/ProgressTracker'
import SupportScreen from './screens/SupportScreen'
import ArticleDetail from './screens/ArticleDetail'
import SyncingOverlay from './screens/SyncingOverlay'

function PhoneApp() {
  const { currentScreen, syncingState, profileOpen, setProfileOpen } = useApp()

  const screens = {
    home: HomeScreen,
    checkin: DailyCheckIn,
    education: EducationHub,
    progress: ProgressTracker,
    support: SupportScreen,
    article: ArticleDetail,
  }

  const Screen = screens[currentScreen] || HomeScreen

  return (
    <div className="phone-frame">
      <div className="phone-screen">
        {/* Dynamic Island */}
        <div className="dynamic-island" />

        <StatusBar />

        {/* Screen content */}
        <div className="screen-scroll" key={currentScreen}>
          <Screen />
        </div>

        {currentScreen !== 'article' && <BottomNav />}

        {/* Profile modal — rendered inside phone-screen so it clips to the frame */}
        {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}

        {/* iOS home indicator */}
        <div className="home-indicator">
          <div className="home-indicator-bar" />
        </div>
      </div>

      {/* Salesforce sync overlay — sits outside phone-screen to overlay everything */}
      {syncingState && <SyncingOverlay state={syncingState} />}
    </div>
  )
}

function DemoNote() {
  return (
    <div className="demo-note">
      <span className="demo-note-icon">ℹ️</span>
      <span>
        <strong>Demo mode</strong> — Tap the profile initials to add email &amp; grant consent.
        Identity stitches from anonymous → known in real time.
        Events are logged to the browser console.
      </span>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <D360Panel />
      <PhoneApp />
      <DemoPersonas />
      <DemoNote />
    </AppProvider>
  )
}
