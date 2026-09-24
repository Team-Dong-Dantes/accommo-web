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
  landlord_id: string
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
      landlord_id,
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

/**
 * One stay as a student's record shows it in place: the accommodation, how
 * many boarders it has now, and — when the lease is known — its room and who is
 * in that room now.
 */
export async function fetchStaySummary(accommodationId: string, leaseId: string | null) {
  const [accRes, boardersRes, leaseRes] = await Promise.all([
    supabase
      .from('accommodations')
      .select(
        `id, name, address, barangay, city, lat, lng, accommodation_type, status, rating_avg, reviews_count, total_rooms,
         landlord:users!accommodations_landlord_id_fkey(full_name, sex, phone)`,
      )
      .eq('id', accommodationId)
      .single(),
    supabase
      .from('leases')
      .select('id, room:rooms!inner(accommodation_id)', { count: 'exact', head: true })
      .eq('room.accommodation_id', accommodationId)
      .in('status', ['active', 'leave_requested']),
    leaseId
      ? supabase
          .from('leases')
          .select('room:rooms(id, label, room_number, room_type, custom_room_type, floor, capacity, monthly_rent, status)')
          .eq('id', leaseId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ])
  if (accRes.error) throw accRes.error
  if (leaseRes.error) throw leaseRes.error

  const one = <T>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)
  const room = one((leaseRes.data as any)?.room)
  let occupants: { name: string; since: string | null }[] = []
  if (room?.id) {
    const { data, error } = await supabase
      .from('leases')
      .select('start_date, student:users!leases_student_id_fkey(full_name)')
      .eq('room_id', room.id)
      .in('status', ['active', 'leave_requested'])
    if (error) throw error
    occupants = ((data ?? []) as any[]).map((l) => ({ name: one<any>(l.student)?.full_name || 'Unknown', since: l.start_date }))
  }

  const acc = accRes.data as any
  return {
    accommodation: { ...acc, landlord: one<any>(acc.landlord) },
    boarders: boardersRes.count ?? 0,
    room: room as any,
    occupants,
  }
}

export type StaySummary = Awaited<ReturnType<typeof fetchStaySummary>>
