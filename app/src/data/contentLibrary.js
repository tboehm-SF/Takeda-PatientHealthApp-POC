// Content library — each item has Salesforce-ready trigger conditions.
// When SF integration is live, this array will be replaced by the ranked
// content JSON returned from Marketing Cloud Next personalisation API.
// The personalise() function below mirrors the Salesforce decision logic
// so the demo works end-to-end before the backend is wired.

export const contentLibrary = [
  // ── Itch Management (NRS ≥ 7 trigger) ──────────────────────────────────
  {
    id: 'itch-001',
    title: 'Cooling strategies for persistent itch',
    subtitle: 'Evidence-based ways to break the itch–scratch cycle during treatment',
    category: 'Itch Management',
    tag: 'Symptom relief',
    tagColor: 'bg-orange-100 text-orange-700',
    gradient: 'from-orange-400 to-amber-500',
    readTime: '4 min',
    triggers: { nrsMin: 7 },
    baseScore: 1,
  },
  {
    id: 'itch-002',
    title: 'Why does TYK2 inhibition reduce itch?',
    subtitle: "Understanding the mechanism behind zasocitinib's relief of itch",
    category: 'Itch Management',
    tag: 'Science',
    tagColor: 'bg-blue-100 text-blue-700',
    gradient: 'from-sky-400 to-blue-600',
    readTime: '3 min',
    triggers: { nrsMin: 6 },
    baseScore: 1,
  },
  {
    id: 'itch-003',
    title: 'When to call your dermatology nurse',
    subtitle: 'Signs that your itch needs clinical attention beyond the app',
    category: 'Itch Management',
    tag: 'Clinical guidance',
    tagColor: 'bg-red-100 text-red-700',
    gradient: 'from-rose-400 to-red-500',
    readTime: '2 min',
    triggers: { nrsMin: 8 },
    baseScore: 0,
  },

  // ── Emotional Wellbeing (PsOdisk emotional < 5 trigger) ─────────────────
  {
    id: 'emo-001',
    title: 'Living confidently with psoriasis',
    subtitle: 'Practical strategies for body confidence when your skin is flaring',
    category: 'Wellbeing',
    tag: 'Mental health',
    tagColor: 'bg-purple-100 text-purple-700',
    gradient: 'from-purple-400 to-pink-500',
    readTime: '5 min',
    triggers: { psodiskDomain: 'emotional', psodiskMax: 4 },
    baseScore: 1,
  },
  {
    id: 'emo-002',
    title: 'Psoriasis and mental health: the connection',
    subtitle: 'How chronic skin conditions affect mood and what you can do about it',
    category: 'Wellbeing',
    tag: 'Mental health',
    tagColor: 'bg-purple-100 text-purple-700',
    gradient: 'from-violet-500 to-purple-700',
    readTime: '6 min',
    triggers: { psodiskDomain: 'emotional', psodiskMax: 4 },
    baseScore: 0,
  },
  {
    id: 'body-001',
    title: 'Body positivity with a skin condition',
    subtitle: "Real stories and strategies from people who've been where you are",
    category: 'Wellbeing',
    tag: 'Body confidence',
    tagColor: 'bg-pink-100 text-pink-700',
    gradient: 'from-pink-400 to-rose-500',
    readTime: '4 min',
    triggers: { psodiskDomain: 'body', psodiskMax: 4 },
    baseScore: 1,
  },

  // ── Sleep (PsOdisk sleep < 5 trigger) ──────────────────────────────────
  {
    id: 'sleep-001',
    title: 'Sleep and itch: breaking the night-time cycle',
    subtitle: 'Evening routines that can help you get more restorative sleep',
    category: 'Lifestyle',
    tag: 'Sleep',
    tagColor: 'bg-indigo-100 text-indigo-700',
    gradient: 'from-indigo-500 to-blue-800',
    readTime: '4 min',
    triggers: { psodiskDomain: 'sleep', psodiskMax: 4 },
    baseScore: 1,
  },

  // ── Social (PsOdisk social < 5 trigger) ────────────────────────────────
  {
    id: 'social-001',
    title: 'Talking to others about your psoriasis',
    subtitle: 'Guidance on disclosure, boundaries, and finding community',
    category: 'Lifestyle',
    tag: 'Social wellbeing',
    tagColor: 'bg-teal-100 text-teal-700',
    gradient: 'from-teal-400 to-cyan-600',
    readTime: '5 min',
    triggers: { psodiskDomain: 'social', psodiskMax: 4 },
    baseScore: 1,
  },

  // ── About Zasocitinib (general, higher base score for early stages) ─────
  {
    id: 'zas-001',
    title: 'What to expect in weeks 1–4',
    subtitle: 'A week-by-week guide to your first month on zasocitinib',
    category: 'About Zasocitinib',
    tag: 'Getting started',
    tagColor: 'bg-teal-100 text-teal-700',
    gradient: 'from-teal-400 to-primary-dark',
    readTime: '5 min',
    triggers: { stages: [1, 2, 3, 4] },
    baseScore: 8,
  },
  {
    id: 'zas-002',
    title: 'How TYK2 inhibition works',
    subtitle: "Understanding the science behind zasocitinib and why it's different",
    category: 'About Zasocitinib',
    tag: 'Science',
    tagColor: 'bg-blue-100 text-blue-700',
    gradient: 'from-blue-400 to-indigo-500',
    readTime: '4 min',
    baseScore: 6,
  },
  {
    id: 'zas-003',
    title: 'Dosing: tips for staying on track',
    subtitle: 'Simple habits that make once-daily dosing feel effortless',
    category: 'About Zasocitinib',
    tag: 'Adherence',
    tagColor: 'bg-green-100 text-green-700',
    gradient: 'from-emerald-400 to-green-600',
    readTime: '3 min',
    baseScore: 5,
  },

  // ── Managing Psoriasis ──────────────────────────────────────────────────
  {
    id: 'skin-001',
    title: 'Building a skin care routine during treatment',
    subtitle: 'Moisturisers, cleansers, and products that work with your therapy',
    category: 'Managing Psoriasis',
    tag: 'Skin care',
    tagColor: 'bg-amber-100 text-amber-700',
    gradient: 'from-amber-300 to-yellow-500',
    readTime: '4 min',
    baseScore: 5,
  },
  {
    id: 'skin-002',
    title: 'Week 4 progress: how to assess your response',
    subtitle: 'What improving psoriasis looks like and how to track it',
    category: 'Managing Psoriasis',
    tag: 'Progress',
    tagColor: 'bg-green-100 text-green-700',
    gradient: 'from-green-400 to-teal-500',
    readTime: '3 min',
    triggers: { stages: [4, 5, 6] },
    baseScore: 7,
  },
  {
    id: 'skin-003',
    title: 'Identifying your psoriasis triggers',
    subtitle: 'Stress, diet, weather — learn what drives your flares',
    category: 'Managing Psoriasis',
    tag: 'Triggers',
    tagColor: 'bg-orange-100 text-orange-700',
    gradient: 'from-orange-300 to-red-400',
    readTime: '5 min',
    baseScore: 4,
  },

  // ── Positive reinforcement (low NRS / trending down) ────────────────────
  {
    id: 'pos-001',
    title: 'Your skin is responding — what this means',
    subtitle: 'Understanding early clearance and what to expect at week 8',
    category: 'Managing Psoriasis',
    tag: 'Progress',
    tagColor: 'bg-green-100 text-green-700',
    gradient: 'from-emerald-400 to-cyan-500',
    readTime: '3 min',
    triggers: { nrsMax: 3 },
    baseScore: 2,
  },
]

// ─── Personalisation engine ──────────────────────────────────────────────────
// Mirrors the Salesforce Data Cloud → MC Next decision rules from the PRD.
// When SF is live, this function is replaced by the API call response.

export function personalise(nrs, psodisk, weekOnTherapy) {
  const stage = weekToStage(weekOnTherapy)

  const scored = contentLibrary.map((item) => {
    let score = item.baseScore || 0
    const t = item.triggers

    if (!t) return { ...item, score }

    if (t.nrsMin !== undefined && nrs >= t.nrsMin) score += 10
    if (t.nrsMax !== undefined && nrs <= t.nrsMax) score += 8

    if (t.psodiskDomain && psodisk) {
      const domainVal = psodisk[t.psodiskDomain]
      if (domainVal !== undefined && domainVal <= (t.psodiskMax ?? 4)) score += 10
    }

    if (t.stages && t.stages.includes(stage)) score += 4

    return { ...item, score }
  })

  return scored.sort((a, b) => b.score - a.score)
}

function weekToStage(week) {
  if (week <= 0) return 1
  if (week <= 4) return 4
  if (week <= 16) return 5
  return 7
}

// Top 4 "For You Now" items
export function getForYouNow(nrs, psodisk, weekOnTherapy) {
  return personalise(nrs, psodisk, weekOnTherapy).slice(0, 4)
}

export const categories = [
  { label: 'Itch Management', gradient: 'from-orange-400 to-amber-500', icon: '🌡' },
  { label: 'About Zasocitinib', gradient: 'from-teal-400 to-primary-dark', icon: '💊' },
  { label: 'Managing Psoriasis', gradient: 'from-emerald-400 to-teal-500', icon: '🌿' },
  { label: 'Wellbeing', gradient: 'from-purple-400 to-pink-500', icon: '🧠' },
  { label: 'Lifestyle', gradient: 'from-sky-400 to-blue-500', icon: '☀️' },
]
