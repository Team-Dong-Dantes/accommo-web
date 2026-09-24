<template>
  <!-- Everything here fits the panel without scrolling: one-line rows, and
       Rating beside Accreditation. Each fact appears once. -->
  <div class="oc-standing" :class="`oc-standing--${standing.tone}`">
    <Icon :icon="standing.tone === 'ok' ? 'lucide:badge-check' : 'lucide:triangle-alert'" width="16" height="16" />
    <span class="oc-standing-title">{{ standing.title }}</span>
    <span class="oc-standing-sub">{{ standing.sub }}</span>
  </div>

  <!-- How it compares: one-line bullet graphs, the campus average as the marker. -->
  <section v-if="campus && campus.count > 1" class="oc">
    <div class="oc-head">
      <span class="oc-title">How it compares</span>
      <span class="oc-meta"><i class="oc-key"></i>campus average · {{ campus.count }} accredited</span>
    </div>
    <div v-for="b in bullets" :key="b.name" class="oc-bullet">
      <span class="oc-bullet-name">{{ b.name }}</span>
      <span class="oc-bullet-track" role="img" :aria-label="`${b.name} ${b.value}, campus ${b.markLabel}`">
        <span class="oc-bullet-fill" :class="`oc-bullet-fill--${b.kind}`" :style="{ width: `${b.fill}%` }"></span>
        <span class="oc-bullet-mark" :style="{ left: `${b.mark}%` }" :title="`Campus ${b.markLabel}`"></span>
      </span>
      <span class="oc-bullet-val">{{ b.value }}</span>
      <span class="oc-delta" :class="`oc-delta--${b.tone}`">{{ b.delta }}</span>
    </div>
  </section>

  <!-- Beds by room: a section through the building, top floor first. -->
  <section class="oc oc--grow">
    <div class="oc-head">
      <span class="oc-title">Beds by room</span>
      <span class="oc-meta">{{ taken }} of {{ beds }} taken · {{ rooms.length }} room{{ rooms.length === 1 ? '' : 's' }} · {{ floors.length }} floor{{ floors.length === 1 ? '' : 's' }}</span>
    </div>
    <template v-if="beds">
      <!-- ponytail: one dot per bed; a very large property wraps rooms onto
           extra lines — switch to per-floor stacked bars if those appear. -->
      <div class="oc-building">
        <div v-for="f in floors" :key="f.key" class="oc-floor">
          <span class="oc-floor-lbl">{{ f.label }}</span>
          <div class="oc-floor-slab">
            <div v-for="r in f.rooms" :key="r.id" class="oc-room" :style="{ flexGrow: Math.max(r.capacity ?? 1, 1) }">
              <span class="oc-room-name">{{ r.name.replace(/^Room\s+/i, '') }}</span>
              <span class="oc-pips">
                <i v-for="(b, i) in pips(r)" :key="i" class="oc-pip" :class="`oc-pip--${b}`" :title="`${r.name} · ${b === 'm' ? 'male boarder' : b === 'f' ? 'female boarder' : 'vacant bed'}`"></i>
              </span>
            </div>
          </div>
          <span class="oc-floor-val">{{ f.taken }}/{{ f.beds }}</span>
        </div>
      </div>
      <div class="oc-legend">
        <span v-if="male"><i class="oc-pip oc-pip--m"></i>Male <b>{{ male }}</b></span>
        <span v-if="female"><i class="oc-pip oc-pip--f"></i>Female <b>{{ female }}</b></span>
        <span v-if="beds - taken"><i class="oc-pip oc-pip--v"></i>Vacant <b>{{ beds - taken }}</b></span>
      </div>
    </template>
    <p v-else class="oc-note">No rooms listed yet.</p>
  </section>

  <!-- Rating and Accreditation, side by side. -->
  <div class="oc-pair">
    <section class="oc oc--half">
      <div class="oc-head">
        <span class="oc-title">Rating</span>
        <span v-if="ratings.length" class="oc-meta">{{ ratings.length }} rating{{ ratings.length === 1 ? '' : 's' }}</span>
      </div>
      <div v-if="ratings.length" class="oc-rating">
        <div class="oc-avg">
          <span class="oc-big">{{ average.toFixed(1) }}</span>
          <span class="oc-stars" :aria-label="`${average.toFixed(1)} out of 5`">
            <Icon v-for="n in 5" :key="n" icon="lucide:star" width="10" height="10" :class="n <= Math.round(average) ? 'oc-star--on' : 'oc-star--off'" />
          </span>
        </div>
        <div class="oc-cols">
          <div v-for="d in distribution" :key="d.stars" class="oc-col" :title="`${d.count} × ${d.stars} star`">
            <span class="oc-col-well"><span class="oc-col-bar" :class="{ 'oc-col-bar--none': !d.count }" :style="{ height: d.count ? `${Math.max((d.count / maxCount) * 100, 8)}%` : '2px' }"></span></span>
            <span class="oc-col-lbl">{{ d.stars }}</span>
          </div>
        </div>
      </div>
      <p v-else class="oc-note">No ratings yet.</p>
    </section>

    <section class="oc oc--half">
      <div class="oc-head">
        <span class="oc-title">Accreditation</span>
        <span class="oc-status" :class="`oc-status--${term.tone}`">
          <Icon :icon="term.tone === 'ok' ? 'lucide:badge-check' : 'lucide:triangle-alert'" width="12" height="12" />{{ term.label }}
        </span>
      </div>
      <template v-if="term.months.length">
        <span class="oc-term-left">{{ term.detail }}</span>
        <div class="oc-months" role="img" :aria-label="`${term.label}. ${term.detail}`">
          <span v-for="(m, i) in term.months" :key="i" class="oc-month" :class="`oc-month--${m}`"></span>
        </div>
        <div class="oc-months-ends">
          <span>{{ fmtMonthYear(accreditedAt) }}</span>
          <span>{{ fmtMonthYear(expiresAt) }}</span>
        </div>
      </template>
      <p v-else class="oc-note">{{ term.detail }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { fmtMonthYear, groupByFloor, type PreviewReview, type PreviewRoom } from '../preview'
import { accreditationTerm, standingOf, watchLine } from './standing'

const props = defineProps<{
  rooms: PreviewRoom[]
  reviews: PreviewReview[]
  accredited: boolean
  accreditedAt: string | null
  expiresAt: string | null
  hidden: boolean
  /** Averages over the accredited accommodations in the hub's list. */
  campus?: { count: number; occupancyPct: number; rating: number | null } | undefined
}>()

// ── Beds ────────────────────────────────────────────────────────────────────
const occupants = (r: PreviewRoom) => r.occupants ?? []
const femaleIn = (r: PreviewRoom) => occupants(r).filter((p) => p.gender === 'female').length
/** One entry per bed: male boarders, then female, then the empty beds. */
function pips(r: PreviewRoom): ('m' | 'f' | 'v')[] {
  const f = femaleIn(r)
  const m = occupants(r).length - f
  const v = Math.max((r.capacity ?? 0) - occupants(r).length, 0)
  return [...Array<'m'>(m).fill('m'), ...Array<'f'>(f).fill('f'), ...Array<'v'>(v).fill('v')]
}
const floors = computed(() =>
  groupByFloor(props.rooms)
    .map((g) => ({
      key: g.key,
      label: g.key === 'none' ? '—' : `${g.key}F`,
      rooms: g.items,
      beds: g.items.reduce((n, r) => n + (r.capacity ?? 0), 0),
      taken: g.items.reduce((n, r) => n + occupants(r).length, 0),
    }))
    .reverse(),
)
const beds = computed(() => floors.value.reduce((n, f) => n + f.beds, 0))
const taken = computed(() => floors.value.reduce((n, f) => n + f.taken, 0))
const female = computed(() => props.rooms.reduce((n, r) => n + femaleIn(r), 0))
const male = computed(() => taken.value - female.value)
const occupancyPct = computed(() => (beds.value ? Math.round((taken.value / beds.value) * 100) : 0))

// ── Rating ──────────────────────────────────────────────────────────────────
const ratings = computed(() => props.reviews.map((r) => r.rating).filter((n) => n >= 1 && n <= 5))
const average = computed(() => ratings.value.reduce((a, b) => a + b, 0) / (ratings.value.length || 1))
const distribution = computed(() =>
  [5, 4, 3, 2, 1].map((stars) => ({ stars, count: ratings.value.filter((n) => Math.round(n) === stars).length })),
)
const maxCount = computed(() => Math.max(1, ...distribution.value.map((d) => d.count)))

// ── Accreditation term ──────────────────────────────────────────────────────
const term = computed(() => accreditationTerm(props.accredited, props.accreditedAt, props.expiresAt))

// ── Benchmarks ──────────────────────────────────────────────────────────────
const bullets = computed(() => {
  const c = props.campus
  if (!c) return []
  const diff = occupancyPct.value - c.occupancyPct
  const out = [{
    name: 'Occupancy', value: `${occupancyPct.value}%`,
    fill: occupancyPct.value, mark: c.occupancyPct, markLabel: `${c.occupancyPct}%`, kind: 'occ',
    delta: diff === 0 ? `Same as ${c.occupancyPct}%` : `${diff > 0 ? '+' : '−'}${Math.abs(diff)} vs ${c.occupancyPct}%`, tone: 'none',
  }]
  if (ratings.value.length && c.rating !== null) {
    const d = Math.round((average.value - c.rating) * 10) / 10
    out.push({
      name: 'Rating', value: average.value.toFixed(1),
      fill: ((average.value - 1) / 4) * 100, mark: ((c.rating - 1) / 4) * 100, markLabel: c.rating.toFixed(1), kind: 'rating',
      delta: d === 0 ? `Same as ${c.rating.toFixed(1)}` : `${Math.abs(d).toFixed(1)} ${d > 0 ? 'above' : 'below'} ${c.rating.toFixed(1)}`,
      tone: d <= -0.3 ? 'warn' : d >= 0.3 ? 'ok' : 'none',
    })
  }
  return out
})

// ── Standing ────────────────────────────────────────────────────────────────
const standing = computed(() => {
  const st = standingOf({
    accredited: props.accredited,
    term: term.value,
    hidden: props.hidden,
    average: average.value,
    reviewCount: ratings.value.length,
    campusRating: props.campus?.rating,
  })
  return { tone: st.tone, title: st.title, sub: watchLine(st.watch) }
})
</script>

<style scoped>
.oc-standing {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  margin-top: 6px;
  padding: 7px 10px;
  border-radius: 9px;
}
.oc-standing--ok { background: color-mix(in srgb, var(--c-success) 12%, var(--ar-surface)); color: var(--c-success); }
.oc-standing--warn { background: color-mix(in srgb, var(--c-warning) 13%, var(--ar-surface)); color: var(--c-warning); }
.oc-standing--bad { background: color-mix(in srgb, var(--c-danger) 12%, var(--ar-surface)); color: var(--c-danger); }
.oc-standing-title { font-size: 13px; font-weight: 700; }
.oc-standing-sub { min-width: 0; color: var(--ar-text); font-size: 11.5px; }

.oc {
  --oc-m: var(--ar-male);
  --oc-f: var(--ar-female);
  --oc-star: #fb8c00;
  --oc-past: color-mix(in srgb, var(--c-success) 45%, var(--ar-surface));
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 6px;
  padding: 9px 0;
  border-bottom: 1px solid var(--ar-border);
}
/* The only section that shrinks, clipping rather than scrolling, on a short window. */
.oc--grow { flex: 0 1 auto; min-height: 0; overflow: hidden; }
/* The light blue sits outside the dark-mode lightness band; one step deeper passes. */
:global([data-theme='dark']) .oc { --oc-m: #2196f3; }

.oc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.oc-title { color: var(--ar-muted); font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; }
.oc-meta { display: inline-flex; align-items: center; gap: 5px; overflow: hidden; color: var(--ar-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.oc-note { margin: 0; color: var(--ar-text); font-size: 12px; }
.oc-big { color: var(--ar-ink); font-family: var(--font-display); font-size: 24px; font-weight: 700; line-height: 1; }

/* One-line bullet graphs */
.oc-key { display: inline-block; width: 2px; height: 11px; border-radius: 1px; background: var(--ar-ink); }
.oc-bullet { display: grid; grid-template-columns: 70px minmax(0, 1fr) 34px auto; align-items: center; gap: 8px; }
.oc-bullet-name { color: var(--ar-ink); font-size: 12.5px; font-weight: 600; }
.oc-bullet-track { position: relative; height: 8px; border-radius: 4px; background: var(--ar-soft); box-shadow: inset 0 0 0 1px var(--ar-border); }
.oc-bullet-fill { position: absolute; inset: 0 auto 0 0; border-radius: 4px; }
.oc-bullet-fill--occ { background: var(--ar-accent); }
.oc-bullet-fill--rating { background: var(--oc-star); }
.oc-bullet-mark {
  position: absolute;
  top: -4px;
  width: 2px;
  height: 16px;
  margin-left: -1px;
  border-radius: 1px;
  background: var(--ar-ink);
  box-shadow: 0 0 0 2px var(--ar-surface);
}
.oc-bullet-val { color: var(--ar-ink); font-family: var(--font-display); font-size: 15px; font-weight: 700; text-align: right; }
.oc-delta { padding: 2px 7px; border-radius: 999px; font-size: 10.5px; font-weight: 600; white-space: nowrap; }
.oc-delta--none { background: var(--ar-soft); color: var(--ar-text); }
.oc-delta--ok { background: color-mix(in srgb, var(--c-success) 12%, var(--ar-surface)); color: var(--c-success); }
.oc-delta--warn { background: color-mix(in srgb, var(--c-warning) 13%, var(--ar-surface)); color: var(--c-warning); }

/* Building section: room name and its bed dots on one line */
.oc-building { display: flex; flex-direction: column; gap: 4px; min-height: 0; }
.oc-floor { display: grid; grid-template-columns: 20px minmax(0, 1fr) 30px; align-items: center; gap: 6px; }
.oc-floor-lbl { color: var(--ar-muted); font-size: 10.5px; font-weight: 700; }
.oc-floor-val { color: var(--ar-text); font-size: 11px; font-variant-numeric: tabular-nums; text-align: right; }
.oc-floor-slab { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px; border-radius: 7px; background: var(--ar-soft); }
.oc-room {
  display: flex;
  flex-basis: 0;
  align-items: center;
  gap: 6px;
  min-width: max-content;
  padding: 4px 6px;
  border: 1px solid var(--ar-border);
  border-radius: 5px;
  background: var(--ar-surface);
}
.oc-room-name { color: var(--ar-text); font-size: 10.5px; font-weight: 600; white-space: nowrap; }
.oc-pips { display: flex; gap: 3px; }
.oc-pip { display: inline-block; flex-shrink: 0; width: 9px; height: 9px; border-radius: 50%; box-sizing: border-box; }
.oc-pip--m { background: var(--oc-m); }
.oc-pip--f { background: var(--oc-f); }
.oc-pip--v { border: 1.5px dashed var(--ar-muted); }
.oc-legend { display: flex; flex-shrink: 0; flex-wrap: wrap; gap: 12px; }
.oc-legend span { display: inline-flex; align-items: center; gap: 5px; color: var(--ar-text); font-size: 11px; }
.oc-legend b { color: var(--ar-ink); }

/* Rating | Accreditation */
.oc-pair { display: grid; flex-shrink: 0; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; border-bottom: 1px solid var(--ar-border); }
.oc--half { min-width: 0; border-bottom: none; }
.oc--half + .oc--half { padding-left: 16px; border-left: 1px solid var(--ar-border); }
.oc-rating { display: flex; align-items: flex-end; gap: 12px; }
.oc-avg { display: flex; flex-direction: column; gap: 4px; }
.oc-stars { display: flex; gap: 1px; }
.oc-star--on { color: var(--oc-star); }
.oc-star--on :deep(path) { fill: currentColor; }
.oc-star--off { color: var(--ar-border); }
.oc-cols { display: flex; flex: 1; gap: 4px; min-width: 0; }
.oc-col { display: flex; flex: 1; flex-direction: column; align-items: center; gap: 2px; }
.oc-col-well { display: flex; align-items: flex-end; width: 100%; height: 30px; }
.oc-col-bar { width: 100%; border-radius: 3px 3px 0 0; background: var(--oc-star); }
.oc-col-bar--none { background: var(--ar-border); }
.oc-col-lbl { color: var(--ar-muted); font-size: 10px; }

.oc-status { display: inline-flex; align-items: center; gap: 3px; font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.oc-status--ok { color: var(--c-success); }
.oc-status--warn { color: var(--c-warning); }
.oc-status--bad { color: var(--c-danger); }
.oc-term-left { color: var(--ar-ink); font-family: var(--font-display); font-size: 15px; font-weight: 700; }
.oc-months { display: flex; gap: 2px; }
.oc-month { flex: 1; height: 12px; border-radius: 2px; box-sizing: border-box; }
.oc-month--past { background: var(--oc-past); }
.oc-month--now { border: 2px solid var(--ar-ink); background: var(--ar-surface); }
.oc-month--left { border: 1px solid var(--ar-border); background: var(--ar-soft); }
.oc-months-ends { display: flex; justify-content: space-between; color: var(--ar-muted); font-size: 10.5px; }
</style>
