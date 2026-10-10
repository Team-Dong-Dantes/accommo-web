// The Map View's base map presets: every classic Mapbox style worth offering.
// `imagery` marks the photographic ones, where the campus rings, the walk and
// the areas switch to white strokes to stay visible.

import { CAMPUS } from '@/utils/geo'

export interface MapStylePreset {
  id: string
  label: string
  hint: string
  /** Mapbox style id (mapbox/<style>); "Default" follows the console's light or dark theme. */
  style: (dark: boolean) => string
  imagery?: boolean
}

const fixed = (s: string) => () => s

export const MAP_STYLES: MapStylePreset[] = [
  { id: 'default', label: 'Default', hint: 'Light or dark, with the console', style: (dark) => (dark ? 'dark-v11' : 'light-v11') },
  { id: 'streets', label: 'Streets', hint: 'Roads, places and colour', style: fixed('streets-v12') },
  { id: 'outdoors', label: 'Outdoors', hint: 'Terrain, paths and rivers', style: fixed('outdoors-v12') },
  { id: 'satellite', label: 'Satellite', hint: 'Imagery with roads and names', style: fixed('satellite-streets-v12'), imagery: true },
  { id: 'imagery', label: 'Imagery only', hint: 'Satellite with no labels', style: fixed('satellite-v9'), imagery: true },
  { id: 'light', label: 'Light', hint: 'Quiet and pale', style: fixed('light-v11') },
  { id: 'dark', label: 'Dark', hint: 'Quiet and dark', style: fixed('dark-v11') },
  { id: 'nav-day', label: 'Navigation', hint: 'Roads first', style: fixed('navigation-day-v1') },
  { id: 'nav-night', label: 'Navigation night', hint: 'Roads first, dark', style: fixed('navigation-night-v1') },
]

export const presetOf = (id: string) => MAP_STYLES.find((p) => p.id === id) ?? MAP_STYLES[0]!

/** A small picture of the campus in a style, for the picker (Mapbox Static Images; loaded only while it is open). */
export function stylePreview(p: MapStylePreset, dark: boolean, token: string) {
  return `https://api.mapbox.com/styles/v1/mapbox/${p.style(dark)}/static/${CAMPUS.lng},${CAMPUS.lat},12.6,0/104x68@2x?attribution=false&logo=false&access_token=${token}`
}

const KEY = 'accommo-map-style'

export function savedStyle(): string {
  try { return presetOf(localStorage.getItem(KEY) ?? '').id } catch { return 'default' }
}

export function saveStyle(id: string) {
  try { localStorage.setItem(KEY, id) } catch { /* non-fatal: just not remembered */ }
}
