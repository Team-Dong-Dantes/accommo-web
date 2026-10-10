// Drawing and reshaping areas on the Map View, after the district tool in
// Cities: Skylines 2. Draw mode places a corner per click, with the shape
// filling in behind the cursor, and closes on the first corner again or a
// double-click. Any corner already placed can be dragged, while drawing too.
// A selected area shows its corners as handles: drag one to move
// it, drag the dot half way along a border to add a corner there, right-click
// one to remove it. Corners snap onto other areas' corners so neighbours share
// a border. A shape that cannot be an area (borders crossing, corners stacked
// or in a line, or covering part of another area) turns red and is refused: the corner is not placed, the shape
// does not close, a dragged corner goes back. What it draws lives in Mapbox
// layers; saving is the page's job.

import { onBeforeUnmount, ref } from 'vue'
import type mapboxgl from 'mapbox-gl'
import { INVALID_COLOR, nearestWithin, pathProblem, ringProblem, type Coord, type MapArea } from './mapAreas'

const AREAS = 'map-areas'
const AREA_FILL = 'map-areas-fill'
const AREA_LINE = 'map-areas-line'
const AREA_LABEL = 'map-areas-label'
const DRAFT = 'map-area-draft'
const DRAFT_PTS = 'map-area-draft-pts'
const HANDLES = 'map-area-handles'
const HANDLE_MID = 'map-area-handle-mid'
const HANDLE_CORNER = 'map-area-handle-corner'

/** How near, in screen px, a corner must come to snap or to close the shape. */
const SNAP_PX = 12
/**
 * How far from a handle a press still grabs it. The dots are a few px across,
 * and Mapbox on its own only counts a press inside the drawn circle, so a near
 * miss (or any finger) panned the map instead of moving the corner.
 */
const GRAB_PX = 10
const GRAB_TOUCH_PX = 22
/** A drawing colour until the area is named and given its own. */
const DRAFT_COLOR = '#0F766E'

type MapPointerEvent = mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent
// @types/geojson is not installed, so the few shapes used here are spelled out.
type Feature = { type: 'Feature'; properties: Record<string, unknown>; geometry: { type: string; coordinates: unknown } }
/** A grab handle, as queryRenderedFeatures hands it over. */
type Handle = { layer: { id: string }; properties: { kind?: string; i?: number }; geometry: { coordinates: Coord } }

interface Callbacks {
  /** An area was clicked on the map. */
  onPick: (id: string) => void
  /** A drawn shape was closed, or reshaped before it was named, and needs a name. */
  onClose: (ring: Coord[]) => void
  /** A selected area's corners were moved, added or removed. */
  onReshape: (id: string, ring: Coord[]) => void
  /** Something was refused because the shape would be impossible; says why. */
  onRefuse: (why: string) => void
}

export function useAreaDraw(getMap: () => mapboxgl.Map | null, cb: Callbacks) {
  const drawing = ref(false)
  /** A corner is being dragged; pins step out of the way meanwhile. */
  const dragging = ref(false)
  /** The corners as they were before each change to the shape being drawn, newest last: what undo goes back to. */
  const draftSteps = ref<Coord[][]>([])
  const snapshot = () => corners.map((c) => [...c] as Coord)
  let areas: MapArea[] = []
  let selectedId: string | null = null
  let corners: Coord[] = []
  let cursor: Coord | null = null
  /** A closed shape waiting for its name; drawn until the page clears it. */
  let pending: Coord[] | null = null
  /** `id` null is the shape being drawn or named, moved in place; otherwise a saved area, moved on a copy. */
  let drag: { id: string | null; ring: Coord[]; index: number; from: Coord | null; moved: boolean } | null = null

  const selectedArea = () => areas.find((a) => a.id === selectedId) ?? null
  const ringOf = (a: MapArea) => (drag?.id === a.id ? drag.ring : a.ring)
  const closed = (ring: Coord[]) => [...ring, ring[0]!]
  /** The outlines a shape may border but not cover: every area but the one being reshaped. */
  const others = (skip?: string) => areas.filter((a) => a.id !== skip).map((a) => a.ring)
  /** What is wrong with the shape being drawn (as far as it goes) or waiting for its name. */
  const draftProblem = () =>
    pending ? ringProblem(pending, others()) : drawing.value ? pathProblem(cursor ? [...corners, cursor] : corners, others()) : null
  const color = (bad: boolean, ok: unknown) => (bad ? INVALID_COLOR : ok)

  function setData(id: string, features: Feature[]) {
    const source = getMap()?.getSource(id) as mapboxgl.GeoJSONSource | undefined
    source?.setData({ type: 'FeatureCollection', features })
  }

  function render() {
    setData(AREAS, areas.map((a) => ({
      type: 'Feature',
      properties: { id: a.id, name: a.name, color: color(drag?.id === a.id && !!ringProblem(drag.ring, others(a.id)), a.color), sel: a.id === selectedId },
      geometry: { type: 'Polygon', coordinates: [closed(ringOf(a))] },
    })))

    const draft = pending ?? (cursor ? [...corners, cursor] : corners)
    const tint = color(!!draftProblem(), DRAFT_COLOR)
    // Placed corners carry their index, so they can be grabbed; the cursor's point cannot.
    const draftFeatures: Feature[] = draft.map((c, i) => ({ type: 'Feature', properties: c === cursor ? { tint } : { i, tint }, geometry: { type: 'Point', coordinates: c } }))
    if (draft.length >= 3) draftFeatures.push({ type: 'Feature', properties: { tint }, geometry: { type: 'Polygon', coordinates: [closed(draft)] } })
    else if (draft.length === 2) draftFeatures.push({ type: 'Feature', properties: { tint }, geometry: { type: 'LineString', coordinates: draft } })
    setData(DRAFT, draftFeatures)

    const area = drawing.value ? null : selectedArea()
    const handles: Feature[] = []
    if (area) {
      const ring = ringOf(area)
      ring.forEach((c, i) => {
        const n = ring[(i + 1) % ring.length]!
        handles.push({ type: 'Feature', properties: { kind: 'mid', i, color: area.color }, geometry: { type: 'Point', coordinates: [(c[0] + n[0]) / 2, (c[1] + n[1]) / 2] } })
        handles.push({ type: 'Feature', properties: { kind: 'corner', i, color: area.color }, geometry: { type: 'Point', coordinates: c } })
      })
    }
    setData(HANDLES, handles)
  }

  /** Where a pointer lands, pulled onto another area's corner when one is near. */
  function snapped(map: mapboxgl.Map, e: MapPointerEvent, skipId?: string): Coord {
    const candidates = areas
      .filter((a) => a.id !== skipId)
      .flatMap((a) => a.ring.map((c) => ({ ...map.project(c), c })))
    const hit = nearestWithin(e.point, candidates, SNAP_PX)
    return hit ? hit.c : [e.lngLat.lng, e.lngLat.lat]
  }

  const near = (map: mapboxgl.Map, a: Coord, b: Coord, px: number) => {
    const p = map.project(a)
    const q = map.project(b)
    return Math.hypot(p.x - q.x, p.y - q.y) <= px
  }

  // ── draw mode ──
  function setDrawing(on: boolean) {
    const map = getMap()
    drawing.value = on
    corners = []
    draftSteps.value = []
    cursor = null
    if (map) {
      if (on) map.doubleClickZoom.disable()
      else map.doubleClickZoom.enable()
      map.getCanvas().style.cursor = on ? 'crosshair' : ''
    }
    render()
  }

  function startDraw() { pending = null; setDrawing(true) }
  function cancelDraw() { setDrawing(false) }
  function clearPending() { pending = null; render() }

  function finish() {
    const why = ringProblem(corners, others())
    if (why) return cb.onRefuse(why)
    pending = corners
    setDrawing(false)
    cb.onClose(pending)
  }

  function onClick(e: mapboxgl.MapMouseEvent) {
    const map = getMap()
    if (!map) return
    if (drawing.value) {
      const c = snapped(map, e)
      if (corners.length >= 3 && near(map, c, corners[0]!, SNAP_PX)) return finish()
      // A click on a corner already placed (the end of a drag, or the second click of a double-click) places nothing.
      if (corners.some((k) => near(map, c, k, GRAB_PX))) return
      const why = pathProblem([...corners, c], others())
      if (why) return cb.onRefuse(why)
      draftSteps.value.push(snapshot())
      corners.push(c)
      render()
      return
    }
    if (!map.getLayer(AREA_FILL)) return // mid style switch
    const hit = map.queryRenderedFeatures(e.point, { layers: [AREA_FILL] })[0] as unknown as Feature | undefined
    const id = hit?.properties.id
    if (typeof id === 'string') cb.onPick(id)
  }

  function onMove(e: MapPointerEvent) {
    const map = getMap()
    if (!map) return
    if (drag) {
      drag.ring[drag.index] = snapped(map, e, drag.id ?? undefined)
      drag.moved = true
      render()
      map.getCanvas().style.cursor = dragProblem() ? 'not-allowed' : 'grabbing'
      return
    }
    if (drawing.value && corners.length) {
      cursor = snapped(map, e)
      render()
    }
    map.getCanvas().style.cursor = hoverCursor(map, e)
  }

  function hoverCursor(map: mapboxgl.Map, e: MapPointerEvent) {
    if (handleAt(map, e)) return 'grab'
    if (drawing.value) return draftProblem() ? 'not-allowed' : 'crosshair'
    const overArea = map.getLayer(AREA_FILL) && map.queryRenderedFeatures(e.point, { layers: [AREA_FILL] }).length
    return overArea ? 'pointer' : ''
  }

  /** The handle nearest the pointer and within reach of it: a placed corner of the draft, or the selected area's corner or border dot. */
  function handleAt(map: mapboxgl.Map, e: MapPointerEvent): Handle | null {
    const layers = [DRAFT_PTS, HANDLE_CORNER, HANDLE_MID].filter((l) => map.getLayer(l))
    if (!layers.length) return null
    const r = 'points' in e ? GRAB_TOUCH_PX : GRAB_PX
    const { x, y } = e.point
    const hits = map.queryRenderedFeatures([[x - r, y - r], [x + r, y + r]], { layers }) as unknown as Handle[]
    // The draft's point under the cursor has no index: it is where the next corner would go, not a corner.
    const grabbable = hits.filter((h) => typeof h.properties.i === 'number').map((h) => ({ ...map.project(h.geometry.coordinates), h }))
    return nearestWithin(e.point, grabbable, r)?.h ?? null
  }

  /** What is wrong with the shape under the corner being dragged. */
  function dragProblem() {
    if (!drag) return null
    if (drag.id !== null) return ringProblem(drag.ring, others(drag.id))
    return pending ? ringProblem(pending, others()) : pathProblem(corners, others())
  }

  function restoreCursor() {
    const map = getMap()
    if (map) map.getCanvas().style.cursor = drawing.value ? 'crosshair' : ''
  }

  function startDrag(e: MapPointerEvent, next: NonNullable<typeof drag>) {
    if ('points' in e && e.points.length !== 1) return
    e.preventDefault() // keeps the map from panning under the drag
    drag = next
    dragging.value = true
    cursor = null
    getMap()!.getCanvas().style.cursor = 'grabbing'
  }


  /** A press on a handle starts dragging it: a corner of the shape being drawn or named, or of the selected area. */
  function onDown(e: MapPointerEvent) {
    const map = getMap()
    const h = map && !drag ? handleAt(map, e) : null
    if (!h) return
    const i = h.properties.i!
    if (h.layer.id === DRAFT_PTS) {
      const ring = pending ?? (drawing.value ? corners : null)
      if (ring) startDrag(e, { id: null, ring, index: i, from: [...ring[i]!] as Coord, moved: false })
      return
    }
    const area = selectedArea()
    if (!area || drawing.value || pending) return
    const ring = area.ring.map((c) => [...c] as Coord)
    const mid = h.properties.kind === 'mid'
    if (mid) {
      // A border dot becomes a new corner half way along that border.
      const [c, n] = [ring[i]!, ring[(i + 1) % ring.length]!]
      ring.splice(i + 1, 0, [(c[0] + n[0]) / 2, (c[1] + n[1]) / 2])
    }
    startDrag(e, { id: area.id, ring, index: mid ? i + 1 : i, from: null, moved: false })
  }

  function onUp() {
    if (!drag) return
    const why = drag.moved ? dragProblem() : null
    // The shape being drawn moves in place, so its corner goes back; a saved area's copy is just dropped.
    if (why && drag.from) drag.ring[drag.index] = drag.from
    const { id, ring, index, from } = drag
    const moved = drag.moved && !why
    drag = null
    dragging.value = false
    restoreCursor()
    if (why) cb.onRefuse(why)
    if (id === null) {
      if (moved && pending) cb.onClose([...pending])
      // While drawing, a moved corner is a step undo can take back.
      else if (moved && drawing.value && from) draftSteps.value.push(corners.map((c, i) => (i === index ? from : [...c] as Coord)))
    } else if (moved) {
      // Shown in place right away; the page saves it and puts it back on failure.
      const area = areas.find((a) => a.id === id)
      if (area) area.ring = ring
      cb.onReshape(id, ring)
    }
    render()
  }

  /** Right-click on a corner of the selected area removes it. */
  function onMenu(e: mapboxgl.MapMouseEvent) {
    const map = getMap()
    const area = selectedArea()
    if (!map || !area || drawing.value || pending) return
    const h = handleAt(map, e)
    if (h?.properties.kind !== 'corner') return
    e.originalEvent.preventDefault()
    const ring = area.ring.filter((_, i) => i !== h.properties.i)
    const why = ringProblem(ring, others(area.id))
    if (why) return cb.onRefuse(why)
    area.ring = ring
    cb.onReshape(area.id, ring)
    render()
  }

  // ── layers ──
  /** Sources, layers and listeners. A style switch drops layers, so this runs on every style load. */
  function addLayers(satellite: boolean) {
    const map = getMap()
    if (!map || map.getSource(AREAS)) return
    // Under the campus rings and the walk, so those stay readable over an area.
    const before = map.getLayer('campus-rings') ? 'campus-rings' : undefined
    const empty = { type: 'FeatureCollection' as const, features: [] }
    map.addSource(AREAS, { type: 'geojson', data: empty })
    map.addSource(DRAFT, { type: 'geojson', data: empty })
    map.addSource(HANDLES, { type: 'geojson', data: empty })
    map.addLayer({
      id: AREA_FILL, type: 'fill', source: AREAS,
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['case', ['get', 'sel'], 0.3, 0.16] },
    }, before)
    map.addLayer({
      id: AREA_LINE, type: 'line', source: AREAS,
      layout: { 'line-join': 'round' },
      paint: { 'line-color': ['get', 'color'], 'line-width': ['case', ['get', 'sel'], 3, 2] },
    }, before)
    map.addLayer({
      id: AREA_LABEL, type: 'symbol', source: AREAS,
      layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-max-width': 8 },
      paint: satellite
        ? { 'text-color': '#ffffff', 'text-halo-color': 'rgba(0,0,0,0.6)', 'text-halo-width': 1.5 }
        : { 'text-color': ['get', 'color'], 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
    })
    map.addLayer({
      id: `${DRAFT}-fill`, type: 'fill', source: DRAFT, filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': ['get', 'tint'], 'fill-opacity': 0.18 },
    })
    map.addLayer({
      id: `${DRAFT}-line`, type: 'line', source: DRAFT, filter: ['!=', ['geometry-type'], 'Point'],
      paint: { 'line-color': satellite ? ['case', ['==', ['get', 'tint'], INVALID_COLOR], INVALID_COLOR, '#ffffff'] : ['get', 'tint'], 'line-width': 2, 'line-dasharray': [2, 1.5] },
    })
    map.addLayer({
      id: DRAFT_PTS, type: 'circle', source: DRAFT, filter: ['==', ['geometry-type'], 'Point'],
      paint: { 'circle-radius': 6, 'circle-color': '#ffffff', 'circle-stroke-color': ['get', 'tint'], 'circle-stroke-width': 2 },
    })
    map.addLayer({
      id: HANDLE_MID, type: 'circle', source: HANDLES, filter: ['==', ['get', 'kind'], 'mid'],
      paint: { 'circle-radius': 5, 'circle-color': ['get', 'color'], 'circle-opacity': 0.75, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
    })
    map.addLayer({
      id: HANDLE_CORNER, type: 'circle', source: HANDLES, filter: ['==', ['get', 'kind'], 'corner'],
      paint: { 'circle-radius': 7, 'circle-color': '#ffffff', 'circle-stroke-color': ['get', 'color'], 'circle-stroke-width': 2.5 },
    })
    render()
  }

  // Map listeners outlive a style switch, so they are bound once.
  let bound: mapboxgl.Map | null = null
  function bind() {
    const map = getMap()
    if (!map || bound === map) return
    bound = map
    map.on('click', onClick)
    map.on('dblclick', () => { if (drawing.value) finish() })
    map.on('mousemove', onMove)
    map.on('touchmove', onMove)
    map.on('touchend', onUp)
    // On the window, so a drag let go over a pin or off the map still ends.
    window.addEventListener('mouseup', onUp)
    map.on('mousedown', onDown)
    map.on('touchstart', onDown)
    map.on('contextmenu', onMenu)
  }

  /**
   * Undo while drawing: the last corner placed comes off, or the last corner
   * moved goes back. True when a drawing was under way (even with nothing left
   * to undo), so undo does not reach past it into the saved areas.
   */
  function undoDraft(): boolean {
    if (!drawing.value) return false
    const prev = draftSteps.value.pop()
    if (prev) {
      corners = prev
      render()
    }
    return true
  }

  /** Esc cancels a drawing, Backspace undoes like Ctrl+Z. True when the key was used. */
  function onKey(e: KeyboardEvent): boolean {
    if (!drawing.value) return false
    if (e.key === 'Escape') { cancelDraw(); return true }
    if (e.key === 'Backspace' && !(e.target instanceof HTMLInputElement)) return undoDraft()
    return false
  }

  function setAreas(next: MapArea[]) {
    areas = next.map((a) => ({ ...a, ring: a.ring.map((c) => [...c] as Coord) }))
    render()
  }

  function setSelected(id: string | null) {
    selectedId = id
    render()
  }

  onBeforeUnmount(() => window.removeEventListener('mouseup', onUp))

  return { drawing, dragging, draftSteps, undoDraft, startDraw, cancelDraw, clearPending, addLayers, bind, onKey, setAreas, setSelected }
}
