/**
 * Syllabus heading formatter. Only ALL-CAPS headings are rewritten into normal title case; headings that are
 * already mixed case are left exactly as authored. Technical abbreviations stay upper case.
 */
const KEEP_UPPER = new Set([
  'API', 'ASME', 'FSS', 'FFS', 'FEA', 'FEM', 'ANSYS', 'DBA', 'NDE', 'UT', 'PAUT', 'TOFD', 'FAD', 'ASTM', 'AWS', 'ISO',
  'PWHT', 'CFD', 'CAD', 'CAE', 'PTB', 'RBI', 'LEFM', 'EPFM', 'CTOD', 'HAZ', 'BPVC', 'PV', 'PD', 'MAWP', 'MDMT',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', '3D', '2D', 'PDF', 'FRP', 'HDPE', 'EN', 'BS', 'TEMA', 'WRC',
])
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'with'])

export function toDisplayTitle(input: string): string {
  const text = input.trim()
  if (!text) return text
  // Mixed or lower case already: leave it alone.
  if (/[a-z]/.test(text)) return text
  // No letters at all (e.g. "1.2"): nothing to do.
  if (!/[A-Z]/.test(text)) return text

  let first = true
  return text.replace(/[A-Za-z0-9][A-Za-z0-9'’/-]*/g, (word) => {
    const upper = word.toUpperCase()
    const isFirst = first
    first = false
    // Hyphenated or slashed compounds: handle each part ("API-579" keeps API; "ELASTIC-PLASTIC" -> "Elastic-Plastic").
    if (/[-/]/.test(word)) {
      return word
        .split(/([-/])/)
        .map((part) => (part === '-' || part === '/' ? part : toDisplayTitle(part) === part && KEEP_UPPER.has(part) ? part : cap(part)))
        .join('')
    }
    if (KEEP_UPPER.has(upper) || /\d/.test(word)) return upper
    if (!isFirst && SMALL.has(upper.toLowerCase())) return upper.toLowerCase()
    return cap(word)
  })
}

function cap(w: string): string {
  const u = w.toUpperCase()
  if (KEEP_UPPER.has(u)) return u
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
}
