// Data access for OSAS announcements and policies — pure fetchers, no reactive
// state. The page decides what a failure means.

import { supabase } from '@/utils/supabase'

const ANNOUNCEMENT_COLUMNS =
  'id, title, summary, body, audience, published_at, expires_at, archived, author_id, accommodation_id, ' +
  'event_at, event_end, deadline_at, location, image_url, ' +
  'author:users ( full_name ), accommodation:accommodations ( name )'

const POLICY_COLUMNS =
  'id, title, body, version, revision, effective_date, updated_at, archived, creator:users!policies_created_by_fkey ( full_name )'

export async function fetchAnnouncements(): Promise<any[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_COLUMNS)
    .order('published_at', { ascending: false, nullsFirst: true })
  if (error) throw error
  return data ?? []
}

export async function fetchPolicies(): Promise<any[]> {
  const { data, error } = await supabase
    .from('policies')
    .select(POLICY_COLUMNS)
    .order('effective_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Notifications sent and read, per announcement id. */
export async function fetchReach(): Promise<Map<string, { sent: number; seen: number }>> {
  const { data, error } = await supabase.rpc('announcement_reach_all')
  if (error) throw error
  return new Map((data ?? []).map((r) => [r.announcement_id, { sent: r.sent, seen: r.seen }]))
}

/** Acceptances of each policy's current revision, and how many users should accept. */
export async function fetchPolicyStats(): Promise<Map<string, { accepted: number; eligible: number }>> {
  const { data, error } = await supabase.rpc('policy_acceptance_stats')
  if (error) throw error
  return new Map((data ?? []).map((r) => [r.policy_id, { accepted: r.accepted, eligible: r.eligible }]))
}

export async function fetchPendingUsers(policyId: string) {
  const { data, error } = await supabase.rpc('policy_pending_users', { p_id: policyId })
  if (error) throw error
  return data ?? []
}

/** Superseded revisions, newest first. The current text lives on the policy row. */
export async function fetchPolicyVersions(policyId: string) {
  const { data, error } = await supabase
    .from('policy_versions')
    .select('id, revision, version, title, body, effective_date, superseded_at')
    .eq('policy_id', policyId)
    .order('revision', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function setAnnouncementPublished(id: string, publishedAt: string | null, authorId?: string | null) {
  const { error } = await supabase
    .from('announcements')
    .update(authorId ? { published_at: publishedAt, author_id: authorId } : { published_at: publishedAt })
    .eq('id', id)
  if (error) throw error
}

export async function setArchived(table: 'announcements' | 'policies', id: string, archived: boolean) {
  const { error } = await supabase.from(table).update({ archived }).eq('id', id)
  if (error) throw error
}
