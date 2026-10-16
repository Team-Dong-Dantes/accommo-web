// Data access for the signed-in admin's notifications — pure fetchers, no
// reactive state. `useNotifications` decides what a failure means.

import { supabase } from '@/utils/supabase'

export interface NotificationRow {
  id: string
  title: string | null
  body: string | null
  type: string | null
  link_url: string | null
  read_at: string | null
  created_at: string | null
}

const COLUMNS = 'id, title, body, type, link_url, read_at, created_at'

/** The signed-in user's id, or null when there is no session. */
export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

/** Newest first. `limit` differs per surface: the bell shows a few, the centre shows the backlog. */
export async function fetchNotifications(userId: string, limit: number): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as NotificationRow[]
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
  if (error) throw error
}

/** A system notice to one person, with no link. */
export async function sendSystemNotice(userId: string, title: string, body: string): Promise<void> {
  const { error } = await supabase.from('notifications').insert({ user_id: userId, type: 'system', title, body } as never)
  if (error) throw error
}

/**
 * The rail's work badges: accounts and accommodations awaiting review, and
 * open tickets. Each count's own error comes back with it, so one failing
 * query does not blank the others.
 */
export async function fetchWorkCounts() {
  const [users, accommodations, tickets] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    supabase.from('accommodations').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
  ])
  return { users, accommodations, tickets }
}
