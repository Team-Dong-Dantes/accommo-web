<template>
  <nav class="ar" aria-label="Filter audit events">
    <div class="ar-label">Areas</div>
    <button type="button" class="ar-item" :class="{ 'is-on': !area }" @click="area = null">
      <Icon icon="lucide:layers" width="15" height="15" class="ar-ic" />
      <span class="ar-name">All areas</span>
      <span class="ar-count">{{ total }}</span>
    </button>
    <button
      v-for="a in areas"
      :key="a"
      type="button"
      class="ar-item"
      :class="{ 'is-on': area === a }"
      :disabled="!areaCounts[a] && area !== a"
      @click="area = area === a ? null : a"
    >
      <Icon :icon="AREA_ICON[a]" width="15" height="15" class="ar-ic" />
      <span class="ar-name">{{ AREA_LABEL[a] }}</span>
      <span class="ar-count">{{ areaCounts[a] ?? 0 }}</span>
    </button>

    <div class="ar-label q-mt-md">People</div>
    <label class="ar-search">
      <Icon icon="lucide:search" width="14" height="14" class="ar-ic" />
      <input v-model="query" type="search" placeholder="Find a person" aria-label="Find a person" />
    </label>
    <button type="button" class="ar-item" :class="{ 'is-on': !person }" @click="person = null">
      <Icon icon="lucide:users" width="15" height="15" class="ar-ic" />
      <span class="ar-name">Everyone</span>
    </button>

    <template v-for="group in groups" :key="group.label">
      <div v-if="group.list.length" class="ar-sub">{{ group.label }}</div>
      <button
        v-for="p in group.list"
        :key="p.key"
        type="button"
        class="ar-item"
        :class="{ 'is-on': person === p.key }"
        @click="person = person === p.key ? null : p.key"
      >
        <q-avatar size="20px" font-size="10px" :color="p.color" text-color="white" class="ar-av text-weight-bold">
          <Icon v-if="p.isSystem" icon="lucide:server" width="11" height="11" />
          <span v-else>{{ p.initials || p.name.slice(0, 1) }}</span>
        </q-avatar>
        <span class="ar-name">{{ p.name }}</span>
        <span class="ar-count">{{ p.count }}</span>
      </button>
    </template>
    <div v-if="query && !groups.some((g) => g.list.length)" class="ar-empty">No one matches “{{ query }}”.</div>
    <button v-if="!query && people.length > LIMIT" type="button" class="ar-more" @click="expanded = !expanded">
      {{ expanded ? 'Show fewer' : `Show all ${people.length}` }}
    </button>

    <div class="ar-foot">
      <q-toggle v-model="automated" dense size="sm" color="primary" label="Automated events" />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { AREA_LABEL, type AuditArea } from './logMapping'

export type RailPerson = { key: string; name: string; initials: string; color: string; isSystem: boolean; count: number }

const props = defineProps<{
  total: number
  areaCounts: Partial<Record<AuditArea, number>>
  /** Every admin account, including those with nothing in the window. */
  admins: RailPerson[]
  /** Everyone else who appears in the events, most active first. */
  people: RailPerson[]
}>()

const area = defineModel<AuditArea | null>('area', { default: null })
const person = defineModel<string | null>('person', { default: null })
const automated = defineModel<boolean>('automated', { default: false })

const LIMIT = 8
const expanded = ref(false)
const query = ref('')

const matches = (p: RailPerson) => p.name.toLowerCase().includes(query.value.trim().toLowerCase())

// A search shows every match; otherwise the other people collapse to the top few.
const groups = computed(() => [
  { label: 'Admins', list: props.admins.filter(matches) },
  { label: 'Others', list: query.value.trim() ? props.people.filter(matches) : shownPeople.value },
])
const areas = Object.keys(AREA_LABEL) as AuditArea[]

const AREA_ICON: Record<AuditArea, string> = {
  accounts: 'lucide:user-round',
  accommodations: 'lucide:house',
  payments: 'lucide:wallet',
  tickets: 'lucide:life-buoy',
  announcements: 'lucide:megaphone',
  verification: 'lucide:shield-check',
  other: 'lucide:ellipsis',
}

// Keep the selected person visible even when they fall outside the top few.
const shownPeople = computed(() => {
  if (expanded.value) return props.people
  const top = props.people.slice(0, LIMIT)
  const sel = props.people.find((p) => p.key === person.value)
  return sel && !top.includes(sel) ? [...top, sel] : top
})
</script>

<style scoped>
.ar {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 12px 10px;
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid var(--c-border);
}
.ar-label {
  padding: 4px 8px 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--c-muted);
}
.ar-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--c-ink);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.ar-item:hover:not(:disabled) { background: var(--c-surface-2); }
.ar-item:disabled { opacity: 0.45; cursor: default; }
.ar-item:focus-visible { outline: 2px solid var(--c-primary); outline-offset: -2px; }
.ar-item.is-on { background: var(--c-primary-soft); color: var(--c-primary); font-weight: 600; }
.ar-ic { flex: none; color: var(--c-muted); }
.ar-item.is-on .ar-ic { color: var(--c-primary); }
.ar-av { flex: none; border-radius: 6px; }
.ar-name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-count {
  flex: none;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--c-muted);
}
.ar-search {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 2px 6px;
  padding: 6px 9px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: var(--c-surface);
}
.ar-search:focus-within { border-color: var(--c-primary); }
.ar-search input {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--c-ink);
  font: inherit;
  font-size: 13px;
}
.ar-sub {
  padding: 8px 8px 3px;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-muted);
}
.ar-empty {
  padding: 6px 8px;
  font-size: 12px;
  color: var(--c-muted);
}
.ar-more {
  align-self: flex-start;
  margin: 2px 0 0 8px;
  padding: 2px 0;
  border: 0;
  background: none;
  color: var(--c-primary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.ar-foot {
  margin-top: auto;
  padding: 12px 8px 2px;
  border-top: 1px solid var(--c-border);
  font-size: 13px;
}
</style>
