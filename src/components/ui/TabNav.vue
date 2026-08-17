<template>
  <q-tabs
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    dense
    no-caps
    align="left"
    class="folder-tabs"
  >
    <q-tab
      v-for="tab in tabs"
      :key="tab.name"
      :name="tab.name"
      :label="tab.label"
      class="folder-tab"
      no-caps
    />
  </q-tabs>
</template>

<script setup lang="ts">
interface TabItem {
  name: string
  label: string
}
defineProps<{
  modelValue: string
  tabs: TabItem[]
}>()
defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<style scoped>
.folder-tabs {
  min-height: 48px;
  background: transparent;
}

:deep(.folder-tab) {
  min-height: 48px;
  padding: 0 24px;
  font-size: 13px;
  font-weight: 700;
  color: var(--c-muted);
  background-color: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  margin-right: 6px;
  margin-bottom: -1px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

:deep(.folder-tab:hover) {
  color: var(--c-ink);
}

:deep(.folder-tab.q-tab--active) {
  background-color: var(--c-surface);
  border-color: var(--c-border);
  border-bottom: none;
  color: var(--c-primary);
  margin-bottom: -1px;
}

:deep(.q-tab__indicator) {
  display: none;
}
</style>
