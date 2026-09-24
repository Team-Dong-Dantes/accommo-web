// Data the OSAS reports need that no page already loads: who signs reports,
// every landlord/landlady account, and every student in an active stay.

import { supabase } from '@/utils/supabase'
import { composeAddress, humanizeEnum } from '@/utils/format'
import type { Signatories } from '@/features/reports/document'

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

/** Who signs a report: the admin generating it, and whoever Settings → Reports names. */
export async function reportSignatories(preparedBy: string | undefined): Promise<Signatories> {
  try {
    const s = await fetchReportSettings()
    return {
      preparedBy,
      notedBy: s.notedByName ? { name: s.notedByName, position: s.notedByPosition } : null,
      approvedBy: s.approvedByName ? { name: s.approvedByName, position: s.approvedByPosition } : null,
    }
  } catch {
    // The report still prints, with blank lines to sign on.
    return { preparedBy }
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

export async function fetchLandlords(): Promise<LandlordRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`id, full_name, sex, status, email, phone, created_at,
      landlord_profiles(response_rate, avg_response_minutes),
      accommodations!accommodations_landlord_id_fkey(id, name, status, accreditation_expires_at, rooms(capacity, current_pax))`)
    .eq('role', 'landlord')
  if (error) throw error

  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)
  return (data ?? []).map((u) => {
    const prof = one(u.landlord_profiles)
    return {
      id: u.id,
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

/** One student in an active lease, with where they stay. */
export interface BoarderRow {
  studentId: string
  name: string
  sex: string | null
  phone: string
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
  emergency: { name: string; relationship: string; phone: string } | null
}

export async function fetchBoarders(): Promise<BoarderRow[]> {
  const { data, error } = await supabase
    .from('leases')
    .select(`start_date,
      student:users!leases_student_id_fkey(id, full_name, sex, phone,
        student_profiles(student_id, college, program, year_level, emergency_contact_json)),
      room:rooms!leases_room_id_fkey(room_number, label,
        accommodation:accommodations!rooms_accommodation_id_fkey(id, name, accommodation_type, address, barangay, city))`)
    .eq('status', 'active')
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
      phone: s?.phone ?? '',
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
      emergency: ec?.name ? { name: ec.name, relationship: ec.relationship ?? '', phone: ec.phone ?? '' } : null,
    }
  })
}
