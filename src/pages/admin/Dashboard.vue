<template>
  <q-page class="dash">
    <q-linear-progress v-if="loading" indeterminate color="primary" size="3px" class="dash-load" />

    <div v-if="error" class="dash-error q-pa-sm q-px-md q-mb-md" role="alert">
      <Icon icon="mdi:alert-circle-outline" width="15" height="15" style="vertical-align: -2px" />
      Some figures may be stale — {{ error }}
      <button type="button" class="dash-retry" @click="load">Retry</button>
    </div>

    <!-- ── Action center ─────────────────────────────────────── -->
    <section class="action-center" aria-labelledby="briefing-title">
      <header class="briefing-intro">
        <div class="briefing-title-block">
          <h1 id="briefing-title" class="dash-hello">{{ greeting }}, <span>{{ firstName }}.</span></h1>
          <p class="briefing-date"><Icon icon="mdi:calendar-blank-outline" width="15" height="15" aria-hidden="true" />{{ todayLabel }}</p>
        </div>
      </header>

      <div class="action-body">
        <div class="command-deck" :class="[`tone-${nextAction.tone}`, { 'has-queues': secondaryActions.length }]">
          <div class="command-primary">
            <span class="command-priority"><Icon :icon="nextAction.icon" width="15" height="15" aria-hidden="true" />Priority</span>
            <p class="command-message">{{ nextAction.message }}</p>
            <p class="command-detail">{{ nextAction.detail }}</p>
            <router-link :to="nextAction.to" class="command-action">
              {{ nextAction.action }} <Icon icon="mdi:arrow-right" width="17" height="17" aria-hidden="true" />
            </router-link>
          </div>
          <nav v-if="secondaryActions.length" class="command-queues" aria-label="Other operational queues">
          <router-link
            v-for="item in secondaryActions"
            :key="item.key"
            :to="item.to"
            class="command-queue"
            :class="`tone-${item.tone}`"
            :aria-label="`${item.label}: ${item.value} ${item.unit}. ${item.detail}`"
          >
            <span class="command-queue-top"><Icon :icon="item.icon" width="15" height="15" aria-hidden="true" />{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <span class="command-queue-unit">{{ item.unit }}</span>
            <span class="link-action command-queue-action">View details <Icon icon="mdi:arrow-right" width="14" height="14" aria-hidden="true" /></span>
          </router-link>
          </nav>
        </div>
      </div>
    </section>

    <!-- ── Main grid ─────────────────────────────────────────── -->
    <div class="dash-main">
      <!-- left column -->
      <div class="dash-col">
        <!-- Registrations trend -->
        <section class="panel">
          <div class="panel-head">
            <div class="reg-title-col">
              <h2>Registrations</h2>
              <span class="panel-sub">
                {{ registrationRange }}
                <b v-if="periodDeltaText" class="period-delta" :class="periodDelta !== null && periodDelta >= 0 ? 'up' : 'down'">
                  {{ periodDeltaText }}
                </b>
              </span>
            </div>
            <div class="seg">
              <button v-for="opt in rangeOpts" :key="opt.value" type="button"
                class="seg-btn" :class="{ active: regRange === opt.value && !customRange }" @click="setRange(opt.value)">
                {{ opt.label }}
              </button>
              <DateRangeButton v-model="customRange" />
            </div>
            <div class="panel-actions">
              <q-btn flat round dense class="icon-btn" aria-label="Export registrations as CSV" @click="exportCsv" title="Export CSV">
                <Icon icon="mdi:download" width="18" height="18" />
                <q-tooltip>Export CSV</q-tooltip>
              </q-btn>
            </div>
          </div>

          <ChartCard type="area" preset="area" :series="regSeries" :options="regOptions" height="220px"
            :has-data="regHasData" empty-text="No registrations in this period" />
          <div class="row q-gutter-md text-caption items-center q-mt-sm">
            <div class="legend-chip" v-for="s in visibleSeriesDefs" :key="s.key">
              <span class="legend-dot" :style="{ background: s.color }" />
              <span>{{ s.label }}</span>
            </div>
          </div>
          <p v-if="registrationProjection" class="registration-projection">Projected next month: {{ registrationProjection }} registrations, based on the latest {{ registrationProjectionWindow }} months.</p>
        </section>

        <!-- Student accounts -->
        <section class="panel student-panel">
          <div class="panel-head">
            <div>
              <h2>Student accounts</h2>
              <span class="panel-sub">Account readiness and profile completion</span>
            </div>
            <router-link to="/users" class="panel-link panel-link-top">Open accounts <Icon icon="mdi:chevron-right" width="15" height="15" /></router-link>
          </div>
          <div class="student-overview">
            <div class="student-primary-stat">
              <span class="micro-label">Registered students</span>
              <strong>{{ data.students.total }}</strong>
              <span>{{ studentProfileCoverageLabel }}</span>
            </div>
            <router-link to="/verifications" class="student-action-stat" :class="{ 'is-attention': data.verificationQueue.students > 0 }">
              <span class="micro-label">Verification queue</span>
              <strong>{{ data.verificationQueue.students }}</strong>
              <span>{{ studentVerificationLabel }}</span>
              <span class="link-action metric-action">View details <Icon icon="mdi:arrow-right" width="14" height="14" aria-hidden="true" /></span>
            </router-link>
            <router-link to="/users" class="student-action-stat" :class="{ 'is-attention': data.studentProfileQuality.collegeMissing > 0 }">
              <span class="micro-label">College on record</span>
              <strong>{{ studentCollegeCoverage }}%</strong>
              <span>{{ studentProfileQualityLabel }}</span>
              <span class="link-action metric-action">View details <Icon icon="mdi:arrow-right" width="14" height="14" aria-hidden="true" /></span>
            </router-link>
          </div>
          <div class="student-composition">
            <div class="student-detail-block">
              <div class="micro-label">Year level</div>
              <ChartCard type="bar" preset="bar" :series="yearLevelSeries" :options="yearLevelOptions" height="164px"
                :has-data="yearLevelBars.some((year) => year.val > 0)" empty-text="No year-level profiles recorded" />
            </div>
            <div class="student-detail-block">
              <div class="micro-label">Gender information</div>
              <ChartCard type="donut" preset="donut" :series="genderSeries" :options="genderOptions" height="164px"
                :has-data="genderTotal > 0" empty-text="No gender information recorded" />
              <div class="gender-key" aria-hidden="true">
                <span v-for="item in genderBreakdown" :key="item.label"><i :style="{ background: item.color }" />{{ item.label }} <b>{{ item.value }}</b></span>
              </div>
              <p v-if="data.gender.unspecified > 0" class="gender-completeness">{{ data.gender.unspecified }} profile{{ data.gender.unspecified === 1 ? '' : 's' }} missing gender information</p>
            </div>
          </div>
          <p class="sr-only">{{ yearLevelSummary }}. {{ genderSummary }}</p>
        </section>

        <section class="panel document-follow-up" aria-labelledby="document-follow-up-title">
          <div class="panel-head">
            <div>
              <h2 id="document-follow-up-title">Document follow-up plan</h2>
              <span class="panel-sub">Permit gaps holding up accommodation accreditation</span>
            </div>
            <router-link to="/accommodation-hub" class="panel-link panel-link-top">Open accommodations <Icon icon="mdi:arrow-right" width="15" height="15" /></router-link>
          </div>
          <div v-if="documentFollowUp.length" class="document-gap-list">
            <div v-for="gap in documentFollowUp" :key="gap.label" class="document-gap-row">
              <div class="document-gap-copy">
                <span>{{ gap.label }}</span>
                <strong>{{ gap.accommodations }} <small>accommodations</small></strong>
              </div>
              <div class="document-gap-track" :aria-label="`${gap.accommodations} pending accommodations are missing a ${gap.label.toLowerCase()}`">
                <span :style="{ width: documentGapWidth(gap.accommodations) }" />
              </div>
            </div>
          </div>
          <p v-else class="follow-up-clear"><Icon icon="mdi:check-circle-outline" width="17" height="17" aria-hidden="true" />All pending accommodations have the required permits.</p>
        </section>
      </div>

      <!-- right column -->
      <div class="dash-col">
        <!-- Support tickets -->
        <section class="panel tickets-panel">
          <div class="panel-head">
            <div>
              <h2>Support tickets</h2>
              <span class="panel-sub">{{ ticketSummary }}</span>
            </div>
            <router-link to="/support-tickets" class="panel-link panel-link-top">Open inbox <Icon icon="mdi:arrow-right" width="15" height="15" /></router-link>
          </div>

          <div class="ticket-triage">
            <div class="ticket-open-count">
              <span class="micro-label">Open</span>
              <b>{{ data.ticketQueue.open }}</b>
              <small v-if="data.ticketQueue.urgent > 0"><Icon icon="mdi:alert-circle" width="13" height="13" aria-hidden="true" />{{ data.ticketQueue.urgent }} urgent</small>
            </div>
            <div class="ticket-triage-copy">
              <span class="micro-label">{{ ticketTriageEyebrow }}</span>
              <strong :class="{ 'is-overdue': data.ticketQueue.pastSla > 0 }">{{ ticketTriageTitle }}</strong>
              <span>{{ ticketTriageDetail }}</span>
            </div>
          </div>

          <div v-if="data.ticketQueue.open > 0" class="ticket-facts" aria-label="Open ticket workload breakdown">
            <div class="ticket-fact">
              <span>Assigned</span>
              <strong>{{ ticketAssignedCount }}<small> / {{ data.ticketQueue.open }}</small></strong>
            </div>
            <div class="ticket-fact" :class="{ 'is-warning': data.ticketQueue.unassigned > 0 }">
              <span>Unassigned</span>
              <strong>{{ data.ticketQueue.unassigned }}</strong>
            </div>
            <div v-if="data.ticketQueue.leadingOpenCategory" class="ticket-fact">
              <span>Leading issue</span>
              <strong class="ticket-category-value">{{ data.ticketQueue.leadingOpenCategory.name }}<small>{{ leadingOpenCategoryPct }}%</small></strong>
            </div>
          </div>

          <div v-if="recentTickets.length" class="ticket-list-head">
            <span class="micro-label">Recently opened</span>
          </div>
          <ul v-if="recentTickets.length" class="ticket-list" aria-label="Latest open support tickets">
            <li v-for="t in recentTickets.slice(0, 3)" :key="t.id">
              <router-link :to="`/support-tickets?focus=ticket:${t.fullId}`" class="t-row">
                <span class="t-ref">#{{ t.id }}</span>
                <span class="t-title ellipsis">{{ t.title }}</span>
                <span class="t-age">{{ t.age }}</span>
                <BadgePill :tone="t.pill.tone" :label="t.pill.label" class="t-pill" />
                <Icon class="ticket-go" icon="mdi:chevron-right" width="16" height="16" aria-hidden="true" />
              </router-link>
            </li>
          </ul>
          <p v-else class="ticket-empty"><Icon icon="mdi:check-circle-outline" width="17" height="17" aria-hidden="true" />No open support tickets.</p>

        </section>

        <!-- Housing capacity -->
        <section class="panel housing-panel" aria-labelledby="housing-title">
          <div class="panel-head">
            <div>
              <h2 id="housing-title">Housing capacity</h2>
              <span class="panel-sub">Current occupancy across listed accommodations</span>
            </div>
            <router-link to="/room-hub" class="panel-link panel-link-top">Open room hub <Icon icon="mdi:chevron-right" width="15" height="15" /></router-link>
          </div>
          <div class="housing-overview">
            <div class="housing-occupancy">
              <span class="micro-label">Bed occupancy</span>
              <div class="housing-figure"><b>{{ data.rooms.occupancyPct }}%</b><span>{{ data.rooms.pax }} of {{ data.rooms.capacity }} beds</span></div>
              <div class="band-bar" role="img" :aria-label="`${data.rooms.occupancyPct}% bed occupancy`"><div class="band-fill" :style="{ width: data.rooms.occupancyPct + '%' }" /></div>
              <span class="housing-headroom">{{ capacityHeadroomLabel }}</span>
            </div>
            <router-link to="/room-hub" class="housing-stat housing-stat-link">
              <span class="micro-label">Available rooms</span>
              <strong>{{ data.rooms.available }}</strong>
              <span>{{ availableRoomsLabel }}</span>
              <span class="link-action metric-action">View details <Icon icon="mdi:arrow-right" width="14" height="14" aria-hidden="true" /></span>
            </router-link>
            <router-link to="/accommodation-hub" class="housing-stat housing-stat-link">
              <span class="micro-label">Listed accommodations</span>
              <strong>{{ data.accommodations.total }}</strong>
              <span>{{ accommodationAccreditationLabel }}</span>
              <span class="link-action metric-action">View details <Icon icon="mdi:arrow-right" width="14" height="14" aria-hidden="true" /></span>
            </router-link>
            <router-link to="/accommodation-hub" class="housing-stat housing-stat-link" :class="{ 'is-alert': data.expiringAccreditations > 0 }">
              <span class="micro-label">Accreditation watch</span>
              <strong>{{ data.expiringAccreditations }}</strong>
              <span>{{ accreditationWatchLabel }}</span>
              <span class="link-action metric-action">View details <Icon icon="mdi:arrow-right" width="14" height="14" aria-hidden="true" /></span>
            </router-link>
            <router-link to="/room-hub" class="housing-stat housing-stat-link" :class="{ 'is-alert': data.expiringLeases.length > 0 }">
              <span class="micro-label">Upcoming vacancies</span>
              <strong>{{ data.expiringLeases.length }}</strong>
              <span>{{ upcomingVacanciesLabel }}</span>
              <span class="link-action metric-action">View details <Icon icon="mdi:arrow-right" width="14" height="14" aria-hidden="true" /></span>
            </router-link>
          </div>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useDashboardStats } from '@/composables/useDashboardStats'
import ChartCard from '@/components/charts/ChartCard.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import DateRangeButton from '@/features/audit/DateRangeButton.vue'
import type { StatusTone } from '@/utils/status.config'
import { getTimeAgoShort as timeAgo } from '@/utils/format'
import { cssVar } from '@/utils/chartTheme'

const { loading, error, data, load } = useDashboardStats()
onMounted(load)

/* ── Shift context ── */
const firstName = computed(() => (data.adminName || 'Admin').split(' ')[0])
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})
const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }),
)
const verificationTotal = computed(() => data.verificationQueue.students + data.verificationQueue.accommodationManagers)
type BriefingTone = 'primary' | 'warning' | 'danger' | 'info'

const actionRegister = computed(() => {
  const paymentTotal = data.accommodationManagerPayments.overdue + data.accommodationManagerPayments.pendingVerification
  return [
    {
      key: 'tickets',
      to: '/support-tickets',
      label: 'Urgent support',
      detail: 'Assign unowned tickets before their review target lapses.',
      value: data.ticketQueue.urgent,
      unit: 'urgent',
      icon: 'mdi:alert-circle-outline',
      tone: 'danger' as BriefingTone,
    },
    {
      key: 'verification',
      to: '/verifications',
      label: 'Verification review',
      detail: `${data.verificationQueue.students} students · ${data.verificationQueue.accommodationManagers} accommodation managers`,
      value: verificationTotal.value,
      unit: 'accounts',
      icon: 'mdi:account-check-outline',
      tone: 'warning' as BriefingTone,
    },
    {
      key: 'accreditation',
      to: '/accommodation-hub',
      label: 'Accommodation accreditation',
      detail: `${data.accreditationQueue.withPermits} of ${data.accreditationQueue.total} ready to review · ${data.accreditationQueue.total - data.accreditationQueue.withPermits} need documents`,
      value: data.accreditationQueue.total,
      unit: 'accommodations',
      icon: 'mdi:home-check-outline',
      tone: 'warning' as BriefingTone,
    },
    {
      key: 'payments',
      to: '/room-hub',
      label: 'Accommodation manager payment review',
      detail: `${data.accommodationManagerPayments.overdue} overdue · ${data.accommodationManagerPayments.pendingVerification} proof${data.accommodationManagerPayments.pendingVerification === 1 ? '' : 's'} to verify`,
      value: paymentTotal,
      unit: 'payments',
      icon: 'mdi:cash-clock',
      tone: data.accommodationManagerPayments.overdue > 0 ? 'danger' as BriefingTone : 'info' as BriefingTone,
    },
  ].filter((item) => item.value > 0)
})

const secondaryActions = computed(() =>
  actionRegister.value.filter((item) => item.key !== nextAction.value.key),
)

const nextAction = computed(() => {
  if (data.ticketQueue.urgent > 0) {
    return {
      value: data.ticketQueue.urgent,
      key: 'tickets',
      label: 'Urgent support',
      message: `${data.ticketQueue.urgent} urgent case${data.ticketQueue.urgent === 1 ? '' : 's'} need attention.`,
      detail: 'Assign unowned tickets before their review target lapses.',
      action: 'Open support inbox',
      icon: 'mdi:alert-circle-outline',
      to: '/support-tickets',
      tone: 'danger' as BriefingTone,
    }
  }
  if (verificationTotal.value > 0) {
    return {
      value: verificationTotal.value,
      key: 'verification',
      label: 'Verification review',
      message: `${verificationTotal.value} accounts are waiting for review.`,
      detail: `${data.verificationQueue.withDocs} have documents ready${data.verificationQueue.oldestDays > 0 ? `; the oldest has waited ${data.verificationQueue.oldestDays} days.` : '.'}`,
      action: 'Review verification queue',
      icon: 'mdi:account-check-outline',
      to: '/verifications',
      tone: 'warning' as BriefingTone,
    }
  }
  if (data.accreditationQueue.total > 0) {
    return {
      value: data.accreditationQueue.total,
      key: 'accreditation',
      label: 'Accreditation review',
      message: `${data.accreditationQueue.total} accommodations are waiting for accreditation.`,
      detail: `${data.accreditationQueue.withPermits} complete document set${data.accreditationQueue.withPermits === 1 ? '' : 's'} ready to review.`,
      action: 'Review accommodations',
      icon: 'mdi:home-check-outline',
      to: '/accommodation-hub',
      tone: 'warning' as BriefingTone,
    }
  }
  if (data.accommodationManagerPayments.overdue > 0 || data.accommodationManagerPayments.pendingVerification > 0) {
    const paymentsToReview = data.accommodationManagerPayments.overdue + data.accommodationManagerPayments.pendingVerification
    return {
      value: paymentsToReview,
      key: 'payments',
      label: 'Accommodation manager payment review',
      message: `${paymentsToReview} accommodation-manager payment${paymentsToReview === 1 ? '' : 's'} need review.`,
      detail: `${data.accommodationManagerPayments.overdue} overdue and ${data.accommodationManagerPayments.pendingVerification} proof${data.accommodationManagerPayments.pendingVerification === 1 ? '' : 's'} awaiting verification.`,
      action: 'Review accommodation-manager payments',
      icon: 'mdi:cash-clock',
      to: '/room-hub',
      tone: data.accommodationManagerPayments.overdue > 0 ? 'danger' as BriefingTone : 'info' as BriefingTone,
    }
  }
  return {
      value: data.rooms.available,
    key: 'housing',
    label: 'Housing status',
    message: 'The priority queues are clear.',
    detail: data.rooms.available > 0
      ? `${data.rooms.available} rooms remain available at ${data.rooms.occupancyPct}% bed occupancy.`
      : `Housing is at ${data.rooms.occupancyPct}% occupancy.`,
    action: 'Review housing capacity',
    icon: 'mdi:bed-outline',
    to: '/room-hub',
    tone: 'primary' as BriefingTone,
  }
})

const ticketSummary = computed(() => {
  const current = data.ticketQueue.createdLast7Days
  const previous = data.ticketQueue.createdPrevious7Days
  if (current === 0) return 'No new tickets in the last 7 days'
  if (previous === 0) return `${current} new in the last 7 days`
  const change = Math.round(((current - previous) / previous) * 100)
  return `${current} new in 7d · ${change >= 0 ? 'up' : 'down'} ${Math.abs(change)}% vs prior 7d`
})
const leadingOpenCategoryPct = computed(() => {
  const category = data.ticketQueue.leadingOpenCategory
  return category && data.ticketQueue.open > 0
    ? Math.round((category.count / data.ticketQueue.open) * 100)
    : 0
})
const ticketTriageEyebrow = computed(() =>
  data.ticketQueue.pastSla > 0 ? 'Past 3-day target' : 'Queue health',
)
const ticketTriageTitle = computed(() => {
  if (data.ticketQueue.pastSla > 0) return `${data.ticketQueue.pastSla} need attention`
  if (data.ticketQueue.unassigned > 0) return `${data.ticketQueue.unassigned} need an owner`
  return 'All tickets assigned'
})
const ticketTriageDetail = computed(() => {
  if (data.ticketQueue.oldestDays === 0) return 'No active ticket aging'
  return `Oldest open ticket: ${data.ticketQueue.oldestDays}d`
})

const studentVerificationLabel = computed(() =>
  data.verificationQueue.students === 0
    ? 'All student accounts verified'
    : data.verificationQueue.studentsPastSla > 0
      ? `${data.verificationQueue.studentsPastSla} past the 3-day review target`
      : `${data.verificationQueue.studentsReadyForReview} ready for review · oldest ${data.verificationQueue.oldestStudentDays}d`,
)
const studentCollegeCoverage = computed(() =>
  data.students.total > 0
    ? Math.round((data.studentProfileQuality.collegeRecorded / data.students.total) * 100)
    : 0,
)
const studentProfileQualityLabel = computed(() =>
  data.students.total > data.studentProfileQuality.records
    ? `${data.students.total - data.studentProfileQuality.records} accounts lack a student profile`
    : `${data.studentProfileQuality.collegeMissing} college missing · ${data.studentProfileQuality.yearLevelMissing} year level missing`,
)
const studentProfileCoverageLabel = computed(() => {
  if (data.students.total === 0) return 'No student accounts registered'
  return `${data.students.newThisMonth} joined in the last 30 days`
})
const availableRoomsLabel = computed(() =>
  `${data.rooms.available} room${data.rooms.available === 1 ? '' : 's'} ready to fill`,
)
const capacityHeadroomLabel = computed(() => {
  const openBeds = Math.max(0, data.rooms.capacity - data.rooms.pax)
  return `${openBeds} bed${openBeds === 1 ? '' : 's'} currently unoccupied`
})
const accommodationAccreditationLabel = computed(() => {
  if (data.accommodations.total === 0) return 'No accommodations listed'
  const rate = Math.round((data.accommodations.accredited / data.accommodations.total) * 100)
  return `${rate}% accredited · ${data.accommodations.accredited} of ${data.accommodations.total}`
})
const accreditationWatchLabel = computed(() =>
  data.expiringAccreditations === 0
    ? 'No renewals approaching'
    : data.accommodations.accredited > 0
      ? `${Math.round((data.expiringAccreditations / data.accommodations.accredited) * 100)}% of accredited accommodations renew within 30d`
      : `${data.expiringAccreditations} renewal${data.expiringAccreditations === 1 ? '' : 's'} within 30d`,
)
const upcomingVacanciesLabel = computed(() =>
  data.expiringLeases.length === 0
    ? 'No active leases end within 30d'
    : data.activeLeases > 0
      ? `Next vacancy in ${nearestLeaseExpiryDays.value}d · ${Math.round((data.expiringLeases.length / data.activeLeases) * 100)}% of active leases end within 30d`
      : `Next vacancy in ${nearestLeaseExpiryDays.value}d`,
)
const nearestLeaseExpiryDays = computed(() => {
  const nextExpiry = data.expiringLeases
    .map((lease) => lease.end_date ? new Date(lease.end_date).getTime() : Number.POSITIVE_INFINITY)
    .reduce((nearest, date) => Math.min(nearest, date), Number.POSITIVE_INFINITY)
  return Number.isFinite(nextExpiry)
    ? Math.max(0, Math.ceil((nextExpiry - Date.now()) / 86_400_000))
    : 0
})

/* ── latest tickets ── */
function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}
const recentTickets = computed(() =>
  data.recentTickets.map((c) => {
    const statusTone: StatusTone =
      c.status === 'resolved' ? 'success'
      : c.status === 'in_progress' ? 'info'
      : c.status === 'rejected' ? 'danger'
      : 'warning'
    const statusLabel = c.status === 'pending'
      ? 'Open'
      : c.status === 'reviewing'
        ? 'In progress'
        : c.status === 'closed'
          ? 'Resolved'
          : c.status === 'in_progress'
            ? 'In progress'
            : capitalize(c.status)
    const pill = c.priority === 'urgent'
      ? { tone: 'danger' as StatusTone, label: 'Urgent' }
      : c.priority === 'high'
        ? { tone: 'warning' as StatusTone, label: 'High' }
        : { tone: statusTone, label: statusLabel }
    return { fullId: c.id, id: c.id.slice(0, 8), title: c.subject || 'Untitled ticket', age: timeAgo(c.reported_at), pill }
  }),
)

/* ── registrations trend ── */
const regRange = ref('6')
const customRange = ref<{ from: string; to?: string } | null>(null)
const rangeOpts = [
  { value: '3', label: '3M' },
  { value: '6', label: '6M' },
  { value: '12', label: '12M' },
  { value: 'ytd', label: 'YTD' },
]
function setRange(v: string) {
  regRange.value = v
  customRange.value = null
}
const regView = computed(() => {
  const all = data.registrationsByMonth
  if (customRange.value?.from) {
    const fromYm = customRange.value.from.slice(0, 7)
    const toYm = (customRange.value.to || customRange.value.from).slice(0, 7)
    return all.filter((m) => m.ym >= fromYm && m.ym <= toYm)
  }
  if (regRange.value === 'ytd') {
    const y = String(new Date().getFullYear())
    const cur = `${y}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    return all.filter((m) => m.ym.startsWith(y) && m.ym <= cur)
  }
  return all.slice(-Number(regRange.value))
})
const registrationRange = computed(() => {
  const months = regView.value.map((m) => m.month)
  if (months.length === 0) return '—'
  return `${months[0]} – ${months[months.length - 1]}`
})
const nextRegistrationMonth = computed(() => {
  const last = regView.value.at(-1)
  if (!last) return ''
  const [year = 0, month = 0] = last.ym.split('-').map(Number)
  return new Date(year, month, 1).toLocaleString('en', { month: 'short' })
})
const regCategories = computed(() => [
  ...regView.value.map((m) => m.month),
  ...(registrationProjection.value === null ? [] : [nextRegistrationMonth.value]),
])

const seriesDefs: { key: 'students' | 'accommodationManagers' | 'total' | 'projection'; label: string; color: string }[] = [
  { key: 'students', label: 'Students', color: cssVar('--c-primary', '#0F766E') },
  { key: 'accommodationManagers', label: 'Accommodation Managers', color: cssVar('--c-accent', '#E0654B') },
  { key: 'total', label: 'Total', color: cssVar('--c-info', '#0E7490') },
  { key: 'projection', label: 'Projected', color: cssVar('--c-primary-ink', '#0B5750') },
]
const visibleSeriesDefs = computed(() =>
  seriesDefs.filter((series) => series.key !== 'projection' || registrationProjection.value !== null),
)
const regColors = computed(() => visibleSeriesDefs.value.map((series) => series.color))
const registrationProjectionWindow = computed(() => Math.min(3, regView.value.length))
const registrationProjection = computed(() => {
  const window = registrationProjectionWindow.value
  if (window < 2) return null
  const recentTotals = regView.value.slice(-window).map((month) => month.students + month.accommodationManagers)
  return Math.round(recentTotals.reduce((total, value) => total + value, 0) / window)
})
const regSeries = computed(() => [
  { name: 'Students', data: [...regView.value.map((m) => m.students), ...(registrationProjection.value === null ? [] : [null])] },
  { name: 'Accommodation Managers', data: [...regView.value.map((m) => m.accommodationManagers), ...(registrationProjection.value === null ? [] : [null])] },
  { name: 'Total', data: [...regView.value.map((m) => m.students + m.accommodationManagers), ...(registrationProjection.value === null ? [] : [null])] },
  ...(registrationProjection.value === null
    ? []
    : [{
        name: 'Projected',
        data: [...Array(Math.max(0, regView.value.length - 1)).fill(null), regView.value.at(-1)!.students + regView.value.at(-1)!.accommodationManagers, registrationProjection.value],
      }]),
])

const peak = computed(() => {
  const rows = regView.value.map((m) => ({ x: m.month, y: m.students + m.accommodationManagers }))
  if (!rows.length || rows.every((r) => r.y === 0)) return null
  return rows.reduce((a, b) => (b.y > a.y ? b : a))
})

/* period-over-period delta (skipped for YTD / custom) */
const prevView = computed(() => {
  if (customRange.value || regRange.value === 'ytd') return []
  const n = Number(regRange.value)
  return data.registrationsByMonth.slice(-2 * n, -n)
})
const totalThisPeriod = computed(() =>
  regView.value.reduce((s, m) => s + m.students + m.accommodationManagers, 0),
)
const totalPrev = computed(() => prevView.value.reduce((s, m) => s + m.students + m.accommodationManagers, 0))
const periodDelta = computed(() =>
  totalPrev.value ? Math.round(((totalThisPeriod.value - totalPrev.value) / totalPrev.value) * 100) : null,
)
const periodDeltaText = computed(() =>
  periodDelta.value === null ? '' : `${periodDelta.value >= 0 ? '▲' : '▼'} ${Math.abs(periodDelta.value)}% vs prev`,
)

const regHasData = computed(() =>
  regView.value.length > 0 && regView.value.some((m) => m.students + m.accommodationManagers > 0),
)

function exportCsv() {
  const exportSeries = visibleSeriesDefs.value.filter((series) => series.key !== 'projection')
  const lines = [['Month', ...exportSeries.map((series) => series.label)].join(',')]
  regView.value.forEach((m, i) => {
    const row: (string | number)[] = [regCategories.value[i] ?? '']
    for (const s of exportSeries) {
      row.push(s.key === 'students' ? m.students : s.key === 'accommodationManagers' ? m.accommodationManagers : m.students + m.accommodationManagers)
    }
    lines.push(row.join(','))
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'registrations.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const regOptions = computed(() => ({
  chart: { height: 220, toolbar: { show: false } },
  colors: regColors.value,
  xaxis: { categories: regCategories.value, labels: { style: { colors: 'var(--c-muted)' } } },
  yaxis: { show: false },
  grid: { borderColor: 'var(--c-border)', strokeDashArray: 4 },
  stroke: {
    curve: 'smooth',
    width: visibleSeriesDefs.value.map(() => 3),
    dashArray: visibleSeriesDefs.value.map((s) => (s.key === 'total' ? 6 : s.key === 'projection' ? 4 : 0)),
  },
  markers: { size: 4, hover: { size: 6 }, strokeWidth: 0 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
  dataLabels: { enabled: false },
  legend: { show: false },
  tooltip: { theme: 'light' },
  annotations: peak.value
    ? {
        points: [
          {
            x: peak.value.x,
            y: peak.value.y,
            marker: { size: 5, fillColor: cssVar('--c-accent', '#E0654B'), strokeColor: '#fff', strokeWidth: 2 },
            label: {
              text: 'Peak',
              borderColor: cssVar('--c-accent', '#E0654B'),
              style: { color: '#fff', background: cssVar('--c-accent', '#E0654B'), fontSize: '10px', fontWeight: 700 },
              offsetY: -6,
            },
          },
        ],
      }
    : {},
}))

/* ── student composition ── */
const yearLevelBars = computed(() => {
  return data.studentsByYear.map(y => ({
    label: y.year,
    val: y.val,
  }))
})
const yearLevelSeries = computed(() => [{ name: 'Students', data: yearLevelBars.value.map((year) => year.val) }])
const yearLevelOptions = computed(() => ({
  colors: [cssVar('--c-primary', '#0F766E')],
  xaxis: {
    categories: yearLevelBars.value.map((year) => year.label),
    labels: { style: { colors: cssVar('--c-muted', '#6B7770'), fontSize: '10px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: cssVar('--c-muted', '#6B7770'), fontSize: '10px' } } },
  grid: { borderColor: cssVar('--c-border', '#E7ECF2'), strokeDashArray: 3, padding: { left: 0, right: 0 } },
  plotOptions: { bar: { horizontal: false, borderRadius: 3, columnWidth: '48%' } },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: (value: number) => `${value} student${value === 1 ? '' : 's'}` } },
}))
const yearLevelSummary = computed(() =>
  yearLevelBars.value.map((year) => `${year.label}: ${year.val}`).join(', '),
)

const genderBreakdown = computed(() => [
  { label: 'Female', value: data.gender.female, color: cssVar('--c-accent', '#E0654B') },
  { label: 'Male', value: data.gender.male, color: cssVar('--c-info', '#0E7490') },
  ...(data.gender.other > 0 ? [{ label: 'Other', value: data.gender.other, color: cssVar('--c-muted', '#6B7770') }] : []),
  ...(data.gender.unspecified > 0 ? [{ label: 'Not recorded', value: data.gender.unspecified, color: cssVar('--c-border-strong', '#D3DAE3') }] : []),
])
const genderTotal = computed(() => genderBreakdown.value.reduce((total, item) => total + item.value, 0))
const genderSeries = computed(() => genderBreakdown.value.map((item) => item.value))
const genderOptions = computed(() => ({
  labels: genderBreakdown.value.map((item) => item.label),
  colors: genderBreakdown.value.map((item) => item.color),
  legend: { show: false },
  stroke: { colors: [cssVar('--c-surface', '#FAFCFE')], width: 2 },
  plotOptions: {
    pie: {
      donut: {
        size: '66%',
        labels: {
          show: true,
          name: { show: true, offsetY: 16, color: cssVar('--c-muted', '#6B7770'), fontSize: '10px' },
          value: { show: true, offsetY: -9, color: cssVar('--c-ink', '#16211E'), fontSize: '20px', fontWeight: 700 },
          total: { show: true, label: 'Recorded', color: cssVar('--c-muted', '#6B7770'), fontSize: '10px', formatter: () => String(genderTotal.value) },
        },
      },
    },
  },
  tooltip: { y: { formatter: (value: number) => `${value} student${value === 1 ? '' : 's'}` } },
}))
const genderSummary = computed(() =>
  genderBreakdown.value.map((item) => `${item.label}: ${item.value}`).join(', '),
)

const ticketAssignedCount = computed(() => Math.max(0, data.ticketQueue.open - data.ticketQueue.unassigned))
const openBedCount = computed(() => Math.max(0, data.rooms.capacity - data.rooms.pax))
const projectedBedAvailability = computed(() => openBedCount.value + data.expiringLeases.length)
const documentFollowUp = computed(() =>
  data.accreditationQueue.documentGaps
    .filter((gap) => gap.accommodations > 0)
    .sort((a, b) => b.accommodations - a.accommodations),
)
const documentGapWidth = (accommodations: number) => {
  const highestGap = documentFollowUp.value[0]?.accommodations ?? 1
  return `${Math.max(8, Math.round((accommodations / highestGap) * 100))}%`
}
</script>

<style scoped>
/* ═══ Page ═══ */
.dash {
  padding: var(--sp-4);
  background: var(--c-bg);
  color: var(--c-text);
  min-height: 100%;
  position: relative;
}
.dash-load { position: absolute; top: 0; left: 0; right: 0; }
.dash-error {
  background: var(--c-danger);
  color: #fff;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: var(--sp-4);
}
.dash-retry { margin-left: var(--sp-3); padding: 0; border: 0; border-bottom: 1px solid currentColor; background: transparent; color: inherit; font: inherit; font-weight: 700; cursor: pointer; }
.dash-retry:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

/* ═══ Action center ═══ */
.action-center { overflow: hidden; margin-bottom: var(--sp-4); background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius); box-shadow: var(--shadow-sm); }
.briefing-intro { position: relative; padding: var(--sp-5); overflow: hidden; color: var(--c-panel-dark-text); background: linear-gradient(112deg, #0d312c 0%, #12443d 58%, #15554b 100%); }
.briefing-intro::after { position: absolute; top: -90px; right: 4%; width: 230px; height: 230px; border: 1px solid rgba(234, 244, 241, 0.09); border-radius: 50%; box-shadow: 0 0 0 34px rgba(234, 244, 241, 0.025), 0 0 0 68px rgba(234, 244, 241, 0.018); content: ''; }
.briefing-title-block { position: relative; z-index: 1; }
.dash-hello { max-width: 22ch; margin: 0; font-family: var(--font-display); font-size: clamp(1.8rem, 1.35rem + 1vw, 2.55rem); font-weight: 700; line-height: 1.08; letter-spacing: -0.035em; text-wrap: balance; color: inherit; }
.dash-hello span { color: #a9eee5; }
.briefing-date { display: inline-flex; align-items: center; gap: 7px; margin: var(--sp-3) 0 0; font-family: var(--font-mono); font-size: 11px; font-weight: 600; letter-spacing: 0.025em; color: rgba(234, 244, 241, 0.72); }
.action-body { padding: var(--sp-5); }
.command-deck { display: grid; grid-template-columns: 1fr; border: 1px solid var(--c-border); border-radius: var(--radius-sm); overflow: hidden; background: var(--c-surface); }
.command-deck.has-queues { grid-template-columns: minmax(320px, 1.2fr) minmax(320px, 1fr); }
.command-primary { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--sp-4); align-content: center; padding: var(--sp-4) var(--sp-5); background: var(--c-surface-2); }
.command-priority { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--c-primary); }
.tone-warning .command-priority { color: var(--c-warning); }
.tone-danger .command-priority { color: var(--c-danger); }
.tone-info .command-priority { color: var(--c-info); }
.command-message { grid-column: 1; margin: var(--sp-2) 0 0; font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; color: var(--c-ink); }
.command-detail { grid-column: 1; margin: 3px 0 0; font-size: 11.5px; line-height: 1.3; color: var(--c-muted); }
.command-action { grid-column: 2; grid-row: 1 / span 3; align-self: center; display: inline-flex; align-items: center; gap: 7px; justify-content: center; min-height: 40px; padding: 0 var(--sp-3); border-radius: var(--radius-btn); color: #fff; background: var(--c-primary); font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap; transition: background var(--t-fast), transform var(--t-fast); }
.command-action:hover { background: var(--c-primary-ink); transform: translateY(-1px); }
.command-action:focus-visible { outline: 3px solid var(--c-primary); outline-offset: 3px; }
.tone-warning .command-action { background: var(--c-warning); }
.tone-danger .command-action { background: var(--c-danger); }
.tone-info .command-action { background: var(--c-info); }
.command-queues { display: grid; grid-template-columns: repeat(auto-fit, minmax(156px, 1fr)); min-width: 0; }
.command-queue { position: relative; display: flex; flex-direction: column; justify-content: center; min-width: 0; min-height: 112px; padding: var(--sp-4); border-left: 1px solid var(--c-border); color: inherit; text-decoration: none; cursor: pointer; transition: background var(--t-fast); }
.command-queue:hover { background: var(--c-surface-2); }
.command-queue:focus-visible { position: relative; z-index: 1; outline: 3px solid var(--c-primary); outline-offset: -3px; }
.command-queue-top { display: flex; align-items: center; gap: 6px; overflow: hidden; color: var(--c-muted); font-size: 10px; font-weight: 700; line-height: 1.2; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
.command-queue-top .iconify { color: var(--c-primary); }
.command-queue.tone-warning .command-queue-top .iconify { color: var(--c-warning); }
.command-queue.tone-danger .command-queue-top .iconify { color: var(--c-danger); }
.command-queue.tone-info .command-queue-top .iconify { color: var(--c-info); }
.command-queue strong { margin-top: var(--sp-3); font-family: var(--font-display); font-size: 2rem; font-weight: 700; letter-spacing: -0.05em; line-height: 0.9; color: var(--c-ink); font-variant-numeric: tabular-nums; }
.command-queue-unit { margin-top: 3px; overflow: hidden; font-size: 10px; font-weight: 600; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; color: var(--c-muted); }
.link-action { display: inline-flex; align-items: center; gap: 4px; color: #0f766e; font-size: 11.5px; font-weight: 700; }
.command-queue-action { position: absolute; right: var(--sp-4); bottom: var(--sp-3); opacity: 0; pointer-events: none; transform: translateY(3px); transition: opacity var(--t-fast), transform var(--t-fast); }
.command-queue:hover .command-queue-action, .command-queue:focus-visible .command-queue-action { opacity: 1; transform: translateY(0); }
@media (max-width: 1050px) { .command-deck.has-queues { grid-template-columns: 1fr; } .command-queues { border-top: 1px solid var(--c-border); } .command-queue:first-child { border-left: 0; } }
@media (max-width: 720px) { .briefing-intro { padding: var(--sp-5) var(--sp-4); } .dash-hello { font-size: clamp(1.7rem, 8vw, 2.15rem); } .action-body { padding: var(--sp-4); } .command-primary { grid-template-columns: 1fr; padding: var(--sp-4); } .command-action { grid-column: 1; grid-row: auto; justify-self: start; margin-top: var(--sp-3); } .command-queues { grid-template-columns: 1fr; } .command-queue { position: relative; min-height: 80px; padding: var(--sp-3) var(--sp-4); border-left: 0; border-top: 1px solid var(--c-border); } .command-queue:first-child { border-top: 0; } .command-queue strong { position: absolute; top: 50%; right: var(--sp-4); margin: -13px 0 0; font-size: 1.65rem; } .command-queue-unit { display: none; } .command-queue-action { right: var(--sp-4); bottom: var(--sp-3); opacity: 1; transform: none; } }

/* ═══ Main grid ═══ */
.dash-main {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  gap: var(--sp-4);
}
.dash-col { display: flex; flex-direction: column; gap: var(--sp-4); min-width: 0; }
@media (max-width: 1100px) { .dash-main { grid-template-columns: 1fr; } }

/* ═══ Panels ═══ */
.panel {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-sm);
  padding: var(--sp-4);
}
.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: var(--sp-4);
}
.panel-head h2 {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--c-ink);
  margin: 0;
}
.reg-title-col { flex: 1 1 0; display: flex; flex-direction: column; }
.panel-actions { flex: 1 1 0; display: flex; justify-content: flex-end; }
.panel-sub { display: block; font-size: 12px; color: var(--c-muted); margin-top: 2px; }

/* segmented range toggle */
.seg {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 10px;
}
.seg-btn {
  border: none;
  background: transparent;
  padding: 4px 11px;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--c-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.seg-btn:hover { color: var(--c-ink); }
.seg-btn.active {
  background: var(--c-surface);
  color: var(--c-primary);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.panel-actions { display: flex; align-items: center; gap: 6px; }
.icon-btn { color: var(--c-muted); }
.icon-btn:hover { color: var(--c-primary); }
.period-delta { font-weight: 700; margin-left: 6px; }
.period-delta.up { color: var(--c-success); }
.period-delta.down { color: var(--c-danger); }
.panel-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: var(--sp-4);
  font-size: 13px;
  font-weight: 600;
  color: var(--c-primary);
  text-decoration: none;
}
.panel-link-top { margin-top: 0; white-space: nowrap; }
.registration-projection { margin: var(--sp-3) 0 0; font-size: 11px; font-weight: 600; color: var(--c-primary); }
.micro-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--c-muted);
  margin-bottom: 6px;
}

/* ═══ Support tickets ═══ */
.ticket-triage { display: grid; grid-template-columns: minmax(94px, 0.5fr) minmax(0, 1fr); gap: var(--sp-4); align-items: center; padding: var(--sp-4); border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-surface-2); }
.ticket-open-count { display: flex; flex-direction: column; align-items: flex-start; gap: var(--sp-1); padding-right: var(--sp-4); border-right: 1px solid var(--c-border); }
.ticket-open-count .micro-label { margin: 0; }
.ticket-open-count b { font-family: var(--font-display); font-size: 2.35rem; font-variant-numeric: tabular-nums; line-height: 1; letter-spacing: -0.05em; color: var(--c-ink); }
.ticket-open-count small { display: inline-flex; align-items: center; gap: 4px; color: var(--c-danger); font-size: 11px; font-weight: 700; }
.ticket-triage-copy { display: flex; flex-direction: column; min-width: 0; }
.ticket-triage-copy .micro-label { margin-bottom: var(--sp-1); }
.ticket-triage-copy strong { font-family: var(--font-display); font-size: 1rem; font-weight: 700; line-height: 1.2; color: var(--c-ink); }
.ticket-triage-copy strong.is-overdue { color: var(--c-danger); }
.ticket-triage-copy > span:last-child { margin-top: 3px; font-size: 11px; font-weight: 600; color: var(--c-muted); }
.ticket-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: var(--sp-3); border: 1px solid var(--c-border); border-radius: var(--radius-sm); overflow: hidden; }
.ticket-fact { display: flex; flex-direction: column; gap: 3px; min-width: 0; padding: var(--sp-3); border-left: 1px solid var(--c-border); }
.ticket-fact:first-child { border-left: 0; }
.ticket-fact > span { overflow: hidden; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; color: var(--c-muted); }
.ticket-fact > strong { overflow: hidden; font-family: var(--font-display); font-size: 1rem; font-weight: 700; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; color: var(--c-ink); }
.ticket-fact small { margin-left: 2px; font-family: var(--font-body); font-size: 11px; font-weight: 600; color: var(--c-muted); }
.ticket-fact.is-warning > strong { color: var(--c-warning); }
.ticket-category-value { text-transform: capitalize; }
.ticket-category-value small { margin-left: var(--sp-2); }
.ticket-list-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-3); margin-top: var(--sp-4); }
.ticket-list-head .micro-label { margin: 0; }
.ticket-list { list-style: none; margin: 0; padding: 0; }
.t-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  min-height: 46px;
  padding: var(--sp-2) 0;
  border-bottom: 1px solid var(--c-border);
  color: inherit;
  text-decoration: none;
  transition: background var(--t-fast);
}
.t-row:last-child { border-bottom: none; }
.t-row:hover { margin: 0 calc(var(--sp-2) * -1); padding-left: var(--sp-2); padding-right: var(--sp-2); background: var(--c-surface-2); }
.t-row:focus-visible { position: relative; z-index: 1; outline: 3px solid var(--c-primary); outline-offset: 2px; }
.t-ref { font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--c-muted); flex-shrink: 0; }
.t-title { font-size: 13px; font-weight: 600; color: var(--c-ink); flex: 1 1 auto; min-width: 0; }
.t-age { font-size: 11px; color: var(--c-muted); flex-shrink: 0; }
.t-pill { flex-shrink: 0; }
.ticket-go { color: var(--c-muted); flex-shrink: 0; }
.t-row:hover .ticket-go { color: var(--c-primary); }
.ticket-empty { display: flex; align-items: center; gap: var(--sp-2); margin: var(--sp-5) 0 0; padding: var(--sp-4) 0 0; border-top: 1px solid var(--c-border); font-size: 13px; color: var(--c-success); }

/* ═══ Student accounts ═══ */
.student-overview { display: grid; grid-template-columns: 1.25fr 1fr 1fr; border: 1px solid var(--c-border); border-radius: var(--radius-sm); overflow: hidden; }
.student-primary-stat, .student-action-stat { position: relative; display: flex; flex-direction: column; justify-content: center; min-height: 116px; padding: var(--sp-4); }
.student-primary-stat { background: var(--c-surface-2); }
.student-action-stat { border-left: 1px solid var(--c-border); color: inherit; text-decoration: none; cursor: pointer; transition: background var(--t-fast); }
.student-action-stat:hover { background: var(--c-surface-2); }
.student-action-stat:focus-visible { z-index: 1; outline: 3px solid var(--c-primary); outline-offset: -3px; }
.student-overview .micro-label { margin-bottom: var(--sp-2); }
.student-overview strong { font-family: var(--font-display); font-size: 2rem; font-weight: 700; letter-spacing: -0.045em; line-height: 1; color: var(--c-ink); }
.student-overview > * > span:not(.micro-label) { margin-top: var(--sp-2); font-size: 11.5px; line-height: 1.3; color: var(--c-muted); }
.student-overview > .student-action-stat > .link-action.metric-action,
.housing-overview > .housing-stat > .link-action.metric-action { color: #0f766e; }
.metric-action { position: absolute; right: var(--sp-3); bottom: var(--sp-3); opacity: 0; transform: translateY(3px); transition: opacity var(--t-fast), transform var(--t-fast); }
.student-action-stat:hover .metric-action, .student-action-stat:focus-visible .metric-action, .housing-stat-link:hover .metric-action, .housing-stat-link:focus-visible .metric-action { opacity: 1; transform: translateY(0); }
.student-action-stat.is-attention strong { color: var(--c-warning); }
.student-composition { display: grid; grid-template-columns: 1.15fr 1fr; gap: var(--sp-4); margin-top: var(--sp-4); }
.gender-key { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-top: var(--sp-2); }
.gender-key span { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--c-muted); }
.gender-key b { font-family: var(--font-mono); color: var(--c-ink); }
.gender-key i { width: 7px; height: 7px; border-radius: 50%; }
.gender-completeness { margin: var(--sp-2) 0 0; font-size: 11px; font-weight: 600; color: var(--c-muted); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

/* ═══ Accreditation follow-up ═══ */
.document-gap-list { border: 1px solid var(--c-border); border-radius: var(--radius-sm); overflow: hidden; }
.document-gap-row { display: grid; grid-template-columns: minmax(120px, 0.9fr) minmax(110px, 1.1fr); gap: var(--sp-4); align-items: center; padding: var(--sp-3) var(--sp-4); border-top: 1px solid var(--c-border); }
.document-gap-row:first-child { border-top: 0; }
.document-gap-copy { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-2); min-width: 0; }
.document-gap-copy > span { overflow: hidden; font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; color: var(--c-ink); }
.document-gap-copy > strong { flex-shrink: 0; font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--c-warning); }
.document-gap-copy small { font-family: var(--font-body); font-size: 10px; font-weight: 600; color: var(--c-muted); }
.document-gap-track { height: 7px; overflow: hidden; border-radius: 999px; background: var(--c-warning-soft); }
.document-gap-track span { display: block; height: 100%; border-radius: inherit; background: var(--c-warning); }
.follow-up-clear { display: flex; align-items: center; gap: var(--sp-2); margin: 0; padding: var(--sp-4); border: 1px solid var(--c-border); border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; color: var(--c-success); }

/* ═══ Housing capacity ═══ */
.housing-panel { padding: var(--sp-4); }
.housing-overview { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border: 1px solid var(--c-border); border-radius: var(--radius-sm); overflow: hidden; }
.housing-occupancy, .housing-stat { position: relative; display: flex; flex-direction: column; justify-content: center; min-height: 116px; padding: var(--sp-4); }
.housing-occupancy { grid-column: span 2; background: var(--c-surface-2); border-bottom: 1px solid var(--c-border); }
.housing-figure { display: flex; align-items: baseline; gap: var(--sp-2); }
.housing-figure b { font-family: var(--font-display); font-size: clamp(2.1rem, 1.7rem + 1vw, 2.7rem); line-height: 1; color: var(--c-ink); }
.housing-figure span { font-size: 12px; color: var(--c-muted); }
.housing-occupancy .micro-label { margin-bottom: var(--sp-2); }
.housing-occupancy .band-bar { margin: var(--sp-3) 0 0; }
.housing-headroom { margin-top: var(--sp-2); font-size: 11px; font-weight: 600; color: var(--c-primary); }
.housing-stat { border-left: 1px solid var(--c-border); }
.housing-stat:nth-child(even) { border-left: 0; }
.housing-stat:nth-child(n + 4) { border-top: 1px solid var(--c-border); }
.housing-stat-link { color: inherit; text-decoration: none; cursor: pointer; transition: background var(--t-fast); }
.housing-stat-link:hover { background: var(--c-surface-2); }
.housing-stat-link:focus-visible { position: relative; z-index: 1; outline: 3px solid var(--c-primary); outline-offset: -3px; }
.housing-stat .micro-label { margin-bottom: var(--sp-2); }
.housing-stat strong { font-family: var(--font-display); font-size: 2rem; font-weight: 700; letter-spacing: -0.045em; line-height: 1; color: var(--c-ink); }
.housing-stat > span:not(.micro-label) { margin-top: var(--sp-2); font-size: 11.5px; line-height: 1.3; color: var(--c-muted); }
.housing-stat.is-alert strong { color: var(--c-warning); }

@media (max-width: 900px) { .student-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); } .student-primary-stat { grid-column: span 2; border-bottom: 1px solid var(--c-border); } .student-action-stat:nth-child(2) { border-left: 0; } .student-composition { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .dash { padding: var(--sp-4); } .panel, .housing-panel { padding: var(--sp-4); } .panel-head { align-items: flex-start; } .student-overview, .housing-overview { grid-template-columns: 1fr; } .student-action-stat, .student-action-stat:last-child, .housing-stat { min-height: 92px; border-top: 1px solid var(--c-border); border-left: 0; } .student-primary-stat, .housing-occupancy { min-height: 106px; } .ticket-triage { grid-template-columns: 1fr; gap: var(--sp-3); } .ticket-open-count { padding: 0 0 var(--sp-3); border-right: 0; border-bottom: 1px solid var(--c-border); } .ticket-facts { grid-template-columns: 1fr; } .ticket-fact, .ticket-fact:first-child { border-top: 1px solid var(--c-border); border-left: 0; } .ticket-fact:first-child { border-top: 0; } .document-gap-row { grid-template-columns: 1fr; gap: var(--sp-2); } .metric-action { opacity: 1; transform: none; } .t-age { display: none; } }
@media (prefers-reduced-motion: reduce) { .command-action, .command-queue, .command-queue-unit, .command-queue-action, .student-action-stat, .housing-stat-link, .metric-action { transition: none; } }

/* occupancy bar (shared) */
.band-bar {
  height: 10px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 999px;
  overflow: hidden;
  margin: 10px 0 6px;
}
.band-fill {
  height: 100%;
  background: var(--c-primary);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--c-ink);
}
</style>
