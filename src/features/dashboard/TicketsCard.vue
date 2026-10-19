<template>
  <DashCard
    icon="lucide:life-buoy"
    title="Needs a reply"
    tone="work"
    :summary="summary"
    :link="{ to: '/support-tickets', label: 'Support tickets' }"
  >
    <template v-if="t">
      <!-- The board's lanes: who owes the next move, read off the conversation. -->
      <div class="dc-sec">
        <div v-if="bands.length" class="dc-band" role="img" :aria-label="bandLabel">
          <span v-for="band in bands" :key="band.label" :class="band.cls" :style="{ flexGrow: band.value }">
            <b>{{ band.value }}</b><em>{{ band.label }}</em>
          </span>
        </div>
        <p v-else class="none">No open tickets.</p>
      </div>

      <ul v-if="t.rows.length" class="dc-rows rows">
        <li v-for="row in t.rows" :key="row.id" class="dc-row">
          <span class="dc-row-main" :title="`${row.subject} · ${row.reporter}`">{{ row.subject }}<em>{{ row.reporter }}</em></span>
          <span v-if="row.mine" class="mine">Yours</span>
          <span class="dc-row-meta" :class="{ 'is-late': row.overdue }">{{ waited(row.waitingSince) }}</span>
          <router-link :to="`/support-tickets?focus=ticket:${row.id}`" class="dc-row-act">Reply</router-link>
        </li>
      </ul>
      <p v-else class="dc-empty">Every requester has an answer.</p>
    </template>
    <p v-else class="dc-empty">Support tickets could not be loaded.</p>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashCard from './DashCard.vue'
import type { DashboardStats } from '@/types/dashboard'

const props = defineProps<{ data: DashboardStats }>()

const t = computed(() => props.data.tickets)

const bands = computed(() => [
  { label: 'New', value: t.value?.new ?? 0, cls: '' },
  { label: 'Needs reply', value: t.value?.needsReply ?? 0, cls: '' },
  { label: 'Waiting on requester', value: t.value?.waiting ?? 0, cls: 'is-good' },
].filter((band) => band.value > 0))
const bandLabel = computed(() => bands.value.map((b) => `${b.label}: ${b.value}`).join(', '))

/** How long the requester has waited on OSAS. */
function waited(since: string) {
  const hours = Math.floor((Date.now() - new Date(since).getTime()) / 3_600_000)
  return hours < 24 ? `${Math.max(hours, 0)}h` : `${Math.floor(hours / 24)}d`
}

const summary = computed(() => {
  if (!t.value) return ''
  const owed = t.value.new + t.value.needsReply
  if (owed === 0) return 'No one is waiting on OSAS.'
  const base = `${owed} waiting on OSAS`
  return t.value.overdue ? `${base}, ${t.value.overdue} for over 48 hours` : base
})
</script>

<style scoped>
.none { margin: 0; color: var(--c-muted); font-size: var(--fs-xs); }
.rows { flex: 1; }
.dc-row-main em {
  margin-left: var(--sp-2);
  color: var(--c-muted);
  font-size: var(--fs-xs);
  font-style: normal;
  font-weight: 400;
}
.mine {
  flex: none;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-size: 10px;
  font-weight: 700;
}
</style>
