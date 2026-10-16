<template>
  <div v-if="preview.historyCards?.length" class="dd-hc-list">
    <div
      v-for="(hc, i) in preview.historyCards"
      :key="i"
      class="dd-hc-row"
      :class="{ 'dd-hc-row--active': hc.active }"
    >
      <div class="dd-hc-rail">
        <span
          class="dd-hc-icon"
          :style="hc.active ? { background: 'var(--c-success)', borderColor: 'var(--c-success)' } : {}"
        >
          <Icon :icon="hc.icon || 'lucide:house'" width="18" height="18" :style="{ color: hc.active ? '#fff' : 'var(--c-primary)' }" />
        </span>
        <template v-if="preview.historyCards.length > 1">
          <div v-if="i < preview.historyCards.length - 1" class="dd-hc-line dd-hc-line--down"></div>
          <div v-if="i > 0" class="dd-hc-line dd-hc-line--up"></div>
        </template>
      </div>
      <div class="dd-hc-card dd-card border-all rounded-borders" style="border-radius: var(--radius-sm); flex: 1 1 auto; background: var(--c-surface-2);" :class="{ 'dd-card--linkless': !hc.accommodationId }">
        <div class="row justify-between items-center">
          <div class="text-weight-bold" style="color: var(--c-text)">{{ hc.title }}</div>
          <BadgePill :tone="hc.statusTone || 'primary'" :label="hc.status" />
        </div>
        <div class="row justify-between items-end">
          <div class="text-caption" style="color: var(--c-muted)">
            <template v-if="hc.roomType">{{ hc.roomType }}</template><template v-if="hc.roomType && hc.location"> · </template>{{ hc.location }}
          </div>
          <div v-if="hc.date" class="text-caption text-right" style="color: var(--c-muted)">{{ hc.date }}</div>
        </div>
        <div v-if="hc.accommodationId && preview.kind === 'user'" class="dd-card-overlay">
          <button type="button" class="dd-hover-btn" @click.stop="$emit('go-hub', 'map', hc.accommodationId)"><Icon icon="lucide:map-pin" width="15" height="15" />Map</button>
          <button type="button" class="dd-hover-btn" @click.stop="$emit('go-hub', 'accommodation', hc.accommodationId)"><Icon icon="lucide:map-pin-house" width="15" height="15" />Accommodation Hub</button>
          <button type="button" class="dd-hover-btn" @click.stop="$emit('go-hub', 'room', hc.accommodationId)"><Icon icon="lucide:door-closed" width="15" height="15" />Rooms Hub</button>
          <button type="button" class="dd-hover-btn" @click.stop="$emit('view-payments', hc.accommodationId)"><Icon icon="lucide:coins" width="15" height="15" />Payment History</button>
        </div>
      </div>
    </div>
  </div>

  <TabEmptyState
    v-else
    icon="lucide:map-pin-house"
    title="No boarding history"
    message="No placements on record for this student yet."
  />
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import TabEmptyState from './TabEmptyState.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import type { DrawerPreview, HubKind } from './preview'

defineProps<{
  preview: DrawerPreview
}>()

defineEmits<{
  (e: 'go-hub', kind: HubKind, accommodationId?: string): void
  (e: 'view-payments', accommodationId: string): void
}>()
</script>

<style scoped>
.border-all {
  border: 1px solid var(--c-border);
}
/* Boarding-history card timeline (cards, not plain text) ------------ */
.dd-hc-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dd-hc-row {
  display: flex;
  align-items: stretch;
}
.dd-hc-rail {
  position: relative;
  flex: 0 0 40px;
  width: 40px;
  margin-right: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.dd-hc-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--c-primary) 26%, transparent);
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  position: relative;
  z-index: 2;
}
.dd-hc-row--active .dd-hc-icon {
  border-color: var(--c-success);
  background: var(--c-success);
}
.dd-hc-line {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: var(--c-border);
  z-index: 1;
}
.dd-hc-line--down {
  top: 50%;
  bottom: -16px;
}
.dd-hc-line--up {
  top: 0;
  bottom: 50%;
}
.dd-hc-card {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.dd-hc-card:not(.dd-card--linkless):hover {
  border-color: var(--c-primary);
  background: var(--c-surface);
}
/* Hover overlay: accommodation quick-links (Map / Accommodation Hub / Room Hub). */
.dd-card {
  position: relative;
}
.dd-card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--c-surface) 82%, transparent);
  backdrop-filter: blur(2px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}
.dd-card:not(.dd-card--linkless):hover .dd-card-overlay {
  opacity: 1;
  pointer-events: auto;
}
.dd-hover-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-text);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.dd-hover-btn:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
  background: var(--c-surface-2);
}
</style>
