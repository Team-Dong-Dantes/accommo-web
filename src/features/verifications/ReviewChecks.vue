<template>
  <section class="tw-sec">
    <h3 class="tw-sec-head">
      <Icon icon="lucide:shield-question" width="15" height="15" />
      Checks
    </h3>
    <div class="tw-checks">
      <span
        v-for="c in checks"
        :key="c.label"
        class="tw-chip"
        :class="`is-${c.status}`"
        :title="c.detail"
      >
        <Icon :icon="c.status === 'pass' ? 'lucide:check' : c.status === 'warn' ? 'lucide:triangle-alert' : 'lucide:x'" width="13" height="13" />
        {{ c.label }}
      </span>
      <span v-if="!checks.length" class="tw-chip is-muted">No automated checks</span>
    </div>
    <!-- Reads the school ID and assessment in this browser: for a
         file the phone did not scan, or a second look at one it did. -->
    <button
      v-if="canRead"
      type="button"
      class="tw-read"
      :disabled="reading"
      @click="emit('read')"
    >
      <Icon :icon="reading ? 'lucide:loader-circle' : 'lucide:scan-text'" width="14" height="14" :class="{ 'is-spinning': reading }" />
      {{ reading ? 'Reading documents…' : 'Read documents' }}
    </button>
  </section>
</template>

<script setup lang="ts">
// The automated checks as chips. VerificationChecks runs them off-screen; the
// window hands its results down here.
import { Icon } from '@iconify/vue'
import type { VerificationCheck } from '@/features/verifications/VerificationChecks.vue'

defineProps<{ checks: VerificationCheck[]; canRead: boolean; reading: boolean }>()
const emit = defineEmits<{ read: [] }>()
</script>

<style scoped src="./reviewRail.css"></style>

<style scoped>
/* ── automated checks ── */
.tw-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 6px 14px 12px;
}
.tw-chip.is-warn { background: var(--c-warning-soft); color: var(--c-warning); }
.tw-chip.is-fail { background: var(--c-danger-soft); color: var(--c-danger); }
.tw-chip.is-muted { background: var(--c-surface-2); color: var(--c-muted); }
.tw-read {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: -4px 14px 12px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--c-primary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}
.tw-read:disabled { color: var(--c-muted); cursor: default; }
@media (prefers-reduced-motion: reduce) {
  .tw-read .is-spinning { animation: none; }
}
@keyframes tw-spin { to { transform: rotate(360deg); } }
</style>
