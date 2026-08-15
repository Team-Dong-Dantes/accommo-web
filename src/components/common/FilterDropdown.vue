<template>
  <q-btn flat text-color="dark" class="bg-surface text-weight-bold rounded-button custom-border" no-caps>
    <Icon icon="mdi:tune" class="on-left" width="18" height="18" />Filter
    <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 220px">

      <div class="q-pa-md">
        <template v-for="(filterGroup, index) in filters" :key="filterGroup.key">
          <div class="text-weight-bold text-dark q-mb-xs" style="font-size: 13px">{{ filterGroup.label }}</div>

          <q-option-group
            :model-value="activeFilters[filterGroup.key] || []"
            @update:model-value="updateFilter(filterGroup.key, $event)"
            :options="filterGroup.options"
            type="checkbox"
            color="teal-7"
            dense
            class="text-grey-8 custom-checkbox"
            :class="{ 'q-mb-md': index !== filters.length - 1 }"
          />

          <q-separator v-if="index !== filters.length - 1" class="q-my-sm" />
        </template>
      </div>

      <div class="bg-grey-1 q-pa-sm row justify-end" style="border-top: 1px solid #f0f0f0">
        <q-btn flat dense label="Clear All" color="grey-6" size="12px" class="text-weight-bold" no-caps @click="$emit('clear')" />
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
.rounded-button {
  border-radius: 10px;
  height: 40px;
}
.custom-border {
  border: 1px solid #cbcbcb;
}
.custom-checkbox :deep(.q-checkbox__label) {
  font-size: 13px;
  margin-left: 4px;
}
</style>
