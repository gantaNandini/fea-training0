/**
 * Syllabus heading formatter. Cleans up raw import artifacts (underscores, missing spaces, typos)
 * and normalizes ALL-CAPS words into clean title case while preserving technical abbreviations.
 */
const KEEP_UPPER = new Set([
  'API', 'ASME', 'FSS', 'FFS', 'FEA', 'FEM', 'ANSYS', 'DBA', 'NDE', 'UT', 'PAUT', 'TOFD', 'FAD', 'ASTM', 'AWS', 'ISO',
  'PWHT', 'CFD', 'CAD', 'CAE', 'PTB', 'RBI', 'LEFM', 'EPFM', 'CTOD', 'HAZ', 'BPVC', 'PV', 'PD', 'MAWP', 'MDMT',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', '3D', '2D', 'PDF', 'FRP', 'HDPE', 'EN', 'BS', 'TEMA', 'WRC',
])
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'with'])

export function toDisplayTitle(input: string): string {
  if (!input) return ''
  let text = input.trim()
  if (!text) return ''

  // 1. Fix common typos in raw syllabus imports
  text = text.replace(/Interoduction/gi, 'Introduction')

  // 2. Clean up underscores (e.g. "Meshing_Techniques" -> "Meshing Techniques", "METHOD _Horizontal" -> "METHOD - Horizontal")
  text = text.replace(/\s+_\s*/g, ' - ')
  text = text.replace(/_+/g, ' ')

  // 3. Spacing around parenthesized dates or hyphens between words/dates
  text = text.replace(/([A-Za-z0-9])-([A-Za-z0-9])/g, (m, a, b) => {
    if (/[0-9]/.test(a) && /[0-9]/.test(b)) return m
    if (/^(Non|Post|Pre|Anti|Semi|Multi)$/i.test(a)) return m
    return `${a} - ${b}`
  })
  text = text.replace(/([A-Za-z0-9])\(/g, '$1 (')
  text = text.replace(/\)-([A-Za-z0-9])/g, ') - $1')
  text = text.replace(/\)\s*-\s*([A-Za-z0-9])/g, ') - $1')

  // 4. Tokenize and convert words that are in ALL CAPS (unless in KEEP_UPPER)
  text = text.replace(/[A-Za-z0-9'’/-]+/g, (word) => {
    if (/[-/]/.test(word)) {
      return word
        .split(/([-/])/)
        .map((part) => (part === '-' || part === '/' ? part : formatWord(part)))
        .join('')
    }
    return formatWord(word)
  })

  // 5. Clean up multiple spaces
  return text.replace(/\s{2,}/g, ' ').trim()
}

function formatWord(word: string): string {
  const upper = word.toUpperCase()
  if (!/[A-Za-z]/.test(word)) return word
  if (KEEP_UPPER.has(upper)) return upper
  if (/\d/.test(word) && (KEEP_UPPER.has(upper) || /^\d+[A-Z]+$/.test(upper))) return upper

  if (word === upper && word.length > 1) {
    if (SMALL.has(word.toLowerCase())) return word.toLowerCase()
    return cap(word)
  }

  return word
}

function cap(w: string): string {
  const u = w.toUpperCase()
  if (KEEP_UPPER.has(u)) return u
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
}
