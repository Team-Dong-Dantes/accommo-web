<template>
  <!-- One screen, never scrolls: a masthead and two rows of three. The top row
       is the work OSAS acts on, the bottom row describes the term. Rows share
       the height left under the masthead; each card clips its own overflow. -->
  <div class="board">
    <header class="board-head">
      <div class="hello">
        <time class="date-tile" :datetime="today.toISOString().slice(0, 10)" :aria-label="todayLabel">
          <span class="dt-wd">{{ today.toLocaleDateString('en-PH', { weekday: 'short' }) }}</span>
          <b class="dt-day">{{ today.getDate() }}</b>
          <span class="dt-mo">{{ today.toLocaleDateString('en-PH', { month: 'short' }) }}</span>
        </time>
        <div>
          <h1>{{ greeting }}, {{ adminName }}</h1>
          <p>OSAS console</p>
        </div>
      </div>
      <nav class="counters" aria-label="Queue totals">
        <router-link v-for="c in counters" :key="c.label" :to="c.to" class="counter" :class="{ 'is-late': c.late }">
          <b>{{ c.value }}</b>
          <span>{{ c.label }}</span>
        </router-link>
      </nav>
    </header>

    <div class="board-grid" :style="{ gridTemplateRows: `repeat(${Math.max(1, Math.ceil(cardCount / 3))}, minmax(0, 1fr))` }">
      <!-- Only the areas this admin can view. -->
      <VerificationsCard v-if="auth.can('verification')" :data="data" :sla-days="slaDays" />
      <AccreditationCard v-if="auth.can('accreditation')" :data="data" />
      <TicketsCard v-if="auth.can('support')" :data="data" :sla-days="slaDays" />
      <RegistrationsCard v-if="auth.can('accounts')" :months="data.registrationsByMonth" />
      <HousingCard v-if="auth.can('accommodations')" :data="data" />
      <StudentsCard v-if="auth.can('accounts')" :data="data" />
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
import { useAuthStore } from '@/stores/auth'
import type { Area } from '@/utils/access'

const props = withDefaults(defineProps<{ data: DashboardStats; slaDays?: number }>(), { slaDays: 3 })
const auth = useAuthStore()
// Fewer areas, fewer cards: rows follow the count so three cards fill the board.
const cardCount = computed(() =>
  (['verification', 'accreditation', 'support', 'accounts', 'accommodations', 'accounts'] as Area[]).filter((a) => auth.can(a)).length)

const adminName = computed(() => props.data.adminName || 'Admin')
const today = new Date()
const greeting = computed(() => {
  const hour = today.getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})
const todayLabel = computed(() =>
  today.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }),
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
      area: 'verification' as Area,
    },
    { label: 'In accreditation', value: d.accreditationQueue.total, late: false, to: '/verifications', area: 'accreditation' as Area },
    { label: 'Open tickets', value: d.ticketQueue.open, late: d.ticketQueue.pastSla > 0, to: '/support-tickets', area: 'support' as Area },
    { label: 'Students', value: d.students.total, late: false, to: '/users', area: 'accounts' as Area },
  ].filter((c) => auth.can(c.area))
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

.hello { display: flex; align-items: center; gap: var(--sp-3); }
/* A desk-calendar block: the date as a shape, read at a glance. */
.date-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: calc(14 * var(--u));
  padding: var(--sp-1) 0;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface);
  line-height: 1;
}
.dt-wd, .dt-mo { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.dt-wd { color: var(--c-primary); }
.dt-mo { color: var(--c-muted); }
.dt-day {
  margin: 3px 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

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
