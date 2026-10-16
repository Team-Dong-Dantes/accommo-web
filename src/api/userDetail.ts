// Data access for the Users record's detail — pure fetchers, no reactive state.
// Each throws on error; the record treats every one as optional and reads a
// failure as "nothing on file".

import { supabase } from '@/utils/supabase'

export async function fetchStudentProfile(userId: string) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('college, program, year_level, student_id, osas_verified_at, emergency_contact_json, school_id_url, assessment_of_fees_url')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** The student's active placement, if any. */
export async function fetchActivePlacement(userId: string) {
  const { data, error } = await supabase
    .from('leases')
    .select('start_date, status, landlord:landlord_id(full_name), room:room_id(room_number, label, accommodation:accommodation_id(id, name, room_type, address, barangay, city))')
    .eq('student_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchBoardingHistory(userId: string) {
  const { data, error } = await supabase
    .from('boarding_history')
    .select('id, accommodation_name, room_type, period_start, period_end, accommodation:accommodations(id, name, address, barangay, city)')
    .eq('student_id', userId)
    .order('period_start', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchLandlordProfile(userId: string) {
  const { data, error } = await supabase
    .from('landlord_profiles')
    .select('response_rate, avg_response_minutes, government_id_url')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** The accommodations a landlord/landlady runs, with their rooms' beds. */
export async function fetchLandlordAccommodations(userId: string) {
  const { data, error } = await supabase
    .from('accommodations')
    .select('id, name, status, room_type, total_rooms, address, barangay, city, rating_avg, reviews_count, rooms(capacity, current_pax)')
    .eq('landlord_id', userId)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

/**
 * Reviews a person received — a landlord/landlady's as manager, a student's as
 * tenant — with each author's name. Read through `review_admin_feed`: the review
 * tables are anonymous to the people involved (SELECT on them is revoked from
 * `authenticated`), and this view is the one place identities survive. It gates
 * itself on is_admin(), so a non-admin session gets nothing back. A failed
 * author lookup leaves the names as 'Unknown'.
 */
export async function fetchReviewsReceived(userId: string, kind: 'manager' | 'tenant') {
  const res = (await supabase
    .from('review_admin_feed')
    .select('rating, comment, created_at, author_id')
    .eq('kind', kind)
    .eq('subject_id', userId)
    .order('created_at', { ascending: false })) as any
  if (res.error) throw res.error
  const revs = (res?.data || []) as any[]
  const authorIds = [...new Set(revs.map((r: any) => r.author_id).filter(Boolean))]
  const nameById = new Map<string, string>()
  if (authorIds.length) {
    const { data: authors } = await supabase.from('users').select('id, full_name').in('id', authorIds)
    for (const a of authors || []) nameById.set(a.id, a.full_name || '')
  }
  return revs.map((r: any) => ({
    author_name: nameById.get(r.author_id) || 'Unknown',
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
  }))
}
