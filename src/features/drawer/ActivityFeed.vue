<template>
  <TabEmptyState
    v-if="!items.length"
    icon="lucide:history"
    title="No activity"
    message="Nothing has happened here yet that we keep a record of."
  />

  <div v-else class="af" :class="{ 'af--dense': dense }">
    <div v-if="toolbar" class="af-tools">
      <SearchInput v-model="search" placeholder="Search activity..." class="af-search" style="width: auto" />
      <FilterDropdown
        v-if="filterGroups.length"
        v-model:active-filters="active"
        :filters="filterGroups"
        @clear="active = {}"
      />
    </div>

    <div v-if="!shown.length" class="af-none text-muted">No activity matches.</div>
    <button
      v-for="(a, i) in shown"
      :key="a.logId ?? i"
      type="button"
      class="af-item"
      :aria-label="`Show details: ${plain(a.text)}`"
      @click="open(a)"
    >
      <div class="af-rail">
        <span class="af-icon" :style="activityIconStyle(a)">
          <Icon :icon="a.icon || 'lucide:circle'" :width="dense ? 14 : 17" :height="dense ? 14 : 17" />
        </span>
        <span v-if="i < shown.length - 1" class="af-line"></span>
      </div>
      <div class="af-body">
        <!-- Built by each record's builder with every spliced value escaped. -->
        <div class="af-text" v-html="a.text"></div>
        <div class="af-time">
          {{ a.time }}<template v-if="a.by"> · {{ a.by }}</template>
        </div>
      </div>
      <Icon icon="lucide:chevron-right" width="16" height="16" class="af-chev" />
    </button>
  </div>

  <AuditDrawer :event="selected" @close="selected = null" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import TabEmptyState from './TabEmptyState.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import FilterDropdown from '@/components/ui/FilterDropdown.vue'
import AuditDrawer from '@/features/audit/AuditDrawer.vue'
import { activityIconStyle, type PreviewActivity } from './preview'
import { fetchAuditEvent } from '@/api/audit'
import type { AuditEvent } from '@/features/audit/logMapping'
import { useNotify } from '@/utils/notify'
import { errorMessage } from '@/utils/errors'

const props = withDefaults(defineProps<{ items: PreviewActivity[]; dense?: boolean; toolbar?: boolean }>(), {
  dense: false,
  toolbar: true,
})

const notify = useNotify()
const search = ref('')
const active = ref<Record<string, string[]>>({})
const selected = ref<AuditEvent | null>(null)

function plain(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
}

const uniq = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))]
const opts = (xs: string[]) => xs.map((x) => ({ label: x, value: x }))
// A group with a single option filters nothing, so it isn't offered.
const filterGroups = computed(() => [
  { key: 'kind', label: 'Type', options: opts(uniq(props.items.map((a) => a.kind))) },
  { key: 'by', label: 'By', options: opts(uniq(props.items.map((a) => a.by)).sort()) },
].filter((g) => g.options.length > 1))

const shown = computed(() => {
  const q = (search.value ?? '').trim().toLowerCase()
  const kinds = active.value.kind ?? []
  const people = active.value.by ?? []
  return props.items.filter((a) =>
    (!kinds.length || kinds.includes(a.kind ?? ''))
    && (!people.length || people.includes(a.by ?? ''))
    && (!q || [plain(a.text), a.by, a.kind, a.time].join(' ').toLowerCase().includes(q)))
})

async function open(a: PreviewActivity) {
  if (a.logId) {
    try {
      selected.value = await fetchAuditEvent(a.logId)
    } catch (e) {
      notify.error(errorMessage(e, 'Could not load this activity'))
    }
    return
  }
  // Lines read from a record's own dates (uploads, move-ins, ratings) have no audit entry.
  selected.value = {
    id: '', at: a.ts ?? 0, dayKey: '', time: a.time, action: '',
    actor: { key: '', name: a.by ?? '—', initials: '', role: '', color: '', isSystem: false },
    verb: a.kind ?? 'Activity', entityLabel: '', name: '', sentence: plain(a.text), hint: '',
    changes: [], noop: false, area: 'other', link: null, entityId: '', ip: '—', userAgent: '—',
  }
}
</script>

<style scoped>
.af { display: flex; flex-direction: column; }
.af-tools { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.af-search { flex: 1 1 auto; min-width: 0; }
.af-none { font-size: 13px; padding: 8px 0; }

.af-item {
  display: flex;
  gap: 12px;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  padding: 0 6px;
  margin: 0 -6px;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.af-item:hover { background: var(--c-surface-2); }
.af-item:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 1px; }
.af-rail { position: relative; flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; padding-top: 2px; }
.af-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.af-line { position: absolute; top: 42px; bottom: -2px; width: 1px; background: var(--c-border); z-index: 1; }
.af-body { flex: 1 1 auto; min-width: 0; padding: 4px 0 16px; }
.af-text { font-size: 13.5px; line-height: 1.45; color: var(--c-ink); }
.af-text :deep(strong) { font-weight: 700; color: var(--c-ink); }
.af-time { font-size: 11.5px; color: var(--c-muted); margin-top: 3px; }
.af-chev { align-self: center; color: var(--c-muted); flex-shrink: 0; opacity: 0; transition: opacity 0.15s; }
.af-item:hover .af-chev, .af-item:focus-visible .af-chev { opacity: 1; }

.af--dense .af-icon { width: 28px; height: 28px; border-radius: 8px; }
.af--dense .af-line { top: 32px; }
.af--dense .af-text { font-size: 13px; }
.af--dense .af-body { padding-bottom: 12px; }
/* Inside the accommodation record, follow its own palette. */
.af--dense .af-text { color: var(--ar-ink, var(--c-ink)); }
.af--dense .af-time { color: var(--ar-muted, var(--c-muted)); }
.af--dense .af-line { background: var(--ar-border, var(--c-border)); }
</style>
