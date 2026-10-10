<template>
  <!-- Sized to exactly the space under the header, so the list and the panel
       scroll inside themselves and the page never does. -->
  <q-page class="map-page" :style-fn="fitViewport">
    <div class="stage">
      <MapList
        v-model:search="search"
        v-model:filters="filters"
        v-model:area-ids="areaIds"
        :areas="areas"
        :items="shown"
        :total="items.length"
        :selected-id="selectedId"
        :hot-id="hotId"
        @select="select"
        @hover="hotId = $event"
      />

      <div ref="mapWrap" class="map" :class="{ 'is-drawing': drawing || dragging }">
        <div ref="mapContainer" class="map-canvas" />
        <p v-if="mapFailed" class="map-failed">The map needs WebGL, which this browser has turned off. Turn on hardware acceleration in the browser's settings and reload; the list still works.</p>

        <div class="legend" aria-label="Legend">
          <h2>Accreditation <span>centre dot</span></h2>
          <div v-for="(g, key) in STATUS_GROUPS" :key="key" class="l-row">
            <span class="dot" :style="{ background: `var(${g.token})` }" />{{ g.label }}
          </div>
          <h2 class="l-gap">Boarders <span>ring</span></h2>
          <div class="fills">
            <span v-for="k in BOARDER_KEY" :key="k.label"><span class="dot" :style="{ background: k.color }" />{{ k.label }}</span>
          </div>
        </div>

        <MapTools v-model:map-style="mapStyle" :drawing="drawing" :can-undo="canUndo" :show-undo="drawing || !!selectedArea" @draw="toggleDraw" @undo="undoArea" />

        <MapAreaCard v-if="selectedArea && stats" :area="selectedArea" :stats="stats" @rename="areaDialog = 'rename'" @delete="areaDialog = 'delete'" @close="areaIds = []" />
        <MapAreaDialog :mode="areaDialog" :area="selectedArea" :busy="areaSaving" @save="saveName" @delete="removeArea" @close="closeAreaDialog" />

        <button v-if="farItems.length" type="button" class="edge" @click="showFar">
          <Icon icon="lucide:move-down-left" width="16" height="16" aria-hidden="true" />
          <span><b>{{ farItems.length }} more than {{ FRAME_KM }} km away</b><br>Show them on the map</span>
        </button>

        <MapPinCard
          v-if="selected && !detailOpen && selectedPoint"
          :item="selected"
          :x="selectedPoint.x"
          :y="selectedPoint.y"
          :map-width="mapSize.w"
          :map-height="mapSize.h"
          :walk="walk?.id === selected.id ? walk.text : ''"
          :side="cardPlacement"
          @close="selectedId = null"
          @open="openDetail"
        />

        <MapDetailPanel
          v-if="selected && detailOpen"
          :item="selected"
          :preview="accommodationPreview"
          :loading="detailLoading"
          @close="detailOpen = false"
          @view-all="viewAll"
        />
      </div>
    </div>

    <!-- "View all" opens the full record, the Accommodation Hub's drawer. -->
    <DetailDrawer
      v-model="drawerOpen"
      size="full"
      close-on-backdrop
      :loading="detailLoading"
      :preview="accommodationPreview"
      :initial-tab="drawerTab"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { Icon } from '@iconify/vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import MapList from '@/features/map/MapList.vue'
import MapPinCard from '@/features/map/MapPinCard.vue'
import MapDetailPanel from '@/features/map/MapDetailPanel.vue'
import MapTools from '@/features/map/MapTools.vue'
import MapAreaCard from '@/features/map/MapAreaCard.vue'
import MapAreaDialog from '@/features/map/MapAreaDialog.vue'
import { presetOf, savedStyle, saveStyle } from '@/features/map/mapStyles'
import { useMapAreas } from '@/features/map/useMapAreas'
import '@/features/map/map-markers.css'
import {
  EMPTY_BED, FRAME_KM, SEX_COLORS, STATUS_GROUPS, boarderRing, circleRing, statusGroup, type MapItem,
} from '@/features/map/mapPins'
import { addCampusLayers, cardSide, frameWalk, useCampusWalk, type CardSide } from '@/features/map/campusRoute'
import { CAMPUS, kmBetween } from '@/utils/geo'
import { humanizeEnum } from '@/utils/format'
import { useAccommodations } from '@/composables/useAccommodations'
import { useAccommodationRecord, toRecordRow } from '@/composables/useAccommodationRecord'
import { consoleZoom, fitViewport } from '@/utils/consoleScale'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Disable Mapbox telemetry (events.mapbox.com). postEvent() short-circuits when
// EVENTS_URL is falsy, so the request is never made — otherwise trackers/ad-blockers
// log ERR_BLOCKED_BY_CLIENT noise. API_URL is left intact so the map still loads.
try {
  Object.defineProperty(mapboxgl.config, 'EVENTS_URL', { get: () => null, configurable: true })
} catch { /* mapbox telemetry opt-out is best-effort; an older build without EVENTS_URL is fine */ }

// QPage's default is a min-height; this page wants a fixed one.

const BOARDER_KEY = [
  { label: 'Female', color: SEX_COLORS.female }, { label: 'Male', color: SEX_COLORS.male },
  { label: 'Not recorded', color: SEX_COLORS.unrecorded }, { label: 'Empty bed', color: EMPTY_BED },
]

const $q = useQuasar()
const route = useRoute()
const { accommodations, load } = useAccommodations()
const rows = computed(() => accommodations.value.map(toRecordRow))
const { detailLoading, openAccommodation, accommodationPreview } = useAccommodationRecord(rows)

// An accommodation without coordinates is left off the map and the list: the
// honest rendering of an unknown location is no pin at all (mobile requires one).
const items = computed<MapItem[]>(() =>
  rows.value
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      type: humanizeEnum(r.type),
      statusLabel: r.statusLabel,
      group: statusGroup(r.status),
      taken: Math.min(r.totalStudents ?? 0, r.totalCapacity ?? 0),
      beds: r.totalCapacity ?? 0,
      female: r.femaleCount ?? 0,
      male: r.maleCount ?? 0,
      km: kmBetween(CAMPUS.lat, CAMPUS.lng, r.lat as number, r.lng as number),
      lat: r.lat as number,
      lng: r.lng as number,
      landlord: r.landlord,
      landlordSex: r.landlordSex,
      address: r.address && r.address !== '—' ? r.address : '',
      photos: r.photos,
      row: r,
    })),
)

// Search and chips drive the list and the pins together.
const search = ref('')
const filters = ref<string[]>([])
const shown = computed(() => {
  const q = search.value.trim().toLowerCase()
  const groups = filters.value.filter((f) => f !== 'free')
  return items.value.filter((i) => {
    if (!inAreas(i)) return false
    if (q && !`${i.name} ${i.landlord} ${i.address}`.toLowerCase().includes(q)) return false
    if (groups.length && !groups.includes(i.group)) return false
    if (filters.value.includes('free') && i.taken >= i.beds) return false
    return true
  })
})
// Areas OSAS draws, like districts: they narrow the list and the pins too.
const {
  areas, areaIds, dialog: areaDialog, saving: areaSaving, selectedArea, stats, drawing, dragging,
  inAreas, load: loadAreas, saveName, remove: removeArea, closeDialog: closeAreaDialog, toggleDraw, canUndo, undo: undoArea,
  addLayers: addAreaLayers, bind: bindAreas, onKey: areaKey,
} = useMapAreas(() => map, items)

const farItems = computed(() => shown.value.filter((i) => i.km > FRAME_KM))

const selectedId = ref<string | null>(null)
const hotId = ref<string | null>(null)
const detailOpen = ref(false)
const selected = computed(() => shown.value.find((i) => i.id === selectedId.value) ?? null)

const drawerOpen = ref(false)
const drawerTab = ref('rooms')

// ── the map ──
const mapWrap = ref<HTMLElement | null>(null)
const mapContainer = ref<HTMLElement | null>(null)
// Mapbox draws with WebGL. With hardware acceleration off or a blocklisted GPU
// driver it throws on creation, and the page used to die with it.
const mapFailed = ref(false)
let map: mapboxgl.Map | null = null
const pins = new Map<string, { marker: mapboxgl.Marker; el: HTMLButtonElement; wrap: HTMLDivElement }>()
let campusMarker: mapboxgl.Marker | null = null

// The base map preset, remembered in this browser (mapStyles.ts).
const mapStyle = ref(savedStyle())
const imagery = computed(() => !!presetOf(mapStyle.value).imagery)
const styleUrl = computed(() => `mapbox://styles/mapbox/${presetOf(mapStyle.value).style($q.dark.isActive)}`)
watch(styleUrl, (url) => map?.setStyle(url))
watch(mapStyle, saveStyle)

// The card follows its pin as the map pans and zooms.
const mapSize = ref({ w: 0, h: 0 })
const viewTick = ref(0)
const selectedPoint = computed(() => {
  void viewTick.value
  if (!map || !selected.value) return null
  // The canvas sits outside the console zoom (app.css), so its px are screen
  // px; the pin card beside it is inside the zoom.
  const p = map.project([selected.value.lng, selected.value.lat])
  const z = consoleZoom()
  return { x: p.x / z, y: p.y / z }
})

function select(id: string) {
  // With the detail panel open, picking another accommodation swaps it.
  if (detailOpen.value) {
    selectedId.value = id
    openDetail()
    return
  }
  selectedId.value = selectedId.value === id ? null : id
  const item = selected.value
  if (item) flyToPin(item)
}

/** Pans to a picked pin, below centre so the card has room. The zoom is left to
 *  frameWalk once the route arrives, so the map does not zoom twice. */
function flyToPin(item: MapItem) {
  if (!map) return
  const drop = Math.min(180, mapSize.value.h * 0.25)
  map.flyTo({ center: [item.lng, item.lat], offset: [0, drop], essential: true })
}

function openDetail() {
  if (!selected.value) return
  openAccommodation(selected.value.row)
  detailOpen.value = true
}

function viewAll(tab: string) {
  drawerTab.value = tab
  drawerOpen.value = true
}

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

// The walk to campus along the roads, as accommo-mobile draws it.
const { walk, show: showWalk, dispose: disposeWalk } = useCampusWalk(() => map)
watch(selectedId, () => { void showWalk(selected.value) })

// Once the route is known the card moves off it, and the map eases to show the
// whole walk with room kept clear on the card's side of the pin.
const cardPlacement = computed<CardSide>(() =>
  selected.value && walk.value?.id === selected.value.id ? cardSide(selected.value, walk.value.coords) : 'above')
watch(walk, (w) => {
  const item = selected.value
  if (map && w && item && w.id === item.id && !detailOpen.value) frameWalk(map, item, w.coords, cardPlacement.value)
})

function frameCampus(duration = 0) {
  const ring = circleRing(CAMPUS, FRAME_KM, 16)
  const bounds = ring.reduce((b, p) => b.extend(p), new mapboxgl.LngLatBounds(ring[0], ring[0]))
  map?.fitBounds(bounds, { padding: 24, duration })
}

function showFar() {
  if (!map || !farItems.value.length) return
  const first = farItems.value[0]!
  const bounds = farItems.value.reduce((b, i) => b.extend([i.lng, i.lat]), new mapboxgl.LngLatBounds([first.lng, first.lat], [first.lng, first.lat]))
  map.fitBounds(bounds, { padding: 120, maxZoom: 15 })
}

function onKey(e: KeyboardEvent) {
  if (drawerOpen.value || areaKey(e) || e.key !== 'Escape') return
  if (detailOpen.value) detailOpen.value = false
  else selectedId.value = null
}
let resizeObs: ResizeObserver | null = null

onMounted(async () => {
  window.addEventListener('keydown', onKey)
  void loadAreas()
  await load()
  await nextTick()
  if (!mapContainer.value) return

  try {
    map = new mapboxgl.Map({ container: mapContainer.value, style: styleUrl.value, center: [CAMPUS.lng, CAMPUS.lat], zoom: 12.5 })
  } catch {
    mapFailed.value = true
    return
  }
  // A style switch drops custom layers: put the rings back and redraw the walk.
  map.on('style.load', () => {
    if (!map) return
    addCampusLayers(map, imagery.value)
    addAreaLayers(imagery.value)
    void showWalk(selected.value)
  })
  map.on('move', () => { viewTick.value++ })
  map.on('click', () => { if (!detailOpen.value && !drawing.value) selectedId.value = null })
  bindAreas()

  const campusEl = document.createElement('div')
  campusEl.className = 'map-campus'
  campusEl.innerHTML = '<i></i>ISU Echague campus'
  campusMarker = new mapboxgl.Marker({ element: campusEl, anchor: 'top', offset: [0, 10] }).setLngLat([CAMPUS.lng, CAMPUS.lat]).addTo(map)

  resizeObs = new ResizeObserver(() => {
    if (!mapWrap.value) return
    mapSize.value = { w: mapWrap.value.clientWidth, h: mapWrap.value.clientHeight }
    map?.resize()
    viewTick.value++
  })
  if (mapWrap.value) resizeObs.observe(mapWrap.value)

  map.on('load', () => {
    frameCampus()
    syncPins()
    // Deep link: ?accommodation=<id> selects it and brings it into view.
    const target = route.query.accommodation
    const item = typeof target === 'string' ? items.value.find((i) => i.id === target) : undefined
    if (item) {
      selectedId.value = item.id
      flyToPin(item)
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  resizeObs?.disconnect()
  pins.forEach((p) => p.marker.remove())
  pins.clear()
  campusMarker?.remove()
  disposeWalk()
  map?.remove()
  map = null
})
</script>

<style scoped>
.map-page { display: flex; padding: 16px; overflow: hidden !important; background: var(--c-bg); }
.stage { display: grid; flex: 1; grid-template-columns: 340px minmax(0, 1fr); min-height: 0; overflow: hidden; border: 1px solid var(--c-border); border-radius: 16px; background: var(--c-surface); }
.map { position: relative; min-width: 0; min-height: 0; overflow: hidden; }
.map-canvas { position: absolute; inset: 0; }
.map-failed { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; margin: 0; padding: 24px; color: var(--c-muted); font-size: 13px; text-align: center; }

.legend { position: absolute; top: 14px; left: 14px; z-index: 2; display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid var(--c-border); border-radius: 12px; background: var(--c-surface); box-shadow: var(--shadow); color: var(--c-text); font-size: 11.5px; }
.legend h2 { margin: 0 0 2px; color: var(--c-muted); font-size: 11.5px; font-weight: 700; line-height: 1.3; }
.legend h2 span { font-weight: 500; opacity: 0.8; }
.legend .l-gap { margin-top: 4px; }
.l-row { display: flex; align-items: center; gap: 8px; }
.dot { width: 9px; height: 9px; flex: none; border-radius: 50%; }
.fills { display: grid; grid-template-columns: auto auto; gap: 4px 12px; }
.fills > span { display: inline-flex; align-items: center; gap: 8px; }

.edge { position: absolute; bottom: 14px; left: 14px; z-index: 2; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--c-border); border-radius: 12px; background: var(--c-surface); box-shadow: var(--shadow); color: var(--c-text); font: inherit; font-size: 12px; text-align: left; cursor: pointer; }
.edge b { color: var(--c-ink); }
.edge:hover { border-color: var(--c-primary); }
.edge:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }

:deep(.mapboxgl-ctrl-attrib) { font-size: 10px; }
</style>
