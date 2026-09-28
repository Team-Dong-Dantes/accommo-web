<template>
  <DashCard
    icon="lucide:graduation-cap"
    title="Students"
    :summary="summary"
    :link="{ to: '/users', label: 'Accounts' }"
  >
    <!-- The identity requirements verification depends on: a queue of missing
         things, so it leads, as rows. -->
    <ul class="dc-rows">
      <li v-for="field in requirements" :key="field.label" class="dc-row">
        <span class="dc-row-main">{{ field.label }}</span>
        <span class="track" :class="{ 'is-thin': field.pct < 25 }"><i :style="{ width: `${Math.max(2, field.pct)}%` }" /></span>
        <span class="dc-row-meta" :class="{ 'is-late': field.pct < 25 }">{{ field.recorded }} of {{ accounts }}</span>
      </li>
    </ul>

    <div class="dc-sec dc-fill split">
      <div class="years-col">
        <p class="dc-label">Year level<template v-if="q.yearMissing">, {{ q.yearMissing }} missing</template></p>
        <ul v-if="years.length" class="years">
          <li v-for="year in years" :key="year.year" :title="`${year.year}: ${year.val}`">
            <b>{{ year.val }}</b>
            <span class="col" :style="{ height: `${year.height}%` }" />
            <em>{{ year.year.replace(/ year$/i, "") }}</em>
          </li>
        </ul>
        <p v-else class="none">No year level recorded.</p>
      </div>

      <div>
        <p class="dc-label">Colleges<template v-if="q.collegeMissing">, {{ q.collegeMissing }} missing</template></p>
        <ul v-if="colleges.length" class="bars">
          <li v-for="college in colleges" :key="college.name">
            <span class="name" :title="college.name">{{ college.name }}</span>
            <span class="track"><i :style="{ width: `${college.pct}%` }" /></span>
            <span class="val">{{ college.val }}</span>
          </li>
        </ul>
        <p v-else class="none">No college recorded.</p>
        <p class="gender">{{ genderLine }}</p>
      </div>
    </div>

    <template #foot>
      <template v-if="q.verifiedWithoutSchoolId > 0">
        <b>{{ q.verifiedWithoutSchoolId }}</b> of {{ q.verified }} verified students have no school ID on file.
      </template>
      <template v-else>Every verified student has a school ID on file.</template>
    </template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashCard from './DashCard.vue'
import type { DashboardStats } from '@/types/dashboard'

const props = defineProps<{ data: DashboardStats }>()

const q = computed(() => props.data.studentProfileQuality)
const accounts = computed(() => q.value.accounts || props.data.students.total)

const summary = computed(() => {
  const base = `${accounts.value} registered, ${props.data.students.newThisMonth} in the last 30 days`
  const withoutProfile = Math.max(0, accounts.value - q.value.records)
  return withoutProfile > 0 ? `${base}, ${withoutProfile} with no profile` : base
})

const requirements = computed(() =>
  q.value.documents.map((field) => ({
    ...field,
    pct: accounts.value > 0 ? Math.round((field.recorded / accounts.value) * 100) : 0,
  })),
)

const years = computed(() => {
  const tallest = Math.max(...props.data.studentsByYear.map((y) => y.val), 1)
  return props.data.studentsByYear.map((y) => ({ ...y, height: Math.max(8, Math.round((y.val / tallest) * 100)) }))
})

// Three fit; the accounts page has the full list.
const colleges = computed(() => {
  const largest = props.data.studentsByCollege[0]?.val ?? 1
  return props.data.studentsByCollege.slice(0, 3).map((c) => ({
    ...c,
    pct: Math.max(6, Math.round((c.val / largest) * 100)),
  }))
})

const genderLine = computed(() => {
  const g = props.data.gender
  const parts = [`${g.female} female`, `${g.male} male`]
  if (g.other) parts.push(`${g.other} other`)
  if (g.unspecified) parts.push(`${g.unspecified} not recorded`)
  return parts.join(', ')
})
</script>

<style scoped>
.track { flex: 0 0 22%; height: 6px; border-radius: 3px; background: var(--c-surface-2); overflow: hidden; }
.track i { display: block; height: 100%; background: var(--c-primary); }
.track.is-thin i { background: var(--c-warning); }

.dc-sec.dc-fill.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: var(--sp-4);
}
.years-col { display: flex; flex-direction: column; min-height: 0; }
.years {
  display: flex;
  flex: 1;
  align-items: flex-end;
  gap: var(--sp-2);
  min-height: calc(7 * var(--u));
  margin: 0;
  padding: 0;
  list-style: none;
}
.years li {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  height: 100%;
  min-width: 0;
}
.years b { color: var(--c-ink); font-size: 11px; font-variant-numeric: tabular-nums; }
.years .col { width: 100%; max-width: 28px; border-radius: 4px 4px 0 0; background: var(--c-primary); opacity: 0.8; }
.years em {
  max-width: 100%;
  overflow: hidden;
  color: var(--c-muted);
  font-size: 10.5px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bars { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; list-style: none; }
.bars li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.7fr) auto;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-xs);
}
.bars .track { flex: none; }
.bars .track i { background: var(--c-info); }
.name { overflow: hidden; color: var(--c-text); text-overflow: ellipsis; white-space: nowrap; }
.val { color: var(--c-ink); font-variant-numeric: tabular-nums; font-weight: 700; }
/* One line each, so the two columns keep their height at 1024px. */
.split .dc-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gender {
  margin: var(--sp-2) 0 0;
  overflow: hidden;
  color: var(--c-muted);
  font-size: var(--fs-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.none { margin: 0; color: var(--c-muted); font-size: var(--fs-xs); }
</style>
