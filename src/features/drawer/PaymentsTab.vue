<template>
  <div class="dd-payments">
    <!-- Active-lease summary -->
    <section v-if="activeLease" class="dd-summary border-all rounded-borders">
      <div class="dd-summary-head">
        <span class="dd-summary-badge">
          <Icon icon="lucide:house" width="18" height="18" />
        </span>
        <div class="col min-width-0">
          <div class="row items-center q-gutter-x-sm min-width-0">
            <span class="dd-summary-name dd-ellipsis">{{ activeLease.accommodationName }}</span>
            <BadgePill :tone="activeLease.statusTone || 'success'" :label="activeLease.statusLabel || activeLease.status" />
          </div>

          <div class="dd-summary-period">{{ activeLease.periodLabel }}</div>

          <div v-if="activeLease.roomName || activeLease.roomType" class="dd-summary-room row items-center q-gutter-x-xs">
            <Icon icon="lucide:door-closed" width="13" height="13" />
            <span v-if="activeLease.roomName">Room {{ activeLease.roomName }}</span>
            <span v-if="activeLease.roomName && activeLease.roomType" class="dd-room-sep">·</span>
            <span v-if="activeLease.roomType">{{ activeLease.roomType }}</span>
          </div>
        </div>
        <div v-if="rentValue(activeLease)" class="dd-summary-rent">
          <span class="dd-rent-label">Monthly rent</span>
          <span class="dd-rent-value">{{ rentValue(activeLease) }}</span>
        </div>
      </div>

      <div v-if="totalPaid > 0 || payments.length" class="dd-summary-stats border-top">
        <div class="dd-stat">
          <span class="dd-stat-value">{{ totalPaidLabel }}</span>
          <span class="dd-stat-label">Total paid</span>
        </div>
        <div class="dd-stat">
          <span class="dd-stat-value">{{ payments.length }}</span>
          <span class="dd-stat-label">Payments</span>
        </div>
        <div v-if="dueCount" class="dd-stat">
          <span class="dd-stat-value dd-stat-value--warn">{{ dueCount }}</span>
          <span class="dd-stat-label">Unsettled</span>
        </div>
      </div>
    </section>

    <!-- Ledger -->
    <template v-if="payments.length">
      <div class="dd-ledger-head">
        <span class="dd-ledger-title">Payment History</span>
        <span class="dd-ledger-count">{{ payments.length }} record{{ payments.length === 1 ? '' : 's' }}</span>
      </div>

      <div class="dd-ledger border-all rounded-borders">
        <div
          v-for="pay in sortedPayments"
          :key="pay.id"
          class="dd-entry border-bottom"
        >
          <div class="dd-entry-main">
            <span class="dd-entry-dot" :style="{ background: dotColor(pay) }"></span>
            <div class="col min-width-0">
              <div class="row items-center q-gutter-x-sm">
                <span class="dd-entry-month">{{ pay.monthLabel }}</span>
                <BadgePill :tone="pay.statusTone || 'neutral'" :label="pay.statusLabel || pay.status" />
              </div>
              <div v-if="leaseTag(pay) || pay.methodLabel || pay.paidAtLabel" class="dd-entry-sub row items-center q-gutter-x-sm">
                <span v-if="leaseTag(pay)" class="dd-entry-lease">{{ leaseTag(pay) }}</span>
                <span v-if="pay.methodLabel" class="dd-muted text-caption">{{ pay.methodLabel }}</span>
                <span v-if="pay.paidAtLabel" class="dd-muted text-caption">paid {{ pay.paidAtLabel }}</span>
              </div>
            </div>
            <span class="dd-entry-amount">{{ pay.amountLabel }}</span>
          </div>

          <div v-if="pay.txnReference" class="dd-entry-ref">Ref: {{ pay.txnReference }}</div>

          <div v-if="pay.proofUrl" class="dd-entry-actions">
            <a :href="pay.proofUrl" target="_blank" rel="noopener" class="dd-proof-btn">
              <Icon icon="lucide:receipt-text" width="15" height="15" /> View proof
            </a>
          </div>
        </div>
      </div>
    </template>

    <TabEmptyState
      v-else
      icon="lucide:receipt"
      title="No payments recorded"
      message="Payments for this student's leases will appear here in chronological order."
    />
  </div>
</template>

<script setup lang="ts">
import TabEmptyState from './TabEmptyState.vue'
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import type { DrawerPreview, PreviewLease, PreviewPayment } from './preview'

const props = withDefaults(
  defineProps<{
    preview: DrawerPreview
    filterAccommodationId?: string | null
  }>(),
  { filterAccommodationId: null },
)

const payments = computed(() => props.preview.payments ?? [])
const leases = computed(() => props.preview.leases ?? [])

const activeLease = computed<PreviewLease | undefined>(
  () => leases.value.find((l) => l.status === 'active'),
)

const sortedPayments = computed<PreviewPayment[]>(() => {
  // Clean reverse-chronological order by month (YYYY-MM). Defensive sort even
  // though the fetch already orders by month desc.
  return [...payments.value].sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0))
})

function rentValue(lease: PreviewLease): string {
  const r = lease.monthlyRent
  // Treat missing or zero as "no rent on file" so we never show a misleading ₱0/mo.
  if (!r || isNaN(r)) return ''
  return `₱${r.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo`
}

const totalPaid = computed(() =>
  payments.value.filter((p) => p.status === 'paid' || p.status === 'settled').reduce((s, p) => s + (p.amount || 0), 0),
)
const totalPaidLabel = computed(() =>
  `₱${totalPaid.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
)
const dueCount = computed(() =>
  payments.value.filter((p) => p.status === 'due' || p.status === 'overdue' || p.status === 'pending_verification').length,
)

function leaseTag(pay: PreviewPayment): string {
  if (leases.value.length <= 1) return ''
  const l = leases.value.find((x) => x.id === pay.leaseId)
  return l?.accommodationName ?? ''
}

function dotColor(pay: PreviewPayment): string {
  switch (pay.status) {
    case 'paid':
    case 'settled':
      return 'var(--c-success)'
    case 'overdue':
      return 'var(--c-danger)'
    case 'due':
    case 'pending_verification':
      return 'var(--c-warning)'
    default:
      return 'var(--c-border-strong)'
  }
}
</script>

<style scoped>
.dd-payments {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

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

/* ---------- Ledger ---------- */
.dd-ledger-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 2px;
}
.dd-ledger-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  color: var(--c-ink);
}
.dd-ledger-count {
  font-size: 12px;
  color: var(--c-muted);
}
.dd-ledger {
  background: var(--c-surface);
  overflow: hidden;
}
.dd-entry {
  padding: 12px 16px;
}
.dd-entry:last-child {
  border-bottom: none;
}
.dd-entry-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dd-entry-dot {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dd-entry-month {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 14px;
  color: var(--c-ink);
}
.dd-entry-sub {
  margin-top: 3px;
}
.dd-entry-lease {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-primary);
}
.dd-entry-amount {
  margin-left: auto;
  flex: 0 0 auto;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 14px;
  color: var(--c-ink);
  white-space: nowrap;
}
.dd-entry-ref {
  margin-top: 4px;
  padding-left: 22px;
  font-size: 12px;
  color: var(--c-muted);
}
.dd-entry-actions {
  margin-top: 6px;
  padding-left: 22px;
}
.dd-proof-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 9px;
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  color: var(--c-primary);
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.dd-proof-btn:hover {
  border-color: var(--c-primary);
  background: var(--c-surface);
}

/* ---------- Empty ---------- */
/* Shared helpers */
.border-all { border: 1px solid var(--c-border); }
.border-top { border-top: 1px solid var(--c-border); }
.border-bottom { border-bottom: 1px solid var(--c-border); }
.min-width-0 { min-width: 0; }
.dd-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dd-ink { color: var(--c-ink); }
.dd-muted { color: var(--c-muted); }
</style>
