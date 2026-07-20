// Historical NRS scores — 14 days, trending from 8 → 5
export const nrsHistory = [
  { day: 'Jun 18', value: 8 },
  { day: 'Jun 19', value: 8 },
  { day: 'Jun 20', value: 7 },
  { day: 'Jun 21', value: 7 },
  { day: 'Jun 22', value: 7 },
  { day: 'Jun 23', value: 6 },
  { day: 'Jun 24', value: 6 },
  { day: 'Jun 25', value: 6 },
  { day: 'Jun 26', value: 5 },
  { day: 'Jun 27', value: 5 },
  { day: 'Jun 28', value: 6 },
  { day: 'Jun 29', value: 5 },
  { day: 'Jun 30', value: 5 },
  { day: 'Jul 1', value: null }, // today — filled in on check-in
]

// DLQI history (every 4 weeks)
export const dlqiHistory = [
  { label: 'Baseline', value: 18 },
  { label: 'Wk 4', value: 12 },
]

// Daily adherence (last 28 days — true = confirmed, false = missed)
export const adherenceHistory = Array.from({ length: 28 }, (_, i) =>
  i === 6 || i === 14 ? false : true
)

// PsOdisk domain labels
export const psodiskDomains = [
  { key: 'itch', label: 'Itch intensity', description: 'How much has itch bothered you?' },
  { key: 'pain', label: 'Skin pain or discomfort', description: 'Have you had pain or stinging from your skin?' },
  { key: 'scaling', label: 'Scaling & flaking', description: 'How much has scaling or flaking affected you?' },
  { key: 'fatigue', label: 'Fatigue', description: 'Have you felt unusually tired because of your skin?' },
  { key: 'sleep', label: 'Sleep quality', description: 'Has itching or discomfort disturbed your sleep?' },
  { key: 'emotional', label: 'Emotional wellbeing', description: 'Have you felt anxious, depressed, or low because of your skin?' },
  { key: 'body', label: 'Body confidence', description: 'Has psoriasis affected how you feel about your appearance?' },
  { key: 'social', label: 'Social activities', description: 'Has your skin condition stopped you from socialising?' },
  { key: 'work', label: 'Work & daily activities', description: 'Has psoriasis interfered with work or daily tasks?' },
  { key: 'overall', label: 'Overall quality of life', description: 'Overall, how much has psoriasis affected your quality of life this week?' },
]

// Milestone badges
export const milestones = [
  {
    id: 'week4',
    label: 'Week 4 Checkpoint',
    description: 'Completed first month on zasocitinib',
    icon: '🗓',
    earned: true,
    date: 'Today',
  },
  {
    id: 'streak21',
    label: '21-Day Streak',
    description: 'Three weeks of consistent dosing',
    icon: '🔥',
    earned: true,
    date: 'Jun 21',
  },
  {
    id: 'dlqi6',
    label: 'DLQI Improved',
    description: 'Quality of life score improved by 6 points',
    icon: '✨',
    earned: true,
    date: 'Jun 28',
  },
  {
    id: 'pasi75',
    label: 'PASI 75',
    description: '75% skin clearance — coming up at Week 12',
    icon: '🏆',
    earned: false,
    date: 'Est. Week 12',
  },
]
