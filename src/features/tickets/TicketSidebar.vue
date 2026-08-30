<template>
  <aside class="tw-side">
    <div class="tw-side-meta">
      <section class="overview-panel" aria-labelledby="ticket-overview-title">
        <h2 id="ticket-overview-title" class="side-sec-title">Overview</h2>

        <div class="overview-details">
          <div class="ov-grid">
            <div class="ov-cell">
              <span class="ov-cap">Status</span>
              <q-btn unelevated no-caps padding="none" class="chip-trigger" :ripple="false">
                <BadgePill :tone="getStatus(ticket.status).tone" :icon="getStatus(ticket.status).icon ?? ''" :label="stLabel(ticket.status)" />
                <Icon icon="mdi:chevron-down" width="14" height="14" class="chip-caret" />
                <q-menu anchor="bottom left" self="top left" class="chip-menu">
                  <button v-for="o in STATUS_OPTS" :key="o.value" class="pop-item" :class="{ 'is-active': ticket.status === o.value }" @click="$emit('update:status', o.value)">
                    <span class="pop-dot" :style="{ background: toneVar(getStatus(o.value).tone) }"></span>{{ o.label }}
                  </button>
                </q-menu>
              </q-btn>
            </div>

            <div class="ov-cell">
              <span class="ov-cap">Priority</span>
              <q-btn unelevated no-caps padding="none" class="chip-trigger" :ripple="false">
                <BadgePill :tone="getStatus(ticket.priority).tone" :icon="getStatus(ticket.priority).icon ?? ''" :label="stLabel(ticket.priority)" />
                <Icon icon="mdi:chevron-down" width="14" height="14" class="chip-caret" />
                <q-menu anchor="bottom left" self="top left" class="chip-menu">
                  <button v-for="o in PRIORITY_OPTS" :key="o.value" class="pop-item" :class="{ 'is-active': ticket.priority === o.value }" @click="$emit('update:priority', o.value)">
                    <span class="pop-dot" :style="{ background: toneVar(getStatus(o.value).tone) }"></span>{{ o.label }}
                  </button>
                </q-menu>
              </q-btn>
            </div>
          </div>

          <div class="ov-assignee">
            <span class="ov-cap">Assignee</span>
            <div class="assignee">
              <span class="assignee-av">{{ assigneeInitials }}</span>
              <span class="assignee-name">{{ ticket.assignee || 'Unassigned' }}</span>
            </div>
          </div>
        </div>

        <button class="btn-resolve" v-if="ticket.status !== 'resolved'" @click="$emit('resolve')"><Icon icon="mdi:check-circle-outline" width="18" height="18" /> Resolve</button>
        <span class="resolved-tag" v-else><Icon icon="mdi:check-circle" width="18" height="18" /> Resolved</span>
      </section>

      <div class="rd-section">
        <div class="rd-activity-head">Activity</div>
        <div class="rd-timeline">
          <div class="tl-item intro-x" v-for="(a, ai) in activityItems" :key="ai">
            <div class="tl-rail">
              <span class="tl-icon" :style="activityIconStyle(a)"><Icon :icon="a.icon || 'mdi:circle'" width="16" height="16" /></span>
              <span v-if="ai < activityItems.length - 1" class="tl-line"></span>
            </div>
            <div class="tl-body">
              <div class="tl-text">{{ a.text }}</div>
              <div v-if="a.time" class="tl-time">{{ a.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { getStatus, toneVar } from '@/utils/status.config'
import { getTimeAgo, formatDateTime } from '@/utils/format'
import BadgePill from '@/components/user/BadgePill.vue'
import type { Ticket } from '@/composables/useTickets'
import { STATUS_OPTS, PRIORITY_OPTS, stLabel } from './types'

const props = defineProps<{ ticket: Ticket }>()

defineEmits<{
  (e: 'update:status', value: string): void
  (e: 'update:priority', value: string): void
  (e: 'resolve'): void
}>()

const assigneeInitials = computed(() => {
  const a = props.ticket.assignee
  if (!a) return '?'
  return a.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
})

const activityItems = computed(() => {
  const t = props.ticket
  const s = getStatus(t.status)
  return [
    { icon: s.icon || 'mdi:circle', text: `Status set to ${stLabel(t.status)}`, time: getTimeAgo(t.updatedAt), tone: s.tone },
    { icon: 'mdi:account-check', text: t.assignee ? `Assigned to ${t.assignee}` : 'Awaiting assignment', time: getTimeAgo(t.updatedAt), tone: t.assignee ? 'success' : 'warning' },
    { icon: 'mdi:ticket-outline', text: 'Ticket reported', time: formatDateTime(t.reportedAt), tone: 'info' },
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
.tw-side {
  position: absolute;
  top: var(--sp-6);
  left: var(--sp-6);
  bottom: var(--sp-6);
  width: 320px;
  border-radius: var(--radius);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow-sm);
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  overflow-y: auto;
  z-index: 1;
}
.tw-side-meta { display: flex; flex-direction: column; gap: var(--sp-5); }
.overview-panel { display: flex; flex-direction: column; gap: var(--sp-3); }
.side-sec-title { margin: 0; font-family: var(--font-display); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-muted); padding: 0 2px; }
.overview-details { overflow: hidden; border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-surface-2); }
.ov-grid { display: grid; grid-template-columns: 1fr 1fr; }
.ov-cell { display: flex; flex-direction: column; gap: 7px; min-width: 0; padding: var(--sp-3); }
.ov-cell + .ov-cell { border-left: 1px solid var(--c-border); }
.ov-cap { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted); }
.ov-assignee { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); padding: var(--sp-3); border-top: 1px solid var(--c-border); background: var(--c-surface); }
.overview-panel .btn-resolve { width: 100%; justify-content: center; }
.overview-panel .resolved-tag { width: 100%; justify-content: center; }

.tw-side { scrollbar-width: thin; scrollbar-color: var(--c-border-strong) transparent; }
.tw-side::-webkit-scrollbar { width: 8px; }
.tw-side::-webkit-scrollbar-thumb { background: var(--c-border-strong); border-radius: 999px; }
.tw-side::-webkit-scrollbar-track { background: transparent; }

.chip-trigger {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  align-self: flex-start;
  background: transparent;
  font-weight: 600;
}
.chip-caret { color: var(--c-muted); margin-left: 2px; transition: transform var(--t-fast); }
.chip-trigger:hover .chip-caret { color: var(--c-ink); }
.chip-menu { box-shadow: var(--shadow-lg); border-radius: var(--card-radius); padding: 6px; min-width: 160px; }
.pop-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--c-text);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background var(--t-fast);
}
.pop-item:hover { background: var(--c-surface-2); }
.pop-item.is-active { background: var(--c-primary-soft); color: var(--c-primary-ink); }
.pop-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.assignee { display: flex; align-items: center; gap: 8px; }
.assignee-av {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--c-primary-soft);
  color: var(--c-primary-ink);
  display: grid; place-items: center;
  font-size: 12px;
  font-weight: 700;
}
.assignee-name { font-size: 13px; font-weight: 600; color: var(--c-ink); }

.btn-resolve {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--c-success);
  color: #fff;
  font-weight: 700; font-size: 13px;
  border: none; border-radius: var(--radius-btn);
  padding: 8px 16px; cursor: pointer;
  transition: background var(--t-fast), transform 80ms ease-out;
}
.btn-resolve:hover { background: color-mix(in srgb, var(--c-success) 90%, black); }
.btn-resolve:active { transform: scale(.98); }
.btn-resolve:focus-visible { outline: 3px solid var(--c-primary); outline-offset: 3px; }
.resolved-tag { display: inline-flex; align-items: center; gap: 6px; min-height: 38px; color: var(--c-success); font-weight: 700; font-size: 13px; }

.rd-section { display: flex; flex-direction: column; gap: var(--sp-2); }

/* Activity heading */
.rd-activity-head { font-size: 12px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: var(--c-muted); margin-bottom: 10px; }
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

@media (max-width: 1100px) {
  .tw-side { top: var(--sp-2); left: var(--sp-2); bottom: var(--sp-2); width: 260px; }
}
</style>
