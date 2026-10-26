/**
 * Deterministic SVG placeholder generator. Resolves `placeholder:{key}` image values to a data URI.
 * Palette is chosen by the category slug contained in the key (so each category looks different);
 * the abstract mesh varies per key. Replace with real images by changing the DB value (REQ-001).
 */

type Palette = { from: string; to: string; accent: string }

const PALETTES: Record<string, Palette> = {
  'vibration-analysis': { from: '#0B3C5D', to: '#1B8A9A', accent: '#BDF0F0' },
  'fracture-mechanics': { from: '#0B2A5B', to: '#1B8A9A', accent: '#D5F5F5' },
  'rotor-dynamics': { from: '#1E3A5F', to: '#3E6FB0', accent: '#CFE3FF' },
  'advanced-training': { from: '#071B3F', to: '#1E5AA8', accent: '#DCE8F7' },
  'pressure-vessel': { from: '#2D3A4A', to: '#5B7083', accent: '#E3EAF0' },
  'offshore-wind': { from: '#0B4F6C', to: '#2A9D8F', accent: '#D5F5EE' },
  'pump-design': { from: '#1F4E3D', to: '#3E8E6B', accent: '#D6F5E6' },
  webinars: { from: '#5A2D0C', to: '#C26A1B', accent: '#FFE6C7' },
  hero: { from: '#071B3F', to: '#123A78', accent: '#B9D0EF' },
}

const FALLBACK: Palette = { from: '#071B3F', to: '#1E5AA8', accent: '#DCE8F7' }

export function isPlaceholder(src?: string | null): src is string {
  return !!src && src.startsWith('placeholder:')
}

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: number) {
  let a = seed || 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickPalette(key: string): Palette {
  for (const slug of Object.keys(PALETTES)) {
    if (key.includes(slug)) return PALETTES[slug]
  }
  if (key.startsWith('hero')) return PALETTES.hero
  return FALLBACK
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function initials(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Simple geometric glyph per category family (decorative, centred at 320,180). */
function glyph(key: string, color: string): string {
  const stroke = `stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"`
  if (key.includes('vibration'))
    return `<path d="M200 180 q30 -70 60 0 t60 0 t60 0 t60 0" ${stroke}/>`
  if (key.includes('fracture'))
    return `<path d="M240 110 L300 170 L270 190 L340 250" ${stroke}/><circle cx="240" cy="110" r="10" fill="${color}" opacity="0.9"/>`
  if (key.includes('rotor'))
    return `<circle cx="320" cy="180" r="48" ${stroke}/><circle cx="320" cy="180" r="12" fill="${color}"/><path d="M320 120 V132 M320 228 V240 M260 180 H272 M368 180 H380" ${stroke}/>`
  if (key.includes('pressure'))
    return `<rect x="270" y="120" width="100" height="120" rx="40" ${stroke}/><path d="M270 150 H370 M270 210 H370" ${stroke}/>`
  if (key.includes('wind'))
    return `<path d="M320 190 V250 M320 190 L320 120 M320 190 L268 220 M320 190 L372 220" ${stroke}/><circle cx="320" cy="190" r="8" fill="${color}"/>`
  if (key.includes('pump'))
    return `<circle cx="320" cy="180" r="50" ${stroke}/><path d="M320 130 V100 M370 180 H410" ${stroke}/><path d="M300 180 a20 20 0 1 1 20 20" ${stroke}/>`
  if (key.includes('webinar'))
    return `<rect x="250" y="140" width="100" height="70" rx="10" ${stroke}/><path d="M350 165 L395 140 V210 L350 185" ${stroke}/>`
  return `<path d="M250 230 L320 120 L390 230 Z" ${stroke}/><circle cx="320" cy="190" r="14" ${stroke}/>`
}

export function buildPlaceholderSvg(key: string, label?: string): string {
  const k = key.replace(/^placeholder:/, '')

  // Client logos: quiet neutral tile with initials.
  if (k.startsWith('logo')) {
    const text = esc(initials(label ?? k) || 'LOGO')
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 96" role="img">` +
      `<rect width="240" height="96" rx="12" fill="#F1F5F9"/>` +
      `<rect x="1" y="1" width="238" height="94" rx="11" fill="none" stroke="#CBD5E1"/>` +
      `<text x="120" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#475569">${text}</text>` +
      `</svg>`
    )
  }

  // Avatars: circle with initials.
  if (k.startsWith('avatar')) {
    const p = pickPalette(k)
    const text = esc(initials(label ?? 'U') || 'U')
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.from}"/><stop offset="1" stop-color="${p.to}"/></linearGradient></defs>` +
      `<rect width="96" height="96" fill="url(#g)"/>` +
      `<text x="48" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF">${text}</text>` +
      `</svg>`
    )
  }

  const p = pickPalette(k)
  const rand = rng(hash(k))
  const circles = Array.from({ length: 7 }, () => {
    const cx = Math.round(rand() * 640)
    const cy = Math.round(rand() * 360)
    const r = Math.round(40 + rand() * 120)
    const o = (0.06 + rand() * 0.14).toFixed(2)
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.accent}" opacity="${o}"/>`
  }).join('')
  const lines = Array.from({ length: 6 }, (_, i) => {
    const y = 40 + i * 56
    return `<path d="M0 ${y} C 160 ${y - 30 + Math.round(rand() * 60)}, 480 ${y + 30 - Math.round(rand() * 60)}, 640 ${y}" stroke="${p.accent}" stroke-opacity="0.18" fill="none" stroke-width="2"/>`
  }).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" role="img">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.from}"/><stop offset="1" stop-color="${p.to}"/></linearGradient></defs>` +
    `<rect width="640" height="360" fill="url(#g)"/>${circles}${lines}${k.startsWith('hero') ? '' : glyph(k, p.accent)}` +
    `</svg>`
  )
}

export function resolvePlaceholder(key: string, label?: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(buildPlaceholderSvg(key, label))}`
}
