<template>
    <DataTable :rows="rows" :columns="overviewColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="startIndex" row-chevron v-model:sort="sort">
      <template #no-data>
        <div class="full-width row flex-center text-muted q-pa-xl column">
          <Icon icon="lucide:map-pin-house" width="48" height="48" class="q-mb-md" />
          <div class="text-h6 text-weight-bold">No accommodations yet</div>
          <div>Listed accommodations will appear here.</div>
        </div>
      </template>
      <template #body="{ props, rowNumber }">
        <q-tr :props="props" class="smart-row cursor-pointer" @click.stop="emit('open', props.row)">
          <q-td class="row-num-cell">{{ rowNumber }}</q-td>
          <q-td key="accommodation" :props="props" class="col-title">
            <UserInfoCell rounded :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :avatar-url="props.row.image" :subtitle="props.row.address" />
          </q-td>
          <q-td key="landlord" :props="props" class="col-person">
            <UserInfoCell :initials="props.row.landlordInitials" :name="props.row.landlord" :avatar-color="'indigo-5'" :avatar-url="props.row.landlordAvatarUrl" :subtitle="props.row.contact" />
          </q-td>
          <q-td key="rooms" :props="props" class="num-cell col-num-wide col-split text-ink">
            <span class="rooms-cell">
              <Icon icon="lucide:door-closed" width="13" height="13" />{{ props.row.totalRooms }}
            </span>
          </q-td>
          <q-td key="floors" :props="props" class="num-cell col-num-wide text-ink">
            <span class="rooms-cell">
              <Icon icon="lucide:layers" width="13" height="13" />{{ props.row.floors || '—' }}
            </span>
          </q-td>
          <q-td key="occupants" :props="props" class="num-cell col-occupants">
            <span class="occupants-cell">
              <span class="text-ink text-weight-bold">{{ props.row.totalStudents }}</span>
              <span class="gender-split">
                <span class="gender-figure is-male"><Icon icon="lucide:mars" width="12" height="12" />{{ props.row.maleCount }}</span>
                <span class="gender-figure is-female"><Icon icon="lucide:venus" width="12" height="12" />{{ props.row.femaleCount }}</span>
              </span>
            </span>
          </q-td>
          <q-td key="status" :props="props" class="col-badge-wide">
            <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.statusLabel" />
          </q-td>
        </q-tr>
      </template>
    </DataTable>
</template>

<script setup lang="ts">
// The Accommodation Hub's Overview tab: one row per accommodation.
import { Icon } from '@iconify/vue'
import DataTable from '@/components/table/DataTable.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import type { SortState } from '@/composables/useSort'
import { overviewColumns } from './hubColumns'

defineProps<{ rows: any[]; loading: boolean; startIndex: number }>()
const sort = defineModel<SortState>('sort', { required: true })
const emit = defineEmits<{ open: [row: any] }>()
</script>

<style scoped>
.rooms-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--c-ink);
}
.rooms-cell .iconify { color: var(--c-muted); }
/* Total leads in ink; the gender breakdown underneath uses the same
   mars/venus icon + colour pairing as this accommodation's own detail drawer
   (features/drawer/accommodation), so a reviewer reads one gender
   visual language across the table and the drawer it opens into. */
.occupants-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  font-size: 13px;
}
.gender-split {
  display: inline-flex;
  gap: 6px;
}
.gender-figure {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  font-size: 11px;
  font-weight: 600;
}
.gender-figure.is-male { color: #42a5f5; }
.gender-figure.is-female { color: #e91e63; }
</style>
