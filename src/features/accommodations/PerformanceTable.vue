<template>
    <DataTable :rows="rows" :columns="performanceColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="startIndex" row-chevron v-model:sort="sort">
      <template #no-data>
        <div class="full-width row flex-center text-muted q-pa-xl column">
          <Icon icon="lucide:chart-column" width="48" height="48" class="q-mb-md" />
          <div class="text-h6 text-weight-bold">No performance data</div>
          <div>Ratings aren't populated yet.</div>
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
          <q-td key="rating" :props="props" class="col-num-wide col-split text-ink" style="font-size: 13px;">
            <span class="text-orange-5 text-weight-bold row items-center no-wrap">
              <Icon icon="lucide:star" width="14" height="14" class="q-mr-xs" /> {{ props.row.rating }}
            </span>
          </q-td>
          <q-td key="response" :props="props" class="col-num-wide text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.responseRate != null ? `${props.row.responseRate}%` : '—' }}</q-td>
          <q-td key="occupancy" :props="props" class="num-cell col-badge text-ink text-weight-medium" style="font-size: 13px;">
            {{ props.row.totalStudents }}/{{ props.row.totalCapacity }}
          </q-td>
        </q-tr>
      </template>
    </DataTable>
</template>

<script setup lang="ts">
// The Accommodation Hub's Performance tab: one row per accommodation.
import { Icon } from '@iconify/vue'
import DataTable from '@/components/table/DataTable.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import type { SortState } from '@/composables/useSort'
import { performanceColumns } from './hubColumns'

defineProps<{ rows: any[]; loading: boolean; startIndex: number }>()
const sort = defineModel<SortState>('sort', { required: true })
const emit = defineEmits<{ open: [row: any] }>()
</script>
