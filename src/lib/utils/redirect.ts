/**
 * REQ-127: only relative paths starting with a single "/" are accepted.
 * Anything with a scheme, "//" prefix, backslash or control characters falls back.
 * (No dependencies, so it is safe to import from edge middleware.)
 */
export function safeRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (/[\\\r\n\t]/.test(value)) return fallback
  return value
}
