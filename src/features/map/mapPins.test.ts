import { describe, it, expect } from 'vitest'
import { statusGroup, bandOf, boarderRing, circleRing } from './mapPins'
import { CAMPUS, kmBetween } from '@/utils/geo'

describe('mapPins', () => {
  it('folds every accommodation_status into one of three groups', () => {
    expect(statusGroup('accredited')).toBe('accredited')
    for (const s of ['pending', 'reviewing', 'needs_revision']) expect(statusGroup(s)).toBe('awaiting')
    for (const s of ['rejected', 'delisted', 'expired', 'suspended', null, 'something_new']) expect(statusGroup(s)).toBe('not')
  })

  it('bands distances at 1, 3 and 5 km', () => {
    expect(bandOf(0.4).key).toBe('near')
    expect(bandOf(1).key).toBe('close')
    expect(bandOf(4.99).key).toBe('town')
    expect(bandOf(14).key).toBe('far')
  })

  it('rings the boarders by sex, then the free beds, never past full', () => {
    // 5 women and 8 men in 16 beds: pink to 31%, blue to 81%, free beds after.
    const casa = boarderRing(5, 8, 13, 16)
    expect(casa).toContain('#e91e63 0 31%')
    expect(casa).toContain('#42a5f5 31% 81%')
    expect(casa).toContain('81% 100%')
    // One of 13 boarders has no sex on record: a grey sliver before the (empty) free part.
    expect(boarderRing(5, 7, 13, 13)).toContain('var(--c-muted) 92% 100%')
    expect(boarderRing(30, 0, 30, 12)).toContain('#e91e63 0 100%')
    expect(boarderRing(0, 0, 0, 0)).toContain('#e91e63 0 0%')
  })

  it('draws a closed ring the given distance from campus', () => {
    const ring = circleRing(CAMPUS, 3)
    expect(ring[0]).toEqual(ring[ring.length - 1])
    for (const [lng, lat] of ring.filter((_, i) => i % 12 === 0)) {
      expect(kmBetween(CAMPUS.lat, CAMPUS.lng, lat, lng)).toBeCloseTo(3, 1)
    }
  })
})
