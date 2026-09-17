<template>
  <div v-if="state" class="screen-gate">
    <div class="sg-panel">
      <Icon :icon="state === 'rotate' ? 'lucide:rotate-cw-square' : 'lucide:monitor-x'" width="56" height="56" />
      <h1>{{ state === 'rotate' ? 'Rotate your device' : 'Screen too small' }}</h1>
      <p v-if="state === 'rotate'">
        The OSAS console is laid out for a wide screen. Turn your device sideways to continue.
      </p>
      <p v-else>
        The OSAS console needs at least a tablet-sized screen in landscape
        ({{ MIN_LONG_EDGE }}&nbsp;&times;&nbsp;{{ MIN_SHORT_EDGE }}). Open it on a tablet or a computer.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { screenGateState, MIN_LONG_EDGE, MIN_SHORT_EDGE, type ScreenGateState } from '@/utils/screenGate'

/**
 * Mounted by the admin layouts only, never by App.vue: the public landing
 * page is where students download the app from a phone, so it must not be
 * gated on a landscape tablet.
 *
 * Null when the app should be shown. The panel is drawn *over* the app rather
 * than replacing it, so a rotation does not unmount the page the reviewer was
 * working on and lose their search, filters and current page.
 */
const state = ref<ScreenGateState>(null)

function measure() {
  const touch =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
  state.value = screenGateState(window.innerWidth, window.innerHeight, touch)
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  window.addEventListener('orientationchange', measure)
})
onUnmounted(() => {
  window.removeEventListener('resize', measure)
  window.removeEventListener('orientationchange', measure)
})
</script>

<style scoped>
.screen-gate {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--c-bg);
}
.sg-panel {
  display: flex;
  max-width: 420px;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--c-border);
  border-radius: var(--card-radius, 16px);
  background: var(--c-surface);
  box-shadow: var(--shadow-sm);
  padding: 32px 28px;
  color: var(--c-muted);
  text-align: center;
}
.sg-panel svg {
  color: var(--c-primary);
}
.sg-panel h1 {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--c-ink);
}
.sg-panel p {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.5;
}
</style>
