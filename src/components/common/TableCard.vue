<template>
  <div class="table-wrapper">
    <q-card flat class="table-container">
      <TableToolbar
        :search="search"
        :search-placeholder="searchPlaceholder"
        :filters="filters"
        :active-filters="activeFilters"
        :loading="loading"
        :total-label="totalLabel"
        @update:search="$emit('update:search', $event)"
        @update:active-filters="$emit('update:activeFilters', $event)"
        @clear-filters="$emit('clearFilters')"
        @refresh="$emit('refresh')"
      />

      <!-- Multi-tab mode: caller provides its own q-tab-panels -->
      <div v-if="$slots.panels" class="panels-wrap">
        <slot name="panels" />
      </div>

      <!-- Single-table mode -->
      <DataTable
        v-else
        :rows="rows"
        :columns="columns"
        :row-key="rowKey"
        :loading="loading"
        :pagination="{ rowsPerPage: rowsPerPage }"
      >
        <template v-if="$slots.empty" #no-data>
          <slot name="empty" />
        </template>
        <template #body="props">
          <slot name="body" :props="props.props" />
        </template>
      </DataTable>
    </q-card>
  </div>

  <div class="non-shrink q-mt-md">
    <TablePagination
      :model-value="page"
      :total-items="totalItems"
      :rows-per-page="rowsPerPage"
      :item-name="itemName"
      @update:model-value="$emit('update:page', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import TableToolbar from '@/components/common/TableToolbar.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import DataTable from '@/components/common/DataTable.vue'

withDefaults(defineProps<{
  search: string
  searchPlaceholder?: string
  filters?: any[]
  activeFilters?: Record<string, any[]>
  loading?: boolean
  totalLabel: string
  rows?: any[]
  columns?: any[]
  rowKey?: string
  rowsPerPage?: number
  totalItems: number
  itemName: string
  page: number
}>(), {
  rowsPerPage: 10,
})
defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:activeFilters', value: Record<string, any[]>): void
  (e: 'clearFilters'): void
  (e: 'refresh'): void
  (e: 'update:page', value: number): void
}>()
</script>

<style scoped>
.table-wrapper {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-container {
  background: var(--c-surface);
  border-radius: 0 0 12px 12px;
  border: 1px solid var(--c-border);
  border-top: none;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panels-wrap {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}

.non-shrink {
  flex-shrink: 0;
}

/* DataTable.vue owns all table sizing — rows flex-grow to fill available
   height (min 46px / max 76px) so 10 rows always fit with no scroll. */
</style>
