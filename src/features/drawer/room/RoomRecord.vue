<template>
  <!-- A room's record (Room Hub): the shared RecordShell, the room's overview
       on the left, its boarders, private facilities and photos on the right. -->
  <RecordShell
    v-model:tab="tab"
    v-model:person="person"
    :tabs="TABS"
    :loading="loading"
    :record-key="preview.name"
    @close="$emit('close')"
  >
    <template #overview>
      <RoomOverview :preview="preview" :loading="loading" @view-person="openBoarder" @go-hub="(k, id) => $emit('go-hub', k, id)" />
    </template>
    <template #skeleton><RowListSkeleton /></template>

    <template #tab-occupants><OccupantsPane :preview="preview" @view-person="openBoarder" /></template>
    <template #tab-facilities><FacilitiesTab :preview="preview" /></template>
    <template #tab-photos><PhotosTab :preview="preview" /></template>
  </RecordShell>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import RecordShell from '../record/RecordShell.vue'
import RowListSkeleton from '../accommodation/RowListSkeleton.vue'
import RoomOverview from './RoomOverview.vue'
import OccupantsPane from './OccupantsPane.vue'
import FacilitiesTab from '../FacilitiesTab.vue'
import PhotosTab from '../PhotosTab.vue'
import type { DrawerPreview, HubKind, PersonTarget, PreviewOccupant } from '../preview'

const props = withDefaults(defineProps<{ preview: DrawerPreview; loading?: boolean }>(), { loading: false })

defineEmits<{
  (e: 'close'): void
  (e: 'go-hub', kind: HubKind, accommodationId?: string): void
}>()

const TABS = [
  { name: 'occupants', label: 'Occupants' },
  { name: 'facilities', label: 'Private Facilities' },
  { name: 'photos', label: 'Photos' },
]

const tab = ref('occupants')
const person = ref<PersonTarget | null>(null)

// A different room is a fresh record.
watch(() => props.preview.name, () => {
  tab.value = 'occupants'
  person.value = null
})

function openBoarder(p: PreviewOccupant) {
  const o = props.preview.roomOverview
  const room = o?.title ?? props.preview.name
  person.value = {
    userId: p.id,
    role: 'student',
    name: p.name,
    initials: p.initials,
    avatarUrl: p.avatarUrl,
    gender: p.gender,
    roleLine: `Boarder · ${room}${o ? ` · ${o.accommodation.name}` : ''}`,
    stay: { room, floor: o?.floor, since: p.since },
  }
}
</script>
