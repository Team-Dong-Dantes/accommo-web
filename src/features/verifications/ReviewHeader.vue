<template>
  <header class="tw-bar">
    <button type="button" class="tw-icon-btn" aria-label="Back" @click="emit('close')">
      <Icon icon="lucide:arrow-left" width="19" height="19" />
    </button>
  
    <span class="tw-av" :style="{ background: request?.avatarColor || 'var(--c-primary)' }">
      <img v-if="request?.avatarUrl" :src="request.avatarUrl" :alt="request.name" />
      <template v-else>{{ request?.initials }}</template>
    </span>
    <span class="tw-who-text">
      <span class="tw-name">{{ request?.name }}</span>
      <span class="tw-sub">{{ request?.type }} · {{ request?.email || request?.owner || 'No contact info' }}</span>
    </span>
  
    <span class="tw-spacer" />
  
    <span v-if="request?.status" class="tw-state" :class="`is-${String(request.statusStyle?.tone ?? 'neutral')}`">
      {{ request.status }}
    </span>
    <span class="tw-age" :class="{ 'is-late': isLate }">
      <Icon icon="lucide:clock" width="14" height="14" />
      {{ request?.submitted || 'Unknown' }}
    </span>
  
    <span v-if="queueCount > 1" class="tw-pos">{{ queueIndex + 1 }} <i>/</i> {{ queueCount }}</span>
  
    <button type="button" class="tw-icon-btn" aria-label="Close" @click="emit('close')">
      <Icon icon="lucide:x" width="19" height="19" />
    </button>
  </header>
</template>

<script setup lang="ts">
// The review window's title bar: who the request is from, where it stands,
// how long it has waited, and where it sits in the queue.
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{ request: Record<string, any> | null; queueIndex: number; queueCount: number }>()
const emit = defineEmits<{ close: [] }>()

/** 97% of this queue is past the 3-day target, so the wait is worth colouring. */
const isLate = computed(() => {
  const text = String(props.request?.submitted ?? '')
  const days = /(\d+)\s*d/.exec(text)
  const months = /month|year/.test(text)
  return months || (days ? Number(days[1]) > 3 : false)
})
</script>

<style scoped src="./reviewRail.css"></style>

<style scoped>
.tw-state {
  flex: 0 0 auto;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--c-surface-2);
  color: var(--c-muted);
  font-size: 11.5px;
  font-weight: 700;
}
.tw-state.is-warning { background: var(--c-warning-soft); color: var(--c-warning); }
.tw-state.is-primary,
.tw-state.is-info { background: var(--c-primary-soft); color: var(--c-primary); }
.tw-state.is-danger { background: var(--c-danger-soft); color: var(--c-danger); }
.tw-state.is-success { background: var(--c-success-soft); color: var(--c-success); }
.tw-spacer { flex: 1 1 auto; }
.tw-icon-btn {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-surface-2);
  color: var(--c-muted);
  cursor: pointer;
}
.tw-icon-btn:hover { border-color: var(--c-primary); color: var(--c-primary); }
.tw-icon-btn:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.tw-av img {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
}
.tw-av {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  font-size: 12.5px;
  font-weight: 700;
}
.tw-who-text { display: flex; min-width: 0; flex-direction: column; }
.tw-name {
  overflow: hidden;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tw-sub { overflow: hidden; color: var(--c-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.tw-age {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--c-surface-2);
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 700;
}
.tw-age.is-late { background: var(--c-danger-soft); color: var(--c-danger); }
.tw-pos {
  flex: 0 0 auto;
  padding-left: 4px;
  color: var(--c-ink);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
}
.tw-pos i { color: var(--c-muted); font-style: normal; font-weight: 500; }
@media (prefers-reduced-motion: reduce) {
  .tw-read .is-spinning { animation: none; }
}
@keyframes tw-spin { to { transform: rotate(360deg); } }
</style>
