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
import { fetchAccommodationPins, fetchPinDetails, type AccommodationPin, type PinDetails } from '@/api/accommodations'
import { capitalize, humanizeEnum } from '@/utils/format'
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
        .setPopup(pinPopup(p.id, p.name, p.lat, p.lng, 24))
        .addTo(map),
    )
  }

  // Added last so it sits above the neighbours it is being compared against.
  if (hasPin.value) {
    markers.push(
      new mapboxgl.Marker({ color: selfColor, scale: 1.25 })
        .setLngLat([props.lng!, props.lat!])
        .setPopup(pinPopup(props.selfId, props.name, props.lat!, props.lng!, 28))
        .addTo(map),
    )
  }
}

const details = new Map<string, Promise<PinDetails | null>>()

/** A pin's popup: the name at once, then the map view's facts and the exterior photo. */
function pinPopup(id: string, name: string, lat: number, lng: number, offset: number) {
  const box = document.createElement('div')
  box.className = 'pm-pop'
  box.append(el('strong', 'pm-pop-name', name), el('span', 'pm-pop-wait', 'Loading…'))
  const popup = new mapboxgl.Popup({ offset, maxWidth: '280px', className: 'pm-popup' }).setDOMContent(box)
  popup.on('open', () => {
    if (!details.has(id)) details.set(id, fetchPinDetails(id).catch(() => null))
    void details.get(id)!.then((d) => {
      if (!d) {
        box.replaceChildren(el('strong', 'pm-pop-name', name), el('span', 'pm-pop-wait', 'Could not load its details.'))
        return
      }
      const photo = d.cover ? Object.assign(document.createElement('img'), { src: d.cover, alt: `${d.name} exterior`, className: 'pm-pop-img' })
        : el('div', 'pm-pop-img pm-pop-img--none', 'No exterior photo')
      const head = el('div', 'pm-pop-head')
      head.append(el('strong', 'pm-pop-name', d.name), el('span', `pm-pop-pill pm-pop-pill--${STATUS_TONE[d.status] ?? 'muted'}`, humanizeEnum(d.status)))
      const rows = el('dl', 'pm-pop-rows')
      const km = kmBetween(CAMPUS.lat, CAMPUS.lng, lat, lng)
      for (const [k, v] of [
        ['Type', d.type ? humanizeEnum(d.type) : '—'],
        ['Beds taken', d.beds ? `${d.taken} of ${d.beds}` : 'No rooms yet'],
        ['From campus', `${km.toFixed(1)} km`],
        ['Landlord/Landlady', d.landlord || '—'],
        ['Address', d.address || '—'],
      ]) {
        const row = el('div', '')
        row.append(el('dt', '', k), el('dd', '', v))
        rows.append(row)
      }
      box.replaceChildren(photo, head, rows)
    })
  })
  return popup
}

/** textContent only — names and addresses are user input. */
function el(tag: string, className: string, text = '') {
  const node = document.createElement(tag)
  if (className) node.className = className
  node.textContent = text
  return node
}

const STATUS_TONE: Record<string, string> = {
  accredited: 'good',
  pending: 'warn',
  reviewing: 'warn',
  needs_revision: 'warn',
  rejected: 'bad',
  expired: 'bad',
  suspended: 'bad',
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

/* Pin popups are built outside Vue, so they are styled through :deep. Mapbox's
   own popup is white with inherited text, which went white-on-white in dark mode. */
.pm :deep(.pm-popup .mapboxgl-popup-content) {
  width: 260px;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--c-border);
  border-radius: 14px;
  background: var(--c-surface);
  box-shadow: var(--shadow-lg);
  color: var(--c-ink);
  font-family: inherit;
}
.pm :deep(.pm-popup .mapboxgl-popup-tip) { border-top-color: var(--c-surface); border-bottom-color: var(--c-surface); }
.pm :deep(.pm-popup .mapboxgl-popup-close-button) {
  top: 6px; right: 6px; width: 24px; height: 24px; border-radius: 8px;
  background: var(--c-surface); color: var(--c-muted); font-size: 16px; line-height: 1;
}
.pm :deep(.pm-pop) { display: flex; flex-direction: column; }
.pm :deep(.pm-pop-img) { display: block; width: 100%; height: 130px; object-fit: cover; background: var(--c-surface-2); }
.pm :deep(.pm-pop-img--none) { display: grid; place-items: center; height: 64px; color: var(--c-muted); font-size: 12px; }
.pm :deep(.pm-pop-head) { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 10px 14px; }
.pm :deep(.pm-pop > .pm-pop-name) { padding: 12px 34px 0 14px; }
.pm :deep(.pm-pop-name) { color: var(--c-ink); font-family: var(--font-display); font-size: 15px; line-height: 1.25; }
.pm :deep(.pm-pop-wait) { padding: 4px 14px 12px; color: var(--c-muted); font-size: 12px; }
.pm :deep(.pm-pop-pill) { padding: 2px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 700; background: var(--c-surface-2); color: var(--c-muted); }
.pm :deep(.pm-pop-pill--good) { background: var(--c-primary-soft); color: var(--c-primary); }
.pm :deep(.pm-pop-pill--warn) { background: var(--c-warning-soft); color: var(--c-warning); }
.pm :deep(.pm-pop-pill--bad) { background: var(--c-danger-soft); color: var(--c-danger); }
.pm :deep(.pm-pop-rows) { margin: 0; border-top: 1px solid var(--c-border); }
.pm :deep(.pm-pop-rows div) { display: flex; justify-content: space-between; gap: 12px; padding: 7px 14px; border-bottom: 1px solid var(--c-border); font-size: 12.5px; }
.pm :deep(.pm-pop-rows div:last-child) { border-bottom: 0; }
.pm :deep(.pm-pop-rows dt) { flex: none; color: var(--c-muted); }
.pm :deep(.pm-pop-rows dd) { min-width: 0; margin: 0; overflow: hidden; color: var(--c-ink); font-weight: 600; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
</style>
