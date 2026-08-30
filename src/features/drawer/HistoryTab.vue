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
          <Icon :icon="hc.icon || 'mdi:home'" width="18" height="18" :style="{ color: hc.active ? '#fff' : 'var(--c-primary)' }" />
        </span>
        <template v-if="preview.historyCards.length > 1">
          <div v-if="i < preview.historyCards.length - 1" class="dd-hc-line dd-hc-line--down"></div>
          <div v-if="i > 0" class="dd-hc-line dd-hc-line--up"></div>
        </template>
      </div>
      <div class="dd-hc-card dd-card border-all rounded-borders" style="border-radius: var(--radius-sm); flex: 1 1 auto; background: var(--c-surface);" :class="{ 'dd-card--linkless': !hc.accommodationId }">
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
        <div v-if="hc.accommodationId" class="dd-card-overlay">
          <button type="button" class="dd-hover-btn" @click.stop="$emit('go-hub', 'map', hc.accommodationId)"><Icon icon="mdi:map-marker" width="15" height="15" />View on Map</button>
          <button type="button" class="dd-hover-btn" @click.stop="$emit('go-hub', 'accommodation', hc.accommodationId)"><Icon icon="mdi:home-search-outline" width="15" height="15" />View on Accommodation Hub</button>
          <button type="button" class="dd-hover-btn" @click.stop="$emit('go-hub', 'room', hc.accommodationId)"><Icon icon="mdi:door" width="15" height="15" />View on Room Hub</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="preview.card">
    <div v-if="preview.card.footerLink" class="row justify-between items-center q-mb-md">
      <div class="dd-ink dd-display text-subtitle1 text-weight-bold">{{ preview.card.title }}</div>
      <span
        class="cursor-pointer text-weight-bold text-caption text-link"
      >{{ preview.card.footerLink }}</span>
    </div>
    <div class="dd-card border-all rounded-borders" :class="{ 'dd-card--linkless': !preview.card?.accommodationId }" style="border-radius: var(--radius-sm); position: relative;">
      <div class="row justify-between items-center q-pa-md" :class="preview.card.cells?.length ? 'border-bottom' : ''">
        <div>
          <div class="text-body1">
            <span class="text-weight-bold" style="color: var(--c-text)">{{ preview.card.head.title }}</span>
          </div>
          <div v-if="preview.card.head.location" class="text-caption q-mt-xs" style="color: var(--c-muted)">{{ preview.card.head.location }}</div>
        </div>
        <BadgePill
          :tone="preview.card.head.statusTone || 'primary'"
          :label="preview.card.head.status"
        />
      </div>
      <div v-if="preview.card.cells?.length" class="row q-pa-sm">
        <div
          v-for="(c, i) in preview.card.cells"
          :key="i"
          class="col q-pa-sm"
          :class="i < preview.card.cells.length - 1 ? 'border-right' : ''"
        >
          <div class="dd-muted text-caption q-mb-xs">{{ c.label }}</div>
          <BadgePill v-if="c.tone" :tone="c.tone" :icon="c.icon ?? ''" :label="c.value || ''" />
          <div v-else-if="c.avatar" class="row items-center q-gutter-x-xs">
            <q-avatar size="24px" color="primary" text-color="white" class="text-caption text-weight-bold">
              {{ c.avatar.initials }}
            </q-avatar>
            <div class="text-weight-medium text-body2">{{ c.avatar.name }}</div>
          </div>
          <div v-else class="text-weight-medium text-body2">{{ c.value }}</div>
        </div>
      </div>
      <div v-if="preview.card?.accommodationId" class="dd-card-overlay">
        <button type="button" class="dd-hover-btn" @click.stop="$emit('go-hub', 'map', preview.card.accommodationId)"><Icon icon="mdi:map-marker" width="15" height="15" />View on Map</button>
        <button type="button" class="dd-hover-btn" @click.stop="$emit('go-hub', 'accommodation', preview.card.accommodationId)"><Icon icon="mdi:home-search-outline" width="15" height="15" />View on Accommodation Hub</button>
        <button type="button" class="dd-hover-btn" @click.stop="$emit('go-hub', 'room', preview.card.accommodationId)"><Icon icon="mdi:door" width="15" height="15" />View on Room Hub</button>
      </div>
    </div>
  </div>

  <div v-else-if="preview.history?.length" class="dd-timeline">
    <div
      v-for="(it, i) in preview.history"
      :key="i"
      class="dd-tl-item intro-x"
      :class="{ 'dd-tl-item--active': it.active }"
    >
      <div class="dd-tl-node">
        <span
          class="dd-tl-dot"
          :style="it.active ? { background: 'var(--c-success)', borderColor: 'var(--c-success)' } : {}"
        >
          <Icon
            :icon="it.icon || 'mdi:circle'"
            width="18"
            height="18"
            :style="{ color: it.active ? '#fff' : 'var(--c-muted)' }"
          />
        </span>
        <div v-if="i < preview.history.length - 1" class="dd-tl-line"></div>
      </div>
      <div class="dd-tl-body">
        <div class="dd-tl-main">
          <div class="dd-tl-title-row">
            <span class="dd-tl-title">{{ it.title }}</span>
            <span v-if="it.active" class="dd-tl-badge">Current</span>
          </div>
          <div v-if="it.desc" class="dd-tl-desc">{{ it.desc }}</div>
        </div>
        <div v-if="it.meta" class="dd-tl-time">{{ it.meta }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import type { DrawerPreview, HubKind } from './preview'

defineProps<{
  preview: DrawerPreview
}>()

defineEmits<{
  (e: 'go-hub', kind: HubKind, accommodationId?: string): void
}>()
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid var(--c-border);
}
.border-right {
  border-right: 1px solid var(--c-border);
}
.border-all {
  border: 1px solid var(--c-border);
}
.text-link {
  text-decoration: none;
  color: var(--c-primary);
}
.text-link:hover {
  text-decoration: underline;
}
.dd-ink {
  color: var(--c-ink);
}
.dd-muted {
  color: var(--c-muted);
}
.dd-display {
  font-family: var(--font-display);
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
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  position: relative;
  z-index: 2;
}
.dd-hc-row--active .dd-hc-icon {
  border-color: var(--c-success);
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

/* Plain timeline (user boarding history) ------------------------------ */
.dd-timeline {
  display: flex;
  flex-direction: column;
}
.dd-tl-item {
  display: flex;
  align-items: stretch;
}
.dd-tl-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  width: 40px;
  margin-right: 14px;
}
.dd-tl-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px dashed var(--c-border);
  background: var(--c-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  position: relative;
  z-index: 2;
}
.dd-tl-item--active .dd-tl-dot {
  border: 1px solid var(--c-success);
  background: color-mix(in srgb, var(--c-success) 14%, transparent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--c-success) 16%, transparent);
}
.dd-tl-line {
  position: absolute;
  top: 40px;
  bottom: -16px;
  width: 1px;
  background: var(--c-border);
  z-index: 1;
}
.dd-tl-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex: 1 1 auto;
  padding-bottom: 22px;
}
.dd-tl-main {
  min-width: 0;
}
.dd-tl-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 15px;
  color: var(--c-ink);
  line-height: 1.25;
}
.dd-tl-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dd-tl-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--c-success) 16%, transparent);
  color: var(--c-success);
  border: 1px solid color-mix(in srgb, var(--c-success) 32%, transparent);
  flex: 0 0 auto;
}
.dd-tl-desc {
  font-size: 12.5px;
  color: var(--c-muted);
  margin-top: 3px;
  line-height: 1.4;
}
.dd-tl-time {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--c-muted);
  text-align: right;
  white-space: nowrap;
  padding-top: 2px;
}

.dd-timeline .intro-x {
  animation: dd-tl-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.dd-timeline .intro-x:nth-child(2) { animation-delay: 0.04s; }
.dd-timeline .intro-x:nth-child(3) { animation-delay: 0.08s; }
.dd-timeline .intro-x:nth-child(4) { animation-delay: 0.12s; }
.dd-timeline .intro-x:nth-child(5) { animation-delay: 0.16s; }
.dd-timeline .intro-x:nth-child(6) { animation-delay: 0.20s; }
@keyframes dd-tl-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dd-timeline .intro-x {
    animation: none;
  }
}
</style>
