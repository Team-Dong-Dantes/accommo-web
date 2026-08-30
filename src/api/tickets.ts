// Data access for student profiles and support tickets.

import { supabase } from '@/utils/supabase'

// --- student_profiles -------------------------------------------------------

export interface StudentCollegeSummary {
  counts: Map<string, number>
  profileCount: number
  recordedCount: number
  missingCount: number
  distinctCount: number
}

export async function fetchCollegeCounts(): Promise<StudentCollegeSummary> {
  const { data, error } = await supabase.from('student_profiles').select('college')
  if (error) throw error
  const rows = (data ?? []) as Array<{ college: string | null }>
  const counts = new Map<string, number>()
  let recordedCount = 0
  for (const c of rows) {
    const key = c.college?.trim() || 'Unspecified'
    if (key !== 'Unspecified') recordedCount += 1
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return {
    counts,
    profileCount: rows.length,
    recordedCount,
    missingCount: rows.length - recordedCount,
    distinctCount: Array.from(counts.keys()).filter((key) => key !== 'Unspecified').length,
  }
}

export async function fetchYearLevelCounts(): Promise<Map<number, number>> {
  const { data, error } = await supabase.from('student_profiles').select('year_level')
  if (error) throw error
  const rows = (data ?? []) as Array<{ year_level: number | null }>
  const counts = new Map<number, number>()
  for (const y of rows) {
    const key = y.year_level ?? 0
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
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

export interface RecentTicketRow {
  id: string
  subject: string
  priority: string
  status: string
  reported_at: string
}

export async function fetchOpenTicketCount(): Promise<number> {
  const { count, error } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .in('status', ['open', 'in_progress'])
  if (error) throw error
  return count ?? 0
}

export async function fetchUrgentOpenTicketCount(): Promise<number> {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('priority', 'urgent')
    .in('status', ['open', 'in_progress'])
  if (error) throw error
  return count ?? 0
}

export async function fetchRecentOpenTickets(): Promise<RecentTicketRow[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, subject, priority, status, reported_at')
    .in('status', ['open', 'in_progress'])
    .order('reported_at', { ascending: false })
    .limit(5)
  if (error) throw error
  return (data ?? []) as unknown as RecentTicketRow[]
}
