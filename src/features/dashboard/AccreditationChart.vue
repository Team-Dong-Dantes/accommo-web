<template>
  <section class="panel accr" aria-labelledby="accr-title">
    <header class="p-head">
      <div>
        <h2 id="accr-title">Accreditation pipeline</h2>
        <p>{{ pipelineNote }}</p>
      </div>
      <router-link to="/verifications" class="p-link">Review</router-link>
    </header>

    <!-- Four counts, not a proportional bar. Pending, reviewing, accredited and
         delisted are four populations at one moment, not stages one application
         travels through — sizing them against each other implied a flow that
         does not exist, and put Delisted downstream of Accredited. -->
    <dl class="accr-status">
      <div v-for="stage in funnel" :key="stage.stage">
        <dt>{{ stage.stage }}</dt>
        <dd :class="`is-${stage.stage.toLowerCase()}`">{{ stage.count }}</dd>
      </div>
    </dl>

    <div class="accr-docs">
      <p class="p-sub">Permit sets among the {{ pipelineTotal }} pending</p>
      <!-- Was a five-column chart with three empty columns: nothing sits between
           "submitted nothing" and "submitted everything", so the distribution
           was a bar chart carrying two numbers. -->
      <div class="doc-bar" role="img" :aria-label="docLabel">
        <span
          v-for="band in docBands"
          :key="band.label"
          :class="band.cls"
          :style="{ flexGrow: band.value }"
        >
          <b>{{ band.value }}</b>
          <em>{{ band.label }}</em>
        </span>
      </div>
    </div>

    <div class="accr-ready">
      <p class="p-sub">Ready to decide</p>
      <ul v-if="ready.length" class="ready-list">
        <li v-for="name in ready" :key="name">{{ name }}</li>
      </ul>
      <p v-else class="accr-empty">{{ emptyRead }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardStats } from '@/types/dashboard'

const props = defineProps<{
  funnel: DashboardStats['accommodationFunnel']
  completeness: DashboardStats['permitCompleteness']
  ready: DashboardStats['accreditationQueue']['ready']
  readyToReview: number
  pipelineTotal: number
}>()

const pipelineNote = computed(() =>
  props.pipelineTotal === 0
    ? 'Nothing awaiting accreditation.'
    : `${props.readyToReview} of ${props.pipelineTotal} have a complete permit set and can be decided now.`,
)

const nothingSubmitted = computed(() => props.completeness[0]?.accommodations ?? 0)
const completeSet = computed(() => props.completeness.at(-1)?.accommodations ?? 0)
const partial = computed(() =>
  props.completeness.slice(1, -1).reduce((sum, c) => sum + c.accommodations, 0),
)

const docBands = computed(() =>
  [
    { label: 'No documents yet', value: nothingSubmitted.value, cls: 'is-none' },
    { label: 'Part of the set', value: partial.value, cls: 'is-partial' },
    { label: 'Complete set', value: completeSet.value, cls: 'is-complete' },
  ].filter((band) => band.value > 0),
)

const docLabel = computed(() => docBands.value.map((b) => `${b.label}: ${b.value}`).join(', '))

const emptyRead = computed(() =>
  props.pipelineTotal === 0
    ? 'The queue is empty.'
    : 'Nothing has a complete permit set yet — chasing documents is the work here, not reviewing them.',
)
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

.accr-status { display: flex; flex-wrap: wrap; gap: 0; margin: 0; }
.accr-status > div {
  flex: 1 1 0;
  min-width: 72px;
  padding-left: 14px;
  border-left: 1px solid var(--c-border);
}
.accr-status > div:first-child { padding-left: 0; border-left: 0; }
.accr-status dt { color: var(--c-muted); font-size: 11px; font-weight: 700; }
.accr-status dd {
  margin: 3px 0 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}
.accr-status dd.is-pending { color: var(--c-warning); }
.accr-status dd.is-delisted { color: var(--c-muted); }

.accr-docs {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-top: 14px;
  border-top: 1px solid var(--c-border);
}
/* Each segment names itself, the way the housing panel's lease bar does; a key
   underneath would make the reader match colours back to words for no gain. */
.doc-bar { display: flex; flex: 1; gap: 3px; min-height: 44px; max-height: 150px; }
.doc-bar > span {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  min-width: 62px;
  padding: 7px 10px;
  border-radius: 3px;
  overflow: hidden;
  color: #fff;
}
.doc-bar b {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}
.doc-bar em {
  overflow: hidden;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  opacity: 0.85;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-bar .is-none { background: var(--c-danger); }
.doc-bar .is-partial { background: var(--c-warning); }
.doc-bar .is-complete { background: var(--c-primary); }

.accr-ready { padding-top: 14px; border-top: 1px solid var(--c-border); }
.ready-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ready-list li {
  overflow: hidden;
  padding-left: 14px;
  color: var(--c-text);
  font-size: 12.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
}
.ready-list li::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--c-primary);
}
.accr-empty { margin: 0; color: var(--c-text); font-size: 0.8rem; line-height: 1.5; }
</style>
