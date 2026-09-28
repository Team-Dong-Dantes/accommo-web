<template>
  <!-- One screen, never scrolls: a masthead and two rows of three. The top row
       is the work OSAS acts on, the bottom row describes the term. Rows share
       the height left under the masthead; each card clips its own overflow. -->
  <div class="board">
    <header class="board-head">
      <div>
        <h1>{{ greeting }}, {{ firstName }}</h1>
        <p>{{ todayLabel }}</p>
      </div>
      <nav class="counters" aria-label="Queue totals">
        <router-link v-for="c in counters" :key="c.label" :to="c.to" class="counter" :class="{ 'is-late': c.late }">
          <b>{{ c.value }}</b>
          <span>{{ c.label }}</span>
        </router-link>
      </nav>
    </header>

    <div class="board-grid">
      <VerificationsCard :data="data" :sla-days="slaDays" />
      <AccreditationCard :data="data" />
      <TicketsCard :data="data" :sla-days="slaDays" />
      <RegistrationsCard :months="data.registrationsByMonth" />
      <HousingCard :data="data" />
      <StudentsCard :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VerificationsCard from './VerificationsCard.vue'
import AccreditationCard from './AccreditationCard.vue'
import TicketsCard from './TicketsCard.vue'
import RegistrationsCard from './RegistrationsCard.vue'
import HousingCard from './HousingCard.vue'
import StudentsCard from './StudentsCard.vue'
import type { DashboardStats } from '@/types/dashboard'

const props = withDefaults(defineProps<{ data: DashboardStats; slaDays?: number }>(), { slaDays: 3 })

const firstName = computed(() => (props.data.adminName || 'Admin').split(' ')[0])
const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})
const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }),
)

// Each total opens its own page, and turns amber while part of it is late.
const counters = computed(() => {
  const d = props.data
  return [
    {
      label: 'Awaiting verification',
      value: d.verificationQueue.students + d.verificationQueue.landlords,
      late: d.verificationQueue.pastSla > 0,
      to: '/verifications',
    },
    { label: 'In accreditation', value: d.accreditationQueue.total, late: false, to: '/verifications' },
    { label: 'Open tickets', value: d.ticketQueue.open, late: d.ticketQueue.pastSla > 0, to: '/support-tickets' },
    { label: 'Students', value: d.students.total, late: false, to: '/users' },
  ]
})
</script>

<style scoped>
.board {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--sp-3);
  height: 100%;
  min-height: 0;
}

.board-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-5);
}
.board-head h1 {
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: var(--fs-h1);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
}
.board-head p { margin: 2px 0 0; color: var(--c-muted); font-size: var(--fs-xs); }

.counters { display: flex; gap: var(--sp-2); }
.counter {
  display: flex;
  flex-direction: column;
  min-width: calc(13 * var(--u));
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface);
  text-decoration: none;
}
.counter:hover { border-color: var(--c-primary); }
.counter:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.counter b {
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1.1;
}
.counter span { color: var(--c-muted); font-size: 11px; font-weight: 600; white-space: nowrap; }
.counter.is-late b { color: var(--c-warning); }

.board-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: var(--sp-3);
  min-height: 0;
}
</style>
