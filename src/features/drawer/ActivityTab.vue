<template>
  <TabEmptyState
    v-if="!preview.activity?.length"
    icon="lucide:history"
    title="No activity"
    message="Nothing has happened here yet that we keep a record of."
  />

  <div v-else class="dd-activity">
    <div
      v-for="(a, i) in preview.activity"
      :key="i"
      class="dd-act-item intro-x"
    >
      <div class="dd-act-rail">
        <span class="dd-act-icon" :style="activityIconStyle(a)">
          <Icon :icon="a.icon || 'lucide:circle'" width="17" height="17" />
        </span>
        <span v-if="preview.activity && i < preview.activity.length - 1" class="dd-act-line"></span>
      </div>
      <div class="dd-act-body">
        <div class="dd-act-text" v-html="a.text"></div>
        <div v-if="a.time" class="dd-act-time">{{ a.time }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TabEmptyState from './TabEmptyState.vue'
import { Icon } from '@iconify/vue'
import type { DrawerPreview } from './preview'
import { activityIconStyle } from './preview'

defineProps<{ preview: DrawerPreview }>()
</script>

<style scoped>
/* Activity feed (distinct from the boarding-history timeline) -------- */
.dd-activity {
  display: flex;
  flex-direction: column;
}
.dd-act-item {
  display: flex;
  gap: 12px;
  position: relative;
}
.dd-act-rail {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2px;
}
.dd-act-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  z-index: 2;
}
.dd-act-line {
  position: absolute;
  top: 42px;
  bottom: -12px;
  width: 1px;
  background: var(--c-border);
  z-index: 1;
}
.dd-act-body {
  flex: 1 1 auto;
  min-width: 0;
  padding: 4px 0 16px;
}
.dd-act-text {
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--c-ink);
}
.dd-act-text :deep(strong) {
  font-weight: 700;
  color: var(--c-ink);
}
.dd-act-time {
  font-size: 11.5px;
  color: var(--c-muted);
  margin-top: 3px;
}
.dd-activity .intro-x {
  animation: dd-tl-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.dd-activity .intro-x:nth-child(3) { animation-delay: 0.04s; }
.dd-activity .intro-x:nth-child(4) { animation-delay: 0.08s; }
.dd-activity .intro-x:nth-child(5) { animation-delay: 0.12s; }
.dd-activity .intro-x:nth-child(6) { animation-delay: 0.16s; }
.dd-activity .intro-x:nth-child(7) { animation-delay: 0.20s; }
.dd-activity .intro-x:nth-child(8) { animation-delay: 0.24s; }
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
  .dd-activity .intro-x {
    animation: none;
  }
}
</style>
