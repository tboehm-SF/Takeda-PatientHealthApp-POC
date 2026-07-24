import { useApp } from '../context/AppContext'
import { pushD360Event } from './D360Panel'
import PERSONAS from '../data/personas'

export default function SideNav() {
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
    <div className="side-nav">
      <div className="side-nav-hdr">
        <span className="side-nav-dot" />
        <span>Demo Controls</span>
      </div>

      <div className="side-nav-body">
        {/* ── Personas ── */}
        <div className="side-nav-section">
          <div className="side-nav-section-title">
            <span>👤</span>
            <span>Personas</span>
          </div>
          <div className="side-nav-personas">
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

        {/* ── Architecture Links ── */}
        <div className="side-nav-section">
          <div className="side-nav-section-title">
            <span>🏗️</span>
            <span>Architecture</span>
          </div>
          <div className="side-nav-links">
            <a
              href="/architecture.html#enrichment"
              target="_blank"
              rel="noopener noreferrer"
              className="side-nav-link"
            >
              <span className="side-nav-link-icon">⚡</span>
              <span>Architecture Enrichment</span>
            </a>
            <a
              href="/architecture.html#datamodel"
              target="_blank"
              rel="noopener noreferrer"
              className="side-nav-link"
            >
              <span className="side-nav-link-icon">🗂️</span>
              <span>Data Model</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
