<template>
  <section class="panel tc" aria-labelledby="tc-title">
    <header class="p-head">
      <div>
        <h2 id="tc-title">Support tickets</h2>
        <p>{{ note }}</p>
      </div>
      <router-link to="/support-tickets" class="p-link">Inbox</router-link>
    </header>

    <!-- Priority used to have this space, but it is near-constant: 17 medium
         and 1 urgent. Age is what separates these tickets from each other, and
         the buckets match the verification backlog's so the two read alike. -->
    <div class="tc-block">
      <p class="p-sub">How long they have waited</p>
      <div class="tc-ages" role="img" :aria-label="ageLabel">
        <span
          v-for="bucket in ageBands"
          :key="bucket.label"
          :class="{ 'is-overdue': bucket.overdue }"
          :style="{ flexGrow: bucket.val }"
        >
          <b>{{ bucket.val }}</b>
          <em>{{ bucket.label }}</em>
        </span>
      </div>
    </div>

    <div class="tc-block">
      <p class="p-sub">What students are reporting</p>
      <ul class="tc-cats">
        <li v-for="entry in categories" :key="entry.name">
          <span class="tc-name">{{ entry.name }}</span>
          <span class="tc-track"><i :style="{ width: entry.width }" /></span>
          <span class="tc-val">{{ entry.val }}</span>
        </li>
      </ul>
    </div>

    <p v-if="oldestUrgent" class="tc-flag">
      The one urgent ticket — {{ oldestUrgent.category }} —
      has been open <b>{{ oldestUrgent.ageDays }} days</b> with no owner.
    </p>
    <p v-else-if="unassigned > 0" class="tc-flag">
      <b>{{ unassigned }}</b> of {{ open }} have no owner; the oldest has waited
      {{ oldestDays }} day{{ oldestDays === 1 ? '' : 's' }}.
    </p>
    <p v-else class="tc-flag is-ok">Every open ticket has an owner.</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { capitalize } from '@/utils/format'
import type { DashboardStats } from '@/types/dashboard'

const props = withDefaults(
  defineProps<{
    byCategory: DashboardStats['ticketsByCategory']
    ages: DashboardStats['ticketAges']
    oldestUrgent: DashboardStats['oldestUrgent']
    open: number
    unassigned: number
    oldestDays: number
    slaDays?: number
  }>(),
  { slaDays: 3 },
)

const ageBands = computed(() => props.ages.filter((bucket) => bucket.val > 0))
const ageLabel = computed(() => ageBands.value.map((b) => `${b.label}: ${b.val}`).join(', '))
const pastTarget = computed(() =>
  props.ages.filter((b) => b.overdue).reduce((sum, b) => sum + b.val, 0),
)

const note = computed(() => {
  if (props.open === 0) return 'The inbox is clear.'
  if (props.unassigned === props.open && pastTarget.value === props.open) {
    return `All ${props.open} are open, unassigned and past the ${props.slaDays}-day target.`
  }
  if (props.unassigned === props.open) return `All ${props.open} open tickets are unassigned.`
  return `${props.unassigned} of ${props.open} open tickets have no owner.`
})

// Four named categories and a tail, rather than eight bars most of which are 1.
const categories = computed(() => {
  const ranked = props.byCategory
  const head = ranked.slice(0, 4)
  const tailCount = ranked.slice(4).reduce((sum, entry) => sum + entry.val, 0)
  const rows = head.map((entry) => ({ name: capitalize(entry.name), val: entry.val }))
  if (tailCount > 0) {
    rows.push({ name: `${ranked.length - 4} other categories`, val: tailCount })
  }
  const largest = Math.max(...rows.map((row) => row.val), 1)
  return rows.map((row) => ({ ...row, width: `${Math.max(6, Math.round((row.val / largest) * 100))}%` }))
})
</script>

<style scoped>
.p-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.p-head h2 {
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.p-head p { max-width: 40ch; margin: 3px 0 0; color: var(--c-muted); font-size: 0.8rem; line-height: 1.45; }
.p-link { flex: 0 0 auto; color: var(--c-primary); font-size: 0.8rem; font-weight: 700; text-decoration: none; }
.p-link:hover { text-decoration: underline; }
.p-sub { margin: 0 0 8px; color: var(--c-muted); font-size: 11px; font-weight: 700; }

.tc-block { min-width: 0; }

/* Each band names itself, as the housing and accreditation splits do. */
.tc-ages { display: flex; gap: 3px; }
.tc-ages > span {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  min-width: 60px;
  padding: 9px 11px;
  border-radius: 3px;
  overflow: hidden;
  background: var(--c-primary);
  color: #fff;
}
.tc-ages .is-overdue { background: var(--c-danger); }
.tc-ages b {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1;
}
.tc-ages em {
  overflow: hidden;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  opacity: 0.85;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tc-cats { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.tc-cats li {
  display: grid;
  grid-template-columns: minmax(0, 9rem) 1fr 1.75rem;
  align-items: center;
  gap: 10px;
}
.tc-name {
  overflow: hidden;
  color: var(--c-text);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tc-track { height: 8px; border-radius: 999px; background: var(--c-surface-2); overflow: hidden; }
.tc-track i { display: block; height: 100%; border-radius: 999px; background: var(--c-info); }
.tc-val {
  color: var(--c-ink);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 11.5px;
  font-weight: 700;
  text-align: right;
}

.tc-flag {
  margin: auto 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--c-border);
  color: var(--c-text);
  font-size: 0.82rem;
  line-height: 1.55;
}
.tc-flag b { color: var(--c-danger); font-weight: 700; }
.tc-flag.is-ok { color: var(--c-muted); }
</style>
