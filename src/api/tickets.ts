// Data access for student profiles and support tickets.

import { supabase } from '@/utils/supabase'

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
 */
export async function fetchStudentProfiles(): Promise<StudentProfileRow[]> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('college, year_level, student_id, school_id_url, assessment_of_fees_url, osas_verified_at')
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




