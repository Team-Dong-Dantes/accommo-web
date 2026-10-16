<template>
  <section class="dd-summary border-all rounded-borders">
    <div class="dd-summary-head">
      <span class="dd-summary-badge">
        <Icon icon="lucide:house" width="18" height="18" />
      </span>
      <div class="col min-width-0">
        <div class="row items-center q-gutter-x-sm min-width-0">
          <span class="dd-summary-name dd-ellipsis">{{ lease.accommodationName }}</span>
          <BadgePill :tone="lease.statusTone || 'success'" :label="lease.statusLabel || lease.status" />
        </div>
  
        <div class="dd-summary-period">{{ lease.periodLabel }}</div>
  
        <div v-if="lease.roomName || lease.roomType" class="dd-summary-room row items-center q-gutter-x-xs">
          <Icon icon="lucide:door-closed" width="13" height="13" />
          <span v-if="lease.roomName">Room {{ lease.roomName }}</span>
          <span v-if="lease.roomName && lease.roomType" class="dd-room-sep">·</span>
          <span v-if="lease.roomType">{{ lease.roomType }}</span>
        </div>
      </div>
      <div v-if="rent" class="dd-summary-rent">
        <span class="dd-rent-label">Monthly rent</span>
        <span class="dd-rent-value">{{ rent }}</span>
      </div>
    </div>
  
    <div v-if="totalPaid > 0 || paymentCount || dueCount" class="dd-summary-stats border-top">
      <div class="dd-stat">
        <span class="dd-stat-value">{{ totalPaidLabel }}</span>
        <span class="dd-stat-label">Total paid</span>
      </div>
      <div class="dd-stat">
        <span class="dd-stat-value">{{ paymentCount }}</span>
        <span class="dd-stat-label">Payments</span>
      </div>
      <div v-if="dueCount" class="dd-stat">
        <span class="dd-stat-value dd-stat-value--warn">{{ dueCount }}</span>
        <span class="dd-stat-label">Unsettled</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// The stay a student's payments belong to, with what they have paid on it.
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import { peso, pesoWhole } from '@/utils/format'
import type { PreviewLease } from './preview'

const props = defineProps<{ lease: PreviewLease; totalPaid: number; paymentCount: number; dueCount: number }>()

const rent = computed(() => {
  const r = props.lease.monthlyRent
  // Treat missing or zero as "no rent on file" so we never show a misleading ₱0/mo.
  if (!r || isNaN(r)) return ''
  return `${pesoWhole(r)}/mo`
})
const totalPaidLabel = computed(() => peso(props.totalPaid))
</script>

<style scoped>
/* ---------- Summary ---------- */
.dd-summary {
  background: var(--c-surface);
}
.dd-summary-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}
.dd-summary-badge {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  color: var(--c-primary);
}
.dd-summary-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  color: var(--c-ink);
}
.dd-summary-period {
  margin-top: 3px;
  font-size: 12.5px;
  color: var(--c-muted);
}
.dd-summary-room {
  margin-top: 2px;
  gap: 5px;
  font-size: 12.5px;
  color: var(--c-muted);
}
.dd-summary-room :deep(.iconify) {
  color: var(--c-border-strong);
}
.dd-room-sep {
  color: var(--c-border-strong);
}
.dd-summary-rent {
  flex: 0 0 auto;
  text-align: right;
  margin-left: auto;
}
.dd-rent-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--c-muted);
}
.dd-rent-value {
  display: block;
  margin-top: 2px;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 16px;
  color: var(--c-ink);
  white-space: nowrap;
}
.dd-summary-stats {
  display: flex;
  border-top: 1px solid var(--c-border);
}
.dd-stat {
  flex: 1 1 0;
  padding: 12px 16px;
  text-align: center;
}
.dd-stat + .dd-stat {
  border-left: 1px solid var(--c-border);
}
.dd-stat-value {
  display: block;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 16px;
  color: var(--c-ink);
}
.dd-stat-value--warn {
  color: var(--c-warning);
}
.dd-stat-label {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--c-muted);
}
/* ---------- Empty ---------- */
/* Shared helpers */
.border-all { border: 1px solid var(--c-border); }
.border-top { border-top: 1px solid var(--c-border); }
.min-width-0 { min-width: 0; }
.dd-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
