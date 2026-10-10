// What the Map View draws, kept free of Mapbox and Vue so it can be tested:
// the three accreditation groups a pin's centre dot encodes, the distance
// bands the side list groups by, the pin's ring of boarders by sex, and the
// campus distance rings.

/** accommodation_status, folded into the three things a pin's colour says. */
export type StatusGroup = 'accredited' | 'awaiting' | 'not'

export const STATUS_GROUPS: Record<StatusGroup, { label: string; token: string; pill: string }> = {
  accredited: { label: 'Accredited', token: '--c-primary', pill: 'is-acc' },
  awaiting: { label: 'Awaiting accreditation', token: '--c-warning', pill: 'is-pen' },
  not: { label: 'Not accredited', token: '--c-muted', pill: 'is-del' },
}

/** One accommodation as the map, its list and its card show it. */
export interface MapItem {
  id: string
  name: string
  type: string
  statusLabel: string
  group: StatusGroup
  taken: number
  beds: number
  /** Boarders on an active lease, by users.sex; any left of `taken` have no sex on record. */
  female: number
  male: number
  /** Straight-line distance from campus, km. */
  km: number
  lat: number
  lng: number
  landlord: string
  /** users.sex of the landlord/landlady, for their title. */
  landlordSex: string | null
  address: string
  /** Exterior photos, by sort order. */
  photos: string[]
  /** The record row it came from, for opening the full record. */
  row: unknown
}

export function statusGroup(status: string | null | undefined): StatusGroup {
  const s = String(status ?? '').toLowerCase()
  if (s === 'accredited') return 'accredited'
  if (s === 'pending' || s === 'reviewing' || s === 'needs_revision') return 'awaiting'
  // rejected, delisted, expired, suspended — and anything unknown.
  return 'not'
}

export const DISTANCE_BANDS = [
  { key: 'near', label: 'Under 1 km of campus', max: 1 },
  { key: 'close', label: '1 to 3 km', max: 3 },
  { key: 'town', label: '3 to 5 km', max: 5 },
  { key: 'far', label: 'More than 5 km', max: Infinity },
] as const

/** The rings drawn around campus, and the edge of the opening frame. */
export const RING_KM = [1, 3, 5] as const
export const FRAME_KM = 5

export function bandOf(km: number) {
  return DISTANCE_BANDS.find((b) => km < b.max) ?? DISTANCE_BANDS[DISTANCE_BANDS.length - 1]!
}

/** Female and male, as the accommodation record colours its occupants (RecordShell's --ar-female / --ar-male). */
export const SEX_COLORS = { female: '#e91e63', male: '#42a5f5', unrecorded: 'var(--c-muted)' } as const
/** A bed nobody has taken: the pale track of the ring and the bar. */
export const EMPTY_BED = 'color-mix(in srgb, var(--c-muted) 22%, var(--c-surface))'

/**
 * A pin's ring: who lives there, filled clockwise as a share of the beds:
 * female boarders, then male, then any whose sex is not on record, over a pale
 * track for the beds still free. An empty house reads as an empty ring, a full
 * one as a solid ring. Accreditation is the pin's centre dot, not the ring.
 */
export function boarderRing(female: number, male: number, taken: number, beds: number): string {
  // Cumulative shares, so rounding never leaves a gap or an overlap between colours.
  const upTo = (n: number) => (beds > 0 ? Math.round((Math.min(n, beds) / beds) * 100) : 0)
  const f = upTo(female)
  const m = upTo(female + male)
  const t = upTo(Math.max(taken, female + male))
  const { female: F, male: M, unrecorded: U } = SEX_COLORS
  return `conic-gradient(${F} 0 ${f}%, ${M} ${f}% ${m}%, ${U} ${m}% ${t}%, ${EMPTY_BED} ${t}% 100%)`
}

const EARTH_KM = 6371

/**
 * A circle `km` from `center` as a closed [lng, lat] ring, for a GeoJSON line.
 * Latitude/longitude spacing is corrected for latitude, so the circle is round
 * on the map rather than stretched east-west.
 */
export function circleRing(center: { lat: number; lng: number }, km: number, steps = 96): [number, number][] {
  const dLat = (km / EARTH_KM) * (180 / Math.PI)
  const dLng = dLat / Math.cos((center.lat * Math.PI) / 180)
  const ring: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI
    ring.push([center.lng + dLng * Math.cos(t), center.lat + dLat * Math.sin(t)])
  }
  return ring
}
