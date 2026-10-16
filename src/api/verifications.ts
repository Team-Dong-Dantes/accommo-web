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

/** Other accounts on this email, for the duplicate-account check. */
export async function fetchAccountsByEmail(email: string, excludeId: string) {
  const { data, error } = await supabase.from('users_full').select('id, status').eq('email', email).neq('id', excludeId)
  if (error) throw error
  return data ?? []
}

/** Other accommodations with this name, for the duplicate-name check. */
export async function fetchAccommodationsByName(name: string, excludeId: string) {
  const { data, error } = await supabase.from('accommodations').select('id, status').eq('name', name).neq('id', excludeId)
  if (error) throw error
  return data ?? []
}

/** What the phone read off a student's documents when they were scanned. */
export async function fetchStoredDocumentText(userId: string) {
  const { data, error } = await supabase.from('student_profiles').select('document_text').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.document_text ?? null
}

/** Accommodations other than this one holding a permit file with any of these hashes. */
export async function fetchDocsWithHashes(hashes: string[], excludeAccommodationId: string) {
  const { data, error } = await supabase
    .from('accommodation_documents')
    .select('accommodation_id, doc_type')
    .in('file_sha256', hashes)
    .neq('accommodation_id', excludeAccommodationId)
  if (error) throw error
  return data ?? []
}

/** Other accommodations pinned inside a small lat/lng box. */
export async function fetchAccommodationsNear(lat: number, lng: number, d: number, excludeId: string) {
  const { data, error } = await supabase
    .from('accommodations')
    .select('id, name, landlord_id')
    .gte('lat', lat - d).lte('lat', lat + d)
    .gte('lng', lng - d).lte('lng', lng + d)
    .neq('id', excludeId)
  if (error) throw error
  return data ?? []
}
