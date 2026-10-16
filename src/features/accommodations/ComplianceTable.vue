<template>
    <DataTable :rows="rows" :columns="complianceColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="startIndex" row-chevron v-model:sort="sort">
      <template #no-data>
        <div class="full-width row flex-center text-muted q-pa-xl column">
          <Icon icon="lucide:file-check" width="48" height="48" class="q-mb-md" />
          <div class="text-h6 text-weight-bold">No accommodations yet</div>
          <div>Permit compliance appears once documents are uploaded.</div>
        </div>
      </template>
      <template #body="{ props, rowNumber }">
        <q-tr :props="props" class="smart-row cursor-pointer" @click.stop="emit('open', props.row)">
          <q-td class="row-num-cell">{{ rowNumber }}</q-td>
          <q-td key="accommodation" :props="props" class="col-title">
            <UserInfoCell rounded :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :avatar-url="props.row.image" :subtitle="props.row.address" />
          </q-td>
          <q-td v-for="(perm, i) in requiredPermits" :key="perm" :props="props" class="col-badge text-center" :class="{ 'col-split': i === 0 }">
            <BadgePill
              :tone="PERMIT_STATE[permitStatus(props.row, perm)].tone"
              :icon="PERMIT_STATE[permitStatus(props.row, perm)].icon"
              :label="PERMIT_STATE[permitStatus(props.row, perm)].label"
            />
          </q-td>
        </q-tr>
      </template>
    </DataTable>
</template>

<script setup lang="ts">
// The Accommodation Hub's Compliance tab: one row per accommodation.
import { Icon } from '@iconify/vue'
import DataTable from '@/components/table/DataTable.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import type { SortState } from '@/composables/useSort'
import { PERMIT_STATE } from '@/utils/permitExpiry'
import { complianceColumns, permitStatus, requiredPermits } from './hubColumns'

defineProps<{ rows: any[]; loading: boolean; startIndex: number }>()
const sort = defineModel<SortState>('sort', { required: true })
const emit = defineEmits<{ open: [row: any] }>()
</script>
