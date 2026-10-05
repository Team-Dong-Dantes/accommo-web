<template>
  <!-- The drawer's Activity tab: the ticket's own audit trail, each entry
       clickable for its full detail (changes, device). -->
  <div class="tw-activity">
    <div v-if="loading" class="text-muted" style="font-size: 13px">Loading…</div>
    <ActivityFeed v-else :items="items" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ActivityFeed from '@/features/drawer/ActivityFeed.vue'
import type { PreviewActivity } from '@/features/drawer/preview'
import { fetchRecordAudit } from '@/api/audit'
import { getActionColor, type AuditEvent } from '@/features/audit/logMapping'
import { getStatus } from '@/utils/status.config'
import { escapeHtml, formatDateTime } from '@/utils/format'
import type { Ticket } from '@/composables/useTickets'

const props = defineProps<{ ticket: Ticket }>()

const items = ref<PreviewActivity[]>([])
const loading = ref(true)

function line(ev: AuditEvent): PreviewActivity {
  const base = { time: formatDateTime(new Date(ev.at).toISOString()), ts: ev.at, logId: ev.id, by: ev.actor.name }
  const status = ev.changes.find((c) => c.key === 'status')
  if (ev.action === 'CREATE') {
    return { ...base, text: 'Ticket reported', icon: 'lucide:ticket', tone: 'info', kind: 'Reported' }
  }
  if (status) {
    // diffRows humanizes enum values ("In progress"); getStatus wants the key.
    const s = getStatus(status.new.toLowerCase().replace(/ /g, '_'))
    return { ...base, text: `Status set to <strong>${escapeHtml(status.new)}</strong>`, icon: s.icon || 'lucide:circle-dot', tone: s.tone, kind: 'Status' }
  }
  if (ev.changes.some((c) => c.key === 'assignee_id')) {
    return { ...base, text: 'Assignment changed', icon: 'lucide:user-check', tone: 'success', kind: 'Assignment' }
  }
  const fields = ev.changes.map((c) => c.field.toLowerCase()).join(', ')
  return { ...base, text: fields ? `Updated ${escapeHtml(fields)}` : escapeHtml(ev.sentence), icon: 'lucide:pencil', tone: getActionColor(ev), kind: 'Edits' }
}

watch(() => [props.ticket.id, props.ticket.updatedAt], async () => {
  loading.value = true
  try {
    items.value = (await fetchRecordAudit(['tickets'], props.ticket.id)).map(line)
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.tw-activity { padding: var(--sp-5); }
</style>
