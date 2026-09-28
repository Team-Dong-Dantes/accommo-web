import { describe, it, expect } from 'vitest'
import { statusGroup, bandOf, ringBackground, circleRing } from './mapPins'
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

  it('fills the ring by beds taken, never past full', () => {
    expect(ringBackground('accredited', 6, 12)).toContain('0 50%')
    expect(ringBackground('accredited', 30, 12)).toContain('0 100%')
    expect(ringBackground('awaiting', 0, 0)).toContain('0 0%')
  })

  it('draws a closed ring the given distance from campus', () => {
    const ring = circleRing(CAMPUS, 3)
    expect(ring[0]).toEqual(ring[ring.length - 1])
    for (const [lng, lat] of ring.filter((_, i) => i % 12 === 0)) {
      expect(kmBetween(CAMPUS.lat, CAMPUS.lng, lat, lng)).toBeCloseTo(3, 1)
    }
  })
})
