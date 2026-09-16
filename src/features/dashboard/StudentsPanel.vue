<template>
  <section class="panel students" aria-labelledby="students-title">
    <header class="p-head">
      <div>
        <h2 id="students-title">Students</h2>
        <p>{{ lede }}</p>
      </div>
      <router-link to="/users" class="p-link">Open accounts</router-link>
    </header>

    <div class="sp-split">
      <!-- Left: the identity paperwork verification depends on. Kept apart from
           the demographics because it is a queue of missing things, not a
           description of the student body. -->
      <div class="sp-col sp-files">
        <p class="p-sub">What is on file, across {{ accounts }} accounts</p>
        <!-- A 6% fill in a full-width track is four pixels of colour: it reads
             as a broken bar, not as a number. The count carries the weight and
             the short track only says how little of the whole it is. -->
        <ul class="sp-files-list">
          <li v-for="field in documents" :key="field.label" :class="{ 'is-thin': field.pct < 25 }">
            <b class="sp-figure">{{ field.recorded }}</b>
            <span class="sp-meta">
              <span class="sp-name">{{ field.label }}</span>
              <span class="sp-missing">{{ field.missing }} still missing</span>
            </span>
            <span class="sp-mini">
              <span class="sp-track"><i :style="{ width: `${Math.max(2, field.pct)}%` }" /></span>
              <span class="sp-pct">{{ field.pct }}%</span>
            </span>
          </li>
        </ul>

        <p v-if="verifiedWithoutSchoolId > 0" class="sp-flag">
          <b>{{ verifiedWithoutSchoolId }}</b>
          of the {{ verified }} profiles marked OSAS-verified have no school ID on file.
        </p>
        <p v-else class="sp-flag is-ok">Every OSAS-verified profile has a school ID on file.</p>
      </div>

      <!-- Right: who the students actually are, counted only among the records
           that carry the field. The blanks are stated, not charted. -->
      <div class="sp-col sp-demo">
        <div class="sp-block">
          <p class="p-sub">Gender</p>
          <div class="sp-bandbar" role="img" :aria-label="genderLabel">
            <span
              v-for="band in genderBands"
              :key="band.label"
              :class="band.cls"
              :style="{ flexGrow: band.value }"
            >
              <b>{{ band.value }}</b>
              <em>{{ band.label }}</em>
            </span>
          </div>
        </div>

        <div class="sp-block">
          <p class="p-sub">Year level <span v-if="yearMissing">· {{ yearMissing }} not recorded</span></p>
          <ul v-if="years.length" class="sp-years">
            <li v-for="year in years" :key="year.year">
              <span class="sp-year-bar" :style="{ height: `${year.height}%` }"><b>{{ year.val }}</b></span>
              <span class="sp-year-name">{{ year.year }}</span>
            </li>
          </ul>
          <p v-else class="sp-none">No year level recorded on any profile.</p>
        </div>

        <div class="sp-block">
          <p class="p-sub">College <span v-if="collegeMissing">· {{ collegeMissing }} not recorded</span></p>
          <ul v-if="colleges.length" class="sp-bars sp-colleges">
            <li v-for="college in colleges" :key="college.name">
              <span class="sp-name" :title="college.name">{{ college.name }}</span>
              <span class="sp-track"><i :style="{ width: `${college.pct}%` }" /></span>
              <span class="sp-val">{{ college.val }}</span>
            </li>
          </ul>
          <p v-else class="sp-none">No college recorded on any profile.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardStats } from '@/types/dashboard'

const props = defineProps<{ data: DashboardStats }>()

const quality = computed(() => props.data.studentProfileQuality)
const accounts = computed(() => quality.value.accounts || props.data.students.total)
const verified = computed(() => quality.value.verified)
const verifiedWithoutSchoolId = computed(() => quality.value.verifiedWithoutSchoolId)
const yearMissing = computed(() => quality.value.yearMissing)
const collegeMissing = computed(() => quality.value.collegeMissing)

const documents = computed(() =>
  quality.value.documents.map((field) => ({
    ...field,
    missing: Math.max(0, accounts.value - field.recorded),
    pct: accounts.value > 0 ? Math.round((field.recorded / accounts.value) * 100) : 0,
  })),
)

const lede = computed(() => {
  const withoutProfile = Math.max(0, accounts.value - quality.value.records)
  const base = `${accounts.value} registered, ${props.data.students.newThisMonth} in the last 30 days.`
  return withoutProfile > 0 ? `${base} ${withoutProfile} have no profile record at all.` : base
})

const years = computed(() => {
  const tallest = Math.max(...props.data.studentsByYear.map((y) => y.val), 1)
  return props.data.studentsByYear.map((y) => ({
    ...y,
    height: Math.max(12, Math.round((y.val / tallest) * 100)),
  }))
})

const colleges = computed(() => {
  const largest = props.data.studentsByCollege[0]?.val ?? 1
  return props.data.studentsByCollege.map((c) => ({
    ...c,
    pct: Math.max(6, Math.round((c.val / largest) * 100)),
  }))
})

const genderBands = computed(() =>
  [
    { label: 'Female', value: props.data.gender.female, cls: 'is-female' },
    { label: 'Male', value: props.data.gender.male, cls: 'is-male' },
    { label: 'Other', value: props.data.gender.other, cls: 'is-other' },
    { label: 'Not recorded', value: props.data.gender.unspecified, cls: 'is-unknown' },
  ].filter((band) => band.value > 0),
)
const genderLabel = computed(() => genderBands.value.map((b) => `${b.label}: ${b.value}`).join(', '))
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
.p-head p { max-width: 60ch; margin: 3px 0 0; color: var(--c-muted); font-size: 0.8rem; line-height: 1.45; }
.p-link { flex: 0 0 auto; color: var(--c-primary); font-size: 0.8rem; font-weight: 700; text-decoration: none; }
.p-link:hover { text-decoration: underline; }
.p-sub { margin: 0 0 8px; color: var(--c-muted); font-size: 11px; font-weight: 700; }
.p-sub span { font-weight: 600; opacity: 0.85; }

.sp-split { display: grid; grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr); gap: 28px; }
.sp-col { display: flex; flex-direction: column; min-width: 0; }
.sp-demo { display: grid; align-content: start; gap: 16px; }
.sp-files { padding-right: 28px; border-right: 1px solid var(--c-border); }

.sp-files-list { display: grid; gap: 14px; margin: 0; padding: 0; list-style: none; }
.sp-files-list li {
  display: grid;
  grid-template-columns: 2.6rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}
.sp-figure {
  color: var(--c-ink);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  text-align: right;
}
.sp-files-list .is-thin .sp-figure { color: var(--c-danger); }
.sp-meta { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.sp-missing { color: var(--c-muted); font-size: 11px; }
.sp-mini { display: flex; align-items: center; gap: 8px; }
.sp-mini .sp-track { width: 74px; }

.sp-bars { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.sp-bars li {
  display: grid;
  grid-template-columns: minmax(0, 9rem) 1fr 2.25rem;
  align-items: center;
  gap: 10px;
}
.sp-name {
  overflow: hidden;
  color: var(--c-text);
  font-size: 12.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sp-track { height: 9px; border-radius: 999px; background: var(--c-surface-2); overflow: hidden; }
.sp-track i { display: block; height: 100%; border-radius: 999px; background: var(--c-primary); }
/* Under a quarter on file reads as a gap, not a statistic. */
.sp-files-list .is-thin .sp-track i { background: var(--c-danger); }
.sp-colleges .sp-track i { background: var(--c-info); }
.sp-val, .sp-pct {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 11.5px;
  font-weight: 700;
  text-align: right;
}
.sp-val { color: var(--c-ink); }
.sp-pct { min-width: 2.4rem; color: var(--c-muted); }

.sp-flag {
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--c-border);
  color: var(--c-text);
  font-size: 0.8rem;
  line-height: 1.5;
}
.sp-flag b {
  color: var(--c-danger);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: 1.35rem;
  font-weight: 700;
}
.sp-flag.is-ok { color: var(--c-muted); }

/* Each segment names itself, as the housing and accreditation splits do. */
.sp-bandbar { display: flex; gap: 3px; }
.sp-bandbar > span {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  min-width: 58px;
  padding: 7px 10px;
  border-radius: 3px;
  overflow: hidden;
  color: #fff;
}
.sp-bandbar b {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}
.sp-bandbar em {
  overflow: hidden;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  opacity: 0.85;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sp-bandbar .is-female { background: var(--c-accent); }
.sp-bandbar .is-male { background: var(--c-info); }
.sp-bandbar .is-other { background: var(--c-primary); }
.sp-bandbar .is-unknown { background: var(--c-border-strong); color: var(--c-text); }

.sp-years {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 66px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sp-years li { display: flex; flex: 1; flex-direction: column; justify-content: flex-end; height: 100%; gap: 4px; }
.sp-year-bar {
  display: grid;
  place-items: center;
  border-radius: 3px 3px 0 0;
  background: var(--c-primary);
  color: #fff;
}
.sp-year-bar b {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: 11.5px;
  font-weight: 700;
}
.sp-year-name { color: var(--c-muted); font-size: 10.5px; font-weight: 600; text-align: center; }

.sp-none { margin: 0; color: var(--c-muted); font-size: 0.8rem; }

@media (max-width: 900px) {
  .sp-split { grid-template-columns: 1fr; gap: 18px; }
  .sp-files { padding-right: 0; padding-bottom: 18px; border-right: 0; border-bottom: 1px solid var(--c-border); }

}
</style>
