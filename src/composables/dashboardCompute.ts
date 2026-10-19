// The dashboard's figures, computed from the rows useDashboardStats fetches.
// Pure: each compute* writes its part of the stats object and nothing else.

import type { ComingUpItem, DashboardStats } from '@/types/dashboard'
import type { AccommodationExpiryRow, AccommodationRow, PermitExpiryRow, fetchPendingAccommodations } from '@/api/accommodations'
import type { LeaseExpiryRow } from '@/api/leases'
import type { RoomRow } from '@/api/rooms'
import type { fetchStudentProfiles } from '@/api/tickets'
import type { Ticket } from '@/composables/useTickets'
import type { VerificationRequest } from '@/features/verifications/queue'
import { boardLane, compareTickets, isOverdue, type BoardLane } from '@/utils/ticketTriage'

const REQUIRED_ACCOMMODATION_PERMITS = [
  { type: 'sanitary_permit', label: 'Sanitary permit' },
  { type: 'fire_safety', label: 'Fire safety certificate' },
  { type: 'business_permit', label: 'Business permit' },
  { type: 'building_permit', label: 'Building permit' },
]


export function emptyStats(): DashboardStats {
  return {
    loading: true,
    error: null,
    adminName: 'Admin',
    accommodations: { total: 0, accredited: 0, avgRent: 0 },
    rooms: { total: 0, occupied: 0, available: 0, capacity: 0, pax: 0, occupancyPct: 0 },
    topOccupied: [],
    students: { total: 0, newThisMonth: 0 },
    studentsByYear: [],
    studentsByCollege: [],
    studentProfileQuality: { accounts: 0, records: 0, documents: [], verified: 0, verifiedWithoutSchoolId: 0, yearMissing: 0, collegeMissing: 0 },
    gender: { female: 0, male: 0, other: 0, unspecified: 0 },
    activeLeases: 0,
    registrationsByMonth: [],
    leasesByAccreditation: { accredited: 0, pipeline: 0, delisted: 0 },
    comingUp: [],
    landlordPayments: { pendingVerification: 0 },
    verifications: null,
    accreditationQueue: { total: 0, withPermits: 0, ready: [] },
    tickets: null,
  }
}

// --- pure transforms (verbatim from the original monolith) -----------------

export function computeAccommodations(accommodations: AccommodationRow[], rooms: RoomRow[], data: DashboardStats) {
  data.accommodations.total = accommodations.length
  data.accommodations.accredited = accommodations.filter((accommodation) => accommodation.status === 'accredited').length

  // Rent is per-room (rooms.monthly_rent), not per-accommodation.
  const rents = rooms.map((r) => r.monthly_rent).filter((r): r is number => r != null)
  data.accommodations.avgRent = rents.length
    ? Math.round(rents.reduce((s, r) => s + r, 0) / rents.length)
    : 0
}

export function computeRooms(rooms: RoomRow[], data: DashboardStats) {
  const totalRooms = rooms.length
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length
  const availableRooms = rooms.filter((r) => r.status === 'available').length
  const totalCapacity = rooms.reduce((s, r) => s + (r.capacity ?? 0), 0)
  const totalPax = rooms.reduce((s, r) => s + (r.current_pax ?? 0), 0)
  data.rooms = {
    total: totalRooms,
    occupied: occupiedRooms,
    available: availableRooms,
    capacity: totalCapacity,
    pax: totalPax,
    occupancyPct: totalCapacity > 0 ? Math.round((totalPax / totalCapacity) * 100) : 0,
  }

  // Most occupied accommodations.
  const accommodationAgg = new Map<string, { occupied: number; total: number }>()
  for (const r of rooms) {
    const name = r.accommodation?.name ?? 'Unknown'
    const agg = accommodationAgg.get(name) ?? { occupied: 0, total: 0 }
    agg.total += 1
    if (r.status === 'occupied') agg.occupied += 1
    accommodationAgg.set(name, agg)
  }
  data.topOccupied = Array.from(accommodationAgg.entries())
    .map(([name, v]) => ({
      name,
      val: v.total > 0 ? v.occupied / v.total : 0,
      ratio: `${v.occupied}/${v.total}`,
    }))
    .filter((p) => p.val > 0)
    .sort((a, b) => b.val - a.val)
    .slice(0, 5)
}

/**
 * What OSAS holds on a student, field by field. The panel used to chart college
 * and year level, but 89 of 111 profiles record no college and 85 no year, so
 * both charts were mostly a bar labelled "Unspecified". Coverage is the real
 * finding, and it is the thing an admin can act on.
 */
export function computeStudentDemographics(
  profiles: Awaited<ReturnType<typeof fetchStudentProfiles>>,
  sexes: Array<{ sex: string | null }>,
  studentTotal: number,
  data: DashboardStats,
) {
  const filled = (value: string | null) => Boolean(value && value.trim())
  const accounts = studentTotal || sexes.length

  let female = 0
  let male = 0
  let other = 0
  let unspecified = 0
  for (const s of sexes) {
    const sex = s.sex?.trim().toLowerCase()
    if (sex === 'f' || sex === 'female') female += 1
    else if (sex === 'm' || sex === 'male') male += 1
    else if (!sex) unspecified += 1
    else other += 1
  }
  data.gender = { female, male, other, unspecified }

  // Only the years and colleges actually recorded. Charting the blanks made
  // "Unspecified" the biggest bar and buried the real distribution; the count of
  // blanks is stated beside each instead.
  const YEAR_LABELS = ['1st', '2nd', '3rd', '4th', '5th']
  const yearCounts = new Map<number, number>()
  const collegeCounts = new Map<string, number>()
  for (const profile of profiles) {
    if (profile.year_level != null) {
      yearCounts.set(profile.year_level, (yearCounts.get(profile.year_level) ?? 0) + 1)
    }
    const college = profile.college?.trim()
    if (college) collegeCounts.set(college, (collegeCounts.get(college) ?? 0) + 1)
  }
  data.studentsByYear = Array.from(yearCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, val]) => ({ year: YEAR_LABELS[year - 1] ?? `Yr ${year}`, val }))
  data.studentsByCollege = Array.from(collegeCounts.entries())
    .map(([name, val]) => ({ name, val }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5)

  const recordedYears = Array.from(yearCounts.values()).reduce((sum, n) => sum + n, 0)
  const recordedColleges = Array.from(collegeCounts.values()).reduce((sum, n) => sum + n, 0)

  data.studentProfileQuality = {
    accounts,
    records: profiles.length,
    documents: [
      { label: 'Student number', recorded: profiles.filter((r) => filled(r.student_id)).length },
      { label: 'School ID', recorded: profiles.filter((r) => filled(r.school_id_url)).length },
      { label: 'Assessment of fees', recorded: profiles.filter((r) => filled(r.assessment_of_fees_url)).length },
    ],
    verified: profiles.filter((r) => r.osas_verified_at != null).length,
    verifiedWithoutSchoolId: profiles.filter(
      (r) => r.osas_verified_at != null && !filled(r.school_id_url),
    ).length,
    yearMissing: Math.max(0, accounts - recordedYears),
    collegeMissing: Math.max(0, accounts - recordedColleges),
  }
}

export function computeRegistrationTrend(
  regRows: Array<{ created_at: string | null; role: string }>,
  data: DashboardStats,
) {
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const now = new Date()
  const monthLabels: string[] = []
  for (let i = 12; i >= 0; i--) {
    monthLabels.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }
  const regByMonth = new Map(monthLabels.map(k => [k, { students: 0, landlords: 0 }]))
  for (const u of regRows) {
    if (!u.created_at) continue
    const k = monthKey(new Date(u.created_at))
    const bucket = regByMonth.get(k)
    if (!bucket) continue
    if (u.role === 'student') bucket.students += 1
    else if (u.role === 'landlord') bucket.landlords += 1
  }
  data.registrationsByMonth = monthLabels.map((k) => {
    const [y, m] = k.split('-')
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('en', { month: 'short' })
    const v = regByMonth.get(k)!
    return { ym: k, month: label, students: v.students, landlords: v.landlords }
  })
}

/**
 * The verification queue as the Verifications page reads it (useVerifications'
 * loadAccountRequests): what OSAS can decide now, and what the rest still lack.
 * The card used to chart every pending account's age, when most of them were
 * still missing a document OSAS cannot decide without. Null is a queue that
 * could not be read.
 */
export function computeVerifications(requests: VerificationRequest[] | null, data: DashboardStats) {
  if (!requests) {
    data.verifications = null
    return
  }
  const ready = requests.filter((request) => request.ready)
  const waiting = requests.filter((request) => !request.ready)
  const missing = new Map<string, number>()
  for (const request of waiting) {
    for (const item of request.requirements) {
      if (!item.ok) missing.set(item.label, (missing.get(item.label) ?? 0) + 1)
    }
  }
  const top = Array.from(missing.entries()).sort((a, b) => b[1] - a[1])[0]
  data.verifications = {
    ready: ready.length,
    waiting: waiting.length,
    late: ready.filter((request) => request.late).length,
    rows: ready.slice(0, 6).map((request) => ({
      id: request.rawId,
      name: request.name,
      role: request.role ?? 'student',
      ageDays: request.ageDays,
      late: request.late,
      applying: request.applying,
    })),
    mostMissing: top ? { label: top[0], count: top[1] } : null,
  }
}

/**
 * The support queue by who owes the next move, with the rules the Support
 * Tickets board and table use (utils/ticketTriage), so the card and the page
 * agree on what is overdue: 48 hours since the requester's unanswered message.
 * It used to count days since filing against a 3-day target, so a ticket
 * already answered still read as waiting. Null is a queue that could not be read.
 */
export function computeTickets(tickets: Ticket[] | null, me: string | null, data: DashboardStats) {
  if (!tickets) {
    data.tickets = null
    return
  }
  const lanes: Record<BoardLane, number> = { new: 0, needs_reply: 0, waiting: 0, resolved: 0 }
  for (const ticket of tickets) lanes[boardLane(ticket)] += 1
  const owed = tickets.filter((ticket) => ticket.waitingSince).sort(compareTickets)
  data.tickets = {
    new: lanes.new,
    needsReply: lanes.needs_reply,
    waiting: lanes.waiting,
    overdue: owed.filter((ticket) => isOverdue(ticket.waitingSince)).length,
    rows: owed.slice(0, 6).map((ticket) => ({
      id: ticket.id,
      ref: ticket.ref,
      subject: ticket.subject,
      reporter: ticket.reporterName,
      waitingSince: ticket.waitingSince!,
      overdue: isOverdue(ticket.waitingSince),
      mine: !!me && ticket.assigneeId === me,
    })),
  }
}

export function computeAccreditationQueue(
  pendingAccommodations: Awaited<ReturnType<typeof fetchPendingAccommodations>>,
  accommodationDocuments: Map<string, string[]>,
  data: DashboardStats,
) {
  // The applications an admin can act on today, by name. `accommodations` has
  // no created_at, so there is no age to rank by — a complete permit set is the
  // only thing that makes one of these decidable.
  const accreditationReady = pendingAccommodations
    .filter((accommodation) => {
      const uploaded = new Set(accommodationDocuments.get(accommodation.id) ?? [])
      return REQUIRED_ACCOMMODATION_PERMITS.every(({ type }) => uploaded.has(type))
    })
    .map((accommodation) => ({ id: accommodation.id, name: accommodation.name || 'Unnamed accommodation' }))

  data.accreditationQueue = {
    total: pendingAccommodations.length,
    withPermits: accreditationReady.length,
    ready: accreditationReady.slice(0, 6),
  }
}

/** Accreditations, permits and leases lapsing in the next 30 days, soonest first. */
export function computeComingUp(
  accreditations: AccommodationExpiryRow[],
  permits: PermitExpiryRow[],
  leases: LeaseExpiryRow[],
  thirtyDaysIso: string,
  data: DashboardStats,
) {
  const items: ComingUpItem[] = accreditations.map((a) => ({
    kind: 'accreditation',
    key: `accreditation:${a.id}`,
    name: a.name || 'Unnamed accommodation',
    what: 'Accreditation',
    date: a.accreditation_expires_at,
    to: `/accommodation-hub?accommodation=${a.id}`,
  }))

  // Newest version first, so the first of each permit seen is the one on file;
  // an older file's expiry no longer counts once it has been replaced.
  const seen = new Set<string>()
  const horizon = new Date(thirtyDaysIso).getTime()
  for (const permit of permits) {
    const key = `${permit.accommodation_id}:${permit.doc_type}`
    if (seen.has(key)) continue
    seen.add(key)
    if (!permit.expires_at || new Date(permit.expires_at).getTime() > horizon) continue
    items.push({
      kind: 'permit',
      key: `permit:${key}`,
      name: permit.accommodation?.name || 'Unnamed accommodation',
      what: REQUIRED_ACCOMMODATION_PERMITS.find((p) => p.type === permit.doc_type)?.label ?? permit.doc_type,
      date: permit.expires_at,
      to: `/accommodation-hub?accommodation=${permit.accommodation_id}`,
    })
  }

  for (const lease of leases) {
    items.push({
      kind: 'lease',
      key: `lease:${lease.id}`,
      name: lease.student?.full_name || 'Unknown student',
      what: `Lease at ${lease.room?.accommodation?.name || 'their accommodation'}`,
      date: lease.end_date,
      to: `/users?user=${lease.student_id}`,
    })
  }

  data.comingUp = items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
