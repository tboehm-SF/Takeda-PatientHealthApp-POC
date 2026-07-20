import { AppProvider, useApp } from './context/AppContext'
import StatusBar from './components/StatusBar'
import BottomNav from './components/BottomNav'
import AgentforceChat from './components/AgentforceChat'
import ProfileModal from './components/ProfileModal'
import HomeScreen from './screens/HomeScreen'
import DailyCheckIn from './screens/DailyCheckIn'
import EducationHub from './screens/EducationHub'
import ProgressTracker from './screens/ProgressTracker'
import SupportScreen from './screens/SupportScreen'
import SyncingOverlay from './screens/SyncingOverlay'

function PhoneApp() {
  const { currentScreen, syncingState, profileOpen, setProfileOpen } = useApp()

  const screens = {
    home: HomeScreen,
    checkin: DailyCheckIn,
    education: EducationHub,
    progress: ProgressTracker,
    support: SupportScreen,
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

        {/* Agentforce floating chat (not shown on support screen — full chat there) */}
        {currentScreen !== 'support' && (
          <div className="relative">
            <AgentforceChat />
          </div>
        )}

        <BottomNav />

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

export default function App() {
  return (
    <AppProvider>
      <PhoneApp />
    </AppProvider>
  )
}
