<template>
  <q-page class="concerns-page column no-wrap" style="background-color: var(--c-bg)">
    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="statusFilter" :tabs="tabs" />
    </div>

    <div class="concerns-body">
      <TableCard
        v-model:search="search"
        v-model:page="page"
        :loading="loading"
        :total-label="`${tickets.length} total ${tickets.length === 1 ? 'ticket' : 'tickets'}`"
        :rows="tickets"
        :columns="columns"
        row-key="id"
        :total-items="tickets.length"
        item-name="tickets"
        @refresh="fetch"
      >
        <template #empty>
          <div class="full-width row flex-center text-muted q-pa-xl column">
            <Icon icon="mdi:ticket-outline" width="48" height="48" class="q-mb-md" />
            <div class="text-h6 text-weight-bold">No tickets found</div>
            <div v-if="error" class="text-caption q-mt-xs" style="color: var(--c-danger)">{{ error }}</div>
            <div v-else>No support tickets match the current filter.</div>
          </div>
        </template>

        <template #body="{ props }">
          <q-tr
            :props="props"
            :key="props.row.id"
            class="cursor-pointer ticket-row"
            :class="{ 'is-active': selectedTicket && selectedTicket.id === props.row.id }"
            @click.stop="selectTicket(props.row.id)"
          >
            <q-td key="ref" :props="props" class="text-muted text-weight-medium ref-cell" style="font-family: var(--font-mono)">{{ props.row.ref }}</q-td>
            <q-td key="reporter" :props="props">
              <UserInfoCell
                :initials="props.row.initials"
                :name="props.row.reporterName"
                :email="props.row.reporterEmail"
                :subtitle="roleLabel(props.row.reporterRole)"
                :avatar-color="props.row.avatarColor"
              />
            </q-td>
            <q-td key="subject" :props="props" class="subject-cell">
              <div class="subject-text">{{ props.row.subject }}</div>
              <div class="subject-preview">{{ props.row.lastPreview }}</div>
            </q-td>
            <q-td key="category" :props="props"><span class="cat-chip">{{ capitalize(props.row.category) }}</span></q-td>
            <q-td key="status" :props="props">
              <BadgePill :tone="getStatus(props.row.status).tone" :icon="getStatus(props.row.status).icon ?? ''" :label="stLabel(props.row.status)" />
            </q-td>
            <q-td key="priority" :props="props">
              <BadgePill :tone="getStatus(props.row.priority).tone" :icon="getStatus(props.row.priority).icon ?? ''" :label="stLabel(props.row.priority)" />
            </q-td>
            <q-td key="updated" :props="props" class="text-muted">{{ getTimeAgo(props.row.updatedAt) }}</q-td>
          </q-tr>
        </template>
      </TableCard>

          </div>

    <teleport to="body">
      <transition name="tw" :duration="450">
        <div class="ticket-window" v-if="selectedTicket">
          <div class="tw-scrim" @click="closeWindow"></div>

          <aside class="tw-side">
            <div class="tw-side-meta">
              <div class="side-sec-title">Overview</div>
              <div class="ov-card">
                <div class="ov-row">
                  <span class="ov-key"><Icon icon="mdi:flag-variant" width="15" height="15" class="ov-ic" /> Status</span>
                  <q-btn unelevated no-caps padding="none" class="chip-trigger" :ripple="false">
                    <BadgePill :tone="getStatus(selectedTicket.status).tone" :icon="getStatus(selectedTicket.status).icon ?? ''" :label="stLabel(selectedTicket.status)" />
                    <Icon icon="mdi:chevron-down" width="14" height="14" class="chip-caret" />
                    <q-menu anchor="bottom left" self="top left" class="chip-menu">
                      <button v-for="o in STATUS_OPTS" :key="o.value" class="pop-item" :class="{ 'is-active': selectedTicket.status === o.value }" @click="updateStatus(o.value)">
                        <span class="pop-dot" :style="{ background: toneColor(getStatus(o.value).tone) }"></span>{{ o.label }}
                      </button>
                    </q-menu>
                  </q-btn>
                </div>

                <div class="ov-row">
                  <span class="ov-key"><Icon icon="mdi:alert-circle-outline" width="15" height="15" class="ov-ic" /> Priority</span>
                  <q-btn unelevated no-caps padding="none" class="chip-trigger" :ripple="false">
                    <BadgePill :tone="getStatus(selectedTicket.priority).tone" :icon="getStatus(selectedTicket.priority).icon ?? ''" :label="stLabel(selectedTicket.priority)" />
                    <Icon icon="mdi:chevron-down" width="14" height="14" class="chip-caret" />
                    <q-menu anchor="bottom left" self="top left" class="chip-menu">
                      <button v-for="o in PRIORITY_OPTS" :key="o.value" class="pop-item" :class="{ 'is-active': selectedTicket.priority === o.value }" @click="updatePriority(o.value)">
                        <span class="pop-dot" :style="{ background: toneColor(getStatus(o.value).tone) }"></span>{{ o.label }}
                      </button>
                    </q-menu>
                  </q-btn>
                </div>

                <div class="ov-row">
                  <span class="ov-key"><Icon icon="mdi:account-outline" width="15" height="15" class="ov-ic" /> Assignee</span>
                  <div class="assignee">
                    <span class="assignee-av">{{ assigneeInitials }}</span>
                    <span class="assignee-name">{{ selectedTicket.assignee || 'Unassigned' }}</span>
                  </div>
                </div>
              </div>

              <button class="btn-resolve" v-if="selectedTicket.status !== 'resolved'" @click="updateStatus('resolved')"><Icon icon="mdi:check-circle-outline" width="18" height="18" /> Resolve</button>
              <span class="resolved-tag" v-else><Icon icon="mdi:check-circle" width="18" height="18" /> Resolved</span>
            </div>

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
          </aside>

          <div class="tw-panel">
            <header class="tw-head">
              <button class="tw-back" @click="closeWindow" aria-label="Back"><Icon icon="mdi:arrow-left" width="20" height="20" /></button>
              <div class="tw-head-main">
                <div class="tw-subject">{{ selectedTicket.subject }}</div>
              </div>
            </header>

            <div class="tw-body">
              <section class="tw-conv">
                <header class="conv-profile">
                  <div class="cp-av" :style="{ background: selectedTicket.avatarColor }">{{ selectedTicket.initials }}</div>
                  <div class="cp-meta">
                    <div class="cp-name">{{ selectedTicket.reporterName }}</div>
                    <div class="cp-sub">{{ roleLabel(selectedTicket.reporterRole) }} · {{ selectedTicket.reporterEmail }}</div>
                  </div>
                </header>

                <div class="tw-thread">
                  <template v-for="(group, gi) in messageGroups" :key="gi">
                    <div class="tw-day"><span>{{ dayLabel(group.day) }}</span></div>
                    <div v-for="m in group.items" :key="m.id" class="msg" :class="[m.authorRole === 'agent' ? 'agent' : 'student', { 'is-internal': m.isInternal }]">
                      <div v-if="m.authorRole === 'student'" class="msg-av">{{ studentInitials }}</div>
                      <div class="bubble">
                        <div class="bubble-author" v-if="m.isInternal"><Icon icon="mdi:lock-outline" width="13" height="13" /> Internal note · {{ m.authorName }}</div>
                        <div class="bubble-body">{{ m.body }}</div>
                        <div class="bubble-foot">{{ formatTime(m.createdAt) }}</div>
                      </div>
                    </div>
                  </template>
                </div>

                <div class="tw-composer" :class="{ 'is-internal': replyMode === 'internal' }">
                  <div class="cmp-toolbar">
                    <div class="reply-toggle">
                      <button class="rt-btn" :class="{ 'is-active': replyMode === 'public' }" @click="replyMode = 'public'"><Icon icon="mdi:reply-outline" width="15" height="15" /> Public reply</button>
                      <button class="rt-btn internal" :class="{ 'is-active': replyMode === 'internal' }" @click="replyMode = 'internal'"><Icon icon="mdi:lock-outline" width="15" height="15" /> Internal note</button>
                    </div>
                    <span class="composer-hint" :class="{ 'int': replyMode === 'internal' }">
                      <Icon :icon="replyMode === 'internal' ? 'mdi:lock-outline' : 'mdi:eye-outline'" width="14" height="14" />
                      {{ replyMode === 'internal' ? 'Internal only' : 'Visible to requester' }}
                    </span>
                  </div>

                  <div class="cmp-quick">
                    <span class="tpl-label">Quick replies</span>
                    <div class="tpl-row" v-if="templates.length">
                      <button v-for="t in templates" :key="t.key" class="tpl-chip" @click="applyTemplate(t)">{{ t.label }}</button>
                      <button v-if="selectedTicket.status !== 'resolved'" class="tpl-chip resolve" @click="updateStatus('resolved')"><Icon icon="mdi:check-circle-outline" width="14" height="14" /> Mark resolved</button>
                    </div>
                  </div>

                  <div class="cmp-box">
                    <q-input v-model="draft" type="textarea" autogrow borderless :placeholder="replyMode === 'internal' ? 'Write an internal note (not visible to requester)…' : 'Write a reply to the requester…'" class="conv-input" />
                    <button class="send-fab" :disabled="!draft.trim()" @click="send" :title="replyMode === 'internal' ? 'Add note' : 'Send reply'">
                      <Icon :icon="replyMode === 'internal' ? 'mdi:note-plus-outline' : 'mdi:send-outline'" width="18" height="18" />
                    </button>
                  </div>
                </div>
              </section>

              <aside class="tw-details">
                <div class="tw-details-head">Details</div>

                <div class="rd-section">
                  <div class="rd-ticket receipt">
                    <div class="rc-paper">
                      <div class="rc-head">
                        <div class="rc-ref">{{ selectedTicket.ref }}</div>
                      </div>
                      <div class="rc-rule"></div>
                      <div class="rc-row"><span>Category</span><span>{{ selectedTicket.category }}</span></div>
                      <div class="rc-row"><span>Logged</span><span>{{ parcelDate }}</span></div>
                      <div class="rc-row"><span>Updated</span><span>{{ updatedDate }}</span></div>
                      <div class="rc-row"><span>Messages</span><span>{{ selectedTicket.messages.length }}</span></div>
                      <div class="rc-rule"></div>
                      <button class="rc-row rc-link" @click="goTable('users')"><span>Reported by</span><span class="rc-val">{{ selectedTicket.reporterName }} <Icon icon="mdi:open-in-new" width="13" height="13" /></span></button>
                      <button v-if="selectedTicket.propertyName" class="rc-row rc-link" @click="goTable('property-hub')"><span>Property</span><span class="rc-val">{{ selectedTicket.propertyName }} <Icon icon="mdi:open-in-new" width="13" height="13" /></span></button>
                      <button v-if="selectedTicket.landlordName && selectedTicket.landlordName !== selectedTicket.reporterName" class="rc-row rc-link" @click="goTable('users')"><span>Landlord</span><span class="rc-val">{{ selectedTicket.landlordName }} <Icon icon="mdi:open-in-new" width="13" height="13" /></span></button>
                      <button v-if="selectedTicket.propertyName && selectedTicket.room !== '—'" class="rc-row rc-link" @click="goTable('room-hub')"><span>Room</span><span class="rc-val">{{ selectedTicket.room }} <Icon icon="mdi:open-in-new" width="13" height="13" /></span></button>
                      <div class="rc-row" v-if="selectedTicket.reporterEmail"><span>Email</span><span>{{ selectedTicket.reporterEmail }}</span></div>
                      <div class="rc-row" v-if="selectedTicket.reporterPhone"><span>Phone</span><span>{{ selectedTicket.reporterPhone }}</span></div>
                      <div class="rc-block">
                        <div class="rc-label">Concern</div>
                        <div class="rc-text">{{ selectedTicket.description }}</div>
                      </div>
                      <div class="rc-rule"></div>
                      <div class="rc-barcode"></div>
                      <div class="rc-thanks">Accommo Care Team</div>
                      <div class="rc-copy">For your records</div>
                    </div>
                  </div>
                </div>

              </aside>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTickets } from '@/composables/useTickets'
import { getStatus } from '@/utils/status.config'
import BadgePill from '@/components/user/BadgePill.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'

const {
  loading, error, search, statusFilter, tickets, counts,
  selectedTicket, selectedId, selectTicket,
  getTimeAgo, capitalize, fetch,
  sendMessage, updateStatus, setStatus, updatePriority,
} = useTickets()

const page = ref(1)
const tabs = computed(() => [
  { name: 'all', label: `All (${counts.value.all})` },
  { name: 'open', label: `Open (${counts.value.open})` },
  { name: 'in_progress', label: `In progress (${counts.value.in_progress})` },
  { name: 'resolved', label: `Resolved (${counts.value.resolved})` },
])
const columns = [
  { name: 'ref', label: 'REF', align: 'left' as const, field: 'ref' },
  { name: 'reporter', label: 'REPORTER', align: 'left' as const, field: 'reporterName' },
  { name: 'subject', label: 'CONCERN', align: 'left' as const, field: 'subject' },
  { name: 'category', label: 'CATEGORY', align: 'left' as const, field: 'category' },
  { name: 'status', label: 'STATUS', align: 'left' as const, field: 'status' },
  { name: 'priority', label: 'PRIORITY', align: 'left' as const, field: 'priority' },
  { name: 'updated', label: 'UPDATED', align: 'left' as const, field: 'updatedAt' },
]

const STATUS_LABELS: Record<string, string> = {
  open: 'Open', in_progress: 'In progress', resolved: 'Resolved',
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
}

const parcelDate = computed(() => {
  const t = selectedTicket.value
  if (!t) return ''
  const d = new Date(t.reportedAt)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
})

const updatedDate = computed(() => {
  const t = selectedTicket.value
  if (!t) return ''
  const d = new Date(t.updatedAt)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
})

function stLabel(key: string): string {
  const map: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  }
  return map[key] ?? key
}

function roleLabel(role?: string): string {
  if (role === 'landlord') return 'Landlord'
  if (role === 'student') return 'Resident'
  return 'User'
}

function initialsOf(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function toggleResolved(t: { id: string; status: string }) {
  setStatus(t.id, t.status === 'resolved' ? 'open' : 'resolved')
}

const TONE_COLOR: Record<string, string> = {
  primary: 'var(--c-primary)',
  success: 'var(--c-success)',
  warning: 'var(--c-warning)',
  danger: 'var(--c-danger)',
  info: 'var(--c-info)',
  neutral: 'var(--c-muted)',
}
function toneColor(tone?: string) {
  return (tone && TONE_COLOR[tone]) || 'var(--c-muted)'
}

interface MsgGroup { day: string; items: any[] }
const messageGroups = computed<MsgGroup[]>(() => {
  const t = selectedTicket.value
  if (!t || !t.messages) return []
  const byDay = new Map<string, any[]>()
  for (const m of t.messages) {
    const d = new Date(m.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(m)
  }
  const groups: MsgGroup[] = []
  for (const [day] of byDay.entries()) {
    const [y, mo, d] = day.split('-').map(Number)
    groups.push({ day: `${y}-${mo}-${d}`, items: byDay.get(day)! })
  }
  groups.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())
  return groups
})

function dayLabel(_day: string): string {
  const d = new Date()
  const today = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const msgDate = new Date(_day)
  const diff = Math.round((today.getTime() - new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate()).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return msgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const activityItems = computed(() => {
  const t = selectedTicket.value
  if (!t) return []
  const s = getStatus(t.status)
  return [
    { icon: s.icon || 'mdi:circle', text: `Status set to ${stLabel(t.status)}`, time: getTimeAgo(t.updatedAt), tone: s.tone },
    { icon: 'mdi:account-check', text: t.assignee ? `Assigned to ${t.assignee}` : 'Awaiting assignment', time: getTimeAgo(t.updatedAt), tone: t.assignee ? 'success' : 'warning' },
    { icon: 'mdi:ticket-outline', text: 'Ticket reported', time: formatDateTime(t.reportedAt), tone: 'info' },
  ]
})

const activityToneColors: Record<string, string> = {
  primary: 'var(--c-primary)',
  success: 'var(--c-success)',
  warning: 'var(--c-warning)',
  danger: 'var(--c-danger)',
  info: 'var(--c-info, var(--c-primary))',
  neutral: 'var(--c-muted)',
}
function activityIconStyle(a: { tone?: string }) {
  const tone = (a.tone && a.tone !== 'neutral' ? a.tone : 'neutral') as keyof typeof activityToneColors
  const base = tone === 'neutral' ? 'var(--c-muted)' : activityToneColors[tone]
  return {
    background: `color-mix(in srgb, ${base} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${base} 34%, transparent)`,
    color: base,
  }
}

const replyMode = ref<'public' | 'internal'>('public')
const draft = ref('')
const templates = [
  { key: 'ack', label: 'Acknowledged', text: 'Thank you for reaching out. We have received your concern and a member of our team is looking into this now.' },
  { key: 'update', label: 'Request update', text: 'Could you share a little more detail or a photo so we can investigate further?' },
]

function applyTemplate(t: { text: string }) {
  draft.value = t.text
}

async function send() {
  if (!draft.value.trim()) return
  const isInternal = replyMode.value === 'internal'
  await sendMessage(draft.value, { isInternal })
  draft.value = ''
}

function closeWindow() {
  selectedId.value = null
}

const STATUS_OPTS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
] as const

const PRIORITY_OPTS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

const assigneeInitials = computed(() => {
  const a = selectedTicket.value?.assignee
  if (!a) return '?'
  return a.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
})

const studentInitials = computed(() => selectedTicket.value?.initials ?? '?')

const router = useRouter()
function goTable(hub: 'users' | 'property-hub' | 'room-hub') {
  router.push('/' + hub)
}

onMounted(() => { fetch() })
</script>

<style scoped>
.concerns-page {
  padding: var(--sp-4);
  height: 100%;
  gap: 0;
}
.concerns-body {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.filters-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--c-primary);
  background: var(--c-primary-soft);
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  margin-bottom: 6px;
}

/* ---- Table cell polish (table design preserved) ---- */
.ticket-row.is-active {
  background: var(--c-primary-soft);
  box-shadow: inset 3px 0 0 var(--c-primary);
}
.ref-cell { font-size: 12px; letter-spacing: 0.02em; }
.subject-cell { min-width: 0; }
.subject-text { font-weight: 700; color: var(--c-ink); }
.subject-preview {
  font-size: 12px;
  color: var(--c-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}
.cat-chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 600;
}
/* Quasar's q-table container defaults to pure white — override to a token surface */
.concerns-page :deep(.q-table__container) {
  background: var(--c-surface) !important;
}

/* ---- THE WINDOW ---- */
.ticket-window {
  position: fixed;
  inset: 0;
  z-index: 4000;
  overflow: hidden;
}
.tw-scrim {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}
.tw-panel {
  position: absolute;
  top: var(--sp-6);
  right: var(--sp-6);
  bottom: var(--sp-6);
  left: calc(var(--sp-6) + 320px + var(--sp-4));
  border-radius: var(--radius);
  background: var(--c-surface);
  box-shadow: -24px 0 60px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
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
.tw-side-meta { display: flex; flex-direction: column; gap: var(--sp-3); }
.side-sec-title { font-family: var(--font-display); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-muted); padding: 0 2px; }
.ov-card { background: var(--c-bg); border: 1px solid var(--c-border); border-radius: var(--radius-sm); overflow: hidden; }
.ov-row { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); padding: 13px 14px; }
.ov-row + .ov-row { border-top: 1px solid var(--c-border); }
.ov-key { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted); }
.ov-ic { color: var(--c-muted); opacity: 0.8; }
.tw-side .btn-resolve { margin-left: 0; width: 100%; justify-content: center; }
.tw-side .resolved-tag { margin-left: 0; width: 100%; justify-content: center; }
.tw-enter-from .tw-panel,
.tw-leave-to .tw-panel { transform: translateX(100%); }
.tw-enter-active .tw-panel,
.tw-leave-active .tw-panel { transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1); }
.tw-enter-from .tw-side,
.tw-leave-to .tw-side { transform: translateX(-100%); opacity: 0; }
.tw-enter-active .tw-side,
.tw-leave-active .tw-side { transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease; }
.tw-enter-from .tw-scrim,
.tw-leave-to .tw-scrim { opacity: 0; }
.tw-enter-active .tw-scrim,
.tw-leave-active .tw-scrim { transition: opacity 0.42s ease; }
.tw-enter-from,
.tw-leave-to { opacity: 0; }
.tw-enter-active,
.tw-leave-active { transition: opacity 0.42s ease; }

.tw-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface);
}
.tw-subject { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--c-ink); }
.tw-back {
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  color: var(--c-muted);
  width: 38px; height: 38px;
  border-radius: 10px;
  display: grid; place-items: center;
  cursor: pointer;
  transition: all var(--t-fast);
  flex-shrink: 0;
}
.tw-back:hover { color: var(--c-ink); border-color: var(--c-border-strong); }

.chip-trigger {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: transparent;
  font-weight: 600;
}
.chip-caret { color: var(--c-muted); margin-left: 2px; transition: transform var(--t-fast); }
.chip-trigger:hover .chip-caret { color: var(--c-ink); }
.chip-menu { box-shadow: var(--shadow); border-radius: var(--radius-sm); padding: 6px; min-width: 160px; }
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
  font-size: 12px; font-weight: 700;
}
.assignee-name { font-size: 13px; font-weight: 600; color: var(--c-ink); }
.btn-resolve {
  margin-left: auto;
  align-self: center;
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--c-success);
  color: #fff;
  font-weight: 700; font-size: 13px;
  border: none; border-radius: var(--radius-btn);
  padding: 8px 16px; cursor: pointer;
  transition: filter var(--t-fast), transform var(--t-fast);
}
.btn-resolve:hover { filter: brightness(1.05); transform: translateY(-1px); }
.resolved-tag { margin-left: auto; align-self: center; display: inline-flex; align-items: center; gap: 6px; color: var(--c-success); font-weight: 700; font-size: 13px; }

.tw-body { flex: 1 1 0; min-height: 0; display: flex; gap: var(--sp-4); padding: var(--sp-4); }
.tw-conv { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; background: var(--c-bg); border: 1px solid var(--c-border); border-radius: var(--radius); overflow: hidden; }
.conv-profile {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
}
.cp-av {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-weight: 700; font-size: 14px; color: #fff;
  flex-shrink: 0;
}
.cp-meta { min-width: 0; }
.cp-name { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-sub { font-size: 12px; color: var(--c-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tw-thread { flex: 1 1 0; min-height: 0; overflow-y: auto; padding: var(--sp-5); display: flex; flex-direction: column; gap: var(--sp-3); }
.tw-thread, .tw-details { scrollbar-width: thin; scrollbar-color: var(--c-border-strong) transparent; }
.tw-thread::-webkit-scrollbar, .tw-details::-webkit-scrollbar { width: 8px; }
.tw-thread::-webkit-scrollbar-thumb, .tw-details::-webkit-scrollbar-thumb { background: var(--c-border-strong); border-radius: 999px; }
.tw-thread::-webkit-scrollbar-track, .tw-details::-webkit-scrollbar-track { background: transparent; }
.tw-day { display: flex; align-items: center; gap: 12px; margin: var(--sp-3) 0; }
.tw-day::before, .tw-day::after { content: ''; height: 1px; background: var(--c-border); flex: 1; }
.tw-day span {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--c-muted);
}
.msg { display: flex; align-items: flex-end; gap: 8px; max-width: 80%; }
.msg.student { align-self: flex-start; }
.msg.agent { align-self: flex-end; justify-content: flex-end; }
.msg.is-internal { align-self: flex-end; max-width: 86%; }
.msg-av {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--c-primary-soft); color: var(--c-primary-ink);
  display: grid; place-items: center; font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.bubble {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px; line-height: 1.5;
  box-shadow: var(--shadow-sm);
}
.msg.student .bubble { background: var(--c-surface); color: var(--c-ink); border: 1px solid var(--c-border); border-bottom-left-radius: 6px; }
.msg.agent .bubble { background: var(--c-primary); color: #fff; border-bottom-right-radius: 6px; }
.msg.is-internal .bubble { background: #FEF3C7; color: #78350F; border-bottom-right-radius: 6px; }
.bubble-author { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 5px; color: #92400E; }
.bubble-foot { font-size: 11px; opacity: 0.7; margin-top: 5px; text-align: right; }

.tw-composer {
  position: relative;
  border-top: 1px solid var(--c-border);
  background: var(--c-surface);
  padding: var(--sp-3) var(--sp-4);
  transition: background var(--t-fast);
}
.tw-composer.is-internal { background: linear-gradient(0deg, rgba(245, 158, 11, 0.06), rgba(245, 158, 11, 0.06)), var(--c-surface); }

.cmp-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: var(--sp-2); }
.reply-toggle { display: inline-flex; background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: 999px; padding: 3px; gap: 2px; }
.rt-btn { display: inline-flex; align-items: center; gap: 5px; border: none; background: transparent; color: var(--c-muted); font-size: 12px; font-weight: 600; padding: 5px 13px; border-radius: 999px; cursor: pointer; transition: background var(--t-fast), color var(--t-fast); }
.rt-btn.is-active { background: var(--c-primary); color: #fff; box-shadow: var(--shadow-sm); }
.rt-btn.internal.is-active { background: var(--c-warning); color: #1F2937; }

.cmp-quick { margin-bottom: var(--sp-2); }
.tpl-label { display: block; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-muted); font-weight: 700; margin-bottom: 6px; }
.tpl-row { display: flex; flex-wrap: wrap; gap: 6px; }
.tpl-chip { display: inline-flex; align-items: center; gap: 5px; border: 1px dashed var(--c-border-strong); background: var(--c-surface-2); color: var(--c-muted); font-size: 11px; font-weight: 600; padding: 5px 11px; border-radius: 999px; cursor: pointer; transition: color var(--t-fast), border-color var(--t-fast), background var(--t-fast); }
.tpl-chip:hover { color: var(--c-ink); border-color: var(--c-primary); background: var(--c-primary-soft); }
.tpl-chip.resolve { border-style: solid; border-color: var(--c-success); color: var(--c-success); background: rgba(16, 185, 129, 0.12); }
.tpl-chip.resolve:hover { filter: brightness(0.97); }

.cmp-box { position: relative; display: flex; align-items: flex-end; gap: 10px; background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 8px 8px 8px 12px; transition: border-color var(--t-fast), box-shadow var(--t-fast); }
.cmp-box:focus-within { border-color: var(--c-primary); box-shadow: 0 0 0 3px var(--c-primary-soft); }
.tw-composer.is-internal .cmp-box:focus-within { border-color: var(--c-warning); box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25); }
.conv-input { flex: 1 1 auto; background: transparent; border: none; padding: 4px 0; }
.conv-input :deep(.q-field__control) { border-radius: 0; }
.conv-input :deep(textarea) { min-height: 44px; }
.send-fab { flex: 0 0 auto; width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--c-primary); color: #fff; display: grid; place-items: center; cursor: pointer; transition: filter var(--t-fast), transform var(--t-fast); }
.send-fab:disabled { opacity: 0.45; cursor: not-allowed; }
.send-fab:not(:disabled):hover { filter: brightness(1.05); transform: translateY(-1px); }
.tw-composer.is-internal .send-fab { background: var(--c-warning); color: #1F2937; }

.composer-hint { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--c-info); font-weight: 600; background: rgba(59, 130, 246, 0.12); padding: 4px 10px; border-radius: 999px; }
.composer-hint.int { color: #B45309; background: rgba(245, 158, 11, 0.14); }

.tw-details { width: 380px; flex-shrink: 0; border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface); overflow-y: auto; padding: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-4); }
.tw-details-head { font-family: var(--font-display); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-muted); margin-bottom: 10px; }
.rd-section { display: flex; flex-direction: column; gap: var(--sp-2); }

/* Ticket paper — thermal receipt */
.rd-ticket.receipt { display: block; }
.rc-paper {
  background: #FBF8F1;
  color: #1F2937;
  font-family: var(--font-mono);
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  padding: 40px 18px 56px;
  clip-path: polygon(
    0% 0%, 100% 0%,
    100% calc(100% - 7px),
    95% 100%, 90% calc(100% - 7px), 85% 100%, 80% calc(100% - 7px),
    75% 100%, 70% calc(100% - 7px), 65% 100%, 60% calc(100% - 7px),
    55% 100%, 50% calc(100% - 7px), 45% 100%, 40% calc(100% - 7px),
    35% 100%, 30% calc(100% - 7px), 25% 100%, 20% calc(100% - 7px),
    15% 100%, 10% calc(100% - 7px), 5% 100%, 0 calc(100% - 7px)
  );
}
.rc-head { text-align: center; }
.rc-ref { font-family: var(--font-display); font-weight: 800; font-size: 19px; letter-spacing: 0.14em; }
.rc-rule { height: 0; border-top: 1px dashed rgba(15, 23, 42, 0.35); margin: 13px 0; }
.rc-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; line-height: 2.5; }
.rc-row > span:first-child { opacity: 0.6; white-space: nowrap; }
.rc-row > span:last-child { text-align: right; word-break: break-word; }
.rc-link {
  width: 100%;
  background: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  padding: 4px 6px;
  margin: 0 -6px;
  border-radius: 6px;
  transition: background var(--t-fast);
}
.rc-link:hover { background: rgba(15, 23, 42, 0.06); }
.rc-link .rc-val { display: inline-flex; align-items: center; gap: 4px; justify-content: flex-end; }
.rc-link:hover .rc-val { color: var(--c-primary); }
.rc-block { margin: 2px 0; }
.rc-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.6; margin-bottom: 3px; }
.rc-text { font-size: 13px; line-height: 1.6; word-break: break-word; }
.rc-barcode {
  height: 28px; margin: 4px 0 11px; opacity: 0.9;
  background-image: repeating-linear-gradient(90deg,
    #1F2937 0 2px, transparent 2px 4px,
    #1F2937 4px 5px, transparent 5px 9px,
    #1F2937 9px 12px, transparent 12px 13px,
    #1F2937 13px 14px, transparent 14px 18px,
    #1F2937 18px 21px, transparent 21px 22px,
    #1F2937 22px 24px, transparent 24px 28px);
  background-size: 28px 100%;
}
.rc-thanks { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; }
.rc-copy { text-align: center; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.6; margin-top: 3px; }

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
  .tw-panel {
    top: var(--sp-2);
    right: var(--sp-2);
    bottom: var(--sp-2);
    left: calc(var(--sp-2) + 260px + var(--sp-2));
    border-radius: var(--radius);
  }
  .tw-side { top: var(--sp-2); left: var(--sp-2); bottom: var(--sp-2); width: 260px; }
  .tw-details { display: none; }
}

/* View-mode toggle */
.view-toggle {
  display: inline-flex;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-btn);
  padding: 3px;
  gap: 2px;
  flex-shrink: 0;
}
.view-toggle button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--c-muted);
  font-size: 13px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 9px;
  cursor: pointer;
  transition: all var(--t-fast);
}
.view-toggle button:hover { color: var(--c-ink); }
.view-toggle button.active { background: var(--c-surface); color: var(--c-ink); box-shadow: var(--shadow-sm); }

/* Inbox mode — master-detail split */
.inbox-split {
  display: flex;
  gap: var(--sp-4);
  flex: 1 1 auto;
  min-height: 0;
}
.inbox-split.is-empty .inbox-list-pane { width: 100%; }
.inbox-list-pane {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  overflow: hidden;
}
.inbox-read {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  overflow: hidden;
}

/* Left pane: search + list */
.inbox-toolbar { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-3) var(--sp-3) 0; }
.inbox-search {
  display: flex; align-items: center; gap: 8px;
  flex: 1 1 auto;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-btn);
  padding: 9px 14px;
}
.inbox-search .is-search { color: var(--c-muted); flex-shrink: 0; }
.inbox-input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: var(--c-ink); font-family: var(--font-body); }
.inbox-input::placeholder { color: var(--c-muted); }
.inbox-count { font-size: 12px; color: var(--c-muted); white-space: nowrap; flex-shrink: 0; }
.inbox-sort {
  display: inline-flex;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-btn);
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
}
.inbox-sort button {
  border: none;
  background: transparent;
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: all var(--t-fast);
}
.inbox-sort button:hover { color: var(--c-ink); }
.inbox-sort button.active { background: var(--c-surface); color: var(--c-primary); box-shadow: var(--shadow-sm); }
.inbox-empty { flex: 1 1 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 48px 16px; color: var(--c-muted); text-align: center; }

.inbox-list {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
.inbox-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  background: var(--c-surface-2);
  border: none;
  border-bottom: 1px solid var(--c-border);
  padding: 12px 16px;
  cursor: pointer;
  transition: background var(--t-fast), filter var(--t-fast), box-shadow var(--t-fast);
}
.inbox-item:hover { filter: brightness(0.975); }
.inbox-item.is-unread { background: var(--c-surface); }
.inbox-item.is-unread:hover { filter: brightness(0.985); }
.inbox-item.is-active { background: var(--c-primary-soft) !important; box-shadow: inset 0 0 0 1.5px var(--c-primary); filter: none; }
.ib-av {
  position: relative;
  width: 38px; height: 38px;
  border-radius: 50%;
  display: grid; place-items: center;
  color: #fff; font-weight: 700; font-size: 14px;
  flex-shrink: 0;
}
.ib-sdot {
  position: absolute;
  right: -2px; bottom: -2px;
  width: 11px; height: 11px; border-radius: 50%;
  border: 2px solid var(--c-surface);
  flex-shrink: 0;
}
.ib-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ib-line1 { display: flex; align-items: baseline; gap: 8px; }
.ib-name { font-size: 14px; color: var(--c-ink); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.inbox-item.is-unread .ib-name { font-weight: 800; }
.ib-role {
  font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
  color: var(--c-muted);
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 999px;
  padding: 0 7px;
  text-transform: uppercase;
  flex-shrink: 0;
}
.ib-time { margin-left: auto; font-size: 11.5px; color: var(--c-muted); white-space: nowrap; flex-shrink: 0; }
.ib-line2 { display: flex; align-items: baseline; font-size: 13px; color: var(--c-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ib-subject { color: var(--c-ink); font-weight: 500; }
.inbox-item.is-unread .ib-subject { font-weight: 700; }
.ib-sep { color: var(--c-border-strong); padding: 0 4px; }
.ib-preview { overflow: hidden; text-overflow: ellipsis; }
.ib-line3 { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.ib-cat { font-size: 11px; font-weight: 600; color: var(--c-muted); background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: 999px; padding: 1px 9px; }
.ib-prio { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; flex-shrink: 0; }
.ib-msgs { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: var(--c-muted); flex-shrink: 0; }
.ib-status { display: inline-flex; }
.ib-assignee {
  margin-left: auto;
  width: 22px; height: 22px; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--c-primary-soft); color: var(--c-primary-ink);
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.ib-action {
  flex-shrink: 0;
  width: 34px; height: 34px; border-radius: 50%;
  display: grid; place-items: center;
  color: var(--c-muted);
  background: transparent; cursor: pointer;
  opacity: 0; transform: scale(0.9);
  transition: opacity var(--t-fast), transform var(--t-fast), background var(--t-fast), color var(--t-fast);
}
.inbox-item:hover .ib-action { opacity: 1; transform: scale(1); }
.ib-action:hover { background: var(--c-surface-2); color: var(--c-primary); }

/* Right pane: reading view */
.pv-head {
  display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface);
  flex-shrink: 0;
}
.pv-head-main { min-width: 0; }
.pv-subject { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pv-sub { font-size: 12px; color: var(--c-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pv-tools { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.pv-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.pv-btn {
  width: 34px; height: 34px; border-radius: 10px;
  display: grid; place-items: center;
  border: 1px solid var(--c-border); background: var(--c-surface-2);
  color: var(--c-muted); cursor: pointer;
  transition: all var(--t-fast);
}
.pv-btn:hover { color: var(--c-ink); border-color: var(--c-border-strong); }

.pv-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  gap: var(--sp-4);
  padding: var(--sp-4);
}
.pv-body .tw-conv { flex: 1 1 auto; min-width: 0; }
.pv-details {
  width: 300px;
  flex-shrink: 0;
  border-left: 1px solid var(--c-border);
  padding-left: var(--sp-4);
  overflow-y: auto;
}
.pv-dtitle { font-family: var(--font-display); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted); margin-bottom: 10px; }
.pv-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; padding: 7px 0; border-bottom: 1px solid var(--c-border); }
.pv-row > span:first-child { color: var(--c-muted); white-space: nowrap; }
.pv-row > span:last-child { text-align: right; font-weight: 600; color: var(--c-ink); }
.pv-email { font-size: 12px; word-break: break-word; }
.pv-rule { height: 0; border-top: 1px dashed var(--c-border); margin: 10px 0; }
.pv-block { margin-top: 4px; }
.pv-label { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-muted); margin-bottom: 4px; }
.pv-text { font-size: 13px; line-height: 1.6; color: var(--c-ink); word-break: break-word; }

/* Gmail tabs (page header, inbox mode) */
.inbox-tabs { display: flex; align-items: stretch; gap: 2px; overflow-x: auto; }
.itab {
  display: inline-flex; align-items: center; gap: 6px;
  border: none; background: transparent;
  color: var(--c-muted);
  font-size: 13px; font-weight: 600;
  padding: 8px 12px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--t-fast), border-color var(--t-fast), background var(--t-fast);
}
.itab:hover { color: var(--c-ink); background: var(--c-surface-2); border-radius: 8px 8px 0 0; }
.itab.active { color: var(--c-primary); border-bottom-color: var(--c-primary); }
.icount {
  font-size: 11px; font-weight: 700;
  background: var(--c-surface-2); color: var(--c-muted);
  padding: 1px 7px; border-radius: 999px;
}
.itab.active .icount { background: var(--c-primary-soft); color: var(--c-primary-ink); }

@media (max-width: 960px) {
  .inbox-list-pane { width: 320px; }
  .pv-details { width: 240px; }
}
@media (max-width: 768px) {
  .inbox-split { flex-direction: column; }
  .inbox-list-pane { width: auto; max-height: 40vh; }
  .pv-details { display: none; }
}
@media (max-width: 520px) {
  .itab { padding: 8px 9px; font-size: 12px; }
  .pv-tools .pv-pill { display: none; }
}
</style>
