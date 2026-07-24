/**
 * Demo Personas Configuration
 * ──────────────────────────────────────────────────────
 * Add a new persona by copying one of the objects below
 * and filling in the fields. The app will pick it up
 * automatically — no other code changes needed.
 *
 * Fields:
 *   id      – unique slug (lowercase, no spaces)
 *   name    – full display name
 *   age     – number
 *   email   – email string (leave '' for anonymous)
 *   avatar  – 1-2 char initials shown in the circle
 *   color   – Tailwind gradient classes for the avatar
 *   desc    – short treatment context line
 *   tag     – 'Known' or 'Anonymous'
 */

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

export default PERSONAS
