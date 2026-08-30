// Data access for leases — pure fetchers, no reactive state.

import { supabase } from '@/utils/supabase'

export interface LeaseExpiryRow {
  id: string
  end_date: string | null
}

export async function fetchActiveLeaseCount(): Promise<number> {
  const { count, error } = await supabase
    .from('leases')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  if (error) throw error
  return count ?? 0
}

export async function fetchExpiringLeases(nowIso: string, thirtyDaysIso: string): Promise<LeaseExpiryRow[]> {
  const { data, error } = await supabase
    .from('leases')
    .select('id, end_date')
    .eq('status', 'active')
    .gte('end_date', nowIso)
    .lte('end_date', thirtyDaysIso)
  if (error) throw error
  return (data ?? []) as unknown as LeaseExpiryRow[]
}

export async function fetchLeaveRequestCount(): Promise<number> {
  const { count, error } = await supabase
    .from('leases')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'leave_requested')
  if (error) throw error
  return count ?? 0
}

export interface LeaseStartDateRow {
  start_date: string | null
}

export async function fetchLeasesSince(sinceIso: string): Promise<LeaseStartDateRow[]> {
  const { data, error } = await supabase
    .from('leases')
    .select('start_date')
    .gte('start_date', sinceIso)
  if (error) throw error
  return (data ?? []) as unknown as LeaseStartDateRow[]
}
