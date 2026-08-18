<template>
  <q-btn flat class="bg-surface text-muted text-weight-bold rounded-button custom-border" no-caps>
    <Icon icon="mdi:tune" class="on-left" width="18" height="18" />Filter
    <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" class="radius shadow-token filter-menu" style="width: 220px">

      <div class="q-pa-md">
        <template v-for="(filterGroup, index) in filters" :key="filterGroup.key">
          <div class="text-weight-bold text-ink q-mb-xs" style="font-size: 13px">{{ filterGroup.label }}</div>

          <q-option-group
            :model-value="activeFilters[filterGroup.key] || []"
            @update:model-value="updateFilter(filterGroup.key, $event)"
            :options="filterGroup.options"
            type="checkbox"
            color="primary"
            dense
            class="text-muted custom-checkbox"
            :class="{ 'q-mb-md': index !== filters.length - 1 }"
          />

          <q-separator v-if="index !== filters.length - 1" class="q-my-sm" />
        </template>
      </div>

      <div class="bg-surface-2 q-pa-sm row justify-end filter-footer">
        <q-btn flat dense label="Clear All" color="primary" size="12px" class="text-weight-bold" no-caps @click="$emit('clear')" />
      </div>

    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { PropType } from 'vue'

interface FilterOption {
  label: string;
  value: string | number;
}

interface FilterGroup {
  label: string;
  key: string;
  options: FilterOption[];
}

const props = defineProps({
  filters: { type: Array as PropType<FilterGroup[]>, default: () => [] },
  activeFilters: { type: Object as PropType<Record<string, any[]>>, default: () => ({}) }
})

const emit = defineEmits(['update:activeFilters', 'clear'])

function updateFilter(key: string, values: any[]) {
  emit('update:activeFilters', { ...props.activeFilters, [key]: values })
}
</script>

<style scoped>
.filter-menu {
  overflow: hidden;
}
.custom-border {
  border: 1px solid var(--c-border-strong);
}
.custom-checkbox :deep(.q-checkbox__label) {
  font-size: 13px;
  margin-left: 4px;
}
.filter-footer {
  border-top: 1px solid var(--c-border);
}
</style>
