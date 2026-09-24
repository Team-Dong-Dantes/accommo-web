<template>
  <q-page class="users-page full-map-page relative-position">

    <!-- MAPBOX CANVAS -->
    <div ref="mapContainer" class="map-container"></div>

    <!-- SEARCH + FILTER + FLOATING PANEL (top-left): toolbar, then list ⇄ detail -->
    <div class="map-toolbar" style="position: absolute; top: 32px; left: 32px; bottom: 32px; z-index: 10; width: 440px; display: flex; flex-direction: column;">

      <!-- Search + Filter (outside the table) -->
      <div class="toolbar-row row no-wrap items-center q-mb-md non-shrink">
        <q-input
          v-model="search"
          outlined
          dense
          bg-color="surface"
          placeholder="Search accommodation, manager..."
          class="search-input col"
          clearable
        >
          <template v-slot:prepend>
            <Icon icon="lucide:search" width="20" height="20" color="var(--c-muted)" />
          </template>
        </q-input>

        <FilterDropdown
          class="filter-drop"
          :filters="filters"
          :active-filters="activeFilters"
          @update:active-filters="activeFilters = $event"
          @clear="clearFilters"
        />
      </div>

      <!-- LIST STATE -->
      <div v-if="!selectedAccommodation" class="accommodation-panel bg-surface shadow-2">
        <AccommodationList
          :accommodations="filteredForList"
          @select="onSelectAccommodation"
        />
      </div>

      <!-- DETAIL STATE: the panel becomes the accommodation detail -->
      <div v-else class="accommodation-panel bg-surface shadow-2">
        <AccommodationDetail
          :key="selectedAccommodation?.id"
          :accommodation="selectedAccommodation"
          @back="selectedAccommodation = null"
        />
      </div>
    </div>

    <!-- MAP STYLE TOGGLE (top-right) -->
    <div class="map-style-options" role="radiogroup" aria-label="Map style" style="position: absolute; top: 32px; right: 32px; z-index: 10;">
      <q-btn
        unelevated
        no-caps
        class="map-style-option"
        :class="{ 'is-active': mapStyle === 'plain' }"
        :aria-checked="mapStyle === 'plain'"
        role="radio"
        @click="setStyle('plain')"
      >
        <Icon icon="lucide:map" width="18" height="18" aria-hidden="true" />
        <span>Map</span>
      </q-btn>
      <q-btn
        unelevated
        no-caps
        class="map-style-option"
        :class="{ 'is-active': mapStyle === 'satellite' }"
        :aria-checked="mapStyle === 'satellite'"
        role="radio"
        @click="setStyle('satellite')"
      >
        <Icon icon="lucide:satellite" width="18" height="18" aria-hidden="true" />
        <span>Satellite</span>
      </q-btn>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import AccommodationList from '@/components/properties/PropertyList.vue'
import AccommodationDetail from '@/components/properties/PropertyDetail.vue'
import FilterDropdown from '@/components/ui/FilterDropdown.vue'
import { humanizeEnum } from '@/utils/format'
import { CAMPUS } from '@/utils/geo'
import { useAccommodations } from '@/composables/useAccommodations'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Disable Mapbox telemetry (events.mapbox.com). postEvent() short-circuits when
// EVENTS_URL is falsy, so the request is never made — otherwise trackers/ad-blockers
// log ERR_BLOCKED_BY_CLIENT noise. API_URL is left intact so the map still loads.
try {
  Object.defineProperty(mapboxgl.config, 'EVENTS_URL', { get: () => null, configurable: true })
} catch { /* mapbox telemetry opt-out is best-effort; an older build without EVENTS_URL is fine */ }

const { accommodations, load: loadAccommodations } = useAccommodations()
const route = useRoute()

const mapContainer = ref<HTMLElement | null>(null)
let map: mapboxgl.Map | null = null
let markers: mapboxgl.Marker[] = []

const selectedAccommodation = ref<any>(null)
const search = ref('')
const activeFilters = ref<Record<string, any[]>>({})

// Filters (accommodation type / room type / status) — applied by MapView, so the
// search + filter toolbar can sit OUTSIDE the AccommodationList table.
// Type options come from the loaded rows, not a hardcoded list: the fixed one
// offered 'Dormitory' / 'Apartment' / 'Boarding House' against row values built
// from the accommodation_type enum, and matched nothing. Derived options also
// track whatever the column actually holds.
const filters = computed(() => {
  const distinct = (key: 'accommodationType' | 'roomType') =>
    [...new Set(accommodations.value.map((p) => String(p[key] ?? '')).filter((v) => v && v !== '—'))]
      .sort()
      .map((v) => ({ label: humanizeEnum(v), value: v }))

  return [
    { key: 'accommodationType', label: 'Accommodation Type', options: distinct('accommodationType') },
    { key: 'roomType', label: 'Room Type', options: distinct('roomType') },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Verified', value: 'verified' },
        { label: 'Pending', value: 'pending' },
      ],
    },
  ]
})

function clearFilters() {
  activeFilters.value = {}
}

// The left panel is a list ⇄ detail toggle. selectedAccommodation == null → list;
// otherwise the panel shows AccommodationDetail for that accommodation.
const filteredForList = computed(() => {
  let list = accommodations.value.slice()

  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((p) =>
      [p.name, p.landlord, p.type]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    )
  }

  for (const key of Object.keys(activeFilters.value)) {
    const selected = activeFilters.value[key] as string[]
    if (!selected || selected.length === 0) continue
    list = list.filter((p) => {
      const val = key === 'status'
        ? (p.verified ? 'verified' : 'pending')
        : String((p as any)[key] ?? '')
      return selected.includes(val)
    })
  }

  return list
})

// Watch the raw accommodation set (not the filtered list) so markers always match
// the full dataset; the toolbar filters only control the side list.
watch(accommodations, () => addMarkers())

// 'plain' = light-v11 flat; 'satellite' = satellite-streets imagery
const mapStyle = ref<'plain' | 'satellite'>('plain')
const MAP_STYLES: Record<'plain' | 'satellite', string> = {
  plain: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

// Selecting an accommodation swaps the panel to its DETAIL view and jumps the map to
// that accommodation's location (its lat/lng — real coords when available, otherwise
// the derived fallback used for markers).
function onSelectAccommodation(accommodation: any) {
  selectedAccommodation.value = accommodation
  flyToAccommodation(accommodation)
}

function flyToAccommodation(accommodation: any) {
  if (!map) return
  const { lat, lng } = accommodation
  if (lat != null && lng != null) {
    map.flyTo({ center: [lng, lat], zoom: 16, essential: true })
  }
}

function setStyle(style: 'plain' | 'satellite') {
  mapStyle.value = style
  map?.setStyle(MAP_STYLES[style])
}

/**
 * Draw a marker per accommodation that has a recorded location.
 *
 * An accommodation without coordinates is left off the map. This used to place
 * it on a circle around a hardcoded centre and cache the made-up position on
 * the row as `_fallbackLat`/`_fallbackLng` — so an admin saw a pin at a
 * location nobody had entered, indistinguishable from a real one. Mobile
 * requires a pin before an accommodation can be created, so in practice there
 * is nothing to draw here; an unplaced row means bad data, and the honest
 * rendering of an unknown location is no pin at all.
 */
function addMarkers() {
  if (!map) return
  markers.forEach(m => m.remove())
  markers = []

  const bounds = new mapboxgl.LngLatBounds()
  let plotted = 0

  accommodations.value.forEach((accommodation) => {
    const { lat, lng } = accommodation
    if (lat == null || lng == null) return

    const marker = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map!)

    // Default Mapbox marker is a teal droplet whose bottom tip lands exactly on
    // the location — no custom pin/rotation so it can't drift or look buried.

    // Wire the default marker's underlying element to open the detail + fly.
    if (marker.getElement()) {
      marker.getElement().addEventListener('click', () => {
        flyToAccommodation(accommodation)
        onSelectAccommodation(accommodation)
      })
    }

    markers.push(marker)
    bounds.extend([lng, lat])
    plotted++
  })

  // Open on the accommodations themselves rather than a fixed centre and zoom.
  // They span two cities — the Echague cluster sits within a few km of campus,
  // but the Santiago ones are 10-15 km out, so no single fixed view holds them.
  if (plotted > 0) map.fitBounds(bounds, { padding: 64, maxZoom: 16, duration: 0 })
}

onMounted(async () => {
  await loadAccommodations()
  await nextTick()
  if (!mapContainer.value) return

  // Campus is only the opening frame for an empty map — addMarkers() fits the
  // view to the accommodations as soon as there are any.
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: MAP_STYLES[mapStyle.value],
    center: [CAMPUS.lng, CAMPUS.lat],
    zoom: 14,
  })

  const onReady = () => {
    addMarkers()
    // Deep-link support: ?accommodation=<id> focuses the accommodation on load.
    const targetId = route.query.accommodation
    if (typeof targetId === 'string' && targetId) {
      const target = accommodations.value.find((p) => p.id === targetId)
      if (target) {
        selectedAccommodation.value = target
        flyToAccommodation(target)
      }
    }
  }
  if (map.loaded()) onReady()
  else map.on('load', onReady)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
  padding: 0 !important;
}

.full-map-page { position: relative; }

.map-container {
  position: absolute;
  inset: 16px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--c-border-strong, #e6e8eb);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.accommodation-panel {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Toolbar search + filter spacing (outside the side table) */
.map-toolbar .toolbar-row {
  gap: 10px;
}
.map-toolbar .search-input :deep(.q-field__control) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.map-toolbar .filter-drop { margin-left: auto; }
.map-toolbar .filter-drop :deep(.q-btn) {
  border-radius: 12px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--c-border-strong, #cbcbcb);
  background: var(--c-surface);
}
.map-toolbar .search-input :deep(.q-field__control),
.map-toolbar .filter-drop :deep(.q-btn) {
  background: #fff;
}

.map-style-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 5px;
  border: 1px solid color-mix(in srgb, var(--c-border-strong) 88%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--c-surface-2) 92%, transparent);
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
}
.map-style-option {
  min-height: 38px;
  gap: 7px;
  border: 1px solid transparent;
  border-radius: 8px !important;
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 700;
  transition: background var(--t-fast), border-color var(--t-fast), box-shadow var(--t-fast), color var(--t-fast), transform 80ms ease-out;
}
.map-style-option:hover {
  color: var(--c-primary-ink);
}
.map-style-option:active {
  transform: scale(.97);
}
.map-style-option:focus-visible {
  outline: 3px solid var(--c-primary);
  outline-offset: 2px;
}
.map-style-option.is-active {
  border-color: color-mix(in srgb, var(--c-primary) 30%, transparent);
  background: var(--c-surface);
  box-shadow: var(--shadow-sm);
  color: var(--c-primary-ink);
}
.map-style-option.is-active :deep(.iconify) {
  color: var(--c-primary);
}

@media (max-width: 600px) {
  .map-style-options {
    right: 16px !important;
    top: 16px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-style-option {
    transition: none;
  }
}

:deep(.mapboxgl-ctrl-attrib) { font-size: 10px; }
</style>
