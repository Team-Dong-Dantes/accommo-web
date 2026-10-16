<template>
  <div class="dd-payments">
    <!-- Unpaid balance on ended stays: it blocks the student from a new one. -->
    <section v-if="pastOwed.length && !filterAccommodationId" class="dd-owed border-all rounded-borders">
      <Icon icon="lucide:triangle-alert" width="18" height="18" class="dd-owed-icon" />
      <div class="col min-width-0">
        <div class="dd-owed-title">Owes {{ peso(pastOwedTotal) }} on {{ pastOwed.length === 1 ? 'a past stay' : 'past stays' }}</div>
        <div v-for="o in pastOwed" :key="o.lease_id" class="dd-owed-row">
          {{ o.accommodation }} · {{ o.room }}{{ o.ended_on ? ` · ended ${o.ended_on}` : '' }} — {{ peso(Number(o.balance)) }}
        </div>
        <div class="dd-owed-note">Can't start a new stay until this is paid or the landlord/landlady forgives it.</div>
      </div>
    </section>

    <LeaseSummary v-if="activeLease" :lease="activeLease" :total-paid="totalPaid" :payment-count="payments.length" :due-count="dueCount" />

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
            <button type="button" class="dd-proof-btn" :disabled="opening === pay.id" @click="viewProof(pay)">
              <Icon icon="lucide:receipt-text" width="15" height="15" /> View proof
            </button>
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

    <q-dialog :model-value="!!proof" maximized @update:model-value="proof = null">
      <PhotoLightbox v-if="proof" :index="0" :title="proof.title" :photos="[proof.url]" style="border-radius: 0" @close="proof = null" />
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import TabEmptyState from './TabEmptyState.vue'
import { computed, ref, watch } from 'vue'
import { fetchPastBalance } from '@/api/payments'
import LeaseSummary from './LeaseSummary.vue'
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import PhotoLightbox from './accommodation/PhotoLightbox.vue'
import { signDocUrl } from '@/utils/docUrl'
import { isImage } from '@/features/verifications/fileUtils'
import { useNotify } from '@/utils/notify'
import { manilaToday } from '@/utils/facilities'
import { peso } from '@/utils/format'
import type { DrawerPreview, PreviewLease, PreviewPayment } from './preview'

const props = withDefaults(
  defineProps<{
    preview: DrawerPreview
    filterAccommodationId?: string | null
  }>(),
  { filterAccommodationId: null },
)

// Narrowed to one stay when opened from that stay in Boarding History.
const byStay = <T extends { accommodationId: string }>(rows: T[]) =>
  props.filterAccommodationId ? rows.filter((r) => r.accommodationId === props.filterAccommodationId) : rows
const payments = computed(() => byStay(props.preview.payments ?? []))
const leases = computed(() => byStay(props.preview.leases ?? []))
const ledger = computed(() => byStay(props.preview.ledger ?? []))

// What the student still owes on ended stays (student_past_balance).
const pastOwed = ref<{ lease_id: string; accommodation: string; room: string; ended_on: string | null; balance: number }[]>([])
const pastOwedTotal = computed(() => pastOwed.value.reduce((s, o) => s + Number(o.balance), 0))
watch(
  () => props.preview.studentId,
  async (id) => {
    pastOwed.value = []
    if (!id) return
    const owed = await fetchPastBalance(id).catch(() => [])
    if (props.preview.studentId === id) pastOwed.value = owed
  },
  { immediate: true },
)

// proof_url holds a private `cld:` reference, not a link, so it is signed on
// demand. Images open in the viewer; a PDF proof can only open in a tab, and
// that signed link expires after a few minutes.
const notify = useNotify()
const opening = ref<string | null>(null)
const proof = ref<{ title: string; url: string } | null>(null)
async function viewProof(pay: PreviewPayment) {
  opening.value = pay.id
  const { url, error } = await signDocUrl('payments', pay.id, pay.proofUrl ?? undefined)
  opening.value = null
  if (!url) return notify.error(error ?? 'Could not open this proof.')
  if (isImage(url)) proof.value = { title: `Proof of payment · ${pay.monthLabel}`, url }
  else window.open(url, '_blank', 'noopener')
}

// One stay's summary shows even after it has ended.
const activeLease = computed<PreviewLease | undefined>(
  () => leases.value.find((l) => l.status === 'active') ?? (props.filterAccommodationId ? leases.value[0] : undefined),
)

const sortedPayments = computed<PreviewPayment[]>(() => {
  // Clean reverse-chronological order by month (YYYY-MM). Defensive sort even
  // though the fetch already orders by month desc.
  return [...payments.value].sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0))
})

const totalPaid = computed(() =>
  payments.value.filter((p) => p.status === 'paid' || p.status === 'settled').reduce((s, p) => s + (p.amount || 0), 0),
)
// Items owed by now or awaiting confirmation, off the ledger: payment rows
// never carry due/overdue, since a month nobody paid has no row.
const dueCount = computed(() => {
  const today = manilaToday()
  return ledger.value.filter((r) => r.state !== 'paid' && (r.state === 'pending' || r.state === 'overdue' || (r.dueDate ?? '') <= today)).length
})

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
.dd-owed {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  padding: 12px 14px;
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
.dd-owed-icon {
  flex: 0 0 auto;
  margin-top: 1px;
}
.dd-owed-title {
  font-weight: 700;
}
.dd-owed-row,
.dd-owed-note {
  font-size: 12.5px;
}
.dd-owed-note {
  margin-top: 4px;
  opacity: 0.85;
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
  font-family: inherit;
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
.border-bottom { border-bottom: 1px solid var(--c-border); }
.min-width-0 { min-width: 0; }
.dd-ink { color: var(--c-ink); }
.dd-muted { color: var(--c-muted); }
</style>
