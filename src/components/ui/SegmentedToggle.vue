<template>
  <div class="usr-seg">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="usr-seg-btn"
      :class="{ active: modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      <Icon v-if="opt.icon" :icon="opt.icon" width="16" height="16" aria-hidden="true" />
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface SegOption {
  value: string
  label: string
  /** Optional lucide icon shown before the label. */
  icon?: string
}
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array as () => SegOption[], required: true },
})
defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<style scoped>
.usr-seg {
  display: flex;
  gap: 4px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}
.usr-seg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  border: none;
  background: transparent;
  color: var(--c-muted);
  font-size: 13px;
  font-weight: 700;
  padding: 9px 0;
  border-radius: 9px;
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast), box-shadow var(--t-fast);
}
.usr-seg-btn:hover {
  color: var(--c-ink);
}
.usr-seg-btn.active {
  background: var(--c-surface);
  color: var(--c-primary);
  box-shadow: var(--shadow-sm);
}
</style>
