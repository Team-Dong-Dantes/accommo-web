// Data access for the signed-in admin's own settings — pure fetchers, no
// reactive state.

import { supabase } from '@/utils/supabase'
import type { TablesInsert } from '@/types/database.gen'

export async function saveOwnProfile(userId: string, fullName: string, phone: string): Promise<void> {
  const { error } = await supabase.from('users').update({ full_name: fullName, phone }).eq('id', userId)
  if (error) throw error
}

/** users.login_alerts — read by the sign-in trigger. Null when the row has none. */
export async function fetchLoginAlerts(userId: string): Promise<boolean | null> {
  const { data, error } = await supabase.from('users').select('login_alerts').eq('id', userId).maybeSingle()
  if (error) throw error
  return data?.login_alerts ?? null
}

export async function saveLoginAlerts(userId: string, on: boolean): Promise<void> {
  const { error } = await supabase.from('users').update({ login_alerts: on }).eq('id', userId)
  if (error) throw error
}

/**
 * Supabase checks current_password itself (Auth → "require current password"),
 * so a session left open on a shared desk can't be used to take the account.
 */
export async function changePassword(current: string, next: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: next, current_password: current })
  if (error) throw error
}

/** The new admin's own details, marking onboarding done. */
export async function completeOnboarding(userId: string, profile: { full_name: string; phone: string; initials: string }): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ ...profile, onboarding_complete: true })
    .eq('id', userId)
  if (error) throw error
}

/** Every admin's access row; the system admin reads them all. */
export async function fetchAdminAccessRows() {
  const { data, error } = await supabase.from('admin_access').select('user_id, preset, levels, expires_at')
  if (error) throw error
  return data ?? []
}

/** The database checks this too (admin_access_write): system admin only, never yourself. */
export async function saveAdminAccess(row: TablesInsert<'admin_access'>): Promise<void> {
  const { error } = await supabase.from('admin_access').upsert(row)
  if (error) throw error
}

/** Every admin account, the system admin first. */
export async function fetchAdmins() {
  const { data, error } = await supabase
    .from('users_full')
    .select('id, full_name, email, initials, avatar_url, is_superadmin, onboarding_complete')
    .eq('role', 'admin')
    .order('is_superadmin', { ascending: false })
    .order('full_name')
  if (error) throw error
  return data ?? []
}
