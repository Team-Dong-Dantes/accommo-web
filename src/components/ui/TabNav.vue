<template>
  <q-tabs
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    dense
    no-caps
    align="left"
    class="folder-tabs"
    :class="{ 'folder-tabs--flat': flat }"
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
withDefaults(defineProps<{
  modelValue: string
  tabs: TabItem[]
  /**
   * Removes every background surface from the tab strip — the wrapper,
   * Quasar's internals, and the tab buttons themselves — so the tabs sit
   * flush on whatever is behind them. Use when embedding the tabs inside
   * a surface that already provides the background.
   */
  flat?: boolean
}>(), {
  flat: false,
})
defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<style scoped>
.folder-tabs {
  min-height: 46px;
  background: transparent;
}

/* Strip any surface Quasar adds to the wrapper layers. */
.folder-tabs :deep(.q-tabs__content),
.folder-tabs :deep(.q-tabs__content-scroll),
.folder-tabs :deep(.q-tabs__arrow) {
  background: transparent;
  background-color: transparent;
  box-shadow: none;
}

/* Flat variant: no background on the strip AND no surface behind the tabs.
   The tab buttons keep their text and active-colour treatment. */
.folder-tabs--flat,
.folder-tabs--flat :deep(.q-tabs__content),
.folder-tabs--flat :deep(.q-tabs__content-scroll),
.folder-tabs--flat :deep(.q-tabs__arrow) {
  background: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

:deep(.folder-tab) {
  min-height: 46px;
  padding: 0 22px;
  margin-right: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--c-muted);
  background-color: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}

:deep(.folder-tab:hover) {
  color: var(--c-ink);
}

:deep(.folder-tab.q-tab--active) {
  background-color: var(--c-surface);
  color: var(--c-primary);
  border-color: var(--c-border);
  border-bottom: 1px solid var(--c-surface);
  margin-bottom: -1px;
  position: relative;
  z-index: 1;
}

:deep(.q-tab__indicator) {
  display: none;
}

/* Flat variant: strip the tab buttons' own background and border too,
   so nothing paints behind the labels. Text colour still distinguishes
   active from inactive. */
.folder-tabs--flat :deep(.folder-tab) {
  background-color: transparent !important;
  background: transparent !important;
  border: none !important;
  border-bottom: none !important;
  border-radius: 0 !important;
}

.folder-tabs--flat :deep(.folder-tab.q-tab--active) {
  color: var(--c-primary);
  background: transparent !important;
  border: none !important;
}
</style>