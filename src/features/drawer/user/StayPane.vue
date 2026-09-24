<template>
  <!-- One stay from a student's Boarding History, opened in place: where it is,
       the accommodation, or the student's room. A summary only — View all takes
       the reviewer to the hub page that holds the full record. -->
  <div class="sp" :class="{ 'sp--map': kind === 'map' }">
    <header class="sp-head">
      <h3 class="sp-title">{{ title }}</h3>
      <button type="button" class="sp-all" @click="$emit('view-all')">
        View all<Icon icon="lucide:arrow-up-right" width="14" height="14" />
      </button>
    </header>

    <q-skeleton v-if="loading" type="rect" :height="kind === 'map' ? '100%' : '220px'" class="sp-skel" />
    <TabEmptyState v-else-if="failed" icon="lucide:circle-alert" title="Couldn't load this stay" message="Try again, or use View all to open the full record." />
    <template v-else-if="data">
      <PropertyMap
        v-if="kind === 'map'"
        plain
        :lat="data.accommodation.lat"
        :lng="data.accommodation.lng"
        :name="data.accommodation.name"
        :self-id="accommodationId"
      />
      <DetailSections v-else-if="kind === 'accommodation'" :groups="accommodationGroups" />
      <DetailSections v-else-if="data.room" :groups="roomGroups" />
      <TabEmptyState v-else icon="lucide:door-closed" title="No room on record" message="This stay has no lease with a room attached." />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import DetailSections from '../DetailSections.vue'
import TabEmptyState from '../TabEmptyState.vue'
import PropertyMap from '@/features/verifications/PropertyMap.vue'
import { fetchStaySummary, type StaySummary } from '@/api/leases'
import { cap, composeAddress, humanizeEnum, landlordTitle } from '@/utils/format'
import { fmtMonthYear, type HubKind, type PreviewDetailGroup } from '../preview'

const props = defineProps<{ kind: HubKind; accommodationId: string; leaseId: string | null }>()
defineEmits<{ (e: 'view-all'): void }>()

const data = ref<StaySummary | null>(null)
const loading = ref(false)
const failed = ref(false)

watch(
  () => [props.accommodationId, props.leaseId] as const,
  async ([accId, leaseId]) => {
    loading.value = true
    failed.value = false
    try {
      const res = await fetchStaySummary(accId, leaseId)
      // A slow answer for a stay the reviewer has already left is dropped.
      if (accId === props.accommodationId) data.value = res
    } catch {
      if (accId === props.accommodationId) failed.value = true
    } finally {
      if (accId === props.accommodationId) loading.value = false
    }
  },
  { immediate: true },
)

const peso = (n: number | null | undefined) => (n ? `₱${n.toLocaleString('en-US')}/mo` : '—')

const title = computed(() => {
  const acc = data.value?.accommodation
  if (props.kind === 'room') return data.value?.room ? roomName(data.value.room) : 'Room'
  return acc?.name ?? (props.kind === 'map' ? 'Map' : 'Accommodation')
})

function roomName(r: NonNullable<StaySummary['room']>): string {
  return r.label || `Room ${r.room_number ?? '—'}`
}

const accommodationGroups = computed<PreviewDetailGroup[]>(() => {
  const d = data.value
  if (!d) return []
  const a = d.accommodation
  const rating = a.rating_avg != null ? `${Number(a.rating_avg).toFixed(1)} (${a.reviews_count ?? 0} ratings)` : 'No ratings yet'
  return [
    {
      title: 'Accommodation',
      icon: 'lucide:map-pin-house',
      rows: [
        { label: 'Type', value: humanizeEnum(a.accommodation_type) },
        { label: 'Status', value: humanizeEnum(a.status) },
        { label: 'Address', value: composeAddress(a) },
        { label: 'Rooms', value: a.total_rooms != null ? String(a.total_rooms) : '—' },
        { label: 'Boarders now', value: String(d.boarders) },
        { label: 'Rating', value: rating },
      ],
    },
    {
      title: landlordTitle(a.landlord?.sex),
      icon: 'lucide:user-round',
      rows: [
        { label: 'Name', value: a.landlord?.full_name ?? '—' },
        { label: 'Phone', value: a.landlord?.phone ?? '—' },
      ],
    },
  ]
})

const roomGroups = computed<PreviewDetailGroup[]>(() => {
  const d = data.value
  const r = d?.room
  if (!d || !r) return []
  const type = r.custom_room_type || (r.room_type ? cap(String(r.room_type).replace('_', ' ')) : '—')
  return [
    {
      title: 'Room',
      icon: 'lucide:door-closed',
      rows: [
        { label: 'Accommodation', value: d.accommodation.name },
        { label: 'Type', value: type },
        { label: 'Floor', value: r.floor != null ? String(r.floor) : '—' },
        { label: 'Capacity', value: r.capacity != null ? `${r.capacity}` : '—' },
        { label: 'Monthly rent', value: peso(r.monthly_rent) },
        { label: 'Status', value: humanizeEnum(r.status) },
      ],
    },
    {
      title: `Boarders now (${d.occupants.length}${r.capacity ? ` of ${r.capacity}` : ''})`,
      icon: 'lucide:users',
      rows: d.occupants.length
        ? d.occupants.map((o) => ({ label: o.name, value: `Since ${fmtMonthYear(o.since)}` }))
        : [{ label: 'Nobody', value: 'Vacant' }],
    },
  ]
})
</script>

<style scoped>
.sp { display: flex; flex-direction: column; gap: 12px; }
.sp--map { flex: 1; min-height: 0; }
.sp--map :deep(.pm) { min-height: 320px; border: 1px solid var(--ar-border); border-radius: 10px; overflow: hidden; }
.sp-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sp-title {
  margin: 0;
  overflow: hidden;
  color: var(--ar-ink);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sp-all {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--ar-accent-line);
  border-radius: 999px;
  background: var(--ar-accent-soft);
  color: var(--ar-accent);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.sp-all:hover { background: color-mix(in srgb, var(--ar-accent) 18%, var(--ar-surface)); }
.sp-all:focus-visible { outline: 2px solid var(--ar-accent); outline-offset: 2px; }
.sp-skel { border-radius: 10px; }
.sp--map .sp-skel { flex: 1; }
</style>
