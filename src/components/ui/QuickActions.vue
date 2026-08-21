<template>
  <q-card flat class="quick-actions">
    <div class="qa-title">{{ title }}</div>
    <div class="qa-list">
      <button
        v-for="item in items"
        :key="item.label"
        type="button"
        class="qa-item"
        @click="$emit('select', item)"
      >
        <Icon :icon="item.icon" width="20" height="20" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import { Icon } from '@iconify/vue'

export interface QuickAction {
  icon: string
  label: string
}

defineProps({
  title: { type: String, default: 'Quick Actions' },
  items: { type: Array as PropType<QuickAction[]>, required: true },
})

defineEmits<{ (e: 'select', item: QuickAction): void }>()
</script>

<style scoped>
.quick-actions {
  background: var(--c-panel-dark);
  color: var(--c-panel-dark-text);
  border-radius: var(--radius);
  padding: 16px;
}
.qa-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 12px;
  color: var(--c-panel-dark-text);
}
.qa-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.qa-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--c-panel-dark-text);
  border: none;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  transition: background-color 0.15s ease;
}
.qa-item:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
