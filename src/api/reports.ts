// Data the OSAS reports need that no page already loads: who signs reports,
// every landlord/landlady account, and every student in an active stay.

import { supabase } from '@/utils/supabase'
import { composeAddress, humanizeEnum } from '@/utils/format'

export interface ReportSettings {
  notedByName: string
  notedByPosition: string
  approvedByName: string
  approvedByPosition: string
}

export async function fetchReportSettings(): Promise<ReportSettings> {
  const { data, error } = await supabase
    .from('report_settings')
    .select('noted_by_name, noted_by_position, approved_by_name, approved_by_position')
    .maybeSingle()
  if (error) throw error
  return {
    notedByName: data?.noted_by_name ?? '',
    notedByPosition: data?.noted_by_position ?? '',
    approvedByName: data?.approved_by_name ?? '',
    approvedByPosition: data?.approved_by_position ?? '',
  }
}

export async function saveReportSettings(s: ReportSettings, userId: string | undefined): Promise<void> {
  const { error } = await supabase
    .from('report_settings')
    .update({
      noted_by_name: s.notedByName.trim() || null,
      noted_by_position: s.notedByPosition.trim() || null,
      approved_by_name: s.approvedByName.trim() || null,
      approved_by_position: s.approvedByPosition.trim() || null,
      updated_at: new Date().toISOString(),
      updated_by: userId ?? null,
    })
    .eq('id', true)
  if (error) throw error
}

/** One landlord/landlady account, with the accommodations they run. */
export interface LandlordRow {
  id: string
  name: string
  sex: string | null
  status: string
  email: string
  phone: string
  joined: string | null
  responseRate: number | null
  avgResponseMinutes: number | null
  accommodations: { id: string; name: string; status: string; beds: number; taken: number; expiresAt: string | null }[]
}

/** Every landlord/landlady account, or just one when given its id. */
export async function fetchLandlords(id?: string): Promise<LandlordRow[]> {
  let q = supabase
    .from('users_full')
    .select(`id, full_name, sex, status, email, phone, created_at,
      landlord_profiles(response_rate, avg_response_minutes),
      accommodations!accommodations_landlord_id_fkey(id, name, status, accreditation_expires_at, rooms(capacity, current_pax))`)
    .eq('role', 'landlord')
  if (id) q = q.eq('id', id)
  const { data, error } = await q
  if (error) throw error

  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)
  return (data ?? []).map((u) => {
    const prof = one(u.landlord_profiles)
    return {
      // users_full is a view, so its generated types call every column nullable.
      id: u.id!,
      name: u.full_name ?? '—',
      sex: u.sex ?? null,
      status: String(u.status ?? ''),
      email: u.email ?? '',
      phone: u.phone ?? '',
      joined: u.created_at ?? null,
      responseRate: prof?.response_rate ?? null,
      avgResponseMinutes: prof?.avg_response_minutes ?? null,
      accommodations: (u.accommodations ?? []).map((a) => ({
        id: a.id,
        name: a.name ?? 'Unnamed accommodation',
        status: String(a.status ?? ''),
        beds: (a.rooms ?? []).reduce((n, r) => n + (r.capacity ?? 0), 0),
        taken: (a.rooms ?? []).reduce((n, r) => n + Math.min(r.current_pax ?? 0, r.capacity ?? 0), 0),
        expiresAt: a.accreditation_expires_at ?? null,
      })),
    }
  })
}

/** One student's stay — current or past — with where it is. */
export interface BoarderRow {
  studentId: string
  name: string
  sex: string | null
  birthDate: string | null
  phone: string
  email: string
  schoolId: string
  college: string
  program: string
  yearLevel: string
  accommodationId: string
  accommodation: string
  /** "Boarding House", "Residence" or "Dormitory". */
  accommodationType: string
  barangay: string
  address: string
  room: string
  since: string | null
  /** The stay's end date: the contract's, even when it ended early (no move-out date is kept). */
  until: string | null
  /** Still staying (active, or asked to leave and not gone yet). */
  current: boolean
  emergency: { name: string; relationship: string; phone: string } | null
}

export async function fetchBoarders(): Promise<BoarderRow[]> {
  const { data, error } = await supabase
    .from('leases')
    .select(`start_date, end_date, status,
      student:users_full!leases_student_id_fkey(id, full_name, sex, date_of_birth, phone, email,
        student_profiles(student_id, college, program, year_level, emergency_contact_json)),
      room:rooms!leases_room_id_fkey(room_number, label,
        accommodation:accommodations!rooms_accommodation_id_fkey(id, name, accommodation_type, address, barangay, city))`)
    .in('status', ['active', 'leave_requested', 'ended', 'terminated'])
  if (error) throw error

  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)
  return (data ?? []).map((l) => {
    const s = one(l.student)
    const prof = one(s?.student_profiles)
    const room = one(l.room)
    const acc = one(room?.accommodation)
    const ec = prof?.emergency_contact_json as { name?: string; relationship?: string; phone?: string } | null
    return {
      studentId: s?.id ?? '',
      name: s?.full_name ?? '—',
      sex: s?.sex ?? null,
      birthDate: s?.date_of_birth ?? null,
      phone: s?.phone ?? '',
      email: s?.email ?? '',
      schoolId: prof?.student_id ?? '',
      college: prof?.college ?? '',
      program: prof?.program ?? '',
      yearLevel: prof?.year_level != null ? String(prof.year_level) : '',
      accommodationId: acc?.id ?? '',
      accommodation: acc?.name ?? '—',
      accommodationType: humanizeEnum(acc?.accommodation_type) || '',
      barangay: acc?.barangay ?? '',
      address: acc ? composeAddress(acc) : '',
      room: room?.room_number ? `Room ${room.room_number}` : room?.label ?? '—',
      since: l.start_date ?? null,
      until: l.end_date ?? null,
      current: l.status === 'active' || l.status === 'leave_requested',
      emergency: ec?.name ? { name: ec.name, relationship: ec.relationship ?? '', phone: ec.phone ?? '' } : null,
    }
  })
}

/** One stay (lease) that got as far as moving in — current or past. */
export interface StayRow {
  leaseId: string
  studentId: string
  student: string
  studentSex: string | null
  landlord: string
  accommodationId: string
  accommodation: string
  room: string
  status: string
  /** Still staying (active, or asked to leave and not gone yet). */
  current: boolean
  since: string | null
  until: string | null
  monthlyRent: number | null
  endedReason: string | null
}

/**
 * One charge on a stay, with where it stands — straight from the database's
 * own ledger_rows, so a month nobody paid shows up as owed even though no
 * payment row exists for it.
 */
export interface LedgerRow {
  leaseId: string
  student: string
  accommodation: string
  room: string
  /** Still staying (active or asked to leave), not a former boarder. */
  current: boolean
  kind: 'rent' | 'deposit' | 'bill' | string
  /** First of the month; null for the deposit. */
  month: string | null
  dueDate: string | null
  due: number
  confirmed: number
  waived: number
  pending: number
  balance: number
  /** 'paid' | 'pending' | 'partial' | 'unpaid' | 'overdue'. */
  state: string
}

/** Every stay at an accommodation, of a student, or with a landlord/landlady — and each one's ledger. */
export async function fetchStays(by: { accommodationId: string } | { studentId: string } | { landlordId: string }): Promise<{ stays: StayRow[]; ledger: LedgerRow[] }> {
  let q = supabase
    .from('leases')
    .select(`id, status, start_date, end_date, monthly_rent, ended_reason,
      student:users_full!leases_student_id_fkey(id, full_name, sex),
      landlord:users_full!leases_landlord_id_fkey(full_name),
      room:rooms!leases_room_id_fkey!inner(room_number, label, accommodation_id,
        accommodation:accommodations!rooms_accommodation_id_fkey(name))`)
    .in('status', ['active', 'leave_requested', 'ended', 'terminated'])
  q = 'accommodationId' in by ? q.eq('room.accommodation_id', by.accommodationId)
    : 'studentId' in by ? q.eq('student_id', by.studentId)
    : q.eq('landlord_id', by.landlordId)
  const { data, error } = await q
  if (error) throw error

  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)
  const stays: StayRow[] = (data ?? []).map((l) => {
    const room = one(l.room)
    const student = one(l.student)
    return {
      leaseId: l.id,
      studentId: student?.id ?? '',
      student: student?.full_name ?? '—',
      studentSex: student?.sex ?? null,
      landlord: one(l.landlord)?.full_name ?? '—',
      accommodationId: room?.accommodation_id ?? '',
      accommodation: one(room?.accommodation)?.name ?? '—',
      room: room?.room_number ? `Room ${room.room_number}` : room?.label ?? '—',
      status: String(l.status),
      current: l.status === 'active' || l.status === 'leave_requested',
      since: l.start_date ?? null,
      until: l.end_date ?? null,
      monthlyRent: l.monthly_rent ?? null,
      endedReason: l.ended_reason ?? null,
    }
  })

  // lease_ledger is ledger_rows behind a who-may-see check; ledger_rows itself is not granted.
  // ponytail: one lease_ledger call per stay; an RPC taking the accommodation/person if one ever has hundreds.
  const ledgers = await Promise.all(stays.map(async (st) => {
    const { data: rows, error: err } = await supabase.rpc('lease_ledger', { p_lease: st.leaseId })
    if (err) throw err
    return (rows ?? []).map((r): LedgerRow => ({
      leaseId: st.leaseId,
      student: st.student,
      accommodation: st.accommodation,
      room: st.room,
      current: st.current,
      kind: r.kind,
      month: r.month ?? null,
      dueDate: r.due_date ?? null,
      due: Number(r.due),
      confirmed: Number(r.confirmed),
      waived: Number(r.waived),
      pending: Number(r.pending),
      balance: Number(r.balance),
      state: r.state,
    }))
  }))
  return { stays, ledger: ledgers.flat() }
}

/** A student's own record, for the Student Boarding Record. */
export interface StudentDossier {
  name: string
  sex: string | null
  birthDate: string | null
  email: string
  phone: string
  status: string
  joined: string | null
  schoolId: string
  college: string
  program: string
  yearLevel: string
  verifiedAt: string | null
  emergency: { name: string; relationship: string; phone: string } | null
  stays: StayRow[]
  ledger: LedgerRow[]
  /** What is still owed on stays that have ended. */
  pastOwed: { accommodation: string; room: string; endedOn: string | null; balance: number }[]
}

export async function fetchStudentDossier(id: string): Promise<StudentDossier> {
  const [user, stays, owed] = await Promise.all([
    supabase.from('users_full')
      .select(`full_name, sex, date_of_birth, email, phone, status, created_at,
        student_profiles(student_id, college, program, year_level, osas_verified_at, emergency_contact_json)`)
      .eq('id', id)
      .single(),
    fetchStays({ studentId: id }),
    supabase.rpc('student_past_balance', { p_student: id }),
  ])
  if (user.error) throw user.error
  if (owed.error) throw owed.error
  const u = user.data
  const prof = Array.isArray(u.student_profiles) ? u.student_profiles[0] : u.student_profiles
  const ec = prof?.emergency_contact_json as { name?: string; relationship?: string; phone?: string } | null
  return {
    name: u.full_name ?? '—',
    sex: u.sex ?? null,
    birthDate: u.date_of_birth ?? null,
    email: u.email ?? '',
    phone: u.phone ?? '',
    status: String(u.status ?? ''),
    joined: u.created_at ?? null,
    schoolId: prof?.student_id ?? '',
    college: prof?.college ?? '',
    program: prof?.program ?? '',
    yearLevel: prof?.year_level != null ? String(prof.year_level) : '',
    verifiedAt: prof?.osas_verified_at ?? null,
    emergency: ec?.name ? { name: ec.name, relationship: ec.relationship ?? '', phone: ec.phone ?? '' } : null,
    ...stays,
    pastOwed: (owed.data ?? []).map((o) => ({ accommodation: o.accommodation, room: o.room, endedOn: o.ended_on, balance: Number(o.balance) })),
  }
}

/** A landlord/landlady's own record, for the Landlord/Landlady Record. */
export interface LandlordDossier {
  profile: LandlordRow
  stays: StayRow[]
  ledger: LedgerRow[]
}

export async function fetchLandlordDossier(id: string): Promise<LandlordDossier> {
  const [rows, stays] = await Promise.all([fetchLandlords(id), fetchStays({ landlordId: id })])
  if (!rows[0]) throw new Error('This landlord/landlady could not be found.')
  return { profile: rows[0], ...stays }
}
