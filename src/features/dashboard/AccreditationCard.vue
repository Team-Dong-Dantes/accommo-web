<template>
  <DashCard
    icon="lucide:building-2"
    title="Accreditation"
    tone="work"
    :summary="summary"
    :link="{ to: '/verifications', label: 'All' }"
  >
    <!-- Four populations at one moment, not stages of a flow: counts side by
         side, never a funnel. -->
    <dl class="dc-sec stages">
      <div v-for="stage in data.accommodationFunnel" :key="stage.stage">
        <dd :class="`is-${stage.stage.toLowerCase()}`">{{ stage.count }}</dd>
        <dt>{{ stage.stage }}</dt>
      </div>
    </dl>

    <div class="dc-sec">
      <p class="dc-label">Permits among the {{ pending }} pending</p>
      <div v-if="permitBands.length" class="dc-band" role="img" :aria-label="permitLabel">
        <span
          v-for="band in permitBands"
          :key="band.label"
          :class="band.cls"
          :style="{ flexGrow: band.value }"
        >
          <b>{{ band.value }}</b><em>{{ band.label }}</em>
        </span>
      </div>
      <p v-else class="none">Nothing pending.</p>
    </div>

    <ul v-if="ready.length" class="dc-rows ready">
      <li v-for="item in ready" :key="item.id" class="dc-row">
        <span class="dc-row-main" :title="item.name">{{ item.name }}</span>
        <span class="dc-row-meta">All 4 permits</span>
        <router-link :to="`/verifications?focus=verification:${item.id}`" class="dc-row-act">Review</router-link>
      </li>
    </ul>
    <p v-else class="dc-empty">{{ emptyRead }}</p>

    <template v-if="moreReady > 0" #foot>
      <b>{{ moreReady }}</b> more ready to decide in Verifications.
    </template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashCard from './DashCard.vue'
import type { DashboardStats } from '@/types/dashboard'

const props = defineProps<{ data: DashboardStats }>()

const pending = computed(() => props.data.accreditationQueue.total)
const readyCount = computed(() => props.data.accreditationQueue.withPermits)
const ready = computed(() => props.data.accreditationQueue.ready.slice(0, 3))
const moreReady = computed(() => Math.max(0, readyCount.value - ready.value.length))

const summary = computed(() =>
  pending.value === 0
    ? 'Nothing awaiting accreditation.'
    : `${readyCount.value} of ${pending.value} pending can be decided now`,
)

const completeness = computed(() => props.data.permitCompleteness)
const permitBands = computed(() =>
  [
    { label: 'None yet', value: completeness.value[0]?.accommodations ?? 0, cls: 'is-late' },
    {
      label: 'Partial',
      value: completeness.value.slice(1, -1).reduce((sum, c) => sum + c.accommodations, 0),
      cls: '',
    },
    { label: 'Complete', value: completeness.value.at(-1)?.accommodations ?? 0, cls: 'is-good' },
  ].filter((band) => band.value > 0),
)
const permitLabel = computed(() => permitBands.value.map((b) => `${b.label}: ${b.value}`).join(', '))

const emptyRead = computed(() =>
  pending.value === 0
    ? 'The queue is empty.'
    : 'No application has a complete permit set yet.',
)
</script>

<style scoped>
.stages {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  margin: 0;
}
.stages > div + div { padding-left: var(--sp-3); border-left: 1px solid var(--c-border); }
.stages dd {
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1.1;
}
.stages dd.is-pending { color: var(--c-warning); }
.stages dd.is-accredited { color: var(--c-primary); }
.stages dd.is-rejected, .stages dd.is-delisted { color: var(--c-muted); }
.stages dt { color: var(--c-muted); font-size: var(--fs-xs); }

.none { margin: 0; color: var(--c-muted); font-size: var(--fs-xs); }
.ready { flex: 1; }
</style>
