// Audit-log row mapping — pure functions, no Vue dependency. Turns a raw
// audit_logs row (full before/after row snapshots written by
// fn_audit_log_change, or a hand-written `verification.*` / `accommodation.*`
// entry) into an event an admin can read: "System Admin published announcement
// "Water interruption"", plus every field that changed.

import type { StatusTone } from '@/utils/status.config'
import { fmtDate, formatDateTime, humanizeEnum, utcIso, utcMs } from '@/utils/format'
import { ticketRef } from '@/utils/ticketTriage'

// `humanizeEnum` renders a missing value as an em dash; field names never are.
export function label(s: string) {
  return s ? humanizeEnum(s) : ''
}

export { fmtDate }

export type AuditArea = 'accounts' | 'accommodations' | 'payments' | 'tickets' | 'announcements' | 'verification' | 'other'

export const AREA_LABEL: Record<AuditArea, string> = {
  accounts: 'Accounts',
  accommodations: 'Accommodations',
  payments: 'Payments & leases',
  tickets: 'Support tickets',
  announcements: 'Announcements & policies',
  verification: 'Verification',
  other: 'Other',
}

export type AuditChange = { key: string; field: string; old: string; new: string }

export type AuditEvent = {
  id: string
  at: number
  dayKey: string
  time: string
  action: string
  /** Stable per person: the actor's id, the signed-in/up user's id, or 'system'. */
  actor: { key: string; name: string; initials: string; role: string; color: string; isSystem: boolean }
  verb: string
  entityLabel: string
  name: string
  sentence: string
  hint: string
  changes: AuditChange[]
  noop: boolean
  area: AuditArea
  link: string | null
  entityId: string
  ip: string
  userAgent: string
}

// Only `updated_at` moves on every write; anything else that changed is news.
const IGNORED = new Set(['updated_at'])
const MONEY = new Set(['amount', 'monthly_rent'])

const ENTITY_LABEL: Record<string, string> = {
  users: 'account',
  user: 'account',
  student_profiles: 'student profile',
  landlord_profiles: 'landlord/landlady profile',
  accommodation_manager_profiles: 'landlord/landlady profile',
  admin_profiles: 'admin profile',
  account_standing: 'account standing',
  accommodations: 'accommodation',
  accommodation: 'accommodation',
  rooms: 'room',
  leases: 'lease',
  payments: 'payment',
  tickets: 'support ticket',
  announcements: 'announcement',
  policies: 'policy',
  verification_documents: 'requirement',
}

const AREA_OF: Record<string, AuditArea> = {
  users: 'accounts', user: 'accounts', student_profiles: 'accounts', landlord_profiles: 'accounts',
  accommodation_manager_profiles: 'accounts', admin_profiles: 'accounts', account_standing: 'accounts',
  accommodations: 'accommodations', accommodation: 'accommodations', rooms: 'accommodations',
  leases: 'payments', payments: 'payments',
  tickets: 'tickets',
  announcements: 'announcements', policies: 'announcements',
  verification_documents: 'verification',
}

const CREATE_VERB: Record<string, string> = {
  accommodations: 'added',
  rooms: 'added',
  leases: 'started',
  payments: 'recorded',
  tickets: 'opened',
  announcements: 'drafted',
  policies: 'created',
  verification_documents: 'uploaded',
  student_profiles: 'completed',
  landlord_profiles: 'completed',
  accommodation_manager_profiles: 'completed',
  admin_profiles: 'completed',
}

// A status landing on one of these reads as a verb of its own.
const STATUS_VERB: Record<string, string> = {
  accredited: 'accredited',
  verified: 'verified',
  suspended: 'suspended',
  rejected: 'rejected',
  needs_resubmission: 'asked for new requirements from',
  approved: 'approved',
  resolved: 'resolved',
  closed: 'closed',
  paid: 'marked as paid',
  ended: 'ended',
}

const CUSTOM_VERB: Record<string, string> = {
  'verification.approve': 'approved verification of',
  'verification.approved': 'approved verification of',
  'verification.rejected': 'rejected verification of',
  'verification.reject': 'rejected verification of',
  'verification.resubmit': 'asked for new requirements from',
  'accommodation.suspend': 'suspended',
  'accommodation.restore': 'restored accreditation of',
  'accommodation.hide': 'hid from listings',
  'accommodation.unhide': 'showed in listings',
}

function peso(v: unknown): string {
  const n = Number(v)
  return isNaN(n) ? String(v) : '₱' + n.toLocaleString('en-PH', { maximumFractionDigits: 2 })
}

export function formatValue(key: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (MONEY.has(key)) return peso(v)
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'object') return Array.isArray(v) && v.length === 0 ? '—' : JSON.stringify(v)
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return formatDateTime(utcIso(s)!)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return fmtDate(s + 'T00:00:00')
  if (/^[a-z]+(_[a-z]+)*$/.test(s)) return humanizeEnum(s)
  return s
}

export function diffRows(before: any, after: any): AuditChange[] {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return []
  return Object.keys({ ...before, ...after })
    .filter((k) => !IGNORED.has(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map((k) => ({ key: k, field: label(k), old: formatValue(k, before[k]), new: formatValue(k, after[k]) }))
}

// A readable name for the affected record, from its row snapshot.
function entityName(entityType: string, row: any): string {
  const json = row && typeof row === 'object' ? row : {}
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = json[k]
      if (v !== null && v !== undefined && v !== '') return String(v)
    }
    return ''
  }
  switch (entityType) {
    case 'users':
    case 'user': return pick('full_name', 'email')
    case 'student_profiles':
    case 'landlord_profiles':
    case 'accommodation_manager_profiles':
    case 'admin_profiles': return pick('business_name', 'full_name')
    case 'accommodations':
    case 'accommodation': return pick('name', 'address')
    case 'rooms': return pick('label', 'room_number')
    case 'payments': return json.amount != null ? peso(json.amount) + (json.description ? ' · ' + json.description : '') : ''
    // Tickets are never merged, so two can share a subject; the number tells them apart.
    case 'tickets': return json.id ? `${ticketRef(json.ticket_no, json.id)} · ${pick('subject', 'category')}` : pick('subject', 'category')
    case 'announcements':
    case 'policies': return pick('title')
    case 'verification_documents': return pick('filename', 'doc_type')
    default: return pick('name', 'title', 'label', 'subject')
  }
}

function recordLink(entityType: string, entityId: string, row: any): string | null {
  const r = row && typeof row === 'object' ? row : {}
  switch (entityType) {
    case 'users':
    case 'user':
    case 'student_profiles':
    case 'landlord_profiles':
    case 'accommodation_manager_profiles':
    case 'admin_profiles':
    case 'account_standing': return `/users?user=${r.user_id ?? r.id ?? entityId}`
    case 'verification_documents': return r.user_id ? `/users?user=${r.user_id}` : null
    case 'leases': return r.student_id ? `/users?user=${r.student_id}` : null
    case 'accommodations':
    case 'accommodation': return `/accommodation-hub?accommodation=${entityId}`
    case 'rooms': return r.accommodation_id ? `/accommodation-hub?accommodation=${r.accommodation_id}` : null
    case 'tickets': return `/support-tickets?focus=ticket:${entityId}`
    case 'announcements':
    case 'policies': return '/announcements'
    default: return null
  }
}

// The verb for an UPDATE, read from what changed. Most specific first.
function updateVerb(entityType: string, changes: AuditChange[], before: any, after: any): string {
  const has = (k: string) => changes.some((c) => c.key === k)
  if (has('published_at')) return after?.published_at ? 'published' : 'unpublished'
  if (has('archived')) return after?.archived ? 'archived' : 'restored'
  if (has('revision') && Number(after?.revision) > Number(before?.revision)) return 'published a new version of'
  if (has('status')) {
    const s = String(after?.status ?? '')
    // `reviewing` means a reviewer has the request open, not a decision.
    if (s === 'reviewing') return 'opened the review of'
    if (before?.status === 'reviewing' && s === 'pending') return 'closed the review of'
    // Otherwise the hint line carries "Old → New".
    return STATUS_VERB[s] ?? 'changed the status of'
  }
  if (has('role')) return 'changed the role of'
  if (entityType === 'users' && changes.length === 1 && changes[0]!.key === 'last_login_at') return 'signed in'
  return 'updated'
}

function hintFor(changes: AuditChange[], verb: string): string {
  if (!changes.length || verb.includes('the review of')) return ''
  const status = changes.find((c) => c.key === 'status')
  if (status) return `${status.old} → ${status.new}`
  if (verb !== 'updated') return ''
  const names = changes.slice(0, 3).map((c) => c.field).join(', ')
  return changes.length > 3 ? `${names} +${changes.length - 3} more` : names
}

export function dayKeyOf(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "Today", "Yesterday", "Mon, Sep 26" — with the year when it isn't this one. */
export function dayLabelOf(dayKey: string, now = new Date()): string {
  if (dayKey === dayKeyOf(now.getTime())) return 'Today'
  if (dayKey === dayKeyOf(now.getTime() - 86_400_000)) return 'Yesterday'
  const d = new Date(dayKey + 'T00:00:00')
  return d.toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

export function mapLog(row: any): AuditEvent {
  const entityType: string = row.entity_type || 'record'
  const snapshot = row.after_json || row.before_json || {}
  const changes = diffRows(row.before_json, row.after_json)
  const name = entityName(entityType, snapshot)
  const entityLabel = ENTITY_LABEL[entityType] ?? label(entityType).toLowerCase()

  let verb: string
  let subjectIsRecord = false
  if (CUSTOM_VERB[row.action]) verb = CUSTOM_VERB[row.action]!
  else if (row.action === 'CREATE' && entityType === 'users') { verb = 'signed up'; subjectIsRecord = true }
  else if (row.action === 'CREATE') verb = entityType === 'announcements' && snapshot.published_at ? 'published' : (CREATE_VERB[entityType] ?? 'created')
  else if (row.action === 'DELETE') verb = 'deleted'
  else if (row.action === 'UPDATE') verb = updateVerb(entityType, changes, row.before_json, row.after_json)
  else verb = label(row.action).toLowerCase()
  if (verb === 'signed in') subjectIsRecord = true

  // Sign-ups and sign-ins are the user's own doing, even though the auth
  // trigger that writes them has no session and so no actor.
  const actorRow = row.actor
  const isSystem = !actorRow && !subjectIsRecord
  const actorName = actorRow?.full_name || (subjectIsRecord ? name : '') || (isSystem ? 'System' : 'Unknown user')
  const at = utcMs(row.created_at) ?? 0

  const object = subjectIsRecord ? '' : ` ${entityLabel}${name ? ` "${name}"` : ''}`
  const sentence = `${actorName} ${verb}${object}`

  const area: AuditArea = row.action?.startsWith('verification.') ? 'verification' : (AREA_OF[entityType] ?? 'other')

  return {
    id: row.id,
    at,
    dayKey: dayKeyOf(at),
    time: new Date(at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }),
    action: row.action,
    actor: {
      key: row.actor_id ?? (subjectIsRecord ? row.entity_id : 'system'),
      name: actorName,
      initials: actorRow?.initials || '',
      role: isSystem ? 'Automated' : label(String(actorRow?.role || (subjectIsRecord ? snapshot.role ?? '' : ''))),
      color: isSystem ? 'grey-8' : (actorRow?.avatar_color || 'teal-7'),
      isSystem,
    },
    verb,
    entityLabel,
    name,
    sentence,
    hint: hintFor(changes, verb),
    changes,
    noop: row.action === 'UPDATE' && changes.length === 0,
    area,
    link: recordLink(entityType, row.entity_id, snapshot),
    entityId: row.entity_id,
    ip: row.ip_address || '—',
    userAgent: row.user_agent || '—',
  }
}

/**
 * The hand-written `verification.*` / `accommodation.*` entries snapshot only
 * the status, so they carry no name; the page looks the name up and sets it here.
 */
export function withName(ev: AuditEvent, name: string): AuditEvent {
  return { ...ev, name, sentence: `${ev.actor.name} ${ev.verb} ${ev.entityLabel} "${name}"` }
}

/** Which table to look a missing name up in, for events that need one. */
export function nameSource(ev: AuditEvent): 'users' | 'accommodations' | null {
  if (ev.name || ev.verb === 'signed up' || ev.verb === 'signed in') return null
  if (ev.entityLabel === 'account') return 'users'
  if (ev.entityLabel === 'accommodation') return 'accommodations'
  return null
}

export function getActionColor(ev: Pick<AuditEvent, 'action' | 'verb'>): StatusTone {
  if (/deleted|rejected|suspended|archived|unpublished/.test(ev.verb)) return 'danger'
  if (ev.action === 'CREATE' || /approved|accredited|verified|published|restored|resolved/.test(ev.verb)) return 'success'
  if (ev.verb === 'signed in' || ev.verb === 'signed up') return 'info'
  return 'neutral'
}
