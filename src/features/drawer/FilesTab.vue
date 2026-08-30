<template>
  <div v-if="preview.files?.length" class="dd-files">
    <a v-for="(f, i) in preview.files" :key="i" :href="f.url" target="_blank" rel="noopener" class="dd-file">
      <span class="dd-file-iconwrap">
        <Icon icon="mdi:file-document-outline" width="22" height="22" />
      </span>
      <span class="col min-width-0">
        <span class="dd-file-name">{{ f.name }}</span>
        <span class="dd-file-meta">Tap to open</span>
      </span>
      <Icon icon="mdi:open-in-new" width="18" height="18" class="dd-file-open" />
    </a>
  </div>
  <div v-else class="dd-empty">No documents uploaded for this account.</div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { DrawerPreview } from './preview'

defineProps<{ preview: DrawerPreview }>()
</script>

<style scoped>
.dd-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.dd-file:hover {
  border-color: var(--c-primary);
  background: var(--c-surface);
}
.dd-file-iconwrap {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  color: var(--c-primary);
}
.dd-file-name {
  display: block;
  font-weight: 700;
  font-size: 14px;
  color: var(--c-ink);
  line-height: 1.2;
}
.dd-file-meta {
  display: block;
  font-size: 12px;
  color: var(--c-muted);
  margin-top: 2px;
}
.dd-file-open {
  margin-left: auto;
  color: var(--c-muted);
  flex: 0 0 auto;
}
.dd-empty {
  font-size: 13px;
  color: var(--c-muted);
  padding: 10px 12px;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
}
</style>
