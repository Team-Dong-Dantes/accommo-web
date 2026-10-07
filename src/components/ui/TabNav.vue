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
   * Removes the background surface from the tab strip wrapper (Quasar's
   * internals included) so the glass tabs sit flush on whatever is behind
   * them. Use when embedding the tabs inside
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

/* Flat variant: no surface on the strip wrapper; the tabs keep their glass. */
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

/* Unselected tabs are frosted glass; the active one stays opaque to fuse
   into the panel below. */
:deep(.folder-tab:not(.q-tab--active)) {
  background-image: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--c-surface) 92%, transparent),
    color-mix(in srgb, var(--c-surface-2) 70%, transparent)
  );
  background-color: transparent;
  border-color: color-mix(in srgb, var(--c-border-strong, var(--c-border)) 85%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #fff 55%, transparent),
    0 1px 2px color-mix(in srgb, #000 6%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
}
:deep(.folder-tab:not(.q-tab--active):hover) {
  background-image: linear-gradient(
    to bottom,
    var(--c-surface),
    color-mix(in srgb, var(--c-surface-2) 88%, transparent)
  );
  border-color: var(--c-border-strong, var(--c-border));
}
:global([data-theme='dark']) .folder-tabs :deep(.folder-tab:not(.q-tab--active)) {
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #fff 12%, transparent),
    0 1px 2px color-mix(in srgb, #000 28%, transparent);
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
</style>