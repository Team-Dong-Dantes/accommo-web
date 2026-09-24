// Account Management's list: every student and landlord/landlady (admins live
// under Settings → Administrators), each with what OSAS acts on — a student's
// current stay, a landlord/landlady's accommodations, and when they were last
// active. Loaded in a handful of batch queries, never one per row.

import { computed, ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { getStatus, getTone, type StatusTone } from '@/utils/status.config'
import { getTimeAgo, landlordTitle, roleLabel } from '@/utils/format'

export interface Stay { accommodationId: string; accommodation: string; room: string }
export interface Portfolio { count: number; accredited: number; beds: number; taken: number }

/**
 * One account as the table and the record drawer read it. The drawer's
 * preview builder reads a dozen of these fields, so the shape stays loose.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DirectoryRow = Record<string, any>

const DAY = 86_400_000

/** How recently someone signed in, as the Last active filter groups it. */
export function activeState(lastLoginAt: string | null | undefined, now = Date.now()): 'week' | 'month' | 'stale' | 'never' {
  const at = lastLoginAt ? Date.parse(lastLoginAt) : NaN
  if (Number.isNaN(at)) return 'never'
  const days = (now - at) / DAY
  return days <= 7 ? 'week' : days <= 30 ? 'month' : 'stale'
}

/** A row passes a filter when its field equals any chosen value. */
export const matches = (row: DirectoryRow, key: string, values: string[]) =>
  values.some((v) => v.toLowerCase() === String(row[key] ?? '').toLowerCase())

/** The table/drawer shape for one `users` row and its role profile. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapUserData(user: any, profile: any = {}): DirectoryRow {
  const displayName = user.full_name || 'Unknown User'
  const nameParts = displayName.split(' ')
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : `${nameParts[0][0]}`.toUpperCase()

  const role = String(user.role || '').toLowerCase()
  const isStudent = role === 'student'
  const status = String(user.status || 'unverified').toLowerCase()
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
  const joined = user.created_at ? new Date(user.created_at) : null

  return {
    rawId: user.id,
    name: displayName,
    email: user.email,
    contact: user.phone || 'No phone provided',
    role: user.role || 'Unknown',
    roleStyle: { tone: (isStudent ? 'neutral' : 'primary') as StatusTone, icon: isStudent ? 'lucide:graduation-cap' : 'lucide:building-2' },
    // A landlord/landlady's own title, from their recorded sex; other roles by name.
    roleTitle: isStudent ? 'Student' : role === 'landlord' ? landlordTitle(user.sex) : roleLabel(user.role),
    status: statusLabel,
    statusStyle: { tone: getTone(status), icon: getStatus(status).icon || 'lucide:circle-help' },
    joined: joined && !isNaN(joined.getTime()) ? joined.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
    dateOfBirth: user.date_of_birth ?? null,
    sex: user.sex ?? null,
    registeredAt: user.registered_at ?? null,
    updatedAt: user.updated_at ?? null,
    emailVerifiedAt: user.email_verified_at ?? null,
    lastLoginAt: user.last_login_at ?? null,
    lastActive: user.last_login_at ? getTimeAgo(user.last_login_at) : 'Never',
    termsAcceptedAt: user.terms_accepted_at ?? null,
    privacyAcceptedAt: user.privacy_accepted_at ?? null,
    onboardingComplete: user.onboarding_complete ?? false,
    isSuperadmin: user.is_superadmin ?? false,
    reviewingAt: user.reviewing_at ?? null,
    initials,
    avatarColor: isStudent ? 'indigo-5' : 'teal-7',
    avatarUrl: user.avatar_url || '',
    studentId: profile.student_id || '',
    college: profile.college || '',
    program: profile.program || '',
    yearLevel: profile.year_level != null ? String(profile.year_level) : '',
    responseRate: profile.response_rate ?? null,
    // Filter keys: the list matches a row field against each option's value.
    emailState: user.email_verified_at ? 'confirmed' : 'unconfirmed',
    activeState: activeState(user.last_login_at),
    profile,
  }
}

/** Each student's current stay, keyed by their user id. */
export function staysByStudent(leases: { student_id: string | null; room: unknown }[]): Map<string, Stay> {
  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)
  const out = new Map<string, Stay>()
  for (const l of leases) {
    const room = one(l.room as { room_number: string | null; label: string | null; accommodation: unknown } | null)
    const acc = one(room?.accommodation as { id: string; name: string | null } | null)
    if (!l.student_id || !acc) continue
    out.set(l.student_id, {
      accommodationId: acc.id,
      accommodation: acc.name ?? 'Unnamed accommodation',
      room: room?.room_number ? `Room ${room.room_number}` : room?.label ?? '',
    })
  }
  return out
}

/** Each landlord/landlady's accommodations, summed, keyed by their user id. */
export function portfoliosByLandlord(
  accommodations: { landlord_id: string | null; status: string | null; rooms: { capacity: number | null; current_pax: number | null }[] | null }[],
): Map<string, Portfolio> {
  const out = new Map<string, Portfolio>()
  for (const a of accommodations) {
    if (!a.landlord_id) continue
    const p = out.get(a.landlord_id) ?? { count: 0, accredited: 0, beds: 0, taken: 0 }
    p.count += 1
    if (a.status === 'accredited') p.accredited += 1
    for (const r of a.rooms ?? []) {
      p.beds += r.capacity ?? 0
      p.taken += Math.min(r.current_pax ?? 0, r.capacity ?? 0)
    }
    out.set(a.landlord_id, p)
  }
  return out
}

/** Mean response rate over every landlord/landlady — the campus benchmark. */
export function campusRate(landlords: DirectoryRow[]): number | null {
  // A landlord/landlady with no rate yet is left out, not counted as 0%.
  const rates = landlords.filter((u) => u.responseRate != null).map((u) => Number(u.responseRate)).filter(Number.isFinite)
  return rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null
}

export function useUserDirectory() {
  const loading = ref(true)
  const error = ref('')
  const rows = ref<DirectoryRow[]>([])

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const { data, error: err } = await supabase
        .from('users')
        .select(
          `id, full_name, email, phone, sex, role, status, created_at, registered_at, updated_at,
           date_of_birth, avatar_url, email_verified_at, last_login_at, terms_accepted_at,
           privacy_accepted_at, onboarding_complete, is_superadmin, reviewing_at`,
        )
        .in('role', ['student', 'landlord'])
        .order('created_at', { ascending: false })
      if (err) throw err

      const ids = (data ?? []).map((u) => u.id)
      // `qr_code_token` is deliberately not selected — it is a live credential.
      const [studentRes, landlordRes, leaseRes, accRes] = ids.length
        ? await Promise.all([
            supabase.from('student_profiles')
              .select('user_id, student_id, program, year_level, college, osas_verified_at, emergency_contact_json, school_id_url, assessment_of_fees_url, extracted_name, extracted_school_id')
              .in('user_id', ids),
            supabase.from('landlord_profiles')
              .select('user_id, government_id_url, response_rate, avg_response_minutes, extracted_name, extracted_gov_id')
              .in('user_id', ids),
            supabase.from('leases')
              .select('student_id, room:rooms!leases_room_id_fkey(room_number, label, accommodation:accommodations!rooms_accommodation_id_fkey(id, name))')
              .eq('status', 'active'),
            supabase.from('accommodations').select('landlord_id, status, rooms(capacity, current_pax)'),
          ])
        : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileByUser = new Map<string, any>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of [...(studentRes.data ?? []), ...(landlordRes.data ?? [])] as any[]) profileByUser.set(p.user_id, p)
      const stays = staysByStudent((leaseRes.data ?? []) as never)
      const portfolios = portfoliosByLandlord((accRes.data ?? []) as never)

      const mapped = (data ?? []).map((u) => {
        const row = mapUserData(u, profileByUser.get(u.id) ?? {})
        if (u.role === 'student') {
          row.stay = stays.get(u.id) ?? null
          row.stayState = row.stay ? 'placed' : 'not_placed'
          row.stayAccommodation = row.stay?.accommodation ?? ''
        } else {
          row.portfolio = portfolios.get(u.id) ?? { count: 0, accredited: 0, beds: 0, taken: 0 }
          row.accreditState = row.portfolio.accredited ? 'accredited' : row.portfolio.count ? 'unaccredited' : 'none'
        }
        return row
      })
      // "Below campus average" needs every landlord/landlady's rate first.
      const campus = campusRate(mapped.filter((r) => r.role === 'landlord'))
      for (const r of mapped) {
        if (r.role !== 'landlord') continue
        r.responseState = r.responseRate == null ? 'none' : campus != null && r.responseRate < campus ? 'below' : 'ok'
      }
      rows.value = mapped
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  const students = computed(() => rows.value.filter((r) => String(r.role).toLowerCase() === 'student'))
  const landlords = computed(() => rows.value.filter((r) => String(r.role).toLowerCase() === 'landlord'))
  const campusResponseRate = computed(() => campusRate(landlords.value))

  return { rows, students, landlords, campusResponseRate, loading, error, load }
}
