<template>
  <!-- The Map View's side column: search, status chips, and every shown
       accommodation grouped by distance from campus. Hover and selection are
       shared with the pins through the page. -->
  <aside class="side" aria-label="Accommodations">
    <div class="side-head">
      <label class="search" for="map-search">
        <Icon icon="lucide:search" width="16" height="16" aria-hidden="true" />
        <input
          id="map-search"
          type="search"
          :value="search"
          placeholder="Search accommodations"
          autocomplete="off"
          @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <div class="chips" role="group" aria-label="Filter the list and the map">
        <button
          v-for="chip in CHIPS"
          :key="chip.key"
          type="button"
          class="chip"
          :aria-pressed="filters.includes(chip.key)"
          @click="toggle(chip.key)"
        >
          <span v-if="chip.token" class="dot" :style="{ background: `var(${chip.token})` }" />
          {{ chip.label }}
        </button>
      </div>
      <div v-if="areas.length" class="chips" role="group" aria-label="Filter by area">
        <button
          v-for="area in areas"
          :key="area.id"
          type="button"
          class="chip"
          :aria-pressed="areaIds.includes(area.id)"
          @click="toggleArea(area.id)"
        >
          <span class="dot swatch" :style="{ background: area.color }" />
          {{ area.name }}
        </button>
      </div>
      <p class="count"><b>{{ items.length }}</b> of {{ total }} accommodations shown, on the list and the map</p>
    </div>

    <div ref="listEl" class="list" @mouseleave="$emit('hover', null)">
      <template v-for="band in bands" :key="band.key">
        <div class="group"><span>{{ band.label }}</span><span>{{ band.items.length }}</span></div>
        <button
          v-for="item in band.items"
          :id="`map-row-${item.id}`"
          :key="item.id"
          type="button"
          class="row"
          :class="{ 'is-sel': item.id === selectedId, 'is-hot': item.id === hotId }"
          @click="$emit('select', item.id)"
          @mouseenter="$emit('hover', item.id)"
        >
          <span class="glyph" :style="{ background: boarderRing(item.female, item.male, item.taken, item.beds) }"><i :style="{ background: `var(${STATUS_GROUPS[item.group].token})` }" /></span>
          <span class="mid">
            <span class="nm">{{ item.name }}</span>
            <span class="sub">{{ item.statusLabel }}, {{ item.type.toLowerCase() }}</span>
          </span>
          <span class="km">{{ item.km.toFixed(1) }} km<span class="beds">{{ item.taken }}/{{ item.beds }} beds</span></span>
        </button>
      </template>
      <p v-if="!items.length" class="empty">No accommodation matches. Clear a filter or change the search.</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { DISTANCE_BANDS, STATUS_GROUPS, bandOf, boarderRing, type MapItem } from './mapPins'
import type { MapArea } from './mapAreas'

const props = defineProps<{
  items: MapItem[]
  total: number
  search: string
  filters: string[]
  areas: MapArea[]
  /** The areas the list and the map are narrowed to. */
  areaIds: string[]
  selectedId: string | null
  hotId: string | null
}>()

const emit = defineEmits<{
  'update:search': [string]
  'update:filters': [string[]]
  'update:areaIds': [string[]]
  select: [string]
  hover: [string | null]
}>()

const CHIPS = [
  { key: 'accredited', label: 'Accredited', token: STATUS_GROUPS.accredited.token },
  { key: 'awaiting', label: 'Awaiting', token: STATUS_GROUPS.awaiting.token },
  { key: 'not', label: 'Not accredited', token: STATUS_GROUPS.not.token },
  { key: 'free', label: 'Has free beds', token: '' },
]

function toggle(key: string) {
  const next = props.filters.includes(key) ? props.filters.filter((k) => k !== key) : [...props.filters, key]
  emit('update:filters', next)
}

function toggleArea(id: string) {
  const next = props.areaIds.includes(id) ? props.areaIds.filter((k) => k !== id) : [...props.areaIds, id]
  emit('update:areaIds', next)
}

const bands = computed(() =>
  DISTANCE_BANDS.map((b) => ({
    ...b,
    items: props.items.filter((i) => bandOf(i.km).key === b.key).sort((a, c) => a.km - c.km),
  })).filter((b) => b.items.length),
)

// A pin picked on the map brings its row into view.
const listEl = ref<HTMLElement | null>(null)
watch(() => props.selectedId, async (id) => {
  if (!id) return
  await nextTick()
  listEl.value?.querySelector(`#map-row-${CSS.escape(id)}`)?.scrollIntoView({ block: 'nearest' })
})
</script>

<style scoped>
.side { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid var(--c-border); background: var(--c-surface); }
.side-head { display: flex; flex-direction: column; gap: 10px; padding: 14px 14px 10px; border-bottom: 1px solid var(--c-border); }
.search { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-bg); color: var(--c-muted); }
.search input { flex: 1; min-width: 0; border: 0; background: none; color: var(--c-ink); font: inherit; outline: none; }
.search:focus-within { border-color: var(--c-primary); }

.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 1px solid var(--c-border-strong); border-radius: 999px; background: var(--c-surface); color: var(--c-text); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.chip:hover { border-color: var(--c-primary); }
.chip[aria-pressed='true'] { border-color: var(--c-primary); background: var(--c-primary-soft); color: var(--c-primary); }
.chip:focus-visible, .row:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.dot { width: 9px; height: 9px; flex: none; border-radius: 50%; }
.dot.swatch { border-radius: 3px; }
.count { margin: 0; color: var(--c-muted); font-size: 12px; }
.count b { color: var(--c-ink); font-variant-numeric: tabular-nums; }

.list { flex: 1; min-height: 0; overflow-y: auto; }
.group { display: flex; justify-content: space-between; padding: 12px 14px 4px; color: var(--c-muted); font-size: 11.5px; font-weight: 700; letter-spacing: 0.02em; }
.row { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; align-items: center; gap: 10px; width: 100%; padding: 9px 14px; border: 0; border-top: 1px solid var(--c-border); background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.group + .row { border-top: 0; }
.row:hover, .row.is-hot { background: var(--c-surface-2); }
.row.is-sel { background: var(--c-primary-soft); }
.mid { min-width: 0; }
.nm { display: block; overflow: hidden; color: var(--c-ink); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.sub { display: block; overflow: hidden; color: var(--c-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.km { color: var(--c-ink); font-size: 12.5px; font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }
.beds { display: block; color: var(--c-muted); font-size: 11.5px; font-weight: 500; }
.empty { margin: 0; padding: 32px 20px; color: var(--c-muted); text-align: center; }

/* The pin in small: boarders by sex in the ring, accreditation in the centre. */
.glyph { position: relative; width: 18px; height: 18px; border: 1.5px solid var(--c-surface); border-radius: 50%; box-sizing: border-box; box-shadow: 0 0 0 1px var(--c-border); }
.glyph i { position: absolute; inset: 4px; border-radius: 50%; box-shadow: 0 0 0 1.5px var(--c-surface); }
</style>
