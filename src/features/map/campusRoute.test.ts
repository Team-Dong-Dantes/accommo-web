import { describe, it, expect } from 'vitest'
import { cardSide, midpointAlong, walkDistance, walkMinutes, type Coord } from './campusRoute'

describe('campusRoute', () => {
  it('puts the label half way along the walk, not at the middle vertex', () => {
    // Three short legs bunched at the start, then one long leg: the middle
    // vertex is near the start, but half the distance is out on the long leg.
    const route: Coord[] = [[0, 0], [0.0001, 0], [0.0002, 0], [0.0003, 0], [0.01, 0]]
    expect(midpointAlong(route)).toEqual([0.01, 0])
  })

  it('reads metres under a kilometre and one decimal above', () => {
    expect(walkDistance(649.6)).toBe('650 m')
    expect(walkDistance(1440)).toBe('1.4 km')
  })

  it('moves the card off whichever side the route takes', () => {
    const pin = { lat: 0, lng: 0 }
    // South to campus: the space above the pin is free.
    expect(cardSide(pin, [[0, 0], [0, -0.01], [0.01, -0.02]])).toBe('above')
    // North-east: the card goes to the pin's left.
    expect(cardSide(pin, [[0, 0], [0.005, 0.005], [0.01, 0.01]])).toBe('left')
    // North-west: the card goes to the pin's right.
    expect(cardSide(pin, [[0, 0], [-0.005, 0.005], [-0.01, 0.01]])).toBe('right')
  })

  it('never says a walk takes zero minutes', () => {
    expect(walkMinutes(10)).toBe(1)
    expect(walkMinutes(505)).toBe(8)
  })
})
