export const toy = {
  radius: 22,
  btnRadius: 999,
  shadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 20px rgba(31,26,20,.14), 0 2px 4px rgba(31,26,20,.08)',
  border: '1.5px solid rgba(31,26,20,.12)',
  grain: 0,
} as const

export const palette = {
  paper:     '#FAF4E6',
  paperDeep: '#F1E8D2',
  ink:       '#1F1A14',
  inkSoft:   '#5C5240',
  primary:   '#E25C3B',
  secondary: '#E8B73E',
  tertiary:  '#2E5BB8',
  accent:    '#5BB390',
} as const

export type Palette = typeof palette
export type ToyTheme = typeof toy
