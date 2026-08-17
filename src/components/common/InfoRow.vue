<template>
  <div class="usr-row" :class="{ 'usr-row--last': last }">
    <span class="usr-ic"><Icon :icon="icon" width="16" height="16" /></span>
    <span class="usr-key">{{ label }}</span>
    <span class="usr-val text-ink" :class="{ 'usr-val--mono': mono }">
      <slot>{{ value }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: String, default: '' },
  last: { type: Boolean, default: false },
  mono: { type: Boolean, default: false },
})
</script>

<style scoped>
.usr-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--c-border);
}
.usr-row--last {
  border-bottom: none;
}
.usr-ic {
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 8px;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.usr-key {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-muted);
  flex: none;
  width: 92px;
}
.usr-val {
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.usr-val--mono {
  font-family: var(--font-mono);
  font-size: 12px;
}
</style>
