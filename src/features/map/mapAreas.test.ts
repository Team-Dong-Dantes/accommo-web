import { describe, it, expect } from 'vitest'
import { AREA_COLORS, areaStats, nearestWithin, nextColor, pathProblem, pointInRing, ringProblem, type Coord } from './mapAreas'
import type { MapItem } from './mapPins'

// A U shape: the notch between x=1..2 above y=1 is outside.
const U: Coord[] = [[0, 0], [3, 0], [3, 3], [2, 3], [2, 1], [1, 1], [1, 3], [0, 3]]

describe('mapAreas', () => {
  it('tells inside from outside, notch included', () => {
    expect(pointInRing(0.5, 2, U)).toBe(true)
    expect(pointInRing(2.5, 2, U)).toBe(true)
    expect(pointInRing(1.5, 0.5, U)).toBe(true)
    expect(pointInRing(1.5, 2, U)).toBe(false)
    expect(pointInRing(4, 1, U)).toBe(false)
    expect(pointInRing(-1, -1, U)).toBe(false)
  })

  it('refuses shapes that cannot be an area', () => {
    expect(ringProblem(U)).toBeNull()
    expect(ringProblem([[0, 0], [2, 2], [2, 0], [0, 2]])).toMatch(/cross/) // bow-tie
    expect(ringProblem([[0, 0], [1, 0], [1, 1], [1, 0]])).toMatch(/same spot/)
    expect(ringProblem([[121.6, 16.7], [121.61, 16.71], [121.62, 16.72]])).toMatch(/straight line/)
    expect(ringProblem([[0, 0], [1, 0]])).toMatch(/three corners/)
    // A border that only touches another one still counts as crossing.
    expect(ringProblem([[0, 0], [4, 0], [4, 4], [2, 0], [0, 4]])).toMatch(/cross/)
  })

  it('refuses a next corner whose border would cross one already drawn', () => {
    const drawn: Coord[] = [[0, 0], [2, 0], [2, 2]]
    expect(pathProblem([...drawn, [0, 2]])).toBeNull()
    expect(pathProblem([...drawn, [1, -1]])).toMatch(/cross/)
    expect(pathProblem([...drawn, [2, 0]])).toMatch(/same spot/)
  })

  it('lets areas share borders and corners, never cover each other', () => {
    const sq = (x: number, y: number, s = 2): Coord[] => [[x, y], [x + s, y], [x + s, y + s], [x, y + s]]
    const B = sq(0, 0)
    expect(ringProblem(sq(2, 0), [B])).toBeNull() // shares the east border
    expect(ringProblem(sq(2, 2), [B])).toBeNull() // shares one corner
    expect(ringProblem(sq(5, 5), [B])).toBeNull() // apart
    expect(ringProblem(sq(1, 1), [B])).toMatch(/overlap/) // borders cross
    expect(ringProblem(sq(-1, -1, 4), [B])).toMatch(/overlap/) // swallows it whole
    expect(ringProblem(sq(0.5, 0.5, 1), [B])).toMatch(/overlap/) // sits inside it
    expect(ringProblem(sq(0, 0), [B])).toMatch(/overlap/) // drawn exactly on top, every corner snapped
    expect(ringProblem([[0, 0], [2, 0], [2, 2]], [B])).toMatch(/overlap/) // half of it, on its corners
    // The U and a block in its notch share three borders and do not overlap.
    expect(ringProblem([[1, 1], [2, 1], [2, 3], [1, 3]], [U])).toBeNull()
  })

  it('stops a shape being drawn from reaching into another area', () => {
    const B: Coord[] = [[0, 0], [2, 0], [2, 2], [0, 2]]
    expect(pathProblem([[2, 0], [4, 0], [4, 2], [2, 2]], [B])).toBeNull() // runs along its border
    expect(pathProblem([[3, 1], [1, 1]], [B])).toMatch(/overlap/) // a corner inside
    expect(pathProblem([[2, 0], [0, 2]], [B])).toMatch(/overlap/) // a border cutting across
  })

  it('snaps to the nearest corner within reach, and to nothing beyond it', () => {
    const corners = [{ x: 0, y: 0, id: 'a' }, { x: 8, y: 0, id: 'b' }, { x: 30, y: 0, id: 'c' }]
    expect(nearestWithin({ x: 6, y: 0 }, corners, 12)?.id).toBe('b')
    expect(nearestWithin({ x: 19, y: 20 }, corners, 12)).toBeNull()
  })

  it('hands out colours not yet in use', () => {
    expect(nextColor([])).toBe(AREA_COLORS[0])
    expect(nextColor([{ color: AREA_COLORS[0] }, { color: AREA_COLORS[2] }])).toBe(AREA_COLORS[1])
    expect(AREA_COLORS).toContain(nextColor(AREA_COLORS.map((color) => ({ color }))))
  })

  it('counts what lies inside', () => {
    const item = (lng: number, lat: number, group: MapItem['group'], taken: number, beds: number) =>
      ({ lng, lat, group, taken, beds }) as MapItem
    const stats = areaStats(U, [item(0.5, 2, 'accredited', 3, 4), item(2.5, 0.5, 'awaiting', 0, 6), item(1.5, 2, 'not', 9, 9)])
    expect(stats).toEqual({ count: 2, accredited: 1, awaiting: 1, not: 0, taken: 3, beds: 10 })
  })
})
