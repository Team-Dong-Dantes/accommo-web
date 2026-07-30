<template>
  <q-table
    :rows="paddedRows"
    :columns="columns"
    :row-key="rowKey"
    flat
    class="custom-data-table"
    hide-pagination
    hide-bottom
    :pagination="pagination"
  >

    <template v-slot:header="props">
      <q-tr :props="props" class="bg-white">
        <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-grey-6 text-weight-bold custom-th">
          {{ col.label }}
        </q-th>
      </q-tr>
    </template>

    <template v-slot:body="props">

      <q-tr v-if="props.row._isEmpty" :props="props" class="empty-row bg-white">
        <q-td v-for="col in columns" :key="col.name" :props="props"></q-td>
      </q-tr>

      <slot v-else name="body" :props="props"></slot>

    </template>

  </q-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  pagination: { type: Object, default: () => ({ rowsPerPage: 10 }) }
})

const paddedRows = computed(() => {
  const perPage = props.pagination.rowsPerPage || 10
  const currentLength = props.rows.length

  if (perPage === 0) return props.rows

  if (currentLength === 0) {
    return Array.from({ length: perPage }, (_, i) => ({
      _isEmpty: true,
      [props.rowKey]: `empty-${i}`
    }))
  }

  const remainder = currentLength % perPage
  if (remainder === 0) return props.rows

  const paddingNeeded = perPage - remainder
  const padding = Array.from({ length: paddingNeeded }, (_, i) => ({
    _isEmpty: true,
    [props.rowKey]: `empty-pad-${i}`
  }))

  return [...props.rows, ...padding]
})
</script>

<style scoped>
.custom-data-table {
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
}

.custom-th {
  font-size: 11px !important;
  letter-spacing: 0.5px;
  padding-top: 16px !important;
  padding-bottom: 16px !important;
}

.empty-row td {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

:deep(.q-table tbody tr) {
  height: 60px !important;
}

:deep(.q-table tbody td) {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}
</style>
