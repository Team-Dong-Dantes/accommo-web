// The campus layers on the Map View: the 1 / 3 / 5 km rings, and the walking
// route from a selected accommodation to campus. The route is accommo-mobile's
// (StudentDiscoverPage.vue): Mapbox Directions along real roads, with
// "650 m · 8 min walk" parked half way along, and a dashed straight line with
// the as-the-crow-flies distance when Directions cannot be reached. Here the
// road route is drawn as a cased solid line, to stand out on a busy map.

import { ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import { CAMPUS, kmBetween } from '@/utils/geo'
import { cssVar } from '@/utils/chartTheme'
import { RING_KM, circleRing } from './mapPins'

export type Coord = [number, number]

const RINGS = 'campus-rings'
const RING_LABELS = 'campus-ring-labels'
const LINK = 'campus-link'

/** The walking route along actual roads, from Mapbox Directions; null when it cannot be had. */
export async function fetchWalkingRoute(from: Coord, to: Coord, token: string) {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/` +
    `${from[0]},${from[1]};${to[0]},${to[1]}` +
    `?geometries=geojson&overview=full&access_token=${token}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const route = (await res.json())?.routes?.[0]
    const coordinates = route?.geometry?.coordinates
    if (!Array.isArray(coordinates) || coordinates.length < 2) return null
    return { coordinates: coordinates as Coord[], distance: Number(route.distance), duration: Number(route.duration) }
  } catch {
    return null
  }
}

/**
 * The point half way *along* the route, so the label sits mid-walk. The middle
 * array index would drag it toward whichever end has the most turns, since
 * that is where the vertices bunch up.
 */
export function midpointAlong(coords: Coord[]): Coord {
  const legs = coords.slice(1).map((c, i) => kmBetween(coords[i]![1], coords[i]![0], c[1], c[0]))
  const half = legs.reduce((a, b) => a + b, 0) / 2
  let walked = 0
  for (let i = 0; i < legs.length; i++) {
    walked += legs[i]!
    if (walked >= half) return coords[i + 1]!
  }
  return coords[coords.length - 1]!
}

/** "650 m" / "1.4 km" — the distance part of the walk label. */
export function walkDistance(metres: number) {
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`
}

export function walkMinutes(seconds: number) {
  return Math.max(1, Math.round(seconds / 60))
}

/**
 * Where the pin card goes so it does not cover the walk. The card normally
 * sits above the pin; a route that mostly heads north would run under it, so
 * the card then moves to the side of the pin the route does not take.
 */
export type CardSide = 'above' | 'left' | 'right'
export function cardSide(pin: { lat: number; lng: number }, coords: Coord[]): CardSide {
  const north = coords.filter(([, lat]) => lat > pin.lat)
  if (north.length < coords.length / 4) return 'above'
  const eastward = north.reduce((sum, [lng]) => sum + (lng - pin.lng), 0)
  return eastward > 0 ? 'left' : 'right'
}

/**
 * Eases the map to show the whole walk, keeping clear the room the pin card
 * takes on its side of the pin (about 520px tall above it, exterior photo
 * included, 300px wide beside it), so no part of the line ends up under the card. The walk decides the
 * zoom both ways: a short one fills the view, a long one pulls out to fit.
 */
const CLOSEST_ZOOM = 17
export function frameWalk(map: mapboxgl.Map, pin: { lat: number; lng: number }, coords: Coord[], side: CardSide) {
  const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds([pin.lng, pin.lat], [pin.lng, pin.lat]))
  map.fitBounds(bounds, {
    padding: {
      top: 60 + (side === 'above' ? 520 : 0),
      bottom: 60,
      left: 60 + (side === 'left' ? 300 : 0),
      right: 60 + (side === 'right' ? 300 : 0),
    },
    // Only a cap on how close a very short walk may zoom — a block or so.
    maxZoom: CLOSEST_ZOOM,
    duration: 700,
  })
}

/** Rings and the (empty) route line. A style switch drops custom layers, so this runs on every style load. */
export function addCampusLayers(map: mapboxgl.Map, satellite: boolean) {
  if (map.getSource(RINGS)) return
  const ink = satellite ? '#ffffff' : cssVar('--c-primary', '#0F766E')
  map.addSource(RINGS, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: RING_KM.map((km) => ({ type: 'Feature', properties: { km }, geometry: { type: 'LineString', coordinates: circleRing(CAMPUS, km) } })),
    },
  })
  map.addLayer({ id: RINGS, type: 'line', source: RINGS, paint: { 'line-color': ink, 'line-opacity': 0.45, 'line-width': 1.5, 'line-dasharray': [3, 3] } })
  map.addSource(RING_LABELS, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: RING_KM.map((km) => ({
        type: 'Feature',
        properties: { label: `${km} km` },
        geometry: { type: 'Point', coordinates: circleRing(CAMPUS, km, 8)[1]! }, // north-east, 45°
      })),
    },
  })
  map.addLayer({
    id: RING_LABELS,
    type: 'symbol',
    source: RING_LABELS,
    layout: { 'text-field': ['get', 'label'], 'text-size': 11, 'text-offset': [1.4, -0.6] },
    paint: { 'text-color': satellite ? '#ffffff' : cssVar('--c-muted', '#6B7770'), 'text-halo-color': 'rgba(0,0,0,0.25)', 'text-halo-width': satellite ? 1 : 0 },
  })
  map.addSource(LINK, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  // The walk along the roads is the one thing to follow on the map, so it is
  // drawn as a route is in a navigation app: a thick solid line on a pale
  // casing that lifts it off the roads, the campus rings and any area beneath.
  // The rings stay thin and dashed, so the two never read as one another.
  const road = ['!', ['get', 'straight']]
  const routeInk = cssVar('--c-primary', '#0F766E')
  map.addLayer({
    id: `${LINK}-casing`, type: 'line', source: LINK, filter: road,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': satellite ? 0.95 : 0.9 },
  })
  map.addLayer({
    id: LINK, type: 'line', source: LINK, filter: road,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': routeInk, 'line-width': 5 },
  })
  // Directions out of reach: the straight line stays dashed, so it is never
  // mistaken for a way along the roads.
  map.addLayer({
    id: `${LINK}-straight`, type: 'line', source: LINK, filter: ['get', 'straight'],
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': satellite ? '#ffffff' : routeInk, 'line-width': 3, 'line-dasharray': [1.6, 1.4] },
  })
}

/**
 * The selected accommodation's walk to campus: draws it on the map and holds
 * its text for the pin card. `show(null)` clears it.
 */
export function useCampusWalk(getMap: () => mapboxgl.Map | null) {
  const walk = ref<{ id: string; text: string; coords: Coord[] } | null>(null)
  let label: mapboxgl.Marker | null = null
  // Bumped on every selection so a slow route for a house already left is dropped.
  let request = 0

  async function show(item: { id: string; lat: number; lng: number; km: number } | null) {
    const token = ++request
    label?.remove()
    label = null
    walk.value = null
    const map = getMap()
    if (!map) return
    drawCampusLink(map, null)
    if (!item) return
    const from: Coord = [item.lng, item.lat]
    const to: Coord = [CAMPUS.lng, CAMPUS.lat]
    const route = await fetchWalkingRoute(from, to, mapboxgl.accessToken ?? '')
    if (token !== request || getMap() !== map) return
    let text: string
    let coords: Coord[]
    if (route) {
      text = `${walkDistance(route.distance)} · ${walkMinutes(route.duration)} min walk`
      coords = route.coordinates
      label = drawCampusLink(map, coords, midpointAlong(coords), text)
    } else {
      // Directions unreachable: a straight line and the crow-flies distance, so the link never just vanishes.
      text = `${item.km.toFixed(1)} km in a straight line`
      coords = [from, to]
      label = drawCampusLink(map, coords, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2], text, true)
    }
    walk.value = { id: item.id, text, coords }
  }

  function dispose() {
    request++
    label?.remove()
    label = null
  }

  return { walk, show, dispose }
}

/** Draws the route (or clears it with `null`); returns the label marker so the page can remove it. */
export function drawCampusLink(map: mapboxgl.Map, coordinates: Coord[] | null, labelAt?: Coord, text?: string, straight = false) {
  const source = map.getSource(LINK) as mapboxgl.GeoJSONSource | undefined
  if (!source) return null
  if (!coordinates) {
    source.setData({ type: 'FeatureCollection', features: [] })
    return null
  }
  source.setData({ type: 'Feature', properties: { straight }, geometry: { type: 'LineString', coordinates } })
  if (!labelAt || !text) return null
  const el = document.createElement('div')
  el.className = 'map-walk-label'
  el.textContent = text
  return new mapboxgl.Marker({ element: el }).setLngLat(labelAt).addTo(map)
}
