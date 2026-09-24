<template>
  <!-- A person's record, left panel: a role-tinted band with their avatar, a
       standing line, then what matters for their role — a student's stay,
       payments and academics; a landlord/landlady's accommodations and how
       quickly they reply — and how to reach them. -->
  <div class="rc-band uo-band" :class="`uo-band--${o?.role ?? 'other'}`">
    <div class="rc-fade"></div>
    <button type="button" class="rc-dots" aria-label="More options" aria-haspopup="menu" @click="$emit('menu')">
      <Icon icon="lucide:ellipsis-vertical" width="16" height="16" />
    </button>
    <div class="rc-head uo-head">
      <span class="uo-avatar" :class="`uo-avatar--${o?.role ?? 'other'}`">
        <img v-if="preview.avatar && !avatarBroken" :src="preview.avatar" :alt="preview.name" @error="avatarBroken = true" />
        <template v-else>{{ preview.initials || '?' }}</template>
      </span>
      <div class="uo-id">
        <span v-if="o" class="rc-pill">
          <Icon :icon="o.role === 'student' ? 'lucide:graduation-cap' : 'lucide:building-2'" width="12" height="12" />{{ o.roleLabel }}
        </span>
        <h2 class="rc-name">{{ preview.name }}</h2>
        <span v-if="o" class="rc-sub"><Icon icon="lucide:calendar" width="13" height="13" />Joined {{ o.joined }}</span>
      </div>
    </div>
  </div>

  <div v-if="o" class="rc-body">
    <template v-if="loading">
      <q-skeleton type="rect" height="34px" class="uo-skel-standing" />
      <section v-for="n in 3" :key="n" class="rc-sec">
        <div class="rc-sec-head"><q-skeleton type="text" width="90px" height="14px" /><q-skeleton type="text" width="80px" height="12px" /></div>
        <q-skeleton type="rect" :height="n === 2 ? '40px' : '30px'" class="uo-skel-block" />
      </section>
    </template>

    <template v-else>
      <div class="rc-standing" :class="`rc-standing--${standing.tone}`">
        <Icon :icon="standing.tone === 'ok' ? 'lucide:badge-check' : 'lucide:triangle-alert'" width="16" height="16" />
        <span class="rc-standing-title">{{ standing.title }}</span>
        <span class="rc-standing-sub">{{ standing.sub }}</span>
        <span v-if="standing.note" class="uo-standing-note">“{{ standing.note }}”</span>
      </div>

      <!-- Student ─────────────────────────────────────────────────────────── -->
      <template v-if="o.role === 'student'">
        <section class="rc-sec">
          <div class="rc-sec-head">
            <span class="rc-title">Current stay</span>
            <span v-if="o.placement?.since" class="rc-meta">since {{ fmtMonthYear(o.placement.since) }} · {{ tenure }}</span>
          </div>
          <button v-if="o.placement" type="button" class="uo-stay" :disabled="!o.placement.accommodationId" @click="goStay">
            <span class="uo-stay-icon"><Icon icon="lucide:house" width="16" height="16" /></span>
            <span class="uo-stay-text">
              <span class="uo-stay-name">{{ o.placement.accommodation }}</span>
              <span class="rc-meta">{{ o.placement.room }} · {{ o.placement.landlord }}</span>
            </span>
            <Icon v-if="o.placement.accommodationId" icon="lucide:chevron-right" width="15" height="15" class="uo-stay-go" />
          </button>
          <p v-else class="rc-note">Not placed in any accommodation.</p>
        </section>

        <section class="rc-sec">
          <div class="rc-sec-head">
            <span class="rc-title">Payments</span>
            <span class="rc-meta">{{ months.length ? `last ${months.length} month${months.length === 1 ? '' : 's'}` : '' }}</span>
          </div>
          <template v-if="months.length">
            <div class="uo-months" role="list">
              <div v-for="m in months" :key="m.key" class="uo-month" role="listitem" :title="`${m.label}: ${m.statusLabel}`">
                <span class="uo-month-bar" :class="`uo-pay--${m.tone}`"></span>
                <span class="uo-month-lbl">{{ m.short }}</span>
              </div>
            </div>
            <div class="uo-legend">
              <span v-for="l in payLegend" :key="l.tone"><i class="uo-sw" :class="`uo-pay--${l.tone}`"></i>{{ l.label }} <b>{{ l.count }}</b></span>
            </div>
          </template>
          <p v-else class="rc-note">No payments on record.</p>
        </section>

        <section v-if="o.academic" class="rc-sec">
          <div class="rc-sec-head"><span class="rc-title">Academic</span></div>
          <dl class="rc-facts">
            <div><dt>College</dt><dd :title="o.academic.college">{{ o.academic.college }}</dd></div>
            <div><dt>Program</dt><dd :title="o.academic.program">{{ o.academic.program }}</dd></div>
            <div><dt>Year level</dt><dd>{{ o.academic.yearLevel }}</dd></div>
            <div><dt>Student ID</dt><dd>{{ o.academic.studentId }}</dd></div>
          </dl>
        </section>
      </template>

      <!-- Landlord / landlady ─────────────────────────────────────────────── -->
      <template v-else-if="o.role === 'landlord'">
        <section class="rc-sec">
          <div class="rc-sec-head">
            <span class="rc-title">Accommodations</span>
            <span class="rc-meta">{{ portfolio.length }} · {{ portfolioTaken }} of {{ portfolioBeds }} beds taken</span>
          </div>
          <template v-if="portfolio.length">
            <button v-for="a in portfolio.slice(0, 4)" :key="a.id" type="button" class="uo-acc" @click="$emit('go-hub', 'accommodation', a.id)">
              <span class="uo-acc-name">{{ a.name }}</span>
              <span class="rc-track uo-acc-track"><span class="rc-fill" :style="{ width: a.beds ? `${(a.taken / a.beds) * 100}%` : '0%' }"></span></span>
              <span class="uo-acc-val">{{ a.taken }}/{{ a.beds }}</span>
            </button>
            <span v-if="portfolio.length > 4" class="rc-meta">+{{ portfolio.length - 4 }} more in the Accommodations tab</span>
          </template>
          <p v-else class="rc-note">No accommodations listed yet.</p>
        </section>

        <section class="rc-sec">
          <div class="rc-sec-head">
            <span class="rc-title">Responsiveness</span>
            <span v-if="o.campusResponseRate != null" class="rc-meta"><i class="rc-key"></i>campus {{ o.campusResponseRate }}%</span>
          </div>
          <div v-if="o.responseRate != null" class="uo-resp">
            <span class="rc-big">{{ o.responseRate }}%</span>
            <span class="rc-track uo-resp-track">
              <span class="rc-fill" :style="{ width: `${o.responseRate}%` }"></span>
              <span v-if="o.campusResponseRate != null" class="rc-mark" :style="{ left: `${o.campusResponseRate}%` }"></span>
            </span>
            <span class="rc-meta">avg reply {{ o.avgResponse || '—' }}</span>
          </div>
          <p v-else class="rc-note">No messages answered yet.</p>
        </section>
      </template>
    </template>
  </div>

  <footer v-if="o" class="rc-foot">
    <a v-if="o.email" class="rc-link" :href="`mailto:${o.email}`"><Icon icon="lucide:mail" width="13" height="13" /><span>{{ o.email }}</span></a>
    <a v-if="o.phone" class="rc-link" :href="`tel:${o.phone.replace(/[^\d+]/g, '')}`"><Icon icon="lucide:phone" width="13" height="13" /><span>{{ formatPhone(o.phone) }}</span></a>
    <span v-if="!o.email && !o.phone" class="rc-meta">No contact details on file.</span>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { formatPhone } from '@/utils/format'
import { fmtMonthYear, type DrawerPreview, type HubKind } from '../preview'
import { watchLine, type Tone } from '../accommodation/standing'

const props = defineProps<{ preview: DrawerPreview; loading?: boolean }>()
const emit = defineEmits<{ (e: 'menu'): void; (e: 'go-hub', kind: HubKind, id?: string): void }>()

const o = computed(() => props.preview.userOverview)
const avatarBroken = ref(false)
watch(() => props.preview.avatar, () => { avatarBroken.value = false })

function goStay() {
  const id = o.value?.placement?.accommodationId
  if (id) emit('go-hub', 'accommodation', id)
}

// ── Student ─────────────────────────────────────────────────────────────────
const tenure = computed(() => {
  const since = o.value?.placement?.since ? new Date(o.value.placement.since) : null
  if (!since || Number.isNaN(since.getTime())) return ''
  const now = new Date()
  const m = (now.getFullYear() - since.getFullYear()) * 12 + (now.getMonth() - since.getMonth())
  return m <= 0 ? 'new this month' : `${m} month${m === 1 ? '' : 's'}`
})

const PAY: Record<string, { tone: string; label: string }> = {
  paid: { tone: 'paid', label: 'Paid' },
  pending_verification: { tone: 'pending', label: 'Pending' },
  due: { tone: 'due', label: 'Due' },
  overdue: { tone: 'overdue', label: 'Overdue' },
}
/** The six most recent billing months, oldest first, one cell each. */
const months = computed(() => {
  const byMonth = new Map<string, { status: string; label: string }>()
  for (const p of props.preview.payments ?? []) {
    // Worst status wins when a month has more than one bill.
    const prev = byMonth.get(p.month)
    const rank = (s: string) => ['paid', 'pending_verification', 'due', 'overdue'].indexOf(s)
    if (!prev || rank(p.status) > rank(prev.status)) byMonth.set(p.month, { status: p.status, label: p.monthLabel })
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, v]) => {
      const meta = PAY[v.status] ?? { tone: 'due', label: v.status }
      return { key, label: v.label, short: v.label.split(' ')[0] ?? v.label, tone: meta.tone, statusLabel: meta.label }
    })
})
const payLegend = computed(() =>
  Object.values(PAY)
    .map((m) => ({ ...m, count: months.value.filter((x) => x.tone === m.tone).length }))
    .filter((m) => m.count),
)
const overdue = computed(() => (props.preview.payments ?? []).filter((p) => p.status === 'overdue').length)

// ── Landlord / landlady ─────────────────────────────────────────────────────
const portfolio = computed(() => o.value?.portfolio ?? [])
const portfolioBeds = computed(() => portfolio.value.reduce((n, a) => n + a.beds, 0))
const portfolioTaken = computed(() => portfolio.value.reduce((n, a) => n + a.taken, 0))

// ── Standing ────────────────────────────────────────────────────────────────
const RESTRICTED: Record<string, string> = { apply: 'room applications paused by OSAS', listings: 'listings hidden by OSAS' }

const standing = computed<{ tone: Tone; title: string; sub: string; note: string }>(() => {
  const u = o.value
  if (!u) return { tone: 'ok', title: '', sub: '', note: '' }
  const s = u.standing
  // The reason OSAS gave, shown while it still explains something.
  const note = s.reason && (u.status !== 'verified' || s.restrictions.length) ? s.reason : ''
  if (u.status === 'suspended') {
    const until = s.suspendedUntil ? `until ${fmtDay(s.suspendedUntil)}` : 'until OSAS reactivates it'
    return { tone: 'bad', title: 'Account suspended', sub: until, note }
  }
  if (u.status === 'rejected') return { tone: 'bad', title: 'New requirements requested', sub: 'Waiting for them to upload again', note }
  const watch: string[] = s.restrictions.map((r) => RESTRICTED[r] ?? r)
  const verified = u.status === 'verified'
  if (!verified) watch.push('account not yet verified')
  if (overdue.value) watch.push(`${overdue.value} overdue payment${overdue.value === 1 ? '' : 's'}`)
  if (u.role === 'landlord' && u.responseRate != null && u.campusResponseRate != null && u.responseRate < u.campusResponseRate - 10) {
    watch.push('response rate is below the campus average')
  }
  return {
    tone: s.restrictions.length ? 'bad' : watch.length ? 'warn' : 'ok',
    title: s.restrictions.length ? 'Restricted' : verified ? 'In good standing' : 'Awaiting verification',
    sub: watchLine(watch),
    note,
  }
})

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })
}
</script>

<style scoped src="../record/sections.css"></style>
<style scoped>
/* A person has no photo to show off, so their band grows with the panel's
   spare height only up to 240px, and gives way to 150px on a short window. */
.uo-band { flex: 1 1 auto; min-height: 150px; max-height: 240px; }
/* The reason OSAS gave, on its own line under the standing. */
.uo-standing-note { flex-basis: 100%; color: var(--ar-text); font-size: 11.5px; font-style: italic; overflow-wrap: anywhere; }
.uo-band--student { background: linear-gradient(135deg, #c5cae9 0%, #7986cb 55%, #3f51b5 100%); }
.uo-band--landlord { background: linear-gradient(135deg, #a9c2bb 0%, #4f8a80 55%, #0f766e 100%); }
.uo-band--other { background: linear-gradient(135deg, var(--ar-soft) 0%, var(--ar-border) 100%); }
.uo-head { flex-direction: row; align-items: flex-end; gap: 14px; }
.uo-id { display: flex; flex-direction: column; align-items: flex-start; gap: 5px; min-width: 0; }
.uo-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  overflow: hidden;
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--ar-surface), 0 2px 10px rgba(0, 0, 0, 0.15);
  font-size: 22px;
  font-weight: 700;
}
.uo-avatar img { width: 100%; height: 100%; object-fit: cover; }
.uo-avatar--student { background: #e8eaf6; color: #3949ab; }
.uo-avatar--landlord, .uo-avatar--other { background: var(--ar-accent-soft); color: var(--ar-accent); }

.uo-skel-standing { margin-top: 6px; border-radius: 9px; }
.uo-skel-block { border-radius: 6px; }

.uo-stay {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--ar-border);
  border-radius: 8px;
  background: var(--ar-surface);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.uo-stay:disabled { cursor: default; }
.uo-stay:not(:disabled):hover { border-color: var(--ar-accent-line); }
.uo-stay:focus-visible { outline: 2px solid var(--ar-accent); outline-offset: 2px; }
.uo-stay-icon { display: flex; flex-shrink: 0; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--ar-accent-soft); color: var(--ar-accent); }
.uo-stay-text { display: flex; flex: 1; flex-direction: column; gap: 1px; min-width: 0; }
.uo-stay-name { overflow: hidden; color: var(--ar-ink); font-size: 13px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.uo-stay-go { flex-shrink: 0; color: var(--ar-muted); }

/* Payments: one column per billing month, coloured by how it stands. */
.uo-months { display: flex; gap: 6px; }
.uo-month { display: flex; flex: 1; flex-direction: column; align-items: center; gap: 3px; }
.uo-month-bar { width: 100%; height: 22px; border-radius: 4px; }
.uo-month-lbl { color: var(--ar-muted); font-size: 10.5px; }
.uo-pay--paid { background: color-mix(in srgb, var(--c-success) 70%, var(--ar-surface)); }
.uo-pay--pending { background: color-mix(in srgb, var(--c-warning) 35%, var(--ar-surface)); }
.uo-pay--due { background: var(--c-warning); }
.uo-pay--overdue { background: var(--c-danger); }
.uo-legend { display: flex; flex-wrap: wrap; gap: 12px; }
.uo-legend span { display: inline-flex; align-items: center; gap: 5px; color: var(--ar-text); font-size: 11px; }
.uo-legend b { color: var(--ar-ink); }
.uo-sw { width: 9px; height: 9px; border-radius: 2px; }

/* Landlord portfolio: one bar per accommodation, beds taken of capacity. */
.uo-acc {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) 40px;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 3px 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.uo-acc:hover .uo-acc-name { color: var(--ar-accent); text-decoration: underline; }
.uo-acc:focus-visible { outline: 2px solid var(--ar-accent); outline-offset: 2px; border-radius: 4px; }
.uo-acc-name { overflow: hidden; color: var(--ar-ink); font-size: 12.5px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.uo-acc-val { color: var(--ar-text); font-size: 11.5px; font-variant-numeric: tabular-nums; text-align: right; }
.uo-resp { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; }
</style>
