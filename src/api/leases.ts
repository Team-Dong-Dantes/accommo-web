// Data access for leases — pure fetchers, no reactive state.

import { supabase } from '@/utils/supabase'
import { signRows } from '@/utils/docUrl'

export interface LeaseExpiryRow {
  id: string
  end_date: string | null
}

/**
 * Which of these students have an application waiting on a landlord/landlady
 * (a pending lease). The verification queue puts them first: they are the ones
 * a decision is holding up.
 */
export async function fetchPendingApplicants(studentIds: string[]): Promise<Set<string>> {
  if (!studentIds.length) return new Set()
  const { data, error } = await supabase
    .from('leases')
    .select('student_id')
    .eq('status', 'pending')
    .in('student_id', studentIds)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.student_id))
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
  const rows = (data ?? []) as LeasePaymentRow[]
  // Proofs are private: swap each stored reference for a short-lived link.
  await signRows('payments', rows, 'proof_url')
  return rows
}

/** One item owed on a stay (a rent month, the deposit or a bill) and where it stands. */
export interface LeaseLedgerRow {
  leaseId: string
  kind: 'rent' | 'deposit' | 'bill' | string
  /** First of the month; null for the deposit. */
  month: string | null
  dueDate: string | null
  due: number
  balance: number
  /** 'paid' | 'pending' | 'partial' | 'unpaid' | 'overdue'. */
  state: string
}

/**
 * What is owed on each stay, from the database's own ledger. Payment rows can't
 * say this: a month nobody paid has no row, so nothing is ever "overdue" there.
 */
export async function fetchLedgerForLeases(leaseIds: string[]): Promise<LeaseLedgerRow[]> {
  // ponytail: one lease_ledger call per stay; a student has a handful.
  const ledgers = await Promise.all(leaseIds.map(async (leaseId) => {
    const { data, error } = await supabase.rpc('lease_ledger', { p_lease: leaseId })
    if (error) throw error
    return (data ?? []).map((r): LeaseLedgerRow => ({
      leaseId,
      kind: r.kind,
      month: r.month ?? null,
      dueDate: r.due_date ?? null,
      due: Number(r.due),
      balance: Number(r.balance),
      state: r.state,
    }))
  }))
  return ledgers.flat()
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
         landlord:users_full!accommodations_landlord_id_fkey(full_name, sex, phone)`,
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
