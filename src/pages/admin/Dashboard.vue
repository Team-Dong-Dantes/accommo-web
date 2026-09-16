<template>
  <q-page class="dash">
    <q-linear-progress v-if="loading" indeterminate color="primary" size="3px" class="dash-load" />

    <div v-if="error" class="dash-error" role="alert">
      <Icon icon="lucide:circle-alert" width="15" height="15" aria-hidden="true" />
      Some figures may be stale — {{ error }}
      <button type="button" class="dash-retry" @click="load">Retry</button>
    </div>

    <DashboardSkeleton v-if="loading && !hasLoaded" />

    <main v-else class="dash-content" :class="{ 'is-refreshing': loading }" :aria-busy="loading">
      <header class="dash-intro">
        <div>
          <h1>{{ greeting }}, <span>{{ firstName }}</span></h1>
          <p>{{ todayLabel }}</p>
        </div>
        <dl class="dash-counters">
          <div v-for="counter in counters" :key="counter.label">
            <dt>{{ counter.label }}</dt>
            <dd>{{ counter.value }}</dd>
          </div>
        </dl>
      </header>

      <!-- The one that decides the day leads the page, in the same card as
           everything else. -->
      <section class="board" aria-labelledby="board-title">
        <header>
          <div>
            <h2 class="board-title" id="board-title">Verification backlog</h2>
            <p class="board-note">Accounts waiting on OSAS, by how long they have waited</p>
          </div>
        </header>
        <QueueAgeChart :buckets="data.verificationAges" />
      </section>

      <div class="dash-grid">
        <AccreditationChart
          class="span-6"
          :funnel="data.accommodationFunnel"
          :completeness="data.permitCompleteness"
          :ready="data.accreditationQueue.ready"
          :ready-to-review="data.accreditationQueue.withPermits"
          :pipeline-total="data.accreditationQueue.total"
        />
        <HousingChart class="span-6" :data="data" />
        <RegistrationsPanel class="span-7" :months="data.registrationsByMonth" />
        <TicketsChart
          class="span-5"
          :by-category="data.ticketsByCategory"
          :ages="data.ticketAges"
          :oldest-urgent="data.oldestUrgent"
          :open="data.ticketQueue.open"
          :unassigned="data.ticketQueue.unassigned"
          :oldest-days="data.ticketQueue.oldestDays"
        />
        <StudentsPanel class="span-12" :data="data" />
      </div>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useDashboardStats } from '@/composables/useDashboardStats'
import DashboardSkeleton from '@/features/dashboard/DashboardSkeleton.vue'
import QueueAgeChart from '@/features/dashboard/QueueAgeChart.vue'
import AccreditationChart from '@/features/dashboard/AccreditationChart.vue'
import HousingChart from '@/features/dashboard/HousingChart.vue'
import TicketsChart from '@/features/dashboard/TicketsChart.vue'
import RegistrationsPanel from '@/features/dashboard/RegistrationsPanel.vue'
import StudentsPanel from '@/features/dashboard/StudentsPanel.vue'

const { loading, error, data, hasLoaded, load } = useDashboardStats()
onMounted(load)

const firstName = computed(() => (data.adminName || 'Admin').split(' ')[0])
const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})
const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }),
)

// A thin strip of totals in the masthead, so the charts below never have to
// repeat a headline number just to state one.
const counters = computed(() => [
  { label: 'Awaiting verification', value: data.verificationQueue.students + data.verificationQueue.accommodationManagers },
  { label: 'In accreditation', value: data.accreditationQueue.total },
  { label: 'Open tickets', value: data.ticketQueue.open },
  { label: 'Students', value: data.students.total },
])
</script>

<style scoped>
.dash {
  padding: clamp(14px, 1.6vw, 22px);
  background: var(--c-bg);
}
.dash-load { position: absolute; top: 0; left: 0; right: 0; }

.dash-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 10px 14px;
  border: 1px solid var(--c-danger);
  border-radius: var(--radius-sm, 10px);
  background: var(--c-danger-soft);
  color: var(--c-danger);
  font-size: 13px;
}
.dash-retry {
  margin-left: auto;
  border: 0;
  background: none;
  color: var(--c-danger);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
}

.dash-content { display: flex; flex-direction: column; gap: clamp(14px, 1.5vw, 18px); }
.dash-content.is-refreshing { opacity: 0.72; transition: opacity 0.2s ease; }

/* ── masthead ── */
.dash-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--c-border);
}
.dash-intro h1 {
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: clamp(1.3rem, 1.1rem + 0.8vw, 1.65rem);
  font-weight: 700;
  letter-spacing: -0.03em;
}
.dash-intro h1 span { color: var(--c-primary); }
.dash-intro > div > p { margin: 3px 0 0; color: var(--c-muted); font-size: 0.82rem; }

.dash-counters { display: flex; gap: clamp(16px, 2.4vw, 34px); margin: 0; }
.dash-counters dt { color: var(--c-muted); font-size: 10.5px; font-weight: 700; }
.dash-counters dd {
  margin: 2px 0 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1;
}

/* ── cards ──
   One card for everything, the one the registrations panel already wore: soft
   border, 16px radius, uniform padding, header sitting inside that padding. The
   plates before this gave each panel a square edge and a tinted strip carrying a
   domain colour, which made five surfaces argue about which one mattered. */
.board,
:deep(.panel) {
  padding: clamp(16px, 1.7vw, 21px);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg, 16px);
  background: var(--c-surface);
}
/* `.reg` manages its own internal spacing; the rest stack with one rhythm. */
.board,
:deep(.panel:not(.reg)) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.board > header,
:deep(.panel:not(.reg)) > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.board-title {
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.board-note { margin: 2px 0 0; color: var(--c-muted); font-size: 0.8rem; }

/* ── analysis grid ── */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(12px, 1.4vw, 18px);
  align-items: stretch;
}
.span-5 { grid-column: span 5; }
.span-6 { grid-column: span 6; }
.span-7 { grid-column: span 7; }
.span-12 { grid-column: span 12; }

@media (max-width: 1100px) {
  .span-5, .span-6, .span-7 { grid-column: span 12; }
}
@media (max-width: 640px) {
  .dash-intro { align-items: flex-start; }
  .dash-counters { flex-wrap: wrap; gap: 14px 20px; }
}
</style>
