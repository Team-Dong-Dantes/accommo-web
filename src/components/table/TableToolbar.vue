<template>
  <div class="row items-center justify-between q-pa-md table-bar">
    <div class="row items-center q-gutter-x-sm">
      <SearchInput :model-value="search" @update:model-value="$emit('update:search', $event)" :placeholder="searchPlaceholder" style="width: 300px;" />
      <FilterDropdown
        :filters="filters"
        :active-filters="activeFilters"
        @update:active-filters="$emit('update:activeFilters', $event)"
        @clear="$emit('clearFilters')"
      />
    </div>

    <div class="row items-center q-gutter-x-md">
      <q-btn flat dense color="grey-6" class="refresh-btn" @click="$emit('refresh')" :loading="loading">
        <Icon icon="mdi:refresh" width="18" height="18" />
        <q-tooltip>Refresh</q-tooltip>
      </q-btn>
      <q-badge color="grey-2" text-color="grey-7" class="q-px-sm q-py-xs text-weight-bold total-badge">
        {{ totalLabel }}
      </q-badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import SearchInput from '@/components/ui/SearchInput.vue'
import FilterDropdown from '@/components/ui/FilterDropdown.vue'

defineProps<{
  search: string
  searchPlaceholder?: string
  filters: any[]
  activeFilters: Record<string, any[]>
  loading?: boolean
  totalLabel: string
}>()
defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:activeFilters', value: Record<string, any[]>): void
  (e: 'clearFilters'): void
  (e: 'refresh'): void
}>()
</script>

<style scoped>
.table-bar { border-bottom: 1px solid var(--c-border); }
.refresh-btn { border-radius: 8px; }
.total-badge { border-radius: 6px; }
</style>
