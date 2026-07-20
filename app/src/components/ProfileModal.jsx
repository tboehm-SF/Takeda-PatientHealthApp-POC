import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { pushD360Event } from './D360Panel'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateDeviceId() {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

export default function ProfileModal({ onClose }) {
  const { profile, updateProfile } = useApp()
  const [form, setForm] = useState({ ...profile })

  function handleSave() {
    const prevKnown = Boolean(profile.email && profile.emailConsent)
    const nextKnown = Boolean(form.email && form.emailConsent)

    // Track attribute changes
    if (form.deviceId !== profile.deviceId) {
      pushD360Event(`Device ID Changed → ${form.deviceId}`, 'identity')
    }
    if (form.firstName !== profile.firstName || form.lastName !== profile.lastName) {
      if (form.firstName && form.lastName) {
        pushD360Event(`Name Captured: ${form.firstName} ${form.lastName}`, 'identity')
      } else if (!form.firstName && !form.lastName && profile.firstName) {
        pushD360Event('Name Cleared → Anonymous', 'identity')
      }
    }

    // Identity stitching: anonymous → known
    if (!prevKnown && nextKnown) {
      pushD360Event(`Identity Stitched: Anonymous → Known (${form.email})`, 'identity_resolution')
    } else if (prevKnown && !nextKnown) {
      pushD360Event('Identity Reverted: Known → Anonymous', 'identity_resolution')
    }

    // Consent change
    if (form.emailConsent !== profile.emailConsent) {
      pushD360Event(
        form.emailConsent ? 'Consent Granted (Email)' : 'Consent Revoked (Email)',
        'consent',
      )
    }

    // Email change
    if (form.email && form.email !== profile.email) {
      pushD360Event(`Email Captured: ${form.email}`, 'identity')
    }

    pushD360Event('Profile Saved', 'engagement')
    updateProfile(form)
    onClose()
  }

  function handleDeviceIdChange(e) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setForm(f => ({ ...f, deviceId: val }))
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl z-10 max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="overflow-y-auto px-5 pb-2">
          <h2 className="text-[20px] font-bold text-gray-900 mt-3 mb-3">Your Profile</h2>

          {/* Anonymous mode toggle */}
          <div className="flex items-center justify-between mb-5 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Anonymous mode</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Only device ID &amp; session tracked</p>
            </div>
            <button
              onClick={() => {
                setForm(f => ({
                  ...f,
                  firstName: '',
                  lastName: '',
                  email: '',
                  emailConsent: false,
                }))
              }}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                !form.firstName && !form.lastName && !form.email && !form.emailConsent
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {!form.firstName && !form.lastName && !form.email && !form.emailConsent
                ? '🟡 Anonymous'
                : 'Reset to anonymous'}
            </button>
          </div>

          {/* Quick-fill demo identity */}
          {(!form.firstName || !form.email) && (
            <button
              onClick={() => {
                setForm(f => ({
                  ...f,
                  firstName: 'Sarah',
                  lastName: 'Mitchell',
                  email: 'sarah.mitchell@example.com',
                  emailConsent: true,
                }))
              }}
              className="w-full mb-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-[13px] font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            >
              <span>👤</span> Quick-fill: Sarah Mitchell (demo)
            </button>
          )}

          {/* Device ID */}
          <div className="mb-5">
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Device ID
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 font-mono text-[18px] font-bold tracking-[0.2em] border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:outline-none focus:border-primary"
                value={form.deviceId}
                onChange={handleDeviceIdChange}
              />
              <button
                onClick={() => setForm(f => ({ ...f, deviceId: generateDeviceId() }))}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-colors"
                title="Generate new Device ID"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </button>
            </div>
          </div>

          {/* First / Last name */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                First name
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50 focus:outline-none focus:border-primary"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Last name
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50 focus:outline-none focus:border-primary"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>

          {/* Age */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Age</label>
              <span className="text-[20px] font-bold text-gray-900">{form.age}</span>
            </div>
            <input
              type="range"
              min="18"
              max="99"
              value={form.age}
              onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-gray-400">18</span>
              <span className="text-[11px] text-gray-400">99</span>
            </div>
          </div>

          {/* Treatment start date */}
          <div className="mb-5">
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Treatment start date
            </label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50 focus:outline-none focus:border-primary"
              value={form.treatmentStartDate}
              onChange={e => setForm(f => ({ ...f, treatmentStartDate: e.target.value }))}
            />
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Email address
            </label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50 focus:outline-none focus:border-primary"
              value={form.email}
              placeholder="name@example.com"
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          {/* Email consent toggle */}
          <div className="flex items-start gap-3 mb-6 bg-primary-50 rounded-2xl p-4">
            <button
              onClick={() => setForm(f => ({ ...f, emailConsent: !f.emailConsent }))}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${form.emailConsent ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.emailConsent ? 'translate-x-5' : ''}`}
              />
            </button>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              I agree to receive educational content by email.{' '}
              <a
                href="https://www.takeda.com/privacy-notice/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold underline"
              >
                Privacy notice
              </a>
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-[15px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white text-[15px] font-semibold transition-opacity hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
