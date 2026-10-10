<template>
  <!-- The small card above a selected pin, centred on it with a pointer down to
       it. Near the map's side edges it slides sideways to stay inside, and the
       pointer stays on the pin. When the walk to campus heads north it would
       run under the card, so the card moves beside the pin instead. The
       house's exterior photos lead the card; the photo opens them full screen. -->
  <div class="anchor" :class="`is-${placed}`" :style="position">
  <div ref="cardEl" class="card" role="dialog" :aria-label="item.name">
    <div v-if="item.photos.length" class="photo">
      <button type="button" class="photo-open" :aria-label="`View the exterior photos of ${item.name}`" @click="viewing = shown">
        <img :src="item.photos[shown]" :alt="`${item.name}, exterior photo ${shown + 1} of ${item.photos.length}`" />
      </button>
      <template v-if="item.photos.length > 1">
        <button type="button" class="photo-nav photo-prev" aria-label="Previous photo" @click="step(-1)"><Icon icon="lucide:chevron-left" width="16" height="16" /></button>
        <button type="button" class="photo-nav photo-next" aria-label="Next photo" @click="step(1)"><Icon icon="lucide:chevron-right" width="16" height="16" /></button>
        <span class="photo-count">{{ shown + 1 }} / {{ item.photos.length }}</span>
      </template>
    </div>
    <div v-else class="photo-none"><Icon icon="lucide:image-off" width="15" height="15" aria-hidden="true" />No exterior photo yet</div>
    <div class="card-top">
      <div class="card-titles">
        <h3>{{ item.name }}</h3>
        <span><span class="pill" :class="STATUS_GROUPS[item.group].pill">{{ item.statusLabel }}</span></span>
      </div>
      <button type="button" class="x" aria-label="Close" @click="$emit('close')">
        <Icon icon="lucide:x" width="15" height="15" />
      </button>
    </div>
    <div class="bedbar" :title="`${pct}% of beds taken`"><i v-for="s in segments" :key="s.color" :style="{ width: `${s.pct}%`, background: s.color }" /></div>
    <dl>
      <div><dt>Beds taken</dt><dd>{{ item.taken }} of {{ item.beds }}</dd></div>
      <div>
        <dt>Boarders</dt>
        <dd v-if="item.taken">
          <span :style="{ color: SEX_COLORS.female }">{{ item.female }} female</span> ·
          <span :style="{ color: SEX_COLORS.male }">{{ item.male }} male</span><template v-if="unrecorded"> · {{ unrecorded }} not recorded</template>
        </dd>
        <dd v-else class="is-pending">None yet</dd>
      </div>
      <div><dt>From campus</dt><dd>{{ item.km.toFixed(1) }} km</dd></div>
      <div>
        <dt>Walk to campus</dt>
        <dd :class="{ 'is-pending': !walk }">{{ walk || 'Finding the route…' }}</dd>
      </div>
      <div><dt>{{ landlordTitle(item.landlordSex) }}</dt><dd>{{ item.landlord || '—' }}</dd></div>
      <div><dt>Address</dt><dd>{{ item.address || '—' }}</dd></div>
    </dl>
    <div class="card-foot">
      <small>{{ item.type }}</small>
      <button type="button" class="open" @click="$emit('open')">Open details</button>
    </div>
  </div>
  <q-dialog :model-value="viewing !== null" maximized @update:model-value="viewing = null">
    <PhotoLightbox v-if="viewing !== null" v-model:index="viewing" title="Exterior photos" :photos="item.photos" style="border-radius: 0" @close="viewing = null" />
  </q-dialog>
  <span class="pointer" :style="placed === 'above' ? { left: `${pointerLeft}px` } : { top: `${pointerTop}px` }" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { landlordTitle } from '@/utils/format'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import PhotoLightbox from '@/features/drawer/accommodation/PhotoLightbox.vue'
import { SEX_COLORS, STATUS_GROUPS, type MapItem } from './mapPins'
import type { CardSide } from './campusRoute'

const props = defineProps<{
  item: MapItem
  /** The pin's position inside the map, px. */
  x: number
  y: number
  mapWidth: number
  mapHeight: number
  /** The walk to campus along the roads ("650 m · 8 min walk"); empty while it is fetched. */
  walk: string
  /** Which side of the pin keeps the card off the walking route. */
  side: CardSide
}>()
defineEmits<{ close: []; open: [] }>()

// The exterior photo on show, and the one open full screen (null: closed).
const shown = ref(0)
const viewing = ref<number | null>(null)
watch(() => props.item.id, () => { shown.value = 0; viewing.value = null })
function step(by: number) {
  const n = props.item.photos.length
  shown.value = (shown.value + by + n) % n
}

const CARD_W = 272
/** Gap between the pin's centre and the pointer's tip: the pin's radius plus a little air. */
const LIFT = 22

// The bar, like the pin's ring: female, then male, then any boarder whose sex is not on record.
const unrecorded = computed(() => Math.max(0, props.item.taken - props.item.female - props.item.male))
const share = (n: number) => (props.item.beds ? (Math.min(n, props.item.beds) / props.item.beds) * 100 : 0)
const segments = computed(() => [
  { color: SEX_COLORS.female, pct: share(props.item.female) },
  { color: SEX_COLORS.male, pct: share(props.item.male) },
  { color: SEX_COLORS.unrecorded, pct: share(unrecorded.value) },
])
const pct = computed(() => (props.item.beds ? Math.round((Math.min(props.item.taken, props.item.beds) / props.item.beds) * 100) : 0))

/** Gap between the pin's centre and a beside-card's near edge. */
const BESIDE = 24

const width = computed(() => Math.min(CARD_W, props.mapWidth - 28))

// A side placement that would leave the map falls back to above the pin.
const placed = computed<CardSide>(() => {
  if (props.side === 'left' && props.x - BESIDE - width.value >= 14) return 'left'
  if (props.side === 'right' && props.x + BESIDE + width.value <= props.mapWidth - 14) return 'right'
  return 'above'
})

// Above: centred on the pin, then slid sideways just enough to stay inside the map.
const left = computed(() => {
  if (placed.value === 'left') return props.x - BESIDE - width.value
  if (placed.value === 'right') return props.x + BESIDE
  return Math.min(Math.max(14, props.x - width.value / 2), props.mapWidth - width.value - 14)
})
const pointerLeft = computed(() => Math.min(Math.max(18, props.x - left.value), width.value - 18))

// The card's own height, measured, so a card beside the pin can be centred on
// it and kept inside the map.
const cardEl = ref<HTMLElement | null>(null)
const cardHeight = ref(360)
let sizeObs: ResizeObserver | null = null
onMounted(() => {
  if (!cardEl.value) return
  sizeObs = new ResizeObserver(() => { cardHeight.value = cardEl.value?.offsetHeight ?? cardHeight.value })
  sizeObs.observe(cardEl.value)
})
onBeforeUnmount(() => sizeObs?.disconnect())

// Beside: centred on the pin vertically, then held inside the map.
const sideTop = computed(() =>
  Math.min(Math.max(14, props.y - cardHeight.value / 2), Math.max(14, props.mapHeight - cardHeight.value - 14)))
const pointerTop = computed(() => Math.min(Math.max(16, props.y - sideTop.value), cardHeight.value - 16) - 7)

// Above: the anchor's top is LIFT above the pin and the CSS translate lifts the
// card by its own height from there.
const position = computed(() => ({
  left: `${left.value}px`,
  top: `${placed.value === 'above' ? props.y - LIFT : sideTop.value}px`,
  width: `${width.value}px`,
}))
</script>

<style scoped>
.anchor { position: absolute; z-index: 6; transform: translateY(calc(-100% - 8px)); }
.anchor.is-left, .anchor.is-right { transform: none; }
.pointer { position: absolute; bottom: -7px; width: 14px; height: 14px; margin-left: -7px; border-right: 1px solid var(--c-border); border-bottom: 1px solid var(--c-border); background: var(--c-surface); transform: rotate(45deg); }
/* Beside the pin: the pointer moves to the near edge, level with the pin. */
.is-left .pointer, .is-right .pointer { bottom: auto; margin-left: 0; }
.is-left .pointer { right: -7px; transform: rotate(-45deg); }
.is-right .pointer { left: -7px; transform: rotate(135deg); }
.card { position: relative; overflow: hidden; border: 1px solid var(--c-border); border-radius: 14px; background: var(--c-surface); box-shadow: var(--shadow-lg); }
.photo { position: relative; height: 128px; background: var(--c-surface-2); }
.photo-open { display: block; width: 100%; height: 100%; padding: 0; border: 0; background: none; cursor: zoom-in; }
.photo-open img { display: block; width: 100%; height: 100%; object-fit: cover; }
.photo-nav { position: absolute; top: 50%; display: grid; place-items: center; width: 28px; height: 28px; margin-top: -14px; border: 0; border-radius: 50%; background: color-mix(in srgb, var(--c-surface) 90%, transparent); box-shadow: var(--shadow); color: var(--c-ink); cursor: pointer; }
.photo-prev { left: 8px; }
.photo-next { right: 8px; }
.photo-count { position: absolute; right: 8px; bottom: 8px; padding: 2px 8px; border-radius: 999px; background: rgba(0, 0, 0, 0.55); color: #fff; font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
.photo-none { display: flex; align-items: center; gap: 7px; padding: 9px 14px; border-bottom: 1px solid var(--c-border); background: var(--c-surface-2); color: var(--c-muted); font-size: 12px; }
.card-top { display: flex; align-items: flex-start; gap: 10px; padding: 12px 12px 10px 14px; }
.card-titles { display: flex; flex: 1; flex-direction: column; gap: 6px; min-width: 0; }
h3 { margin: 0; color: var(--c-ink); font-family: var(--font-display); font-size: 15.5px; letter-spacing: -0.01em; line-height: 1.25; }
.x { display: grid; flex: none; place-items: center; width: 26px; height: 26px; border: 0; border-radius: 8px; background: var(--c-surface-2); color: var(--c-muted); cursor: pointer; }
.pill { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 700; }
.pill.is-acc { background: var(--c-primary-soft); color: var(--c-primary); }
.pill.is-pen { background: var(--c-warning-soft); color: var(--c-warning); }
.pill.is-del { background: var(--c-surface-2); color: var(--c-muted); }
.bedbar { display: flex; height: 6px; margin: 0 14px 10px; overflow: hidden; border-radius: 3px; background: var(--c-surface-2); }
.bedbar i { display: block; flex: none; height: 100%; }
dl { margin: 0; border-top: 1px solid var(--c-border); }
dl div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 14px; border-bottom: 1px solid var(--c-border); font-size: 12.5px; }
dt { flex: none; color: var(--c-muted); }
dd { min-width: 0; margin: 0; overflow: hidden; color: var(--c-ink); font-variant-numeric: tabular-nums; font-weight: 600; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
dd.is-pending { color: var(--c-muted); font-weight: 500; }
.card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 14px 12px; }
.card-foot small { color: var(--c-muted); font-size: 11px; }
.open { height: 32px; padding: 0 14px; border: 0; border-radius: 9px; background: var(--c-primary); color: #fff; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; }
.photo-open:focus-visible, .photo-nav:focus-visible { outline: 2px solid var(--c-primary); outline-offset: -2px; }
.x:focus-visible, .open:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
</style>
