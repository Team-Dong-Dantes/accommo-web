<template>
  <div class="usr-hist" :class="{ 'usr-hist--link': clickable }" @click="clickable && $emit('click')">
    <div class="usr-hist-top">
      <span class="text-weight-bold text-ink">{{ title }}</span>
      <span v-if="chip" class="usr-rt-chip">{{ chip }}</span>
    </div>
    <div v-if="subtitle" class="usr-hist-addr text-muted">
      <Icon v-if="pin" icon="mdi:map-marker" width="13" height="13" class="q-mr-xs" />
      {{ subtitle }}
    </div>
    <div v-if="meta" class="usr-hist-period text-muted">{{ meta }}</div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  meta: { type: String, default: '' },
  chip: { type: String, default: '' },
  pin: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
})
defineEmits<{ (e: 'click'): void }>()
</script>

<style scoped>
.usr-hist {
  padding: 11px 0;
  border-bottom: 1px solid var(--c-border);
  cursor: default;
}
.usr-hist:last-child {
  border-bottom: none;
}
.usr-hist--link {
  cursor: pointer;
  transition: background var(--t-fast);
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 8px;
}
.usr-hist--link:hover {
  background: var(--c-surface-2);
}
.usr-hist-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.usr-hist-addr {
  font-size: 12px;
  font-weight: 500;
  margin-top: 3px;
}
.usr-hist-period {
  font-size: 12px;
  font-weight: 600;
  margin-top: 1px;
}
.usr-rt-chip {
  flex: none;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
}
</style>
