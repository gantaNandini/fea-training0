/**
 * Design tokens used by tests/unit/contrast.test.ts (REQ-305, REQ-321A).
 * Keep these hex values in sync with the @theme / :root / .dark blocks in src/app/globals.css.
 */

export const slate = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
  950: '#020617',
} as const

export const plum = {
  50: '#EEF4FB',
  100: '#DCE8F7',
  200: '#B9D0EF',
  300: '#8DB1E3',
  400: '#5A8AD1',
  500: '#2F63B5',
  600: '#1E4C96',
  700: '#123A78',
  800: '#0B2A5B',
  900: '#071B3F',
} as const

export const coral = {
  400: '#2DD4BF',
  500: '#14B8A6',
  600: '#0F766E',
  700: '#115E59',
} as const

export const semantic = {
  successText: '#15803D',
  warningText: '#B45309',
  dangerText: '#B91C1C',
} as const

export interface ContrastPair {
  name: string
  fg: string
  bg: string
  /** 4.5 for normal text, 3 for large text / UI components */
  min: 4.5 | 3
}

export const contrastPairs: ContrastPair[] = [
  // ── light theme ──
  { name: 'body text on page', fg: slate[900], bg: '#FFFFFF', min: 4.5 },
  { name: 'muted text on page', fg: slate[600], bg: '#FFFFFF', min: 4.5 },
  { name: 'muted text on muted surface', fg: slate[600], bg: slate[100], min: 4.5 },
  { name: 'body text on alt section', fg: slate[900], bg: slate[50], min: 4.5 },
  { name: 'link text on page', fg: plum[700], bg: '#FFFFFF', min: 4.5 },
  { name: 'primary button label', fg: '#FFFFFF', bg: plum[700], min: 4.5 },
  { name: 'gradient start label', fg: '#FFFFFF', bg: plum[700], min: 4.5 },
  { name: 'gradient end label (coral-600)', fg: '#FFFFFF', bg: coral[600], min: 4.5 },
  { name: 'success text on page', fg: semantic.successText, bg: '#FFFFFF', min: 4.5 },
  { name: 'warning text on page', fg: semantic.warningText, bg: '#FFFFFF', min: 4.5 },
  { name: 'danger text on page', fg: semantic.dangerText, bg: '#FFFFFF', min: 4.5 },
  { name: 'focus ring on page', fg: plum[500], bg: '#FFFFFF', min: 3 },
  { name: 'hero text on plum-900 scrim', fg: '#FFFFFF', bg: plum[900], min: 4.5 },
  // ── dark theme ──
  { name: 'dark: body text', fg: slate[50], bg: slate[950], min: 4.5 },
  { name: 'dark: body text on card', fg: slate[50], bg: slate[900], min: 4.5 },
  { name: 'dark: muted text on page', fg: slate[400], bg: slate[950], min: 4.5 },
  { name: 'dark: muted text on muted surface', fg: slate[400], bg: slate[800], min: 4.5 },
  { name: 'dark: link text', fg: plum[300], bg: slate[950], min: 4.5 },
  { name: 'dark: primary button label', fg: '#FFFFFF', bg: plum[600], min: 4.5 },
  { name: 'dark: focus ring', fg: coral[400], bg: slate[950], min: 3 },
]
