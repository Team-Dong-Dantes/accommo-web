<template>
  <!-- The drawer's Activity tab. Was the lower half of the old window's left
       sidebar; the Overview half (status, priority, Resolve) moved into the
       drawer header, where it is reachable from every tab. -->
  <div class="tw-activity">
    <div class="rd-timeline">
      <div class="tl-item intro-x" v-for="(a, ai) in activityItems" :key="ai">
        <div class="tl-rail">
          <span class="tl-icon" :style="activityIconStyle(a)"><Icon :icon="a.icon || 'lucide:circle'" width="16" height="16" /></span>
          <span v-if="ai < activityItems.length - 1" class="tl-line"></span>
        </div>
        <div class="tl-body">
          <div class="tl-text">{{ a.text }}</div>
          <div v-if="a.time" class="tl-time">{{ a.time }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { getStatus, toneVar } from '@/utils/status.config'
import { getTimeAgo, formatDateTime } from '@/utils/format'
import type { Ticket } from '@/composables/useTickets'
import { stLabel } from './types'

const props = defineProps<{ ticket: Ticket }>()

const activityItems = computed(() => {
  const t = props.ticket
  const s = getStatus(t.status)
  return [
    { icon: s.icon || 'lucide:circle', text: `Status set to ${stLabel(t.status)}`, time: getTimeAgo(t.updatedAt), tone: s.tone },
    { icon: 'lucide:user-check', text: t.assignee ? `Assigned to ${t.assignee}` : 'Awaiting assignment', time: getTimeAgo(t.updatedAt), tone: t.assignee ? 'success' : 'warning' },
    { icon: 'lucide:ticket', text: 'Ticket reported', time: formatDateTime(t.reportedAt), tone: 'info' },
  ]
})

function activityIconStyle(a: { tone?: string }) {
  const base = toneVar(a.tone)
  return {
    background: `color-mix(in srgb, ${base} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${base} 34%, transparent)`,
    color: base,
  }
}
</script>

<style scoped>
.tw-activity { padding: var(--sp-5); }
.rd-timeline { display: flex; flex-direction: column; }
.tl-item { display: flex; gap: 12px; position: relative; }
.tl-rail { position: relative; flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; padding-top: 2px; }
.tl-icon {
  width: 32px; height: 32px; border-radius: 50%; border: 1px solid;
  display: flex; align-items: center; justify-content: center; flex: 0 0 auto; z-index: 2;
}
.tl-line { position: absolute; top: 36px; bottom: -12px; width: 1.5px; background: var(--c-border); z-index: 1; }
.tl-body { flex: 1 1 auto; min-width: 0; padding: 5px 0 18px; }
.tl-text { font-size: 13.5px; font-weight: 600; line-height: 1.45; color: var(--c-ink); }
.tl-time { font-size: 11.5px; color: var(--c-muted); margin-top: 3px; }
.tl-item.intro-x { animation: tl-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both; }
.tl-item.intro-x:nth-child(2) { animation-delay: 0.04s; }
.tl-item.intro-x:nth-child(3) { animation-delay: 0.08s; }
@keyframes tl-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

</style>
