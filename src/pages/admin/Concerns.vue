<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">
    <div class="concerns-split row no-wrap q-gutter-x-md" style="flex: 1 1 0; min-height: 0; overflow: hidden;">

    <!-- LEFT SIDEBAR: Inbox -->
    <q-card flat class="bg-surface custom-shadow column no-wrap shrink-0" style="border-radius: 12px; width: 340px;">

      <div class="q-pa-md border-bottom shrink-0 bg-surface" style="border-radius: 12px 12px 0 0; z-index: 10;">
        <div class="text-h6 text-weight-bold text-dark q-mb-md" style="line-height: 1;">Tickets</div>

        <SearchInput v-model="searchQuery" placeholder="Search tickets..." class="q-mb-md custom-radius" />

        <q-tabs v-model="activeStatus" dense no-caps class="text-grey-6" active-color="teal-7" indicator-color="teal-7" align="justify">
          <q-tab name="Open" label="Open" class="text-weight-bold" />
          <q-tab name="Pending" label="Pending" class="text-weight-bold" />
          <q-tab name="Resolved" label="Resolved" class="text-weight-bold" />
        </q-tabs>
      </div>

      <q-scroll-area class="col">
        <q-list class="q-pt-xs">
          <q-item
            v-for="ticket in filteredTickets"
            :key="ticket.id"
            clickable
            v-ripple
            class="ticket-item q-pa-md"
            :class="{ 'active-ticket': selectedTicket?.id === ticket.id }"
            @click="selectedTicket = ticket"
          >
            <q-item-section avatar top class="q-pr-sm" style="min-width: 44px;">
              <q-avatar size="48px" :color="ticket.avatarColor" text-color="white" class="text-weight-bold relative-position" style="border-radius: 10px; font-size: 18px;">
                {{ ticket.initials }}
              </q-avatar>
            </q-item-section>

            <q-item-section style="min-width: 0;">
              <div class="row justify-between items-center no-wrap q-mb-xs">
                <div class="text-weight-bold text-dark ellipsis" style="font-size: 13px;">{{ ticket.name }}</div>
                <div class="text-grey-5 shrink-0" style="font-size: 11px;">{{ ticket.timeAgo }}</div>
              </div>

              <div class="text-dark text-weight-medium ellipsis q-mb-xs" style="font-size: 13px;">{{ ticket.subject }}</div>

              <div class="text-grey-6 ellipsis q-mb-sm" style="font-size: 12px;">
                {{ ticket.preview }}
              </div>

              <div class="row items-center justify-between no-wrap">
                <div class="row items-center q-gutter-x-xs">
                  <Icon :icon="getPriorityIcon(ticket.priority)" :color="getPriorityColor(ticket.priority)" width="14" height="14" />
                  <span class="text-grey-7 text-weight-medium" style="font-size: 11px;">#{{ ticket.ticketId }}</span>
                </div>
                <q-badge v-if="ticket.unread > 0" color="teal-6" class="text-weight-bold shrink-0 q-px-sm" style="border-radius: 4px; font-size: 10px;">
                  {{ ticket.unread }} New
                </q-badge>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-card>

    <!-- CENTER PANE: Conversation -->
    <q-card v-if="selectedTicket" flat class="col bg-surface custom-shadow column no-wrap relative-position" style="border-radius: 12px; overflow: hidden;">

      <div class="q-pa-md border-bottom shrink-0 bg-surface z-top row justify-between items-center">
        <div class="row items-center q-gutter-x-sm">
            <q-badge :color="getStatusBgColor(selectedTicket.status)" :text-color="getStatusColor(selectedTicket.status)" class="text-weight-bold q-px-sm q-py-xs" style="border-radius: 6px; font-size: 11px;">
            <Icon icon="mdi:circle" width="6" height="6" class="q-mr-xs" /> {{ selectedTicket.status }}
          </q-badge>
          <div class="text-h6 text-weight-bold text-dark ellipsis" style="line-height: 1.2;">{{ selectedTicket.subject }}</div>
        </div>
      </div>

      <q-scroll-area class="col bg-grey-1 q-pa-md">
        <div class="column q-gutter-y-md q-pb-xl" style="max-width: 800px; margin: 0 auto;">

          <div v-for="(msg, index) in selectedTicket.messages" :key="index">

            <div v-if="!msg.isSystem" class="row items-start no-wrap q-mt-sm" :class="msg.isAgent && !msg.isInternal ? 'justify-end' : ''">
              <q-avatar v-if="!msg.isAgent || msg.isInternal" size="36px" :color="msg.isAgent ? 'grey-8' : selectedTicket.avatarColor" text-color="white" class="text-weight-bold q-mr-md shrink-0 shadow-1" style="border-radius: 10px;">
                {{ msg.isAgent ? 'MA' : selectedTicket.initials }}
              </q-avatar>

              <div class="column" :style="msg.isAgent && !msg.isInternal ? 'align-items: flex-end; max-width: 75%;' : 'max-width: 75%;'">
                <div class="row items-center q-mb-xs q-gutter-x-sm" :class="msg.isAgent && !msg.isInternal ? 'justify-end' : ''">
                  <span class="text-weight-bold text-dark" style="font-size: 13px;">{{ msg.isAgent ? 'Maria Admin' : selectedTicket.name }}</span>
                  <span class="text-grey-5" style="font-size: 11px;">{{ msg.time }}</span>
                </div>

                <div
                  class="q-pa-md shadow-1 text-dark"
                  :class="[
                    msg.isInternal ? 'bg-amber-1 border-amber' :
                    (msg.isAgent ? 'bg-teal-1 border-teal' : 'bg-surface border-all')
                  ]"
                  :style="[
                    'font-size: 14px; line-height: 1.5;',
                    msg.isAgent && !msg.isInternal ? 'border-radius: 16px 4px 16px 16px;' : 'border-radius: 4px 16px 16px 16px;'
                  ]"
                >
                  <div v-if="msg.isInternal" class="row items-center text-amber-9 text-weight-bold q-mb-sm" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                    <Icon icon="mdi:lock" width="12" height="12" class="q-mr-xs"/> Internal Note
                  </div>
                  {{ msg.text }}
                </div>
              </div>

              <q-avatar v-if="msg.isAgent && !msg.isInternal" size="36px" color="teal-7" text-color="white" class="text-weight-bold q-ml-md shrink-0 shadow-1" style="border-radius: 10px;">
                MA
              </q-avatar>
            </div>

            <div v-else class="row justify-center q-my-md">
              <div class="bg-grey-3 text-grey-7 q-px-md q-py-xs text-weight-medium" style="border-radius: 20px; font-size: 11px;">
                <Icon :icon="msg.icon" width="14" height="14" class="q-mr-xs" style="margin-top: -2px;"/>
                <span v-html="msg.text"></span> &bull; {{ msg.time }}
              </div>
            </div>

          </div>
        </div>
      </q-scroll-area>

      <div class="q-pa-md bg-surface border-top shrink-0">
        <div style="max-width: 800px; margin: 0 auto;" class="column">

          <q-card flat class="composer-card overflow-hidden" :class="replyMode === 'internal' ? 'border-amber' : 'border-all'">
            <q-tabs
              v-model="replyMode" dense align="left" class="border-bottom"
              :class="replyMode === 'internal' ? 'bg-amber-1 text-amber-9' : 'bg-grey-1 text-grey-7'"
              active-color="dark" indicator-color="transparent"
            >
              <q-tab name="public" no-caps class="text-weight-bold q-px-md">
                <div class="row items-center"><Icon icon="mdi:reply" width="16" height="16" class="q-mr-xs"/> Public Reply</div>
              </q-tab>
              <q-tab name="internal" no-caps class="text-weight-bold q-px-md">
                <div class="row items-center"><Icon icon="mdi:lock-outline" width="16" height="16" class="q-mr-xs"/> Internal Note</div>
              </q-tab>
            </q-tabs>

            <q-input
              v-model="replyText" type="textarea" borderless autogrow
              :placeholder="replyMode === 'internal' ? 'Type a private note...' : 'Type your reply...'"
              class="q-pa-sm" :class="replyMode === 'internal' ? 'bg-amber-1' : 'bg-surface'"
            />

            <div class="row justify-between items-center q-pa-sm border-top" :class="replyMode === 'internal' ? 'bg-amber-1' : 'bg-surface'">
              <div class="row q-gutter-x-sm text-grey-6">
                <q-btn flat dense size="sm" class="custom-radius"><Icon icon="mdi:format-bold" width="18" height="18" /></q-btn>
                <q-btn flat dense size="sm" class="custom-radius"><Icon icon="mdi:paperclip" width="18" height="18" /></q-btn>
              </div>

              <q-btn-dropdown
                split unelevated
                :color="replyMode === 'internal' ? 'amber-8' : 'teal-7'"
                :label="replyMode === 'internal' ? 'Save Note' : 'Send Reply'"
                no-caps class="text-weight-bold" style="border-radius: 8px;"
              >
                <q-list class="text-weight-medium">
                  <q-item clickable v-close-popup><q-item-section>Send and set to Pending</q-item-section></q-item>
                  <q-item clickable v-close-popup><q-item-section>Send and Resolve</q-item-section></q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
          </q-card>
        </div>
      </div>
    </q-card>

    <!-- RIGHT PANE: Context Sidebar -->
    <q-card v-if="selectedTicket" flat class="sidebar-container bg-surface custom-shadow column no-wrap shrink-0" style="border-radius: 12px; width: 300px; overflow-y: auto;">

      <div class="q-pa-md border-bottom">
        <div class="text-caption text-grey-5 text-weight-bold text-uppercase q-mb-md tracking-wide">Ticket Info</div>
        <div class="column q-gutter-y-md">

          <!-- Smart Assignee UI instead of dropdown -->
          <div class="row items-center justify-between q-pa-sm bg-grey-1 custom-radius border-all">
            <div class="row items-center q-gutter-x-sm">
              <q-avatar size="28px" :color="selectedTicket.assignee === 'Unassigned' ? 'grey-4' : 'teal-7'" text-color="white" class="text-weight-bold" style="font-size: 11px;">
                {{ selectedTicket.assignee === 'Unassigned' ? '?' : selectedTicket.assignee.charAt(0) }}
              </q-avatar>
              <div class="column">
                <span class="text-grey-6 text-weight-medium" style="font-size: 10px; line-height: 1;">Assignee</span>
                <span class="text-dark text-weight-bold" style="font-size: 13px; line-height: 1.2;">{{ selectedTicket.assignee }}</span>
              </div>
            </div>
            <!-- One-click Assign to Me -->
            <q-btn v-if="selectedTicket.assignee === 'Unassigned'" unelevated size="sm" color="primary" text-color="white" label="Take It" no-caps class="text-weight-bold custom-radius" @click="selectedTicket.assignee = 'Maria Admin'" />
            <!-- Handoff Icon -->
            <q-btn v-else flat dense size="sm" color="grey-6" class="custom-radius">
              <Icon icon="mdi:swap-horizontal-bold" width="18" height="18" />
              <q-tooltip>Transfer ticket</q-tooltip>
            </q-btn>
          </div>

          <div>
            <div class="text-grey-6 text-caption q-mb-xs">Status</div>
            <q-select v-model="selectedTicket.status" :options="['Open', 'Pending', 'Resolved']" outlined dense class="custom-radius text-weight-bold">
              <template v-slot:prepend><Icon icon="mdi:circle" width="10" height="10" :color="getStatusColor(selectedTicket.status)" /></template>
            </q-select>
          </div>
          <div>
            <div class="text-grey-6 text-caption q-mb-xs">Priority</div>
            <q-select v-model="selectedTicket.priority" :options="['High', 'Medium', 'Low']" outlined dense class="custom-radius text-weight-bold">
              <template v-slot:prepend><Icon :icon="getPriorityIcon(selectedTicket.priority)" :color="getPriorityColor(selectedTicket.priority)" width="18" height="18" /></template>
            </q-select>
          </div>
        </div>
      </div>

      <div class="q-pa-md border-bottom">
        <div class="text-caption text-grey-5 text-weight-bold text-uppercase q-mb-md tracking-wide">Student Details</div>
        <div class="row items-center no-wrap q-mb-md">
          <q-avatar size="40px" :color="selectedTicket.avatarColor" text-color="white" class="text-weight-bold q-mr-sm custom-radius">
            {{ selectedTicket.initials }}
          </q-avatar>
          <div>
            <div class="text-weight-bold text-dark" style="font-size: 14px;">{{ selectedTicket.name }}</div>
            <div class="text-grey-6" style="font-size: 12px;">{{ selectedTicket.courseId }}</div>
          </div>
        </div>
        <div class="row items-center q-mb-sm text-dark" style="font-size: 13px;">
          <Icon icon="mdi:email-outline" color="#9e9e9e" width="16" height="16" class="q-mr-sm"/> {{ selectedTicket.student.email }}
        </div>
        <div class="row items-center text-dark" style="font-size: 13px;">
          <Icon icon="mdi:phone-outline" color="#9e9e9e" width="16" height="16" class="q-mr-sm"/> {{ selectedTicket.student.phone }}
        </div>
      </div>

      <div class="q-pa-md bg-grey-1" style="flex-grow: 1;">
        <div class="text-caption text-grey-5 text-weight-bold text-uppercase q-mb-md tracking-wide">Property Context</div>
        <q-card flat bordered class="bg-surface q-pa-sm custom-radius q-mb-md">
          <div class="text-weight-bold text-dark q-mb-xs" style="font-size: 13px;">{{ selectedTicket.property.name }}</div>
          <div class="text-grey-6 q-mb-sm" style="font-size: 11px;">Landlord: {{ selectedTicket.property.landlord }}</div>
        </q-card>

        <div class="column q-gutter-y-sm">
          <q-btn outline color="teal-7" no-caps class="text-weight-bold full-width custom-radius bg-surface" align="left">
            <Icon icon="mdi:open-in-new" class="on-left" width="18" height="18" />Open Property Profile
          </q-btn>
        </div>
      </div>

    </q-card>

    <q-card v-else flat class="col bg-surface custom-shadow column flex-center" style="border-radius: 12px;">
      <Icon icon="mdi:forum-outline" width="64" height="64" color="var(--c-border-strong)" class="q-mb-md" />
      <div class="text-h6 text-grey-5 text-weight-bold">Select a ticket to begin</div>
    </q-card>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const searchQuery = ref('')
const activeStatus = ref('Open')
const selectedTicket = ref<any>(null)
const replyText = ref('')
const replyMode = ref('public')

const tickets = ref([
  {
    id: 'TKT-0045', initials: 'GO', avatarColor: 'teal-5', name: 'Grace Ocampo', courseId: '2023-0047 BSN',
    subject: 'Landlord not responding to water heater repair request',
    ticketId: '0045', date: 'May 21, 2026', timeAgo: '10m', status: 'Open', category: 'Repair', priority: 'High', unread: 1, assignee: 'Maria Admin',
    preview: 'Puwede po ba mag-file ng formal complaint?',
    student: { email: 'g.ocampo@student.isu.edu.ph', phone: '+63 912 345 6789' },
    property: { name: 'Pinzon Student Hub', landlord: 'Juan Dela Cruz' },
    messages: [
      { text: 'Good morning po. Yung water heater namin ay hindi gumagana na ng halos isang buwan. Nag-report na po kami sa landlord pero walang aksyon.', time: '10:00 AM', isAgent: false, isInternal: false },
      { text: 'Puwede po ba mag-file ng formal complaint?', time: '11:31 AM', isAgent: false, isInternal: false },
      { text: 'I will contact the landlord directly first before we escalate this. Hold off on replying.', time: '11:50 AM', isAgent: true, isInternal: true },
      { text: 'Hi Grace, we have received your concern and I am currently contacting Mr. Dela Cruz regarding this issue.', time: '11:55 AM', isAgent: true, isInternal: false }
    ]
  },
  {
    id: 'TKT-0044', initials: 'LT', avatarColor: 'pink-4', name: 'Luis Tamayo', courseId: '2022-0091 BSIT',
    subject: 'Deadline clarification for 2nd semester documents',
    ticketId: '0044', date: 'Mar 26, 2026', timeAgo: '2h', status: 'Pending', category: 'Document', priority: 'Low', unread: 0, assignee: 'Unassigned',
    preview: 'Thank you po noted.',
    student: { email: 'l.tamayo@student.isu.edu.ph', phone: '+63 918 111 2222' },
    property: { name: 'ISU Gate Apartment', landlord: 'Rosa Mercado' },
    messages: []
  },
  {
    id: 'TKT-0043', initials: 'AR', avatarColor: 'indigo-5', name: 'Ana Rivera', courseId: '2023-0011 BSN',
    subject: 'Missing payment receipt for Room 2B',
    ticketId: '0043', date: 'Apr 4, 2026', timeAgo: '1d', status: 'Open', category: 'Payment', priority: 'Medium', unread: 0, assignee: 'Officer Reyes',
    preview: 'Sent the proof of payment to the landlord...',
    student: { email: 'a.rivera@student.isu.edu.ph', phone: '+63 999 888 7777' },
    property: { name: 'Cruz Residence Dormitory', landlord: 'Ramon dela Cruz' },
    messages: []
  }
])

if (tickets.value.length > 0) {
  selectedTicket.value = tickets.value[0]
}

const filteredTickets = computed(() => {
  return tickets.value.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          t.subject.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          t.ticketId.includes(searchQuery.value)
    const matchesStatus = t.status === activeStatus.value
    return matchesSearch && matchesStatus
  })
})

function getPriorityColor(prio: string) {
  if (prio === 'High') return 'red-5'
  if (prio === 'Medium') return 'orange-5'
  return 'blue-5'
}

function getPriorityIcon(prio: string) {
  if (prio === 'High') return 'mdi:chevron-double-up'
  if (prio === 'Medium') return 'mdi:chevron-up'
  return 'mdi:chevron-down'
}

function getStatusColor(status: string) {
  if (status === 'Open') return 'blue-7'
  if (status === 'Pending') return 'orange-7'
  return 'green-7'
}

function getStatusBgColor(status: string) {
  if (status === 'Open') return 'blue-1'
  if (status === 'Pending') return 'orange-1'
  return 'green-1'
}
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}
.custom-shadow { box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important; border: 1px solid var(--c-border-strong); }
.border-bottom { border-bottom: 1px solid #f0f0f0; }
.border-top { border-top: 1px solid #f0f0f0; }
.border-all { border: 1px solid var(--c-border-strong); }
.border-amber { border: 1px solid #ffca28; }
.border-teal { border: 1px solid #b2dfdb; }
.custom-radius { border-radius: 8px !important; }
.composer-card { border-radius: 12px; }

.shrink-0 { flex-shrink: 0; }
.tracking-wide { letter-spacing: 0.5px; }

.ticket-item {
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f9f9f9;
}
.ticket-item:hover { background-color: var(--c-surface-2); }
.active-ticket {
  background-color: #f4fbfb !important;
  border-left: 4px solid #0f8b7d;
}

.composer-card :deep(.q-tab--active) {
  border-bottom: 2px solid currentColor;
}
</style>
