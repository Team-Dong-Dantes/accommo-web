// Data access for users — pure fetchers, no reactive state.

import { supabase } from '@/utils/supabase'

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




export async function fetchRegistrationsSince(sinceIso: string): Promise<Array<{ created_at: string | null; role: string }>> {
  const { data, error } = await supabase
    .from('users')
    .select('created_at, role')
    .gte('created_at', sinceIso)
  if (error) throw error
  return (data ?? []) as unknown as Array<{ created_at: string | null; role: string }>
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

/** Everything the review window shows about the account behind a request. */
export interface ReviewProfile {
  phone: string | null
  sex: string | null
  date_of_birth: string | null
  email_verified_at: string | null
  registered_at: string | null
  privacy_accepted_at: string | null
  created_at: string | null
  last_login_at: string | null
  terms_accepted_at: string | null
  onboarding_complete: boolean | null
  student_id?: string | null
  college?: string | null
  program?: string | null
  year_level?: number | null
  response_rate?: number | null
}

/**
 * The account behind a verification request. `get_verification_queue()` returns
 * only a name, an e-mail and the documents, which left the reviewer deciding on
 * an identity with almost nothing to check it against — everything here was
 * already stored and simply never read.
 */
export async function fetchReviewProfile(userId: string, role: string): Promise<ReviewProfile | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('phone, sex, date_of_birth, email_verified_at, registered_at, created_at, last_login_at, terms_accepted_at, privacy_accepted_at, onboarding_complete')
    .eq('id', userId)
    .maybeSingle()
  if (error || !user) return null

  const profile = { ...user } as unknown as ReviewProfile
  if (role === 'student') {
    const { data } = await supabase
      .from('student_profiles')
      .select('student_id, college, program, year_level')
      .eq('user_id', userId)
      .maybeSingle()
    Object.assign(profile, data ?? {})
  } else if (role === 'accommodation_manager') {
    const { data } = await supabase
      .from('accommodation_manager_profiles')
      .select('response_rate')
      .eq('user_id', userId)
      .maybeSingle()
    Object.assign(profile, data ?? {})
  }
  return profile
}

/** A file a user uploaded for verification. */
export interface VerificationDocRow {
  id: string
  doc_type: string
  filename: string | null
  file_url: string | null
  status: string | null
  uploaded_at: string | null
  verified_at: string | null
}

/**
 * Everything one user has uploaded. The drawer's Documents tab used to read two
 * URL columns off `student_profiles` and one off
 * `accommodation_manager_profiles`, but uploads land in
 * `verification_documents` — so a manager's business permit had nowhere to show
 * at all, and the tab read "No documents" for people who had uploaded some.
 */
export async function fetchVerificationDocs(userId: string): Promise<VerificationDocRow[]> {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('id, doc_type, filename, file_url, status, uploaded_at, verified_at')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as VerificationDocRow[]
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
