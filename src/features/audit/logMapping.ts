// Audit-log row mapping + diffing — pure functions, no Vue dependency.
// Extracted verbatim from pages/admin/AuditLogs.vue; also used by the
// realtime INSERT upsert on that page.

import type { StatusTone } from '@/utils/status.config'
import { humanizeEnum } from '@/utils/format'

// Kept as a named re-export so the existing callers in this feature don't churn;
// the implementation moved to utils/format.ts, which is where shared string
// helpers live (ARCHITECTURE.md rule 4).
// `humanizeEnum` renders a missing value as an em dash; this surface has always
// rendered it as an empty cell, so keep that rather than change the table.
export function label(s: string) {
  return s ? humanizeEnum(s) : ''
}

export function fmtDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtTime(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

function formatVal(v: unknown) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// Columns that change on *every* write (timestamps/sync bookkeeping) and would
// produce noisy diffs. Skipped so the first meaningful change is surfaced.
const IGNORED_DIFF_KEYS = new Set([
  'updated_at', 'last_login_at', 'created_at', 'email_verified_at',
  'accredited_at', 'verified_at', 'uploaded_at', 'issued_at', 'expires_at'
])

// Full-row snapshot → a single human-readable change line (first meaningful diff).
// Aggregate diffs (beyond the first) are summarized as "+N more fields".
function diffJson(before: any, after: any, _entityType: string): any {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return null
  const keys = Object.keys({ ...before, ...after }).filter(k => !IGNORED_DIFF_KEYS.has(k))

  if (keys.length === 0) return null

  const changed = keys.filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
  if (changed.length === 0) return null

  // Prefer a semantic "status" field if it changed, else the first changed field.
  const preferred = changed.find(k => k === 'status') ?? changed[0]!

  const first = {
    field: label(preferred),
    old: formatVal(before[preferred]),
    new: formatVal(after[preferred])
  }
  return changed.length > 1
    ? { ...first, more: `${changed.length - 1} more field${changed.length > 2 ? 's' : ''}` }
    : first
}

// Derive a human-readable name for the affected entity from the full-row snapshot.
function entityDisplayName(entityType: string, row: any): string {
  const json = row && typeof row === 'object' ? row : {}
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = json[k]
      if (v !== null && v !== undefined && v !== '') return String(v)
    }
    return ''
  }
  switch (entityType) {
    case 'users': return pick('full_name', 'email', 'phone')
    case 'student_profiles':
    case 'accommodation_manager_profiles':
    case 'admin_profiles': return pick('business_name', 'full_name', 'user_id')
    case 'accommodations': return pick('name', 'address', 'city')
    case 'rooms': return pick('label', 'room_number', 'room_id')
    case 'leases': return pick('id', 'room_id', 'student_id')
    case 'payments': return pick('description', 'txn_reference', 'id')
    case 'tickets': return pick('description', 'category', 'id')
    case 'announcements': return pick('title', 'id')
    case 'policies': return pick('title', 'version', 'id')
    case 'verification_documents': return pick('filename', 'doc_type', 'id')
    default: return pick('name', 'title', 'label', 'subject', 'id')
  }
}

export function mapLog(row: any) {
  const actor = row.actor
  const isSystem = !actor
  const entityType = row.entity_type || 'record'
  const entityTypeLabel = label(entityType)
  const sourceJson = row.after_json || row.before_json || {}
  const entityName = entityDisplayName(entityType, sourceJson) || row.entity_id
  const changes = diffJson(row.before_json, row.after_json, entityType)

  return {
    id: row.id,
    date: fmtDate(row.created_at),
    time: fmtTime(row.created_at),
    createdAt: row.created_at,
    action: row.action,
    actor: {
      name: isSystem ? 'System Automator' : (actor.full_name || 'Unknown User'),
      initials: isSystem ? '' : (actor.initials || ''),
      role: isSystem ? 'Automated Process' : label(String(actor.role || '')),
      color: isSystem ? 'grey-8' : (actor.avatar_color || 'teal-7'),
      isSystem
    },
    target: {
      type: entityTypeLabel,
      name: entityName,
      id: row.entity_id
    },
    changes,
    description: changes ? null : `${row.action} on ${entityTypeLabel}`,
    ip: row.ip_address || '—'
  }
}

export function getActionColor(action: string): { tone: StatusTone } {
  switch(action) {
    case 'CREATE': return { tone: 'success' }
    case 'APPROVE': return { tone: 'success' }
    case 'UPDATE': return { tone: 'info' }
    case 'DELETE': return { tone: 'danger' }
    case 'REJECT': return { tone: 'danger' }
    case 'AUTH': return { tone: 'warning' }
    case 'SYSTEM': return { tone: 'primary' }
    default: return { tone: 'neutral' }
  }
}
