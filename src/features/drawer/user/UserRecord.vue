<template>
  <!-- A person's record (Users): the shared RecordShell, the person's overview
       on the left, and their role's tabs on the right. The tab contents are the
       drawer's existing tab components. -->
  <RecordShell
    v-model:tab="tab"
    v-model:drilled="drilled"
    :tabs="tabs"
    :loading="loading"
    :management-actions="managementActions"
    :record-key="preview.name"
    @close="$emit('close')"
    @manage="$emit('manage', $event)"
  >
    <template #overview="{ toggleMenu }">
      <UserOverview :preview="preview" :loading="loading" @menu="toggleMenu" @go-hub="openStay" />
    </template>
    <template #skeleton><RowListSkeleton /></template>

    <template #tab-history><HistoryTab :preview="preview" @go-hub="openStay" @view-payments="openStay('payments', $event)" /></template>
    <template #drill>
      <template v-if="stay">
        <PaymentsTab v-if="stay.kind === 'payments'" :preview="preview" :filter-accommodation-id="stay.accommodationId" />
        <StayPane v-else :kind="stay.kind" :accommodation-id="stay.accommodationId" :lease-id="stayLeaseId" @view-all="goHub(stay.kind, stay.accommodationId)" />
      </template>
    </template>
    <template #tab-accommodations><PortfolioPane :preview="preview" @go-hub="goHub" /></template>
    <template #tab-documents><FilesTab :preview="preview" /></template>
    <template #tab-reviews><ReviewsTab :preview="preview" /></template>
    <template #tab-activity><ActivityTab :preview="preview" /></template>
    <template #tab-notes><NotesPane :user-id="preview.userOverview?.userId ?? ''" /></template>
  </RecordShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RecordShell from '../record/RecordShell.vue'
import RowListSkeleton from '../accommodation/RowListSkeleton.vue'
import UserOverview from './UserOverview.vue'
import PortfolioPane from './PortfolioPane.vue'
import HistoryTab from '../HistoryTab.vue'
import PaymentsTab from '../PaymentsTab.vue'
import StayPane from './StayPane.vue'
import NotesPane from './NotesPane.vue'
import FilesTab from '../FilesTab.vue'
import ReviewsTab from '../ReviewsTab.vue'
import ActivityTab from '../ActivityTab.vue'
import type { DrawerPreview, HubKind } from '../preview'

const props = withDefaults(
  defineProps<{
    preview: DrawerPreview
    managementActions?: { label: string; action: string; danger?: boolean }[]
    loading?: boolean
  }>(),
  { managementActions: () => [], loading: false },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'manage', action: string): void
  (e: 'go-hub', kind: HubKind, accommodationId?: string): void
}>()

const STUDENT = [
  { name: 'history', label: 'Boarding History' },
  { name: 'documents', label: 'Requirements' },
  { name: 'reviews', label: 'Ratings' },
  { name: 'activity', label: 'Activity' },
  { name: 'notes', label: 'Notes' },
]
const LANDLORD = [
  { name: 'accommodations', label: 'Accommodations' },
  { name: 'documents', label: 'Requirements' },
  { name: 'reviews', label: 'Ratings' },
  { name: 'activity', label: 'Activity' },
  { name: 'notes', label: 'Notes' },
]
const tabs = computed(() => (props.preview.userOverview?.role === 'landlord' ? LANDLORD : STUDENT))

const tab = ref(tabs.value[0]!.name)
// A stay's map, accommodation, room or payments open over Boarding History
// (#drill) instead of leaving the record; each view's View all goes to the hub.
// `stay` is left set on Back so the view keeps its content while it slides away.
const drilled = ref(false)
const stay = ref<{ kind: HubKind | 'payments'; accommodationId: string } | null>(null)

// The stay's lease, for its room. ponytail: a student with two leases at one
// accommodation gets the active one, else the latest; pass the lease id from
// the history card if that ever matters.
const stayLeaseId = computed(() => {
  const mine = (props.preview.leases ?? []).filter((l) => l.accommodationId === stay.value?.accommodationId)
  return (mine.find((l) => l.status === 'active') ?? mine[0])?.id ?? null
})

// A different person is a fresh record: start on their role's first tab.
watch(() => [props.preview.name, tabs.value] as const, () => {
  tab.value = tabs.value[0]!.name
  drilled.value = false
})

function openStay(kind: HubKind | 'payments', accommodationId?: string) {
  if (!accommodationId) return
  stay.value = { kind, accommodationId }
  drilled.value = true
}

function goHub(kind: HubKind, id?: string) {
  emit('go-hub', kind, id)
}
</script>
