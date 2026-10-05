<template>
  <!-- Nothing worth filtering by (no groups, or every group has one value) → no button. -->
  <q-btn v-if="shown.length" flat class="bg-surface text-muted text-weight-bold rounded-button custom-border" no-caps>
    <Icon icon="lucide:sliders-horizontal" class="on-left" width="18" height="18" />Filter
    <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" class="filter-menu" :style="{ width: wide ? '460px' : '220px' }">

      <!-- Past four groups one column runs off the screen, so they flow into two. -->
      <div class="q-pa-md" :class="{ 'filter-grid': wide }">
        <div v-for="(filterGroup, index) in shown" :key="filterGroup.key">
          <div class="text-weight-bold text-ink q-mb-xs" style="font-size: 13px">{{ filterGroup.label }}</div>

          <q-option-group
            :model-value="activeFilters[filterGroup.key] || []"
            @update:model-value="updateFilter(filterGroup.key, $event)"
            :options="filterGroup.options"
            type="checkbox"
            color="primary"
            dense
            class="text-muted custom-checkbox"
            :class="{ 'q-mb-md': !wide && index !== shown.length - 1 }"
          />

          <q-separator v-if="!wide && index !== shown.length - 1" class="q-my-sm" />
        </div>
      </div>

      <div class="bg-surface-2 q-pa-sm row justify-end filter-footer">
        <q-btn flat dense label="Clear All" color="primary" size="12px" class="text-weight-bold" no-caps @click="$emit('clear')" />
      </div>

    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'

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

// A group with a single option can't narrow anything (every row has that
// value), so it isn't offered — unless it is in use, so it can be cleared.
const shown = computed(() => props.filters.filter((g) =>
  g.options.length > 1 || (props.activeFilters[g.key]?.length ?? 0) > 0))

const wide = computed(() => shown.value.length > 4)

const emit = defineEmits(['update:activeFilters', 'clear'])

function updateFilter(key: string, values: any[]) {
  emit('update:activeFilters', { ...props.activeFilters, [key]: values })
}
</script>

<style scoped>
.filter-menu {
  overflow: hidden;
}
.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 20px;
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
