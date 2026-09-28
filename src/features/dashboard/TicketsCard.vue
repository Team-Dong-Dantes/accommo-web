<template>
  <DashCard
    icon="lucide:life-buoy"
    title="Support tickets"
    tone="work"
    :summary="summary"
    :link="{ to: '/support-tickets', label: 'All' }"
  >
    <!-- Same age buckets as the verification backlog, so the two read alike. -->
    <div class="dc-sec">
      <p class="dc-label">How long open tickets have waited</p>
      <div v-if="ageBands.length" class="dc-band" role="img" :aria-label="ageLabel">
        <span
          v-for="bucket in ageBands"
          :key="bucket.label"
          :class="bucket.overdue ? 'is-late' : 'is-good'"
          :style="{ flexGrow: bucket.val }"
        >
          <b>{{ bucket.val }}</b><em>{{ bucket.label }}</em>
        </span>
      </div>
      <p v-else class="none">No open tickets.</p>
    </div>

    <ul v-if="oldest.length" class="dc-rows rows">
      <li v-for="row in oldest" :key="row.id" class="dc-row">
        <span class="dc-row-main" :title="row.subject">{{ row.subject }}</span>
        <span v-if="row.priority === 'urgent'" class="urgent">Urgent</span>
        <span class="dc-row-meta" :class="{ 'is-late': row.ageDays > slaDays }">{{ row.ageDays }}d</span>
        <router-link :to="`/support-tickets?focus=ticket:${row.id}`" class="dc-row-act">Open</router-link>
      </li>
    </ul>
    <p v-else class="dc-empty">The inbox is clear.</p>

    <template v-if="categoryLine" #foot>Most reported: {{ categoryLine }}</template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashCard from './DashCard.vue'
import { capitalize } from '@/utils/format'
import type { DashboardStats } from '@/types/dashboard'

const props = withDefaults(defineProps<{ data: DashboardStats; slaDays?: number }>(), { slaDays: 3 })

const queue = computed(() => props.data.ticketQueue)
const oldest = computed(() => queue.value.oldest.slice(0, 3))

const ageBands = computed(() => props.data.ticketAges.filter((bucket) => bucket.val > 0))
const ageLabel = computed(() => ageBands.value.map((b) => `${b.label}: ${b.val}`).join(', '))

const summary = computed(() => {
  const { open, unassigned, pastSla } = queue.value
  if (open === 0) return 'The inbox is clear.'
  return `${open} open, ${pastSla} past the ${props.slaDays}-day target, ${unassigned} unassigned`
})

// Top three categories in one line; the full breakdown lives on the tickets page.
const categoryLine = computed(() =>
  props.data.ticketsByCategory
    .slice(0, 3)
    .map((entry) => `${capitalize(entry.name)} ${entry.val}`)
    .join(', '),
)
</script>

<style scoped>
.none { margin: 0; color: var(--c-muted); font-size: var(--fs-xs); }
.rows { flex: 1; }
.urgent { flex: none; color: var(--c-accent); font-size: var(--fs-xs); font-weight: 700; }
</style>
