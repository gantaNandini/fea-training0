import { describe, expect, it } from 'vitest'
import { codeMatches, generateCode, hashCode, verificationEmail } from '../../src/lib/auth/signup-verification'

describe('signup email code', () => {
  it('generates 6 digits, keeping leading zeros', () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{6}$/)
  })
  it('matches only the right code for the right email', () => {
    const h = hashCode('A@Example.com', '012345')
    expect(codeMatches('a@example.com', '012345', h)).toBe(true) // email is case-insensitive
    expect(codeMatches('a@example.com', '012346', h)).toBe(false)
    expect(codeMatches('b@example.com', '012345', h)).toBe(false)
  })
  it('never puts the code in the stored hash', () => {
    expect(hashCode('a@example.com', '123456')).not.toContain('123456')
  })
  it('email text carries the code and expiry', () => {
    const m = verificationEmail('Asha', '123456')
    expect(m.text).toContain('123456')
    expect(m.text).toContain('10 minutes')
  })
})
