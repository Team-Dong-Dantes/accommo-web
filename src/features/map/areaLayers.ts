// The Mapbox sources and layers that draw areas, the draft being drawn, and
// the reshape handles. useAreaDraw fills them; a style switch drops them, so
// they are added again on every style load.
import type mapboxgl from 'mapbox-gl'
import { INVALID_COLOR } from './mapAreas'

export const AREAS = 'map-areas'
export const AREA_FILL = 'map-areas-fill'
export const AREA_LINE = 'map-areas-line'
export const AREA_LABEL = 'map-areas-label'
export const DRAFT = 'map-area-draft'
export const DRAFT_PTS = 'map-area-draft-pts'
export const HANDLES = 'map-area-handles'
export const HANDLE_MID = 'map-area-handle-mid'
export const HANDLE_CORNER = 'map-area-handle-corner'

export function addAreaLayers(map: mapboxgl.Map, satellite: boolean) {
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
}
