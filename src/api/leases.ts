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

/**
 * Active leases grouped by the accreditation status of the accommodation the
 * student is actually living in.
 *
 * The product's premise is that students only ever see accredited houses, so
 * this should be entirely `accredited`. It currently is not, which is worth
 * being able to see rather than assume.
 */
export async function fetchActiveLeaseAccreditation(): Promise<{ accredited: number; pipeline: number; delisted: number }> {
  const { data, error } = await supabase
    .from('leases')
    .select('id, room:rooms!inner(accommodation:accommodations!inner(status))')
    .eq('status', 'active')
  if (error) throw error

  const tally = { accredited: 0, pipeline: 0, delisted: 0 }
  for (const row of (data ?? []) as any[]) {
    const room = Array.isArray(row.room) ? row.room[0] : row.room
    const accommodation = Array.isArray(room?.accommodation) ? room.accommodation[0] : room?.accommodation
    const status = accommodation?.status
    if (status === 'accredited') tally.accredited += 1
    else if (status === 'delisted' || status === 'rejected') tally.delisted += 1
    else tally.pipeline += 1
  }
  return tally
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
