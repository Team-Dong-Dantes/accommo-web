<template>
  <!-- The accommodation record: the shared RecordShell with the overview on
       the left and the accommodation's own panes as its tabs. -->
  <RecordShell
    v-model:tab="tab"
    v-model:person="person"
    :tabs="TABS"
    :loading="loading"
    :management-actions="managementActions"
    :record-key="preview.name"
    @close="$emit('close')"
    @manage="$emit('manage', $event)"
  >
    <template #overview="{ toggleMenu }">
      <OverviewPanel :preview="preview" :loading="loading" @menu="toggleMenu" @view-landlord="openLandlord" />
    </template>
    <template #skeleton><RowListSkeleton /></template>

    <template #tab-rooms><RoomsPane :preview="preview" @view-person="openBoarder" @photos="openPhotos" /></template>
    <template #tab-facilities><FacilitiesPane :preview="preview" @photos="openPhotos" /></template>
    <template #tab-permits><PermitsPane :preview="preview" @view="permitIndex = $event" /></template>
    <template #tab-activity><ActivityPane :preview="preview" /></template>
    <template #tab-reviews><ReviewsPane :preview="preview" /></template>

    <PhotoLightbox
      v-if="lightbox"
      v-model:index="lightbox.index"
      :title="lightbox.title"
      :photos="lightbox.photos"
      @close="lightbox = null"
    />
    <PermitViewer
      v-if="openPermit"
      :file="openPermit"
      :landlord-id="preview.overview?.landlord.id ?? ''"
      :accommodation-name="preview.name"
      @close="permitIndex = null"
    />
  </RecordShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RecordShell from '../record/RecordShell.vue'
import OverviewPanel from './OverviewPanel.vue'
import RoomsPane from './RoomsPane.vue'
import RowListSkeleton from './RowListSkeleton.vue'
import FacilitiesPane from './FacilitiesPane.vue'
import PermitsPane from './PermitsPane.vue'
import ActivityPane from './ActivityPane.vue'
import ReviewsPane from './ReviewsPane.vue'
import PhotoLightbox from './PhotoLightbox.vue'
import PermitViewer from './PermitViewer.vue'
import type { DrawerPreview, PersonTarget, PreviewOccupant, PreviewRoom } from '../preview'

const props = withDefaults(
  defineProps<{
    preview: DrawerPreview
    managementActions?: { label: string; action: string; danger?: boolean }[]
    /** The record is still fetching its rooms, boarders and reviews. */
    loading?: boolean
  }>(),
  { managementActions: () => [], loading: false },
)

defineEmits<{
  (e: 'close'): void
  (e: 'manage', action: string): void
}>()

const TABS = [
  { name: 'rooms', label: 'Rooms' },
  { name: 'facilities', label: 'Shared Facilities' },
  { name: 'permits', label: 'Permits' },
  { name: 'activity', label: 'Activity' },
  { name: 'reviews', label: 'Ratings' },
]

const tab = ref('rooms')
const person = ref<PersonTarget | null>(null)
const lightbox = ref<{ title: string; photos: string[]; index: number } | null>(null)
const permitIndex = ref<number | null>(null)
const openPermit = computed(() => (permitIndex.value === null ? undefined : props.preview.files?.[permitIndex.value]))

// A different accommodation is a fresh record: nothing from the last one stays open.
watch(() => props.preview.name, () => {
  person.value = null
  lightbox.value = null
  permitIndex.value = null
})

function openPhotos(title: string, photos: string[], index: number) {
  lightbox.value = { title, photos, index }
}

function openLandlord() {
  const l = props.preview.overview?.landlord
  if (!l?.id) return
  person.value = {
    userId: l.id,
    role: 'landlord',
    name: l.name,
    initials: l.initials,
    avatarUrl: l.avatarUrl,
    roleLine: `${l.title} · ${props.preview.name}`,
  }
}

function openBoarder(p: PreviewOccupant, rm: PreviewRoom) {
  person.value = {
    userId: p.id,
    role: 'student',
    name: p.name,
    initials: p.initials,
    avatarUrl: p.avatarUrl,
    gender: p.gender,
    roleLine: `Boarder · ${rm.name} · Active`,
    stay: { room: rm.name, floor: rm.floor, since: p.since },
  }
}
</script>
