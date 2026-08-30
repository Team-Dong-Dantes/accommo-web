// Data access for users — pure fetchers, no reactive state.

import { supabase } from '@/utils/supabase'

export interface PendingUserRow {
  id: string
  full_name: string | null
  created_at: string | null
  role: string
  status: string
}

export async function fetchAdminName(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return null
  const { data, error } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', session.user.id)
    .maybeSingle()
  if (error) return null
  return (data as { full_name: string | null } | null)?.full_name ?? null
}

export async function fetchStudentCount(): Promise<number> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
  if (error) throw error
  return count ?? 0
}

export async function fetchNewStudentCount(sinceIso: string): Promise<number> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .gte('created_at', sinceIso)
  if (error) throw error
  return count ?? 0
}

export async function fetchPendingUserRows(): Promise<PendingUserRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, created_at, role, status')
    .in('status', ['pending', 'reviewing'])
    .order('created_at', { ascending: false })
    .limit(6)
  if (error) throw error
  return (data ?? []) as unknown as PendingUserRow[]
}

export async function fetchUnverifiedUserCount(): Promise<number> {
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'reviewing'])
  if (error) throw error
  return count ?? 0
}

export async function fetchUserRoles(): Promise<string[]> {
  const { data, error } = await supabase.from('users').select('role')
  if (error) throw error
  return ((data ?? []) as Array<{ role: string | null }>).map((r) => r.role ?? '')
}

export async function fetchRegistrationsSince(sinceIso: string): Promise<Array<{ created_at: string | null; role: string }>> {
  const { data, error } = await supabase
    .from('users')
    .select('created_at, role')
    .gte('created_at', sinceIso)
  if (error) throw error
  return (data ?? []) as unknown as Array<{ created_at: string | null; role: string }>
}

export async function fetchPendingRoleCounts(): Promise<Array<{ role: string }>> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .in('status', ['pending', 'reviewing'])
  if (error) throw error
  return (data ?? []) as unknown as Array<{ role: string }>
}

export interface RangeUserRow {
  id: string
  full_name: string
  role: string
  created_at: string
}

export async function fetchUsersInRange(fromIso: string, toIso: string): Promise<RangeUserRow[]> {
  const { data, error } = await (supabase as any)
    .from('users')
    .select('id, full_name, role, created_at')
    .gte('created_at', fromIso)
    .lte('created_at', toIso)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as RangeUserRow[]
}

export async function fetchStudentSexes(): Promise<Array<{ sex: string | null }>> {
  const { data, error } = await supabase.from('users').select('sex').eq('role', 'student')
  if (error) throw error
  return (data ?? []) as unknown as Array<{ sex: string | null }>
}

// --- admin home: verification queue -----------------------------------------

export interface PendingVerificationUser {
  id: string
  full_name: string | null
  role: string
  status: string
  created_at: string | null
}

/** All users awaiting verification, oldest first. */
export async function fetchPendingVerificationUsers(): Promise<PendingVerificationUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, role, status, created_at')
    .in('status', ['pending', 'reviewing'])
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PendingVerificationUser[]
}

/** user_id → doc types uploaded, for the whole verification pipeline. */
export async function fetchVerificationDocIndex(): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('user_id, doc_type')
  if (error) throw error
  const rows = (data ?? []) as Array<{ user_id: string | null; doc_type: string }>
  const map = new Map<string, string[]>()
  for (const r of rows) {
    if (!r.user_id) continue
    map.set(r.user_id, [...(map.get(r.user_id) ?? []), r.doc_type])
  }
  return map
}
