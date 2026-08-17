<template>
  <div class="usr-stat" :class="`usr-stat--${accent}`">
    <span class="usr-stat-ic"><Icon :icon="icon" width="16" height="16" /></span>
    <div class="usr-stat-val text-ink">{{ value }}</div>
    <div class="usr-stat-lbl">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: String, required: true },
  accent: { type: String as () => 'teal' | 'amber' | 'green' | 'info', default: 'teal' },
})
</script>

<style scoped>
.usr-stat {
  position: relative;
  overflow: hidden;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 14px 14px 12px;
}
.usr-stat-ic {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.usr-stat--teal .usr-stat-ic { background: var(--c-primary-soft); color: var(--c-primary); }
.usr-stat--amber .usr-stat-ic { background: var(--c-warning-soft); color: var(--c-warning); }
.usr-stat--green .usr-stat-ic { background: var(--c-success-soft); color: var(--c-success); }
.usr-stat--info .usr-stat-ic { background: var(--c-info-soft); color: var(--c-info); }
.usr-stat-val {
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.1;
}
.usr-stat-lbl {
  font-size: 11px;
  font-weight: 600;
  color: var(--c-muted);
  margin-top: 3px;
}
</style>
