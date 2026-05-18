export interface Achievement {
  id: string
  icon: string
  name: string
  desc: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'one-stroke',      icon: '✏️',  name: 'One-stroke',      desc: 'Clear any level in 1 stroke' },
  { id: 'five-perfect',    icon: '🖊️',  name: 'Five Perfect',    desc: 'Clear 5 levels in 1 stroke each' },
  { id: 'perfect-lab',     icon: '⚗',   name: 'Lab Perfection',  desc: 'All Lab levels with 3★' },
  { id: 'perfect-factory', icon: '⚙',   name: 'Forged Steel',    desc: 'All Factory levels with 3★' },
  { id: 'perfect-castle',  icon: '♛',   name: 'Royal Command',   desc: 'All Castle levels with 3★' },
  { id: 'perfect-space',   icon: '✦',   name: 'Zero Gravity',    desc: 'All Space levels with 3★' },
  { id: 'grand-master',    icon: '👑',  name: 'Grand Master',    desc: 'All 40 levels with 3★' },
  { id: 'completionist',   icon: '🗺️',  name: 'Completionist',   desc: 'Complete all 40 levels' },
  { id: 'daily-first',     icon: '🗓',   name: 'Daily Player',    desc: 'Complete first daily challenge' },
  { id: 'daily-7',         icon: '🔥',  name: '7-Day Streak',    desc: '7 daily challenges in a row' },
  { id: 'daily-30',        icon: '🌟',  name: '30-Day Streak',   desc: '30 daily challenges in a row' },
  { id: 'ball-collector',  icon: '🧲',  name: 'Ball Collector',  desc: 'Unlock all 6 balls' },
  { id: 'rainbow',         icon: '🌈',  name: 'Rainbow',         desc: 'Unlock all 7 ink colors' },
  { id: 'level-creator',   icon: '⚒️',  name: 'Level Creator',   desc: 'Save a custom level in the editor' },
]
