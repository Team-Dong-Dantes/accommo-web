<template>
  <div v-if="preview.rooms?.length" class="dd-rooms">
    <button
      v-for="(rm, i) in preview.rooms"
      :key="i"
      type="button"
      class="dd-room"
      @click="$emit('go-room', rm)"
    >
      <span class="dd-room-icon"><Icon icon="mdi:door" width="20" height="20" /></span>
      <span class="col min-width-0 text-left">
        <span class="dd-room-name">{{ rm.name }}</span>
        <span class="dd-room-meta">Floor {{ rm.floor ?? '—' }} · {{ rm.pax ?? 0 }}/{{ rm.capacity ?? 0 }} beds</span>
      </span>
      <BadgePill v-if="rm.status" :tone="rm.statusTone || 'neutral'" :label="rm.status" />
      <Icon icon="mdi:chevron-right" width="18" height="18" class="dd-room-open" />
    </button>
  </div>
  <div v-else class="dd-empty">No rooms for this accommodation.</div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import type { DrawerPreview, PreviewRoom } from './preview'

defineProps<{ preview: DrawerPreview }>()

defineEmits<{
  (e: 'go-room', room: PreviewRoom): void
}>()
</script>

<style scoped>
.dd-rooms {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dd-room {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.dd-room:hover {
  border-color: var(--c-primary);
  background: var(--c-surface);
}
.dd-room-icon {
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
.dd-room-name {
  display: block;
  font-weight: 700;
  font-size: 14px;
  color: var(--c-ink);
  line-height: 1.2;
}
.dd-room-meta {
  display: block;
  font-size: 12px;
  color: var(--c-muted);
  margin-top: 2px;
}
.dd-room-open {
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
