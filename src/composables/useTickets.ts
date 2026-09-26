import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { getInitials, getTimeAgo, capitalize } from '@/utils/format'
import { ticketRef, waitingSince } from '@/utils/ticketTriage'

export interface TicketMessage {
  id: string
  authorRole: 'student' | 'agent'
  authorName: string
  authorAvatarUrl: string
  body: string
  isInternal: boolean
  attachments: string[]
  createdAt: string
}

export interface Ticket {
  id: string
  ref: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  assignee: string | null
  assigneeId: string | null
  reporterName: string
  reporterEmail: string
  reporterPhone: string
  reporterRole: 'student' | 'landlord' | 'user'
  accommodationName: string | null
  accommodationId: string | null
  room: string
  landlordName: string | null
  initials: string
  avatarColor: string
  /** The reporter's profile photo, when they have one. */
  avatarUrl: string
  reportedAt: string
  updatedAt: string
  photoUrls: string[]
  messages: TicketMessage[]
  lastPreview: string
  /** The requester's latest message, or the description if they have sent none. */
  lastRequesterText: string
  /** Support's latest public reply, or null if nobody has answered. */
  lastReplyAt: string | null
  /** When the requester started waiting on support; null when they are not (see utils/ticketTriage.ts). */
  waitingSince: string | null
  unread: number
}

const AVATAR_PALETTE = ['teal-6', 'pink-5', 'indigo-5', 'deep-orange-5', 'cyan-7', 'purple-5']

function avatarColorFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length] ?? 'teal-6'
}

const ENRICHED_SELECT = `
  id, ticket_no, subject, description, category, priority, status, assignee_id, reporter_name, reported_at, updated_at, resolved_at, photo_urls, lease_id, student_id, accommodation_id, landlord_id,
  lease:lease_id (
    id,
    student:student_id ( id, full_name, email, phone, avatar_url, student_profiles ( program, college ) ),
    room:room_id ( id, label, accommodation:accommodation_id ( id, name, landlord:landlord_id ( full_name ) ) )
  ),
  reporter:student_id ( id, full_name, email, phone, role, avatar_url ),
  landlord:landlord_id ( id, full_name, email, phone, role, avatar_url ),
  accommodation:accommodation_id ( id, name, landlord:landlord_id ( full_name ) ),
  assignee:assignee_id ( id, full_name ),
  ticket_messages (
    id, body, author_role, is_internal, attachment_urls, created_at,
    author:author_id ( full_name, avatar_url )
  )
`


function safeGet<T = any>(val: any): T | null {
  if (val == null) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

function mapTicket(r: any, seenRequesterMessageIds: Set<string> = new Set()): Ticket {
  const lease = safeGet(r.lease) || {}
  const student = safeGet(lease.student) || {}
  const room = safeGet(lease.room) || {}
  const leaseAccommodation = safeGet(room.accommodation) || {}
  const directAccommodation = safeGet(r.accommodation) || {}
  const accommodation = directAccommodation.id ? directAccommodation : leaseAccommodation
  const landlord = safeGet(accommodation.landlord) || {}
  // Landlord-filed tickets carry no student_id, so the landlord/landlady is the reporter.
  const reporter = safeGet(r.reporter) || safeGet(r.landlord) || {}
  const assignee = safeGet(r.assignee) || {}

  const hasLease = !!lease.id
  const reporterName = r.reporter_name || reporter.full_name || student.full_name || 'Unknown user'
  const reporterRole: 'student' | 'landlord' | 'user' =
    (reporter.role as 'student' | 'landlord' | 'user') || (hasLease ? 'student' : 'user')

  const rawMessages: any[] = r.ticket_messages || []
  const messages: TicketMessage[] = rawMessages
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((m) => ({
      id: m.id,
      authorRole: m.author_role === 'agent' ? 'agent' : 'student',
      authorName: m.author?.full_name || (m.author_role === 'agent' ? 'Agent' : 'Requester'),
      authorAvatarUrl: m.author?.avatar_url || '',
      body: m.body || '',
      isInternal: !!m.is_internal,
      attachments: Array.isArray(m.attachment_urls) ? m.attachment_urls : [],
      createdAt: m.created_at,
    }))

  // Unread = requester messages after the last agent (public) reply.
  let lastAgentIdx = -1
  messages.forEach((m, i) => {
    if (m.authorRole === 'agent' && !m.isInternal) lastAgentIdx = i
  })
  const unread = messages.filter(
    (message, index) =>
      message.authorRole === 'student' &&
      index > lastAgentIdx &&
      !seenRequesterMessageIds.has(message.id),
  ).length

  const subject = r.subject || r.description?.slice(0, 60) || 'Untitled ticket'
  const lastPreview = messages.length ? (messages.at(-1)?.body ?? '') : (r.description || '')
  // What the requester last said — the queue's preview. lastPreview is the
  // latest message of anyone's, which on an answered ticket is OSAS's own
  // canned reply, repeated down every row.
  const lastRequesterText = messages.filter((m) => m.authorRole === 'student').at(-1)?.body || r.description || ''
  const lastReplyAt = messages.filter((m) => m.authorRole === 'agent' && !m.isInternal).at(-1)?.createdAt ?? null

  return {
    id: r.id,
    ref: ticketRef(r.ticket_no, r.id),
    subject,
    description: r.description || '',
    category: r.category || 'others',
    priority: r.priority || 'medium',
    status: r.status || 'open',
    assignee: assignee.full_name || null,
    assigneeId: r.assignee_id || null,
    reporterName,
    reporterEmail: reporter.email || student.email || '',
    reporterPhone: reporter.phone || student.phone || '',
    reporterRole,
    accommodationName: accommodation.name || null,
    accommodationId: accommodation.id || r.accommodation_id || null,
    room: hasLease ? (room.label || '—') : '—',
    landlordName: landlord.full_name || null,
    initials: getInitials(reporterName ?? ''),
    avatarColor: avatarColorFor(r.id),
    avatarUrl: reporter.avatar_url || student.avatar_url || '',
    reportedAt: r.reported_at,
    updatedAt: r.updated_at || r.reported_at,
    photoUrls: Array.isArray(r.photo_urls) ? r.photo_urls : [],
    messages,
    lastPreview,
    lastRequesterText,
    lastReplyAt,
    waitingSince: waitingSince(messages, r.reported_at, r.status || 'open'),
    unread,
  }
}

export function useTickets() {
  const loading = ref(true)
  const error = ref<string | null>(null)
  const notify = useNotify()

  const search = ref('')
  const statusFilter = ref<'open' | 'in_progress' | 'resolved' | 'all' | 'unread'>('all')
  const selectedId = ref<string | null>(null)
  const tickets = ref<Ticket[]>([])
  const agents = ref<{ id: string; full_name: string }[]>([])
  const seenRequesterMessageIds = new Set<string>()

  const currentUserId = ref<string | null>(null)

  const counts = computed(() => {
    const c = { open: 0, in_progress: 0, resolved: 0, unread: 0, all: tickets.value.length }
    for (const t of tickets.value) {
      if (t.status === 'open') c.open++
      else if (t.status === 'in_progress') c.in_progress++
      else if (t.status === 'resolved') c.resolved++
      if (t.unread > 0) c.unread++
    }
    return c
  })

  const filtered = computed(() => {
    let list = tickets.value
    if (statusFilter.value === 'unread') list = list.filter((t) => t.unread > 0)
    else if (statusFilter.value !== 'all') list = list.filter((t) => t.status === statusFilter.value)

    const q = search.value.trim().toLowerCase()
    if (q) {
      list = list.filter((t) =>
        t.subject.toLowerCase().includes(q) ||
        t.reporterName.toLowerCase().includes(q) ||
        t.ref.toLowerCase().includes(q) ||
        (t.accommodationName?.toLowerCase().includes(q) ?? false),
      )
    }
    return list.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  })

  const selectedTicket = computed(() => tickets.value.find((t) => t.id === selectedId.value) || null)

  async function ensureUser() {
    if (currentUserId.value) return
    try {
      const { data } = await supabase.auth.getUser()
      currentUserId.value = data.user?.id || null
    } catch {
      currentUserId.value = null
    }
  }

  async function fetchAgents() {
    try {
      const { data } = await supabase.from('users').select('id, full_name').eq('role', 'admin').order('full_name')
      if (data) agents.value = (data as any[]).map((a) => ({ id: a.id, full_name: a.full_name || 'Admin' }))
    } catch {
      agents.value = []
    }
  }

  async function fetch() {
    loading.value = true
    error.value = null
    await ensureUser()
    await fetchAgents()

    const result = await supabase.from('tickets').select(ENRICHED_SELECT).order('updated_at', { ascending: false })

    if (result.error) {
      console.error('Error fetching tickets:', result.error.message)
      const msg = result.error.message || ''
      error.value = msg
    } else if (result.data) {
      tickets.value = (result.data ?? []).map((row) => mapTicket(row, seenRequesterMessageIds))
    }
    loading.value = false
  }

  async function sendMessage(body: string, opts: { isInternal?: boolean; thenStatus?: string } = {}): Promise<boolean> {
    const ticket = selectedTicket.value
    if (!ticket || !body.trim()) return false
    await ensureUser()
    try {
      const { error: insErr } = await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        author_id: currentUserId.value,
        author_role: 'agent',
        body: body.trim(),
        is_internal: !!opts.isInternal,
      })
      if (insErr) {
        notify.error('Could not send', insErr.message)
        return false
      }
      if (opts.thenStatus && opts.thenStatus !== ticket.status) {
        await updateStatus(opts.thenStatus)
      }
      await fetch()
      return true
    } catch (e) {
      notify.error('Failed to send', e instanceof Error ? e.message : '')
      return false
    }
  }

  async function updateStatus(status: string) {
    const ticket = selectedTicket.value
    if (!ticket) return
    const { error: e } = await supabase.from('tickets').update({ status }).eq('id', ticket.id)
    if (e) notify.error('Could not update status', e.message)
    else await fetch()
  }

  async function setStatus(id: string, status: string) {
    const { error: e } = await supabase.from('tickets').update({ status }).eq('id', id)
    if (e) notify.error('Could not update status', e.message)
    else await fetch()
  }

  async function updatePriority(priority: string) {
    const ticket = selectedTicket.value
    if (!ticket) return
    const { error: e } = await supabase.from('tickets').update({ priority }).eq('id', ticket.id)
    if (e) notify.error('Could not update priority', e.message)
    else await fetch()
  }

  async function assignTo(assigneeId: string | null) {
    const ticket = selectedTicket.value
    if (!ticket) return
    const { error: e } = await supabase.from('tickets').update({ assignee_id: assigneeId }).eq('id', ticket.id)
    if (e) notify.error('Could not assign', e.message)
    else await fetch()
  }

  function selectTicket(id: string) {
    const ticket = tickets.value.find((item) => item.id === id)
    if (ticket) {
      let lastPublicAgentIndex = -1
      ticket.messages.forEach((message, index) => {
        if (message.authorRole === 'agent' && !message.isInternal) lastPublicAgentIndex = index
      })
      ticket.messages.forEach((message, index) => {
        if (message.authorRole === 'student' && index > lastPublicAgentIndex) {
          seenRequesterMessageIds.add(message.id)
        }
      })
      ticket.unread = 0
    }
    selectedId.value = id
  }

  return {
    loading,
    error,
    search,
    statusFilter,
    currentUserId,
    agents,
    tickets: filtered,
    allTickets: tickets,
    counts,
    selectedTicket,
    selectedId,
    capitalize,
    getTimeAgo,
    fetch,
    sendMessage,
    updateStatus,
    setStatus,
    updatePriority,
    assignTo,
    selectTicket,
  }
}
