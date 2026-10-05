import { supabase } from '@/utils/supabase'
import { mapLog, nameSource, withName, type AuditEvent } from '@/features/audit/logMapping'

export const AUDIT_COLUMNS = `
  id, action, created_at, actor_id, entity_id, entity_type, ip_address, user_agent,
  before_json, after_json,
  actor:users ( full_name, initials, role, avatar_color )
`

// Name the records that hand-written entries left nameless — one query per table.
export async function fillNames(events: AuditEvent[]): Promise<AuditEvent[]> {
  const ids = { users: new Set<string>(), accommodations: new Set<string>() }
  for (const ev of events) {
    const src = nameSource(ev)
    if (src) ids[src].add(ev.entityId)
  }
  const names = new Map<string, string>()
  const [users, accs] = await Promise.all([
    ids.users.size ? supabase.from('users').select('id, full_name').in('id', [...ids.users]) : null,
    ids.accommodations.size ? supabase.from('accommodations').select('id, name').in('id', [...ids.accommodations]) : null,
  ])
  for (const u of users?.data ?? []) names.set(u.id, u.full_name)
  for (const a of accs?.data ?? []) names.set(a.id, a.name)
  return events.map((ev) => (nameSource(ev) && names.has(ev.entityId) ? withName(ev, names.get(ev.entityId)!) : ev))
}

// Record activity goes through audit_entry()/record_activity(): audit_logs
// itself is readable by the system admin only, and these check the admin's
// Activity history access (device details only at "Changes & device").

/** One audit entry, fully mapped — what the audit drawer shows. */
export async function fetchAuditEvent(id: string): Promise<AuditEvent | null> {
  const { data, error } = await supabase.rpc('audit_entry', { p_id: id })
  if (error) throw error
  if (!data) return null
  const [ev] = await fillNames([mapLog(data)])
  return ev ?? null
}

/** A record's raw audit rows (shaped like AUDIT_COLUMNS), newest first. */
type AuditRow = Parameters<typeof mapLog>[0]

export async function fetchRecordAuditRows(entityTypes: string[], entityId: string, limit = 100): Promise<AuditRow[]> {
  const { data, error } = await supabase.rpc('record_activity', { p_types: entityTypes, p_entity: entityId, p_limit: limit })
  if (error) throw error
  return (data ?? []) as AuditRow[]
}

/** A record's audit entries, mapped, newest first. */
export async function fetchRecordAudit(entityTypes: string[], entityId: string, limit = 100): Promise<AuditEvent[]> {
  return fillNames((await fetchRecordAuditRows(entityTypes, entityId, limit)).map(mapLog))
}
