// Data access for student profiles and support tickets.

import { supabase } from '@/utils/supabase'
import type { TablesInsert, TablesUpdate } from '@/types/database.gen'

// --- student_profiles -------------------------------------------------------

/** One row per student profile, carrying only the fields OSAS needs on file. */
export interface StudentProfileRow {
  college: string | null
  year_level: number | null
  student_id: string | null
  school_id_url: string | null
  assessment_of_fees_url: string | null
  osas_verified_at: string | null
}

/**
 * Replaces the separate college and year-level queries. Both pulled the same
 * table for one column each, and neither could answer the question the
 * dashboard actually needs: how much of a student record is filled in.
 *
 * Only profiles whose account is still a student: a few landlords/landladies
 * keep the profile from before their role changed, and counting them gave
 * "49 of 48" against the student-account total.
 */
export async function fetchStudentProfiles(): Promise<StudentProfileRow[]> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('college, year_level, student_id, school_id_url, assessment_of_fees_url, osas_verified_at, user:users!student_profiles_user_id_fkey!inner(role)')
    .eq('user.role', 'student')
  if (error) throw error
  return (data ?? []) as unknown as StudentProfileRow[]
}

// --- tickets -----------------------------------------------------------------

export interface TicketSummaryRow {
  id: string
  subject: string | null
  priority: string
  status: string
  category: string | null
  assignee_id: string | null
  reported_at: string
}

export async function fetchTicketSummaries(): Promise<TicketSummaryRow[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, subject, priority, status, category, assignee_id, reported_at')
    .order('reported_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as TicketSummaryRow[]
}

// --- tickets (the Support Tickets console) ------------------------------------

const ENRICHED_SELECT = `
  id, ticket_no, subject, description, category, priority, status, assignee_id, reporter_name, reported_at, updated_at, resolved_at, photo_urls, lease_id, student_id, accommodation_id, landlord_id,
  lease:lease_id (
    id,
    student:users_full!leases_student_id_fkey ( id, full_name, email, phone, avatar_url, student_profiles ( program, college ) ),
    room:room_id ( id, label, accommodation:accommodation_id ( id, name, landlord:landlord_id ( full_name, sex ) ) )
  ),
  reporter:users_full!tickets_student_id_fkey ( id, full_name, email, phone, role, sex, avatar_url ),
  landlord:users_full!tickets_landlord_id_fkey ( id, full_name, email, phone, role, sex, avatar_url ),
  accommodation:accommodation_id ( id, name, landlord:landlord_id ( full_name, sex ) ),
  assignee:assignee_id ( id, full_name ),
  ticket_messages (
    id, body, author_role, is_internal, attachment_urls, created_at,
    author:author_id ( full_name, avatar_url )
  )
`

export async function fetchEnrichedTickets(): Promise<any[]> {
  const { data, error } = await supabase.from('tickets').select(ENRICHED_SELECT).order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Who a ticket can be assigned to. */
export async function fetchAdminAgents(): Promise<{ id: string; full_name: string | null }[]> {
  const { data, error } = await supabase.from('users').select('id, full_name').eq('role', 'admin').order('full_name')
  if (error) throw error
  return data ?? []
}

export async function insertTicketMessage(row: TablesInsert<'ticket_messages'>): Promise<void> {
  const { error } = await supabase.from('ticket_messages').insert(row)
  if (error) throw error
}

export async function updateTickets(ids: string[], row: TablesUpdate<'tickets'>): Promise<void> {
  const { error } = await supabase.from('tickets').update(row).in('id', ids)
  if (error) throw error
}
