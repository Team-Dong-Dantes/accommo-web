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

export type LeaseStatus = 'active' | 'ended' | 'terminated' | 'leave_requested' | string
export type PaymentStatus = 'due' | 'paid' | 'overdue' | 'pending_verification' | string
export type PaymentMethod = 'gcash' | 'maya' | 'bank' | 'cash' | 'others' | string

export interface LeaseDetailRow {
  id: string
  status: LeaseStatus
  start_date: string
  end_date: string | null
  monthly_rent: number | null
  advance_paid: number | null
  deposit_paid: number | null
  ended_reason: string | null
  accommodation_manager_id: string
  room: {
    id: string
    room_number: string | null
    label: string | null
    floor: number | null
    capacity: number | null
    monthly_rent: number | null
    status: string
    accommodation: {
      id: string
      name: string
      address: string | null
      barangay: string | null
      city: string | null
      room_type: string
    } | null
  } | null
}

export interface LeasePaymentRow {
  id: string
  lease_id: string
  month: string
  amount: number
  status: PaymentStatus
  method: PaymentMethod
  paid_at: string | null
  proof_url: string | null
  txn_reference: string | null
  description: string | null
  verified_by: string | null
}

export async function fetchStudentLeaseHistory(studentId: string): Promise<LeaseDetailRow[]> {
  const { data, error } = await supabase
    .from('leases')
    .select(`
      id,
      status,
      start_date,
      end_date,
      monthly_rent,
      advance_paid,
      deposit_paid,
      ended_reason,
      accommodation_manager_id,
      room:rooms!inner(
        id,
        room_number,
        label,
        floor,
        capacity,
        monthly_rent,
        status,
        accommodation:accommodations!inner(
          id,
          name,
          address,
          barangay,
          city,
          room_type
        )
      )
    `)
    .eq('student_id', studentId)
    .order('start_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as LeaseDetailRow[]
}

export async function fetchPaymentsForLeases(leaseIds: string[]): Promise<LeasePaymentRow[]> {
  if (!leaseIds.length) return []
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .in('lease_id', leaseIds)
    .order('month', { ascending: false })

  if (error) throw error
  return (data ?? []) as LeasePaymentRow[]
}
