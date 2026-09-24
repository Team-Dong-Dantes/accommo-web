// Data access for OSAS's controls over a person's account — pure fetchers.
//
// Every status change goes through admin_set_account_status(), which records
// the reason, writes the decision trail and notifies the person in one step, so
// no caller can do half of it.

import { supabase } from '@/utils/supabase'
import type { Database } from '@/types/database.gen'

export type AccountStatus = Database['public']['Enums']['user_status']
/** apply: a student may not apply for rooms. listings: a landlord/landlady's accommodations are hidden. */
export type Restriction = 'apply' | 'listings'

export interface AccountStanding {
  reason: string | null
  suspendedUntil: string | null
  restrictions: Restriction[]
}

export const NO_STANDING: AccountStanding = { reason: null, suspendedUntil: null, restrictions: [] }

export async function fetchAccountStanding(userId: string): Promise<AccountStanding> {
  const { data, error } = await supabase
    .from('account_standing')
    .select('reason, suspended_until, restrictions')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return NO_STANDING
  return {
    reason: data.reason,
    suspendedUntil: data.suspended_until,
    restrictions: (data.restrictions ?? []) as Restriction[],
  }
}

export async function setAccountStatus(
  userId: string,
  status: AccountStatus,
  opts: { reason?: string | null; until?: string | null; restrictions?: Restriction[] } = {},
): Promise<void> {
  const args: Database['public']['Functions']['admin_set_account_status']['Args'] = { p_user: userId, p_status: status }
  if (opts.reason) args.p_reason = opts.reason
  if (opts.until) args.p_until = opts.until
  if (opts.restrictions) args.p_restrictions = opts.restrictions
  const { error } = await supabase.rpc('admin_set_account_status', args)
  if (error) throw error
}

/** One change to the account, from `audit_logs`, newest first. */
export interface AccountEvent {
  /** UPDATE for a row change, or account.* for a sign-in action. */
  action: string
  table: string
  createdAt: string
  actorName: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

export async function fetchAccountEvents(userId: string, limit = 30): Promise<AccountEvent[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, entity_type, created_at, before_json, after_json, actor:users!audit_logs_actor_id_fkey(full_name)')
    .in('entity_type', ['users', 'account_standing'])
    .eq('entity_id', userId)
    .in('action', ['UPDATE', 'account.sign_out_everywhere', 'account.disconnect_google', 'account.email_changed', 'account.temp_password', 'account.closed'])
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((r) => {
    const actor = Array.isArray(r.actor) ? r.actor[0] : r.actor
    return {
      action: r.action,
      table: r.entity_type,
      createdAt: r.created_at,
      actorName: (actor as { full_name?: string } | null)?.full_name ?? null,
      before: r.before_json as Record<string, unknown> | null,
      after: r.after_json as Record<string, unknown> | null,
    }
  })
}

export interface AccountNote {
  id: string
  body: string
  createdAt: string
  authorId: string | null
  authorName: string
}

export async function fetchAccountNotes(userId: string): Promise<AccountNote[]> {
  const { data, error } = await supabase
    .from('account_notes')
    .select('id, body, created_at, author_id, author:users!account_notes_author_id_fkey(full_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((n) => {
    const author = Array.isArray(n.author) ? n.author[0] : n.author
    return {
      id: n.id,
      body: n.body,
      createdAt: n.created_at,
      authorId: n.author_id,
      authorName: (author as { full_name?: string } | null)?.full_name || 'A former admin',
    }
  })
}

export async function addAccountNote(userId: string, authorId: string, body: string): Promise<void> {
  const { error } = await supabase.from('account_notes').insert({ user_id: userId, author_id: authorId, body })
  if (error) throw error
}

export async function deleteAccountNote(id: string): Promise<void> {
  const { error } = await supabase.from('account_notes').delete().eq('id', id)
  if (error) throw error
}

/** A message from OSAS in the person's notifications. Their app shows it; nothing is e-mailed. */
export async function sendUserNotification(userId: string, title: string, body: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type: 'system', title, body, link_url: '/profile', source: 'osas' })
  if (error) throw error
}

// ── Sign-in ─────────────────────────────────────────────────────────────────

export interface SignInMethods {
  hasPassword: boolean
  hasGoogle: boolean
  lastSignInAt: string | null
}

export async function fetchSignInMethods(userId: string): Promise<SignInMethods> {
  const { data, error } = await supabase.rpc('admin_sign_in_methods', { p_user: userId })
  if (error) throw error
  const row = (data ?? [])[0]
  return {
    hasPassword: !!row?.has_password,
    hasGoogle: !!row?.has_google,
    lastSignInAt: row?.last_sign_in_at ?? null,
  }
}

/** Ends every session; returns how many there were. */
export async function signOutEverywhere(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('admin_sign_out_everywhere', { p_user: userId })
  if (error) throw error
  return data ?? 0
}

export async function disconnectGoogle(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_disconnect_google', { p_user: userId })
  if (error) throw error
}

/** The manage-user edge function: what only auth's admin API can do. */
async function manageUser<T>(body: Record<string, unknown>): Promise<T> {
  const { data: sess } = await supabase.auth.getSession()
  const token = sess.session?.access_token
  const { data, error } = await supabase.functions.invoke('manage-user', {
    body,
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  })
  if (error) throw error
  if (!data?.ok) throw new Error(data?.error || 'That did not go through.')
  return data as T
}

export async function changeSignInEmail(userId: string, email: string): Promise<void> {
  await manageUser({ action: 'change_email', target_id: userId, email })
}

/** Returns the generated password — shown to OSAS once, never stored. */
export async function setTemporaryPassword(userId: string): Promise<string> {
  const res = await manageUser<{ temporary_password: string }>({ action: 'set_temp_password', target_id: userId })
  return res.temporary_password
}

// ── Profile corrections ─────────────────────────────────────────────────────

export interface EditableProfile {
  fullName: string
  sex: 'M' | 'F' | null
  dateOfBirth: string | null
  phone: string
  /** Students only. */
  student: { college: string | null; program: string | null; yearLevel: number | null; studentId: string | null } | null
}

export async function fetchEditableProfile(userId: string): Promise<EditableProfile> {
  const [u, sp] = await Promise.all([
    supabase.from('users').select('full_name, sex, date_of_birth, phone, role').eq('id', userId).single(),
    supabase.from('student_profiles').select('college, program, year_level, student_id').eq('user_id', userId).maybeSingle(),
  ])
  if (u.error) throw u.error
  const sex = String(u.data.sex ?? '').trim().toUpperCase()
  return {
    fullName: u.data.full_name ?? '',
    sex: sex === 'M' || sex === 'F' ? sex : null,
    dateOfBirth: u.data.date_of_birth,
    phone: u.data.phone ?? '',
    student: u.data.role === 'student'
      ? {
          college: sp.data?.college ?? null,
          program: sp.data?.program ?? null,
          yearLevel: sp.data?.year_level ?? null,
          studentId: sp.data?.student_id ?? null,
        }
      : null,
  }
}

/** Direct writes under users_update_admin / admin_all_student_profiles; the audit trigger records old and new. */
export async function saveEditableProfile(userId: string, p: EditableProfile): Promise<void> {
  const initials = p.fullName.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const { error } = await supabase
    .from('users')
    .update({ full_name: p.fullName.trim(), initials, sex: p.sex, date_of_birth: p.dateOfBirth, phone: p.phone.trim() })
    .eq('id', userId)
  if (error) throw error
  if (p.student) {
    const { error: spError } = await supabase
      .from('student_profiles')
      .update({
        college: p.student.college,
        program: p.student.program,
        year_level: p.student.yearLevel,
        student_id: p.student.studentId?.trim() || null,
      })
      .eq('user_id', userId)
    if (spError) throw spError
  }
}

// ── The far-reaching ones ───────────────────────────────────────────────────

/** Resets their registration to the other role; they re-register on their next sign-in. */
export async function changeRole(userId: string, role: 'student' | 'landlord', reason: string): Promise<void> {
  const { error } = await supabase.rpc('admin_change_role', { p_user: userId, p_role: role, p_reason: reason })
  if (error) throw error
}

/** Main admin only. Anonymizes — the row stays for the other party's records. */
export async function closeAccount(userId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('admin_close_account', { p_user: userId, p_reason: reason })
  if (error) throw error
}

export async function fetchClosedAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('users').select('closed_at').eq('id', userId).single()
  if (error) throw error
  return data.closed_at
}

/**
 * A support ticket OSAS opens on the person's behalf. It starts in progress (it
 * is OSAS's own, so the new-ticket alert to admins would be noise) and its first
 * message is OSAS's, which notifies the person through the usual reply trigger.
 */
export async function openTicketFor(
  userId: string,
  role: 'student' | 'landlord',
  actorId: string,
  subject: string,
  body: string,
): Promise<void> {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      subject,
      description: body,
      category: 'other',
      status: 'in_progress',
      assignee_id: actorId,
      ...(role === 'student' ? { student_id: userId } : { landlord_id: userId }),
    })
    .select('id')
    .single()
  if (error) throw error
  const { error: msgError } = await supabase
    .from('ticket_messages')
    .insert({ ticket_id: ticket.id, author_id: actorId, author_role: 'agent', body })
  if (msgError) throw msgError
}
