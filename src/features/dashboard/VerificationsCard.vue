<template>
  <DashCard
    icon="lucide:user-check"
    title="Ready to decide"
    tone="work"
    :summary="summary"
    :link="{ to: '/verifications', label: 'Verifications' }"
  >
    <template v-if="v">
      <!-- The queue split the way the Verifications page splits it: what OSAS
           can decide now, and what is still waiting on the applicant. -->
      <div class="dc-sec">
        <div v-if="bands.length" class="dc-band" role="img" :aria-label="bandLabel">
          <span v-for="band in bands" :key="band.label" :class="band.cls" :style="{ flexGrow: band.value }">
            <b>{{ band.value }}</b><em>{{ band.label }}</em>
          </span>
        </div>
        <p v-else class="none">No account is waiting for verification.</p>
      </div>

      <ul v-if="v.rows.length" class="dc-rows rows">
        <li v-for="row in v.rows" :key="row.id" class="dc-row">
          <span class="dc-row-main" :title="row.name">{{ row.name }}</span>
          <span v-if="row.applying" class="holding" title="Their room application waits on this decision">Holding a room</span>
          <span class="dc-row-meta">{{ row.role === 'student' ? 'Student' : 'Landlord/Landlady' }}</span>
          <span v-if="row.ageDays !== null" class="dc-row-meta" :class="{ 'is-late': row.late }">{{ row.ageDays }}d</span>
          <router-link :to="`/verifications?focus=verification:${row.id}`" class="dc-row-act">Review</router-link>
        </li>
      </ul>
      <p v-else class="dc-empty">Nothing can be decided yet{{ v.waiting ? ': every request still lacks a document.' : '.' }}</p>
    </template>
    <p v-else class="dc-empty">The verification queue could not be loaded.</p>

    <template v-if="v?.mostMissing" #foot>
      Most often missing: <b>{{ v.mostMissing.label }}</b> ({{ v.mostMissing.count }} waiting)
    </template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashCard from './DashCard.vue'
import { REVIEW_TARGET_DAYS } from '@/features/verifications/queue'
import type { DashboardStats } from '@/types/dashboard'

const props = defineProps<{ data: DashboardStats }>()

const v = computed(() => props.data.verifications)

const bands = computed(() => [
  { label: 'Ready to decide', value: v.value?.ready ?? 0, cls: 'is-good' },
  { label: 'Waiting on the applicant', value: v.value?.waiting ?? 0, cls: '' },
].filter((band) => band.value > 0))
const bandLabel = computed(() => bands.value.map((b) => `${b.label}: ${b.value}`).join(', '))

const summary = computed(() => {
  if (!v.value) return ''
  const { ready, late } = v.value
  if (ready === 0) return 'Nothing to decide right now.'
  const base = `${ready} account${ready === 1 ? '' : 's'} can be decided now`
  return late ? `${base}, ${late} past the ${REVIEW_TARGET_DAYS}-day target` : base
})
</script>

<style scoped>
.none { margin: 0; color: var(--c-muted); font-size: var(--fs-xs); }
.rows { flex: 1; }
.holding {
  flex: none;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-size: 10px;
  font-weight: 700;
}
</style>
