// Data access for OSAS announcements — pure fetchers, no reactive
// state. The page decides what a failure means.

import { supabase } from '@/utils/supabase'

const ANNOUNCEMENT_COLUMNS =
  'id, title, summary, body, audience, published_at, expires_at, archived, author_id, accommodation_id, ' +
  'event_at, event_end, deadline_at, location, image_url, ' +
  'author:users ( full_name ), accommodation:accommodations ( name )'

export async function fetchAnnouncements(): Promise<any[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_COLUMNS)
    .order('published_at', { ascending: false, nullsFirst: true })
  if (error) throw error
  return data ?? []
}

/** Notifications sent and read, per announcement id. */
export async function fetchReach(): Promise<Map<string, { sent: number; seen: number }>> {
  const { data, error } = await supabase.rpc('announcement_reach_all')
  if (error) throw error
  return new Map((data ?? []).map((r) => [r.announcement_id, { sent: r.sent, seen: r.seen }]))
}

export async function setAnnouncementPublished(id: string, publishedAt: string | null, authorId?: string | null) {
  const { error } = await supabase
    .from('announcements')
    .update(authorId ? { published_at: publishedAt, author_id: authorId } : { published_at: publishedAt })
    .eq('id', id)
  if (error) throw error
}

export async function setArchived(id: string, archived: boolean) {
  const { error } = await supabase.from('announcements').update({ archived }).eq('id', id)
  if (error) throw error
}
