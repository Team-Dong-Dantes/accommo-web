import { describe, expect, it } from 'vitest'
import { consoleScale } from './consoleScale'

describe('consoleScale', () => {
  it('leaves the design size and up alone', () => {
    expect(consoleScale(1440, 900)).toBe(1)
    expect(consoleScale(2560, 1440)).toBe(1)
  })
  it('shrinks by the tighter side', () => {
    expect(consoleScale(1366, 768)).toBe(0.85)
    expect(consoleScale(1536, 730)).toBe(0.81)
  })
  it('stops at the floor on a small tablet', () => {
    expect(consoleScale(1024, 600)).toBe(0.75)
  })
})
