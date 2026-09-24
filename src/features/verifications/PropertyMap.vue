<template>
  <div class="pm">
    <div ref="host" class="pm-canvas"></div>

    <div class="pm-styles" role="radiogroup" aria-label="Map style">
      <button
        type="button"
        role="radio"
        :aria-checked="mapStyle === 'plain'"
        :class="{ 'is-active': mapStyle === 'plain' }"
        @click="setStyle('plain')"
      >
        <Icon icon="lucide:map" width="15" height="15" />
        Map
      </button>
      <button
        type="button"
        role="radio"
        :aria-checked="mapStyle === 'satellite'"
        :class="{ 'is-active': mapStyle === 'satellite' }"
        @click="setStyle('satellite')"
      >
        <Icon icon="lucide:satellite" width="15" height="15" />
        Satellite
      </button>
    </div>

    <!-- One line, because only one of these is ever the reviewer's problem. -->
    <p v-if="note" class="pm-note">
      <Icon icon="lucide:triangle-alert" width="16" height="16" />
      <span>{{ note }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { fetchAccommodationPins, type AccommodationPin } from '@/api/accommodations'
import { capitalize } from '@/utils/format'
import { CAMPUS, kmBetween } from '@/utils/geo'

const props = defineProps<{
  lat: number | null
  lng: number | null
  name: string
  /** The accommodation being reviewed, so its own pin is not its own neighbour. */
  selfId: string
  /** Just locating the property (a student's stay), not reviewing it: no
   *  "under review" label and no nearby-duplicate warning. */
  plain?: boolean
}>()

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Same telemetry opt-out as the admin map view: postEvent() short-circuits on a
// falsy EVENTS_URL, so blockers stop logging ERR_BLOCKED_BY_CLIENT noise.
try {
  Object.defineProperty(mapboxgl.config, 'EVENTS_URL', { get: () => null, configurable: true })
} catch { /* best-effort; an older build without EVENTS_URL is fine */ }

const MAP_STYLES = {
  plain: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const

/** Two pins this close are the same building, or one of them is wrong. */
const NEAR_M = 100

const host = ref<HTMLElement | null>(null)
const mapStyle = ref<'plain' | 'satellite'>('plain')
const others = ref<AccommodationPin[]>([])
const loadError = ref('')

let map: mapboxgl.Map | null = null
let markers: mapboxgl.Marker[] = []

const hasPin = computed(() => props.lat != null && props.lng != null)

/**
 * Properties sitting on top of this one. This is the whole reason the map is
 * here: a second submission of the same building, or a pin dropped on the wrong
 * lot, both show up as a neighbour a few metres away.
 */
const nearby = computed(() => {
  if (!hasPin.value) return []
  return others.value
    .map((p) => ({ ...p, metres: Math.round(kmBetween(props.lat!, props.lng!, p.lat, p.lng) * 1000) }))
    .filter((p) => p.metres <= NEAR_M)
    .sort((a, b) => a.metres - b.metres)
})

const note = computed(() => {
  if (loadError.value) return loadError.value
  if (!hasPin.value) return 'This property has no map pin, so only the properties already on the map are shown.'
  if (props.plain || !nearby.value.length) return ''
  const list = nearby.value.map((p) => `${p.name} (${capitalize(p.status)}, ${p.metres} m)`).join(' · ')
  return `${nearby.value.length} ${nearby.value.length === 1 ? 'property' : 'properties'} within ${NEAR_M} m — ${list}`
})

function setStyle(style: 'plain' | 'satellite') {
  mapStyle.value = style
  map?.setStyle(MAP_STYLES[style])
}

function drawMarkers() {
  if (!map) return
  markers.forEach((m) => m.remove())
  markers = []

  const ink = getComputedStyle(document.documentElement)
  const selfColor = ink.getPropertyValue('--c-danger').trim() || '#e11d48'
  const otherColor = ink.getPropertyValue('--c-muted').trim() || '#64748b'

  for (const p of others.value) {
    markers.push(
      new mapboxgl.Marker({ color: otherColor })
        .setLngLat([p.lng, p.lat])
        .setPopup(new mapboxgl.Popup({ offset: 24 }).setText(`${p.name} · ${capitalize(p.status)}`))
        .addTo(map),
    )
  }

  // Added last so it sits above the neighbours it is being compared against.
  if (hasPin.value) {
    markers.push(
      new mapboxgl.Marker({ color: selfColor, scale: 1.25 })
        .setLngLat([props.lng!, props.lat!])
        .setPopup(new mapboxgl.Popup({ offset: 28 }).setText(props.plain ? props.name : `${props.name} · under review`))
        .addTo(map),
    )
  }
}

onMounted(async () => {
  await nextTick()
  if (!host.value) return

  map = new mapboxgl.Map({
    container: host.value,
    style: MAP_STYLES[mapStyle.value],
    center: hasPin.value ? [props.lng!, props.lat!] : [CAMPUS.lng, CAMPUS.lat],
    zoom: hasPin.value ? 16 : 13,
  })
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
  // The stage sizes this container, so the map is built before it has its height.
  map.once('load', () => map?.resize())

  try {
    const pins = await fetchAccommodationPins()
    others.value = pins.filter((p) => p.id !== props.selfId)
  } catch {
    loadError.value = 'Could not load the other properties, so this pin cannot be checked against them.'
  }
  drawMarkers()
})

onBeforeUnmount(() => {
  markers.forEach((m) => m.remove())
  map?.remove()
  map = null
})
</script>

<style scoped>
.pm { position: relative; flex: 1 1 auto; min-height: 0; }
.pm-canvas { position: absolute; inset: 0; }

.pm-styles {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  display: flex;
  overflow: hidden;
  border: 1px solid var(--c-border);
  border-radius: 9px;
  background: var(--c-surface);
  box-shadow: var(--shadow-sm);
}
.pm-styles button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border: 0;
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}
.pm-styles button + button { border-left: 1px solid var(--c-border); }
.pm-styles button.is-active { background: var(--c-surface-2); color: var(--c-ink); }

/* Sits on the map rather than beside it: it is about the pin under it. */
.pm-note {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  padding: 9px 11px;
  border: 1px solid var(--c-warning);
  border-radius: 9px;
  background: var(--c-surface);
  box-shadow: var(--shadow-sm);
  color: var(--c-ink);
  font-size: 12px;
  line-height: 1.45;
}
.pm-note :deep(svg) { flex: 0 0 auto; margin-top: 1px; color: var(--c-warning); }
</style>
