<template>
  <q-page class="users-page full-map-page relative-position">

    <!-- MAPBOX CANVAS -->
    <div ref="mapContainer" class="map-container"></div>

    <!-- SEARCH + FILTER + FLOATING PANEL (top-left): toolbar, then list ⇄ detail -->
    <div class="map-toolbar" style="position: absolute; top: 24px; left: 32px; bottom: 32px; z-index: 10; width: 440px; display: flex; flex-direction: column;">

      <!-- Search + Filter (outside the table) -->
      <div class="toolbar-row row no-wrap items-center q-mb-md non-shrink">
        <q-input
          v-model="search"
          outlined
          dense
          bg-color="surface"
          placeholder="Search property, landlord..."
          class="search-input col"
          clearable
        >
          <template v-slot:prepend>
            <Icon icon="mdi:magnify" width="20" height="20" color="var(--c-muted)" />
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
      <div v-if="!selectedProperty" class="property-panel bg-surface shadow-2">
        <PropertyList
          :properties="filteredForList"
          @select="onSelectProperty"
        />
      </div>

      <!-- DETAIL STATE: the panel becomes the property detail -->
      <div v-else class="property-panel bg-surface shadow-2">
        <PropertyDetail
          :key="selectedProperty?.id"
          :property="selectedProperty"
          @back="selectedProperty = null"
        />
      </div>
    </div>

    <!-- MAP STYLE TOGGLE (top-right) -->
    <div class="style-toggle bg-surface shadow-1" style="position: absolute; top: 32px; right: 32px; z-index: 10;">
      <q-btn-group rounded flat>
        <q-btn
          unelevated
          no-caps
          dense
          :class="mapStyle === 'satellite' ? 'active-style' : 'inactive-style'"
          class="q-px-sm"
          @click="setStyle('satellite')"
        >
          <Icon icon="mdi:satellite-variant" width="18" height="18" class="q-mr-xs" /> Realistic
        </q-btn>
        <q-btn
          unelevated
          no-caps
          dense
          :class="mapStyle === 'plain' ? 'active-style' : 'inactive-style'"
          class="q-px-sm"
          @click="setStyle('plain')"
        >
          <Icon icon="mdi:map-outline" width="18" height="18" class="q-mr-xs" /> Plain
        </q-btn>
      </q-btn-group>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import PropertyList from '@/components/properties/PropertyList.vue'
import PropertyDetail from '@/components/properties/PropertyDetail.vue'
import FilterDropdown from '@/components/ui/FilterDropdown.vue'
import { useProperties } from '@/composables/useProperties'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Disable Mapbox telemetry (events.mapbox.com). postEvent() short-circuits when
// EVENTS_URL is falsy, so the request is never made — otherwise trackers/ad-blockers
// log ERR_BLOCKED_BY_CLIENT noise. API_URL is left intact so the map still loads.
try {
  Object.defineProperty(mapboxgl.config, 'EVENTS_URL', { get: () => null, configurable: true })
} catch {}

const { properties, load: loadProperties } = useProperties()

const mapContainer = ref<HTMLElement | null>(null)
let map: mapboxgl.Map | null = null
let markers: mapboxgl.Marker[] = []

const selectedProperty = ref<any>(null)
const search = ref('')
const activeFilters = ref<Record<string, any[]>>({})

// Filters (property type / room type / status) — applied by MapView, so the
// search + filter toolbar can sit OUTSIDE the PropertyList table.
const filters = [
  {
    key: 'propertyType',
    label: 'Property Type',
    options: [
      { label: 'Dormitory', value: 'Dormitory' },
      { label: 'Bedspace', value: 'Bedspace' },
      { label: 'Apartment', value: 'Apartment' },
      { label: 'Boarding House', value: 'Boarding House' },
    ],
  },
  {
    key: 'roomType',
    label: 'Room Type',
    options: [
      { label: 'Solo', value: 'solo' },
      { label: 'Duo', value: 'duo' },
      { label: 'Triple', value: 'triple' },
      { label: 'Bedspace', value: 'bedspace' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'Verified', value: 'verified' },
      { label: 'Pending', value: 'pending' },
    ],
  },
]

function clearFilters() {
  activeFilters.value = {}
}

// The left panel is a list ⇄ detail toggle. selectedProperty == null → list;
// otherwise the panel shows PropertyDetail for that property.
const filteredForList = computed(() => {
  let list = properties.value.slice()

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

// Watch the raw property set (not the filtered list) so markers always match
// the full dataset; the toolbar filters only control the side list.
watch(properties, () => addMarkers())

// 'plain' = light-v11 flat; 'satellite' = satellite-streets imagery
const mapStyle = ref<'plain' | 'satellite'>('plain')
const MAP_STYLES: Record<'plain' | 'satellite', string> = {
  plain: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

// Selecting a property swaps the panel to its DETAIL view and jumps the map to
// that property's location (its lat/lng — real coords when available, otherwise
// the derived fallback used for markers).
function onSelectProperty(p: any) {
  selectedProperty.value = p
  flyToProperty(p)
}

function flyToProperty(p: any) {
  if (!map) return
  const lat = p.lat ?? p._fallbackLat
  const lng = p.lng ?? p._fallbackLng
  if (lat != null && lng != null) {
    map.flyTo({ center: [lng, lat], zoom: 16, essential: true })
  }
}

function setStyle(style: 'plain' | 'satellite') {
  mapStyle.value = style
  map?.setStyle(MAP_STYLES[style])
}

function addMarkers() {
  if (!map) return
  markers.forEach(m => m.remove())
  markers = []
  const centerLat = 16.710
  const centerLng = 121.720

  properties.value.forEach((p, i) => {
    const hasCoords = p.lat != null && p.lng != null
    const angle = (i / Math.max(1, properties.value.length)) * Math.PI * 2
    const radius = 0.008 + (i % 3) * 0.004
    const lat = hasCoords ? p.lat! : centerLat + Math.sin(angle) * radius
    const lng = hasCoords ? p.lng! : centerLng + Math.cos(angle) * radius * 1.3
    ;(p as any)._fallbackLat = lat
    ;(p as any)._fallbackLng = lng

    const marker = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map!)
    // Default Mapbox marker is a teal droplet whose bottom tip lands exactly on
    // the location — no custom pin/rotation so it can't drift or look buried.

    // Wire the default marker's underlying element to open the detail + fly.
    if (marker.getElement()) {
      marker.getElement().addEventListener('click', () => {
        flyToProperty(p)
        onSelectProperty(p)
      })
    }

    markers.push(marker)
  })
}

onMounted(async () => {
  await loadProperties()
  await nextTick()
  if (!mapContainer.value) return

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: MAP_STYLES[mapStyle.value],
    center: [121.720, 16.710],
    zoom: 14,
  })

  const onReady = () => addMarkers()
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

.property-panel {
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

.style-toggle {
  border-radius: 12px;
  border: 1px solid var(--c-border-strong, #e6e8eb);
  overflow: hidden;
}
.style-toggle .active-style {
  background: #0d9488;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
}
.style-toggle .inactive-style {
  background: #fff;
  color: #555;
  font-size: 12px;
}

:deep(.mapboxgl-ctrl-attrib) { font-size: 10px; }
</style>
