<template>
  <div class="pp">
    <div class="pp-bar">
      <button type="button" class="pp-back" @click="$emit('back')">
        <Icon icon="lucide:chevron-left" width="16" height="16" />{{ backLabel }}
      </button>
    </div>

    <div class="pp-head">
      <span class="pp-av" :class="avatarClass">
        <img v-if="avatarUrl && !avatarBroken" :src="avatarUrl" :alt="name" @error="avatarBroken = true" />
        <template v-else>{{ initials || '?' }}</template>
      </span>
      <div class="pp-id">
        <div class="pp-name">{{ name }}</div>
        <div class="pp-role">{{ target.roleLine }}</div>
      </div>
      <button type="button" class="pp-all" @click="viewAll">
        View all<Icon icon="lucide:external-link" width="14" height="14" />
      </button>
    </div>

    <template v-if="loading">
      <q-skeleton v-for="n in 3" :key="n" type="rect" height="96px" class="pp-skel" />
    </template>
    <div v-else-if="failed" class="pp-error">Could not load this person's details.</div>
    <div v-for="s in sections" v-else :key="s.title" class="pp-sec">
      <div class="pp-sec-head">{{ s.title }}</div>
      <div class="pp-grid">
        <div v-for="r in s.rows" :key="r.label" class="pp-cell">
          <span class="pp-lbl">{{ r.label }}</span>
          <span class="pp-val">{{ r.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { fetchPersonSummary, type PersonSummary } from '@/api/users'
import { fmtDate, getInitialsWide, humanizeEnum } from '@/utils/format'
import type { PersonTarget } from '../preview'

const props = defineProps<{ target: PersonTarget; backLabel: string }>()
defineEmits<{ (e: 'back'): void }>()

const router = useRouter()
const person = ref<PersonSummary | null>(null)
const loading = ref(false)
const failed = ref(false)
const avatarBroken = ref(false)

watch(
  () => props.target.userId,
  async (id) => {
    person.value = null
    failed.value = false
    avatarBroken.value = false
    loading.value = true
    try {
      person.value = await fetchPersonSummary(id, props.target.role)
      if (!person.value) failed.value = true
    } catch {
      failed.value = true
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

const name = computed(() => person.value?.fullName || props.target.name)
const initials = computed(() => props.target.initials || getInitialsWide(name.value))
const avatarUrl = computed(() => person.value?.avatarUrl || props.target.avatarUrl || '')
const avatarClass = computed(() =>
  props.target.role === 'landlord' ? 'pp-av--l' : props.target.gender === 'female' ? 'pp-av--f' : 'pp-av--m',
)

const v = (x: string | number | null | undefined) => (x == null || x === '' ? '—' : String(x))
const sexLabel = (s: string | null) => (s === 'F' ? 'Female' : s === 'M' ? 'Male' : '—')

const sections = computed(() => {
  const p = person.value
  if (!p) return []
  const out: { title: string; rows: { label: string; value: string }[] }[] = [
    {
      title: 'Personal',
      rows: [
        { label: 'Sex', value: sexLabel(p.sex) },
        { label: 'Birthdate', value: fmtDate(p.dateOfBirth) },
        { label: 'Contact number', value: v(p.phone) },
        { label: 'Email', value: v(p.email) },
      ],
    },
  ]
  if (p.student) {
    out.push({
      title: 'Academic',
      rows: [
        { label: 'Student ID', value: v(p.student.studentId) },
        { label: 'College', value: v(p.student.college) },
        { label: 'Program', value: v(p.student.program) },
        { label: 'Year level', value: v(p.student.yearLevel) },
      ],
    })
  }
  const stay = props.target.stay
  if (stay) {
    out.push({
      title: 'Stay',
      rows: [
        { label: 'Room', value: stay.floor != null && stay.floor !== '' ? `${stay.room} · Floor ${stay.floor}` : stay.room },
        { label: 'Moved in', value: v(stay.since) },
      ],
    })
  }
  if (p.student) {
    const ec = p.student.emergencyContact
    out.push({
      title: 'Emergency contact',
      rows: [
        { label: 'Name', value: v(ec?.name) },
        { label: 'Relationship', value: v(ec?.relationship) },
        { label: 'Contact number', value: v(ec?.phone) },
      ],
    })
  }
  out.push({
    title: 'Account',
    rows: [
      { label: 'Status', value: humanizeEnum(p.status) || '—' },
      { label: 'Registered', value: fmtDate(p.registeredAt) },
      ...(p.landlord
        ? [{ label: 'Response rate', value: p.landlord.responseRate != null ? `${p.landlord.responseRate}%` : '—' }]
        : []),
    ],
  })
  return out
})

function viewAll() {
  void router.push({ path: '/users', query: { user: props.target.userId } })
}
</script>

<style scoped>
.pp { display: flex; flex-direction: column; gap: 16px; }
.pp-bar {
  position: sticky;
  /* Pinned to the panel's top edge, over the scroller's 20px padding, so
     nothing scrolls visibly above it. */
  top: -20px;
  z-index: 3;
  margin: -20px -20px 0;
  padding: 16px 20px 10px;
  border-bottom: 1px solid var(--ar-border);
  background: var(--ar-surface);
}
.pp-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  border: none;
  background: none;
  color: var(--ar-text);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.pp-back:hover { color: var(--ar-accent); }
.pp-head { display: flex; align-items: center; gap: 14px; }
.pp-av {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 50%;
  font-size: 18px;
  font-weight: 700;
}
.pp-av img { width: 100%; height: 100%; object-fit: cover; }
.pp-av--m { background: color-mix(in srgb, var(--ar-male) 16%, var(--ar-surface)); color: color-mix(in srgb, var(--ar-male) 70%, #000); }
.pp-av--f { background: color-mix(in srgb, var(--ar-female) 14%, var(--ar-surface)); color: color-mix(in srgb, var(--ar-female) 75%, #000); }
.pp-av--l { background: var(--ar-accent-soft); color: var(--ar-accent); }
.pp-id { flex: 1; min-width: 0; }
.pp-name { color: var(--ar-ink); font-family: var(--font-display); font-size: 22px; font-weight: 700; line-height: 1.15; }
.pp-role { margin-top: 3px; color: var(--ar-text); font-size: 12.5px; }
.pp-all {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--ar-accent-line);
  border-radius: 8px;
  background: var(--ar-surface);
  color: var(--ar-accent);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.pp-all:hover { background: var(--ar-accent-soft); }
.pp-skel { border-radius: 10px; }
.pp-error { color: var(--ar-muted); font-size: 13px; }
.pp-sec { overflow: hidden; border: 1px solid var(--ar-border); border-radius: 10px; }
.pp-sec-head {
  padding: 9px 14px;
  border-bottom: 1px solid var(--ar-border);
  background: var(--ar-soft);
  color: var(--ar-muted);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pp-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: -1px; }
.pp-cell { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding: 10px 14px; border-bottom: 1px solid var(--ar-border); }
.pp-lbl { color: var(--ar-muted); font-size: 11px; }
.pp-val { overflow-wrap: anywhere; color: var(--ar-ink); font-size: 13px; font-weight: 500; }
</style>
