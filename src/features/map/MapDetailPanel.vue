<template>
  <!-- The Map View's detail panel: slides over the map's right side while the
       map stays where it is. Its tabs are the full record's own panes, fed a
       trimmed copy of the record, and its footer opens the full record. -->
  <section class="detail" :aria-label="`${item.name} details`">
    <div class="d-cover">
      <img v-if="cover && !coverBroken" :src="cover" alt="" class="d-img" @error="coverBroken = true" />
      <svg v-else class="d-hills" viewBox="0 0 480 132" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 100 L80 60 L140 84 L230 30 L320 70 L400 40 L480 66 V132 H0Z" fill="#fff" />
      </svg>
      <div class="d-fade" />
      <span class="d-type">{{ item.type }}</span>
      <button type="button" class="d-close" aria-label="Close details" @click="$emit('close')">
        <Icon icon="lucide:x" width="16" height="16" />
      </button>
      <h2>{{ item.name }}</h2>
      <span class="d-addr">{{ item.address ? `${item.address}, ` : '' }}{{ item.km.toFixed(1) }} km from campus</span>
    </div>

    <div class="d-stats">
      <div><b>{{ item.taken }}/{{ item.beds }}</b><span>Beds taken</span></div>
      <div><b>{{ overview?.roomCount ?? rooms.length }}</b><span>Rooms</span></div>
      <div>
        <b><span class="pill" :class="STATUS_GROUPS[item.group].pill">{{ item.statusLabel }}</span></b>
        <span class="clip" :title="item.landlord">{{ item.landlord || '—' }}</span>
      </div>
      <div><b>{{ overview?.ratingLabel ?? '—' }}</b><span>Rating</span></div>
    </div>

    <div class="d-tabs">
      <TabNav v-model="tab" :tabs="tabs" />
    </div>

    <div class="pane">
      <RowListSkeleton v-if="loading && !rooms.length" />
      <template v-else>
        <RoomsPane v-if="tab === 'rooms'" :preview="trimmed" @view-person="$emit('view-all', 'rooms')" @photos="$emit('view-all', 'rooms')" />
        <FacilitiesPane v-else-if="tab === 'facilities'" :preview="trimmed" @photos="$emit('view-all', 'facilities')" />
        <PermitsPane v-else-if="tab === 'permits'" :preview="trimmed" @view="$emit('view-all', 'permits')" />
        <ActivityPane v-else-if="tab === 'activity'" :preview="trimmed" />
        <ReviewsPane v-else :preview="trimmed" />
      </template>
    </div>

    <footer v-if="foot.total > 0" class="d-foot">
      <span class="va-note">{{ foot.shown < foot.total ? `Showing ${foot.shown} of ${foot.total}` : `All ${foot.total} shown` }}</span>
      <button type="button" class="viewall" @click="$emit('view-all', tab)">
        {{ foot.label }} <em>{{ foot.total }}</em>
        <Icon icon="lucide:chevron-right" width="14" height="14" aria-hidden="true" />
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import TabNav from '@/components/ui/TabNav.vue'
import RoomsPane from '@/features/drawer/accommodation/RoomsPane.vue'
import FacilitiesPane from '@/features/drawer/accommodation/FacilitiesPane.vue'
import PermitsPane from '@/features/drawer/accommodation/PermitsPane.vue'
import ActivityPane from '@/features/drawer/accommodation/ActivityPane.vue'
import ReviewsPane from '@/features/drawer/accommodation/ReviewsPane.vue'
import RowListSkeleton from '@/features/drawer/accommodation/RowListSkeleton.vue'
import type { DrawerPreview } from '@/components/ui/DetailDrawer.vue'
import { STATUS_GROUPS, type MapItem } from './mapPins'

const props = defineProps<{ item: MapItem; preview: DrawerPreview; loading: boolean }>()
defineEmits<{ close: []; 'view-all': [tab: string] }>()

/** How much of each tab the panel previews before "View all". */
const PREVIEW = { rooms: 4, facilities: 3, permits: 4, activity: 3, reviews: 2 } as const
type TabName = keyof typeof PREVIEW

const tab = ref<TabName>('rooms')
const coverBroken = ref(false)
watch(() => props.item.id, () => { coverBroken.value = false })

const overview = computed(() => props.preview.overview)
const cover = computed(() => overview.value?.coverUrl ?? '')
const rooms = computed(() => props.preview.rooms ?? [])

const totals = computed<Record<TabName, number>>(() => ({
  rooms: rooms.value.length,
  facilities: props.preview.facilities?.length ?? 0,
  permits: props.preview.files?.length ?? 0,
  activity: props.preview.activity?.length ?? 0,
  reviews: props.preview.reviews?.length ?? 0,
}))

// Counts ride in the labels, the way the mockup shows them ("Rooms 12").
const tabs = computed(() => [
  { name: 'rooms', label: `Rooms ${totals.value.rooms}` },
  { name: 'facilities', label: 'Shared Facilities' },
  { name: 'permits', label: `Permits ${totals.value.permits}` },
  { name: 'activity', label: 'Activity' },
  { name: 'reviews', label: `Ratings ${totals.value.reviews}` },
])

const trimmed = computed<DrawerPreview>(() => ({
  ...props.preview,
  rooms: rooms.value.slice(0, PREVIEW.rooms),
  facilities: (props.preview.facilities ?? []).slice(0, PREVIEW.facilities),
  files: (props.preview.files ?? []).slice(0, PREVIEW.permits),
  activity: (props.preview.activity ?? []).slice(0, PREVIEW.activity),
  reviews: (props.preview.reviews ?? []).slice(0, PREVIEW.reviews),
}))

const FOOT_LABEL: Record<TabName, string> = {
  rooms: 'View all rooms',
  facilities: 'View all shared facilities',
  permits: 'View all permits',
  activity: 'View all activity',
  reviews: 'View all ratings',
}
const foot = computed(() => {
  const total = totals.value[tab.value]
  return { label: FOOT_LABEL[tab.value], total, shown: Math.min(total, PREVIEW[tab.value]) }
})
</script>

<style scoped>
.detail { position: absolute; top: 0; right: 0; bottom: 0; z-index: 7; display: flex; flex-direction: column; width: min(480px, 100%); border-left: 1px solid var(--c-border); background: var(--c-surface); box-shadow: -12px 0 32px rgba(16, 32, 28, 0.12); animation: slide-in 0.22s ease-out; }
@keyframes slide-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }

.d-cover { position: relative; flex: none; height: 132px; overflow: hidden; background: linear-gradient(160deg, color-mix(in srgb, var(--c-primary) 55%, #1b2a26), color-mix(in srgb, var(--c-primary) 20%, #0e1a17)); }
.d-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.d-hills { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.22; }
.d-fade { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.55)); }
.d-type { position: absolute; top: 16px; left: 18px; padding: 3px 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.16); color: #fff; font-size: 11.5px; font-weight: 700; }
.d-close { position: absolute; top: 14px; right: 14px; display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 9px; background: rgba(0, 0, 0, 0.28); color: #fff; cursor: pointer; }
.d-close:focus-visible, .viewall:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.d-cover h2 { position: absolute; right: 18px; bottom: 30px; left: 18px; margin: 0; color: #fff; font-family: var(--font-display); font-size: 21px; letter-spacing: -0.02em; line-height: 1.15; text-wrap: balance; }
.d-addr { position: absolute; right: 18px; bottom: 11px; left: 18px; overflow: hidden; color: rgba(255, 255, 255, 0.82); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }

.d-stats { display: grid; flex: none; grid-template-columns: repeat(4, minmax(0, 1fr)); border-bottom: 1px solid var(--c-border); }
.d-stats > div { min-width: 0; padding: 10px 14px; }
.d-stats > div + div { border-left: 1px solid var(--c-border); }
.d-stats b { display: block; color: var(--c-ink); font-family: var(--font-display); font-size: 17px; font-variant-numeric: tabular-nums; }
.d-stats span { color: var(--c-muted); font-size: 11.5px; }
.clip { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pill { display: inline-flex; padding: 2px 9px; border-radius: 999px; font-family: var(--font-body); font-size: 11px; font-weight: 700; }
.pill.is-acc { background: var(--c-primary-soft); color: var(--c-primary); }
.pill.is-pen { background: var(--c-warning-soft); color: var(--c-warning); }
.pill.is-del { background: var(--c-surface-2); color: var(--c-muted); }

.d-tabs { flex: none; padding: 8px 14px 0; overflow-x: auto; }
/* The shared folder tabs at the mockup's compact size, so all five fit in 480px. */
/* css/app.css sizes every folder tab with !important, so this panel's compact
   variant has to answer in kind; it applies inside this panel only. */
.d-tabs :deep(.folder-tabs) { min-height: 34px !important; }
.d-tabs :deep(.folder-tabs .folder-tab) { min-height: 34px !important; padding: 0 11px !important; font-size: 12.5px !important; }
.pane { flex: 1; min-height: 0; margin: 0 14px 14px; overflow-y: auto; border: 1px solid var(--c-border); border-radius: 0 12px 12px 12px; background: var(--c-bg); }

.d-foot { display: flex; flex: none; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-top: 1px solid var(--c-border); background: var(--c-surface); }
.va-note { color: var(--c-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.viewall { display: flex; flex: none; align-items: center; gap: 6px; height: 38px; padding: 0 16px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); color: var(--c-primary); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.viewall em { color: var(--c-muted); font-style: normal; font-weight: 500; font-variant-numeric: tabular-nums; }
.viewall:hover { border-color: var(--c-primary); background: var(--c-primary-soft); }

@media (prefers-reduced-motion: reduce) { .detail { animation: none; } }
</style>
