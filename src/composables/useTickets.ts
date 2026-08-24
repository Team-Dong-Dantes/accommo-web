import { ref, computed, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { getInitials, getTimeAgo, capitalize } from '@/utils/format'

export interface TicketMessage {
  id: string
  authorRole: 'student' | 'agent'
  authorName: string
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
  propertyName: string | null
  propertyId: string | null
  room: string
  landlordName: string | null
  initials: string
  avatarColor: string
  reportedAt: string
  updatedAt: string
  photoUrls: string[]
  messages: TicketMessage[]
  lastPreview: string
  unread: number
}

const AVATAR_PALETTE = ['teal-6', 'pink-5', 'indigo-5', 'deep-orange-5', 'cyan-7', 'purple-5']

function avatarColorFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length] ?? 'teal-6'
}

const ENRICHED_SELECT = `
  id, subject, description, category, priority, status, assignee_id, reported_at, updated_at, resolved_at, photo_urls, lease_id,
  lease:lease_id (
    id,
    student:student_id ( id, full_name, email, phone, student_profiles ( program, college ) ),
    room:room_id ( id, label, property:property_id ( id, name, landlord:landlord_id ( full_name ) ) )
  ),
  assignee:assignee_id ( id, full_name ),
  ticket_messages (
    id, body, author_role, is_internal, attachment_urls, created_at,
    author:author_id ( full_name )
  )
`

const BASE_SELECT = `
  id, description, category, status, reported_at, resolved_at, photo_urls, lease_id,
  lease:lease_id (
    id,
    student:student_id ( id, full_name, email, phone, student_profiles ( program, college ) ),
    room:room_id ( id, label, property:property_id ( id, name, landlord:landlord_id ( full_name ) ) )
  )
`

function safeGet<T = any>(val: any): T | null {
  if (val == null) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

function mapTicket(r: any): Ticket {
  const lease = safeGet(r.lease) || {}
  const student = safeGet(lease.student) || {}
  const studentProfile = safeGet(student.student_profiles) || {}
  const room = safeGet(lease.room) || {}
  const property = safeGet(room.property) || {}
  const landlord = safeGet(property.landlord) || {}
  const reporter = safeGet(r.reporter) || {}
  const assignee = safeGet(r.assignee) || {}

  const hasLease = !!lease.id
  const reporterName = reporter.full_name || student.full_name || 'Unknown user'
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
  const unread = messages.filter((m, i) => m.authorRole === 'student' && i > lastAgentIdx).length

  const subject = r.subject || r.description?.slice(0, 60) || 'Untitled concern'
  const lastPreview = messages.length ? (messages.at(-1)?.body ?? '') : (r.description || '')

  return {
    id: r.id,
    ref: 'TKT-' + r.id.replace(/-/g, '').slice(0, 4).toUpperCase(),
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
    propertyName: hasLease ? (property.name || 'Unknown property') : null,
    propertyId: hasLease ? (property.id || null) : null,
    room: hasLease ? (room.label || '—') : '—',
    landlordName: hasLease ? (landlord.full_name || 'Unknown landlord') : null,
    initials: getInitials(reporterName ?? ''),
    avatarColor: avatarColorFor(r.id),
    reportedAt: r.reported_at,
    updatedAt: r.updated_at || r.reported_at,
    photoUrls: Array.isArray(r.photo_urls) ? r.photo_urls : [],
    messages,
    lastPreview,
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
        (t.propertyName?.toLowerCase().includes(q) ?? false),
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

    let result: any = await (supabase as any).from('tickets').select(ENRICHED_SELECT).order('updated_at', { ascending: false })
    // Fallback when the ticket_support migration hasn't been applied yet
    // (missing subject/priority/assignee_id columns or ticket_messages table).
    if (result.error) {
      const msg = result.error.message || ''
      if (/does not exist|ticket_messages|priority|subject/.test(msg)) {
        result = await (supabase as any).from('tickets').select(BASE_SELECT).order('reported_at', { ascending: false })
        if (!result.error) {
          error.value =
            'Ticket features are limited — apply the 20260821_ticket_support migration to enable threads, priority & assignment.'
        }
      }
    }

    if (result.error) {
      console.error('Error fetching tickets:', result.error.message)
      const msg = result.error.message || ''
      if (/does not exist|could not find the table|ticket_messages|priority|subject/i.test(msg)) {
        error.value =
          'Ticket support tables are not set up yet — apply the 20260821_ticket_support migration (supabase db push) to enable the inbox.'
      } else {
        error.value = msg
      }
    } else if (result.data) {
      tickets.value = (result.data as any[]).map(mapTicket)
    }
    loading.value = false
  }

  async function sendMessage(body: string, opts: { isInternal?: boolean; thenStatus?: string } = {}) {
    const ticket = selectedTicket.value
    if (!ticket || !body.trim()) return
    await ensureUser()
    try {
      const { error: insErr } = await (supabase as any).from('ticket_messages').insert({
        ticket_id: ticket.id,
        author_id: currentUserId.value,
        author_role: 'agent',
        body: body.trim(),
        is_internal: !!opts.isInternal,
      } as any)
      if (insErr) {
        notify.error('Could not send', insErr.message)
        return
      }
      if (opts.thenStatus && opts.thenStatus !== ticket.status) {
        await updateStatus(opts.thenStatus)
      }
      await fetch()
      notify.success(opts.isInternal ? 'Internal note saved' : 'Reply sent')
    } catch (e: any) {
      notify.error('Failed to send', e?.message)
    }
  }

  async function updateStatus(status: string) {
    const ticket = selectedTicket.value
    if (!ticket) return
    const { error: e } = await (supabase as any).from('tickets').update({ status } as any).eq('id', ticket.id)
    if (e) notify.error('Could not update status', e.message)
    else await fetch()
  }

  async function setStatus(id: string, status: string) {
    const { error: e } = await (supabase as any).from('tickets').update({ status } as any).eq('id', id)
    if (e) notify.error('Could not update status', e.message)
    else await fetch()
  }

  async function updatePriority(priority: string) {
    const ticket = selectedTicket.value
    if (!ticket) return
    const { error: e } = await (supabase as any).from('tickets').update({ priority } as any).eq('id', ticket.id)
    if (e) notify.error('Could not update priority', e.message)
    else await fetch()
  }

  async function assignTo(assigneeId: string | null) {
    const ticket = selectedTicket.value
    if (!ticket) return
    const { error: e } = await (supabase as any).from('tickets').update({ assignee_id: assigneeId } as any).eq('id', ticket.id)
    if (e) notify.error('Could not assign', e.message)
    else await fetch()
  }

  function selectTicket(id: string) {
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
