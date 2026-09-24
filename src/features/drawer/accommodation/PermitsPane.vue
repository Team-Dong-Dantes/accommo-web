<template>
  <div v-if="preview.files?.length" class="pm">
    <div v-for="(f, i) in preview.files" :key="f.docId ?? i" class="pm-row" :class="{ 'pm-row--warn': isExpiring(f) }">
      <span class="pm-icon"><Icon icon="lucide:file-text" width="16" height="16" /></span>
      <div class="pm-main">
        <div class="pm-name">{{ f.name }}</div>
        <div class="pm-sub">{{ f.expiry || 'No expiry recorded' }}<template v-if="isExpiring(f) && f.daysLeft != null"> · in {{ f.daysLeft }} day{{ f.daysLeft === 1 ? '' : 's' }}</template></div>
      </div>
      <span v-if="f.status" class="pm-pill" :class="`pm-pill--${f.statusTone ?? 'neutral'}`">{{ f.status }}</span>
      <button type="button" class="pm-view" @click="$emit('view', i)">View</button>
    </div>
  </div>
  <TabEmptyState v-else icon="lucide:file-text" title="No permits" message="No permits have been uploaded for this accommodation yet." />
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import TabEmptyState from '../TabEmptyState.vue'
import type { DrawerPreview, PreviewFile } from '../preview'

defineProps<{ preview: DrawerPreview }>()
defineEmits<{ (e: 'view', index: number): void }>()

const isExpiring = (f: PreviewFile) => f.statusTone === 'warning'
</script>

<style scoped>
.pm { overflow: hidden; border: 1px solid var(--ar-border); border-radius: 10px; }
.pm-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--ar-border); }
.pm-row:last-child { border-bottom: none; }
.pm-row--warn { background: color-mix(in srgb, var(--c-warning) 5%, var(--ar-surface)); }
.pm-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--ar-soft);
  color: var(--ar-text);
}
.pm-row--warn .pm-icon { background: color-mix(in srgb, var(--c-warning) 15%, var(--ar-surface)); color: var(--c-warning); }
.pm-main { flex: 1; min-width: 0; }
.pm-name { color: var(--ar-ink); font-size: 13px; font-weight: 600; }
.pm-sub { margin-top: 2px; color: var(--ar-muted); font-size: 11px; }
.pm-row--warn .pm-sub { color: var(--c-warning); font-weight: 600; }
.pm-pill { padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.pm-pill--success { background: color-mix(in srgb, var(--c-success) 14%, var(--ar-surface)); color: var(--c-success); }
.pm-pill--warning { background: color-mix(in srgb, var(--c-warning) 15%, var(--ar-surface)); color: var(--c-warning); }
.pm-pill--danger { background: color-mix(in srgb, var(--c-danger) 13%, var(--ar-surface)); color: var(--c-danger); }
.pm-pill--neutral,
.pm-pill--primary,
.pm-pill--info { background: var(--ar-soft); color: var(--ar-text); }
.pm-view {
  flex-shrink: 0;
  padding: 5px 10px;
  border: 1px solid var(--ar-border);
  border-radius: 8px;
  background: var(--ar-surface);
  color: var(--ar-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.pm-view:hover { border-color: var(--ar-accent-line); color: var(--ar-accent); }
</style>
