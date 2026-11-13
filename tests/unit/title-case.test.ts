import { describe, expect, it } from 'vitest'
import { toDisplayTitle } from '@/lib/utils/title-case'

describe('toDisplayTitle', () => {
  it('cleans up raw underscores', () => {
    expect(toDisplayTitle('Meshing_Techniques (11-01-2026)')).toBe('Meshing Techniques (11-01-2026)')
  })

  it('fixes typos like Interoduction', () => {
    expect(toDisplayTitle('Protection Against Plastic Collapse Global Criteria-Interoduction(16-01-2026)')).toBe(
      'Protection Against Plastic Collapse Global Criteria - Introduction (16-01-2026)',
    )
  })

  it('normalizes screaming ALL-CAPS words while preserving technical acronyms like 2D, FEA, ASME', () => {
    expect(
      toDisplayTitle('5.2.2 ELASTIC STRESS ANALYSIS METHOD (17-01-2026)-2D Axisymmetric Approach (16-01-2026)'),
    ).toBe('5.2.2 Elastic Stress Analysis Method (17-01-2026) - 2D Axisymmetric Approach (16-01-2026)')
  })

  it('handles _Horizontal Pressure Vessel properly', () => {
    expect(toDisplayTitle('5.2.2 ELASTIC STRESS ANALYSIS METHOD _Horizontal Pressure Vessel')).toBe(
      '5.2.2 Elastic Stress Analysis Method - Horizontal Pressure Vessel',
    )
  })

  it('preserves clean titles and Roman numerals', () => {
    expect(toDisplayTitle('White Paper II.')).toBe('White Paper II.')
    expect(toDisplayTitle('Substantiation of FEA')).toBe('Substantiation of FEA')
    expect(toDisplayTitle('Difference between shear stress and hydrotest stresses')).toBe(
      'Difference between shear stress and hydrotest stresses',
    )
  })
})

