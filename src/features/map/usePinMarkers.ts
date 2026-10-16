// The Map View's pins as Mapbox markers: one per shown accommodation, kept in
// step with what is shown, selected and hovered.
import { watch, type ComputedRef, type Ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import { STATUS_GROUPS, boarderRing, type MapItem } from './mapPins'

export function usePinMarkers(
  getMap: () => mapboxgl.Map | null,
  shown: ComputedRef<MapItem[]>,
  selectedId: Ref<string | null>,
  hotId: Ref<string | null>,
  select: (id: string) => void,
) {
  const pins = new Map<string, { marker: mapboxgl.Marker; el: HTMLButtonElement; wrap: HTMLDivElement }>()

  /**
   * Mapbox positions a marker by writing `transform` on the element it is
   * given, so the pin that grows on hover is a button inside that element, not
   * the element itself — scaling the element would throw the pin off its spot.
   */
  function makePin(item: MapItem) {
    const wrap = document.createElement('div')
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'map-pin'
    el.innerHTML = '<span class="map-pin-ring"></span><span class="map-pin-core"></span>'
    el.addEventListener('click', (e) => { e.stopPropagation(); select(item.id) })
    el.addEventListener('mouseenter', () => { hotId.value = item.id })
    el.addEventListener('mouseleave', () => { if (hotId.value === item.id) hotId.value = null })
    wrap.appendChild(el)
    return { wrap, el }
  }

  /** Rebuild the pins for what is shown; cheap at this scale (tens of houses). */
  function syncPins() {
    const map = getMap()
    if (!map) return
    const keep = new Set(shown.value.map((i) => i.id))
    for (const [id, pin] of pins) {
      if (!keep.has(id)) { pin.marker.remove(); pins.delete(id) }
    }
    for (const item of shown.value) {
      let pin = pins.get(item.id)
      if (!pin) {
        const { wrap, el } = makePin(item)
        pin = { el, wrap, marker: new mapboxgl.Marker({ element: wrap }).setLngLat([item.lng, item.lat]).addTo(map) }
        pins.set(item.id, pin)
      }
      // The selected and hovered pins sit above their neighbours.
      pin.wrap.style.zIndex = item.id === selectedId.value ? '4' : item.id === hotId.value ? '3' : ''
      // The ring is who lives there, by sex; the centre dot is accreditation.
      const [ring, core] = [...pin.el.children] as HTMLElement[]
      ring!.style.background = boarderRing(item.female, item.male, item.taken, item.beds)
      core!.style.background = `var(${STATUS_GROUPS[item.group].token})`
      const who = item.taken ? `: ${item.female} female, ${item.male} male` : ''
      pin.el.setAttribute('aria-label', `${item.name}, ${item.statusLabel}, ${item.taken} of ${item.beds} beds taken${who}`)
      pin.el.classList.toggle('is-sel', item.id === selectedId.value)
      pin.el.classList.toggle('is-hot', item.id === hotId.value)
    }
  }
  watch([shown, selectedId, hotId], syncPins)

  function disposePins() {
    pins.forEach((p) => p.marker.remove())
    pins.clear()
  }

  return { syncPins, disposePins }
}
