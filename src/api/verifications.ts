import { supabase } from '@/utils/supabase'

/**
 * get_verification_queue() is the one source for users + documents: it is
 * admin-gated server-side and already joins the pending document rows.
 */
export async function fetchVerificationQueue(): Promise<any[]> {
  const { data, error } = await (supabase as any).rpc('get_verification_queue')
  if (error) throw new Error(error.message)
  return (data ?? []) as any[]
}

/**
 * The accommodation queue is every listing with an open accreditation round
 * (accommo-mobile's migration 20261002120000) — a new listing, a resubmission,
 * an appeal, a renewal, a change or a permit replaced on a live listing. It
 * used to be "status is pending or reviewing", which could not see the last
 * three: they leave the listing live.
 */
export async function fetchOpenRounds(): Promise<any[] | null> {
  const { data, error } = await supabase
    .from('accreditation_rounds')
    .select(
      `id, round, kind, message, proposed_changes, submitted_at,
       accommodation:accommodation_id (
         id, name, status, landlord_id, accommodation_type, gender_policy,
         purok, barangay, city, description, lat, lng, reviewing_at, reviewing_by,
         accreditation_expires_at,
         landlord:users_full!accommodations_landlord_id_fkey ( full_name, email, phone, status, sex )
       )`,
    )
    .is('decided_at', null)
  if (error) throw new Error(error.message)
  return data as any[] | null
}

/**
 * The permits and past decisions behind open rounds. A failed permit read is
 * returned rather than thrown: the queue still shows, just without the files.
 */
export async function fetchRoundEvidence(accommodationIds: string[]) {
  if (!accommodationIds.length) return { documents: [], documentError: null, pastRounds: [] }
  const [{ data: documents, error: documentError }, { data: pastRounds }] = await Promise.all([
    supabase
      .from('accommodation_documents')
      .select('id, accommodation_id, doc_type, uploaded_at, expires_at, version, file_sha256')
      .in('accommodation_id', accommodationIds)
      .order('version', { ascending: false }),
    supabase
      .from('accreditation_rounds')
      .select('accommodation_id, round, kind, decision, decided_at, flagged_docs, tags, note')
      .in('accommodation_id', accommodationIds)
      .not('decided_at', 'is', null)
      .order('round', { ascending: false }),
  ])
  return { documents, documentError, pastRounds }
}
