import { useApp } from '../context/AppContext'
import { pushD360Event } from './D360Panel'

const PERSONAS = [
  {
    id: 'sarah',
    name: 'Sarah Mitchell',
    age: 34,
    email: 'sarah.mitchell@example.com',
    avatar: 'SM',
    color: 'from-teal-400 to-cyan-500',
    desc: 'Week 4 · Active treatment',
    tag: 'Known',
  },
  {
    id: 'erin',
    name: 'Erin Walsh',
    age: 29,
    email: 'ewalsh@example.com',
    avatar: 'EW',
    color: 'from-violet-400 to-purple-500',
    desc: 'Week 2 · Early response',
    tag: 'Known',
  },
  {
    id: 'rose',
    name: 'Rose Gonzalez',
    age: 42,
    email: 'rgonzalez@example.com',
    avatar: 'RG',
    color: 'from-rose-400 to-pink-500',
    desc: 'Week 8 · Responder',
    tag: 'Known',
  },
  {
    id: 'anon',
    name: 'Anonymous',
    age: 34,
    email: '',
    avatar: '?',
    color: 'from-gray-400 to-gray-500',
    desc: 'No PII · Device only',
    tag: 'Anonymous',
  },
]

export default function DemoPersonas() {
  const { profile, updateProfile } = useApp()

  function applyPersona(persona) {
    const isAnon = persona.id === 'anon'
    const prevKnown = Boolean(profile.email && profile.emailConsent)

    const newProfile = {
      ...profile,
      firstName: isAnon ? '' : persona.name.split(' ')[0],
      lastName: isAnon ? '' : persona.name.split(' ')[1],
      age: persona.age,
      email: persona.email,
      emailConsent: !isAnon,
    }

    // Fire tracking events
    if (isAnon) {
      if (prevKnown) {
        pushD360Event('Identity Reverted: Known → Anonymous', 'identity_resolution')
        pushD360Event('Consent Revoked (Email)', 'consent')
      }
      pushD360Event('Demo Persona: Anonymous', 'engagement', { persona: 'anonymous' })
    } else {
      pushD360Event(`Name Captured: ${newProfile.firstName} ${newProfile.lastName}`, 'identity')
      pushD360Event(`Email Captured: ${persona.email}`, 'identity')
      if (!prevKnown) {
        pushD360Event(`Identity Stitched: Anonymous → Known (${persona.email})`, 'identity_resolution', { email: persona.email })
      }
      pushD360Event('Consent Granted (Email)', 'consent')
      pushD360Event(`Demo Persona: ${persona.name}`, 'engagement', { persona: persona.name })
    }

    pushD360Event('Profile Saved', 'engagement')
    updateProfile(newProfile)
  }

  const activeId = PERSONAS.find(
    (p) =>
      p.email === profile.email &&
      p.name.split(' ')[0] === profile.firstName,
  )?.id ?? ((!profile.firstName && !profile.email) ? 'anon' : null)

  return (
    <div className="demo-personas">
      <div className="demo-personas-hdr">
        <span className="demo-personas-dot" />
        <span>Demo Personas</span>
      </div>
      <div className="demo-personas-list">
        {PERSONAS.map((p) => {
          const isActive = activeId === p.id
          return (
            <button
              key={p.id}
              onClick={() => applyPersona(p)}
              className={`demo-persona-card ${isActive ? 'active' : ''}`}
            >
              <div className={`demo-persona-avatar bg-gradient-to-br ${p.color}`}>
                {p.avatar}
              </div>
              <div className="demo-persona-info">
                <span className="demo-persona-name">{p.name}</span>
                <span className="demo-persona-desc">{p.desc}</span>
              </div>
              <span className={`demo-persona-tag ${p.tag === 'Known' ? 'known' : 'anon'}`}>
                {p.tag}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
