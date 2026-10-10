// Areas OSAS draws on the Map View, like districts in a city builder: a named,
// coloured outline that filters the list and the pins to what lies inside.
// Kept free of Mapbox and Vue so it can be tested.

import type { MapItem, StatusGroup } from './mapPins'

export type Coord = [number, number]

/** One drawn area. `ring` is open: the last corner joins back to the first. */
export interface MapArea {
  id: string
  name: string
  color: string
  ring: Coord[]
}

/** Distinct on the light, dark and satellite styles alike. No red: red marks a shape that cannot be. */
export const AREA_COLORS = ['#2563EB', '#D97706', '#7C3AED', '#DB2777', '#059669', '#475569', '#0891B2', '#65A30D'] as const
export const INVALID_COLOR = '#DC2626'

/** The first colour no area uses yet; past eight areas they start to repeat. */
export function nextColor(areas: Pick<MapArea, 'color'>[]): string {
  const used = new Set(areas.map((a) => a.color))
  return AREA_COLORS.find((c) => !used.has(c)) ?? AREA_COLORS[areas.length % AREA_COLORS.length]!
}

/**
 * Whether a point lies inside a ring, by counting how many edges a ray east
 * of it crosses. Flat lng/lat is exact enough at the scale of a town.
 */
export function pointInRing(lng: number, lat: number, ring: Coord[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const OVERLAP = "Areas cannot overlap. Snap to a neighbour's corners to share its border."

const orient = (a: Coord, b: Coord, c: Coord) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]))
const onSegment = (a: Coord, b: Coord, p: Coord) =>
  Math.min(a[0], b[0]) <= p[0] && p[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1])

/** Whether segments ab and cd meet, touching included. */
export function segmentsMeet(a: Coord, b: Coord, c: Coord, d: Coord): boolean {
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b)
  if (o1 !== o2 && o3 !== o4) return true
  return (o1 === 0 && onSegment(a, b, c)) || (o2 === 0 && onSegment(a, b, d)) ||
    (o3 === 0 && onSegment(c, d, a)) || (o4 === 0 && onSegment(c, d, b))
}

/** Whether any two borders that do not share a corner meet. `closed` adds the border back to the first corner. */
function crosses(points: Coord[], closed: boolean): boolean {
  const n = points.length
  const edges = closed ? n : n - 1
  for (let i = 0; i < edges; i++) {
    for (let j = i + 2; j < edges; j++) {
      if (closed && i === 0 && j === n - 1) continue // the last border shares the first corner
      if (segmentsMeet(points[i]!, points[(i + 1) % n]!, points[j]!, points[(j + 1) % n]!)) return true
    }
  }
  return false
}

const stacked = (points: Coord[]) => points.some((c, i) => points.some((d, j) => j > i && c[0] === d[0] && c[1] === d[1]))

/** Why a closed outline cannot be an area, or null when it can. `others` are the other areas' outlines, which it may border but not cover. */
export function ringProblem(ring: Coord[], others: Coord[][] = []): string | null {
  if (ring.length < 3) return 'An area needs at least three corners.'
  if (stacked(ring)) return 'Two corners sit on the same spot.'
  if (crosses(ring, true)) return 'Borders cannot cross each other.'
  // Shoelace area in square degrees, measured from the first corner so the
  // large lng/lat values do not eat the precision; 1e-12 is about 0.01 m².
  const [ox, oy] = ring[0]!
  const area = ring.reduce((sum, c, i) => {
    const n = ring[(i + 1) % ring.length]!
    return sum + (c[0] - ox) * (n[1] - oy) - (n[0] - ox) * (c[1] - oy)
  }, 0) / 2
  if (Math.abs(area) < 1e-12) return 'The corners lie in a straight line.'
  if (others.some((o) => overlaps(ring, true, o))) return OVERLAP
  return null
}

/** Why the corners of a shape still being drawn (not yet closed) cannot stand, or null when they can. */
export function pathProblem(corners: Coord[], others: Coord[][] = []): string | null {
  if (stacked(corners)) return 'Two corners sit on the same spot.'
  if (crosses(corners, false)) return 'Borders cannot cross each other.'
  if (others.some((o) => overlaps(corners, false, o))) return OVERLAP
  return null
}

/** Closer than this (in degrees, about 0.1 mm) counts as on a border: a shared border is exact, a snapped corner is the same point. */
const ON_EDGE = 1e-9

function onBorder(p: Coord, ring: Coord[]): boolean {
  return ring.some((a, i) => {
    const b = ring[(i + 1) % ring.length]!
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)))
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)) < ON_EDGE
  })
}

/** Inside and not on the border: a point a neighbour may share does not count. */
const within = (p: Coord, ring: Coord[]) => !onBorder(p, ring) && pointInRing(p[0], p[1], ring)

/** A point surely inside a ring: the middle of an ear (a corner triangle no other corner falls into). */
function insidePoint(ring: Coord[]): Coord | null {
  const n = ring.length
  const turn = Math.sign(ring.reduce((sum, c, i) => { const d = ring[(i + 1) % n]!; return sum + (c[0] - ring[0]![0]) * (d[1] - ring[0]![1]) - (d[0] - ring[0]![0]) * (c[1] - ring[0]![1]) }, 0))
  for (let i = 0; i < n; i++) {
    const tri = [ring[(i + n - 1) % n]!, ring[i]!, ring[(i + 1) % n]!]
    if (orient(tri[0]!, tri[1]!, tri[2]!) !== turn) continue // a reflex corner: its triangle lies outside
    if (ring.some((c) => !tri.includes(c) && pointInRing(c[0], c[1], tri))) continue
    return [(tri[0]![0] + tri[1]![0] + tri[2]![0]) / 3, (tri[0]![1] + tri[1]![1] + tri[2]![1]) / 3]
  }
  return null
}

const edges = (points: Coord[], closed: boolean) =>
  points.slice(0, closed ? undefined : -1).map((a, i) => [a, points[(i + 1) % points.length]!] as const)
const mid = ([a, b]: readonly [Coord, Coord]): Coord => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

/**
 * Whether a shape covers any of another area. Sharing corners and borders is
 * fine; borders crossing, or a corner or border reaching inside, is not. Two
 * outlines that coincide exactly are caught by a point surely inside each.
 * `closed` false is a shape still being drawn, which has no inside yet.
 * ponytail: a border passing between two of the other's corners that lie
 * exactly on it is not caught; snapping only reaches corners, so it cannot be drawn.
 */
export function overlaps(points: Coord[], closed: boolean, other: Coord[]): boolean {
  const mine = edges(points, closed)
  const theirs = edges(other, true)
  for (const [a, b] of mine) {
    for (const [c, d] of theirs) {
      if (orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0) return true
    }
  }
  if (points.some((p) => within(p, other)) || mine.some((e) => within(mid(e), other))) return true
  if (!closed) return false
  if (other.some((p) => within(p, points)) || theirs.some((e) => within(mid(e), points))) return true
  const [pi, oi] = [insidePoint(points), insidePoint(other)]
  return (!!pi && within(pi, other)) || (!!oi && within(oi, points))
}

/** The candidate closest to `p` within `max` screen px, or null — what a corner snaps onto. */
export function nearestWithin<T extends { x: number; y: number }>(p: { x: number; y: number }, candidates: T[], max: number): T | null {
  let best: T | null = null
  let bestD = max
  for (const c of candidates) {
    const d = Math.hypot(c.x - p.x, c.y - p.y)
    if (d <= bestD) { best = c; bestD = d }
  }
  return best
}

/** What an area's card says about the accommodations inside it. */
export function areaStats(ring: Coord[], items: MapItem[]) {
  const inside = items.filter((i) => pointInRing(i.lng, i.lat, ring))
  const by: Record<StatusGroup, number> = { accredited: 0, awaiting: 0, not: 0 }
  for (const i of inside) by[i.group]++
  return {
    count: inside.length,
    ...by,
    taken: inside.reduce((n, i) => n + i.taken, 0),
    beds: inside.reduce((n, i) => n + i.beds, 0),
  }
}
