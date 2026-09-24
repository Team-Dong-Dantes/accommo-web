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
