// Dashboard statistics orchestrator.
// Owns the reactive stats object + loading/error state; all Supabase access
// lives in src/api/* modules. Transform logic lifted verbatim from the
// original monolithic load() — no behavior change.

import { ref, reactive } from 'vue'
import type { DashboardStats } from '@/types/dashboard'
import {
  fetchAccommodationRows,
  fetchExpiringAccommodationAccreditations,
  fetchPendingAccommodations,
  fetchAccommodationDocumentIndex,
  type AccommodationRow,
} from '@/api/accommodations'
import { fetchRoomRows, type RoomRow } from '@/api/rooms'
import {
  fetchAdminName,
  fetchStudentCount,
  fetchNewStudentCount,
  fetchRegistrationsSince,
  fetchStudentSexes,
  fetchPendingVerificationUsers,
  fetchVerificationDocIndex,
} from '@/api/users'
import {
  fetchStudentProfiles,
  fetchTicketSummaries,
} from '@/api/tickets'
import {
  fetchActiveLeaseCount,
  fetchExpiringLeases,
  fetchActiveLeaseAccreditation,
} from '@/api/leases'
import {
  fetchPendingAccommodationManagerPaymentVerificationCount,
  fetchOverdueAccommodationManagerPaymentCount,
} from '@/api/payments'

export type { DashboardStats } from '@/types/dashboard'

const DASHBOARD_LOAD_TIMEOUT_MS = 15_000
const VERIFICATION_REVIEW_SLA_DAYS = 3
const SUPPORT_TICKET_SLA_DAYS = 3
const REQUIRED_ACCOMMODATION_PERMITS = [
  { type: 'sanitary_permit', label: 'Sanitary permit' },
  { type: 'fire_safety', label: 'Fire safety permit' },
  { type: 'business_permit', label: 'Business permit' },
  { type: 'building_permit', label: 'Building permit' },
]

function settleWithin<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Dashboard data is taking too long to load. Check your connection and retry.'))
    }, DASHBOARD_LOAD_TIMEOUT_MS)

    promise.then(
      (value) => {
        clearTimeout(timeout)
        resolve(value)
      },
      (reason) => {
        clearTimeout(timeout)
        reject(reason)
      },
    )
  })
}

function emptyStats(): DashboardStats {
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
    verificationAges: [],
    accommodationFunnel: [],
    permitCompleteness: [],
    ticketsByCategory: [],
    ticketAges: [],
    oldestUrgent: null,
    ticketsByPriority: [],
    leasesByAccreditation: { accredited: 0, pipeline: 0, delisted: 0 },
    expiringLeases: [],
    expiringAccreditations: 0,
    recentTickets: [],
    accommodationManagerPayments: { pendingVerification: 0, overdue: 0 },
    verificationQueue: { students: 0, accommodationManagers: 0, withDocs: 0, oldestDays: 0, oldestStudentDays: 0, studentsReadyForReview: 0, studentsPastSla: 0, oldest: [] },
    accreditationQueue: { total: 0, withPermits: 0, ready: [] },
    ticketQueue: { open: 0, urgent: 0, unassigned: 0, oldestDays: 0, pastSla: 0, createdLast7Days: 0, createdPrevious7Days: 0, leadingOpenCategory: null, oldest: [] },
  }
}

// --- pure transforms (verbatim from the original monolith) -----------------

const FUNNEL_STAGES: { key: string; stage: string }[] = [
  { key: 'pending', stage: 'Pending' },
  { key: 'reviewing', stage: 'Reviewing' },
  { key: 'accredited', stage: 'Accredited' },
  { key: 'rejected', stage: 'Rejected' },
  { key: 'delisted', stage: 'Delisted' },
]

function computeAccommodations(accommodations: AccommodationRow[], rooms: RoomRow[], data: DashboardStats) {
  data.accommodations.total = accommodations.length
  data.accommodations.accredited = accommodations.filter((accommodation) => accommodation.status === 'accredited').length

  // Where applications actually stop. Empty stages are dropped so the chart
  // does not carry bars of nothing.
  data.accommodationFunnel = FUNNEL_STAGES
    .map(({ key, stage }) => ({ stage, count: accommodations.filter((a) => a.status === key).length }))
    .filter((entry) => entry.count > 0)

  // Rent is per-room (rooms.monthly_rent), not per-accommodation.
  const rents = rooms.map((r) => r.monthly_rent).filter((r): r is number => r != null)
  data.accommodations.avgRent = rents.length
    ? Math.round(rents.reduce((s, r) => s + r, 0) / rents.length)
    : 0
}

function computeRooms(rooms: RoomRow[], data: DashboardStats) {
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
function computeStudentDemographics(
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

function computeRegistrationTrend(
  regRows: Array<{ created_at: string | null; role: string }>,
  data: DashboardStats,
) {
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const now = new Date()
  const monthLabels: string[] = []
  for (let i = 12; i >= 0; i--) {
    monthLabels.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }
  const regByMonth = new Map(monthLabels.map(k => [k, { students: 0, accommodationManagers: 0 }]))
  for (const u of regRows) {
    if (!u.created_at) continue
    const k = monthKey(new Date(u.created_at))
    const bucket = regByMonth.get(k)
    if (!bucket) continue
    if (u.role === 'student') bucket.students += 1
    else if (u.role === 'accommodation_manager') bucket.accommodationManagers += 1
  }
  data.registrationsByMonth = monthLabels.map((k) => {
    const [y, m] = k.split('-')
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('en', { month: 'short' })
    const v = regByMonth.get(k)!
    return { ym: k, month: label, students: v.students, accommodationManagers: v.accommodationManagers }
  })
}

function ageInDays(date: string | null): number {
  if (!date) return 0
  const timestamp = new Date(date).getTime()
  if (Number.isNaN(timestamp)) return 0
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
}

/**
 * Bucket the verification queue by how long each account has waited.
 *
 * The queue was previously reported as one total. Against the live data that
 * total was 69 while 47 of those accounts had been waiting more than a
 * fortnight and only 2 were inside the 3-day target — a shape a single number
 * cannot carry. Buckets are fixed rather than derived so the x-axis means the
 * same thing from one day to the next.
 */
// `overdue` is relative to VERIFICATION_REVIEW_SLA_DAYS (3), so everything past
// the first bucket has already missed the target — 4–7d included.
const AGE_BUCKETS: { label: string; maxDays: number; overdue: boolean }[] = [
  { label: '0–3d', maxDays: VERIFICATION_REVIEW_SLA_DAYS, overdue: false },
  { label: '4–7d', maxDays: 7, overdue: true },
  { label: '8–14d', maxDays: 14, overdue: true },
  { label: '15d+', maxDays: Infinity, overdue: true },
]

function computeVerificationAges(
  pendingUsers: Awaited<ReturnType<typeof fetchPendingVerificationUsers>>,
  data: DashboardStats,
) {
  const rows = AGE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    students: 0,
    managers: 0,
    overdue: bucket.overdue,
  }))

  for (const user of pendingUsers) {
    const age = ageInDays(user.created_at)
    const index = AGE_BUCKETS.findIndex((bucket) => age <= bucket.maxDays)
    const row = rows[index === -1 ? rows.length - 1 : index]
    if (!row) continue
    if (user.role === 'accommodation_manager') row.managers += 1
    else row.students += 1
  }

  data.verificationAges = rows
}

function computeTicketMix(
  tickets: Awaited<ReturnType<typeof fetchTicketSummaries>>,
  data: DashboardStats,
) {
  const tally = (values: (string | null)[]) => {
    const counts = new Map<string, number>()
    for (const value of values) {
      const key = value || 'Uncategorised'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, val]) => ({ name, val }))
      .sort((a, b) => b.val - a.val)
  }

  const open = tickets.filter((ticket) => ['open', 'in_progress'].includes(ticket.status.toLowerCase()))

  data.ticketsByCategory = tally(open.map((t) => t.category))
  data.ticketsByPriority = tally(open.map((t) => t.priority))

  data.ticketAges = AGE_BUCKETS.map(({ label, maxDays, overdue }, index) => {
    const floor = index === 0 ? -Infinity : (AGE_BUCKETS[index - 1]?.maxDays ?? 0)
    return {
      label,
      overdue,
      val: open.filter((ticket) => {
        const age = ageInDays(ticket.reported_at)
        return age > floor && age <= maxDays
      }).length,
    }
  })

  const urgent = open
    .filter((ticket) => ticket.priority.toLowerCase() === 'urgent')
    .sort((a, b) => ageInDays(b.reported_at) - ageInDays(a.reported_at))[0]
  data.oldestUrgent = urgent
    ? { category: urgent.category || 'Uncategorised', ageDays: ageInDays(urgent.reported_at) }
    : null
}

function computeOperationalQueues(
  pendingUsers: Awaited<ReturnType<typeof fetchPendingVerificationUsers>>,
  verificationDocs: Map<string, string[]>,
  pendingAccommodations: Awaited<ReturnType<typeof fetchPendingAccommodations>>,
  accommodationDocuments: Map<string, string[]>,
  tickets: Awaited<ReturnType<typeof fetchTicketSummaries>>,
  data: DashboardStats,
) {
  const verificationOldest = pendingUsers.slice(0, 3).map((user) => ({
    name: user.full_name || 'Unknown user',
    role: user.role,
    ageDays: ageInDays(user.created_at),
    hasDocs: (verificationDocs.get(user.id)?.length ?? 0) > 0,
  }))
  const oldestPendingStudent = pendingUsers.find((user) => user.role === 'student')
  data.verificationQueue = {
    students: pendingUsers.filter((user) => user.role === 'student').length,
    accommodationManagers: pendingUsers.filter((user) => user.role === 'accommodation_manager').length,
    withDocs: pendingUsers.filter((user) => (verificationDocs.get(user.id)?.length ?? 0) > 0).length,
    oldestDays: verificationOldest[0]?.ageDays ?? 0,
    oldestStudentDays: ageInDays(oldestPendingStudent?.created_at ?? null),
    studentsReadyForReview: pendingUsers.filter((user) =>
      user.role === 'student' && (verificationDocs.get(user.id)?.length ?? 0) >= 2,
    ).length,
    studentsPastSla: pendingUsers.filter((user) =>
      user.role === 'student' && ageInDays(user.created_at) > VERIFICATION_REVIEW_SLA_DAYS,
    ).length,
    oldest: verificationOldest,
  }

  // The applications an admin can act on today, by name. `accommodations` has
  // no created_at, so there is no age to rank by — a complete permit set is the
  // only thing that makes one of these decidable.
  const accreditationReady = pendingAccommodations
    .filter((accommodation) => {
      const uploaded = new Set(accommodationDocuments.get(accommodation.id) ?? [])
      return REQUIRED_ACCOMMODATION_PERMITS.every(({ type }) => uploaded.has(type))
    })
    .map((accommodation) => accommodation.name || 'Unnamed accommodation')
  // How complete each pending application is, 0–4 permits.
  const completenessTally = [0, 0, 0, 0, 0]
  for (const accommodation of pendingAccommodations) {
    const uploaded = new Set(accommodationDocuments.get(accommodation.id) ?? [])
    const submitted = REQUIRED_ACCOMMODATION_PERMITS.filter(({ type }) => uploaded.has(type)).length
    completenessTally[submitted] = (completenessTally[submitted] ?? 0) + 1
  }
  data.permitCompleteness = completenessTally.map((accommodations, submitted) => ({
    submitted,
    accommodations,
  }))

  data.accreditationQueue = {
    total: pendingAccommodations.length,
    withPermits: accreditationReady.length,
    ready: accreditationReady.slice(0, 6),
  }

  const openTickets = tickets
    .filter((ticket) => ['open', 'in_progress'].includes(ticket.status.toLowerCase()))
    .sort((a, b) => new Date(a.reported_at).getTime() - new Date(b.reported_at).getTime())
  const sevenDaysAgo = Date.now() - 7 * 86_400_000
  const fourteenDaysAgo = Date.now() - 14 * 86_400_000
  const ticketCreatedAt = (ticket: { reported_at: string }) => new Date(ticket.reported_at).getTime()
  const openCategoryCounts = new Map<string, number>()
  for (const ticket of openTickets) {
    const category = ticket.category || 'Other'
    openCategoryCounts.set(category, (openCategoryCounts.get(category) ?? 0) + 1)
  }
  const leadingOpenCategory = Array.from(openCategoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)[0] ?? null
  data.ticketQueue = {
    open: openTickets.length,
    urgent: openTickets.filter((ticket) => ticket.priority === 'urgent').length,
    unassigned: openTickets.filter((ticket) => !ticket.assignee_id).length,
    oldestDays: ageInDays(openTickets[0]?.reported_at ?? null),
    pastSla: openTickets.filter((ticket) => ageInDays(ticket.reported_at) > SUPPORT_TICKET_SLA_DAYS).length,
    createdLast7Days: tickets.filter((ticket) => ticketCreatedAt(ticket) >= sevenDaysAgo).length,
    createdPrevious7Days: tickets.filter((ticket) => {
      const createdAt = ticketCreatedAt(ticket)
      return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo
    }).length,
    leadingOpenCategory,
    oldest: openTickets.slice(0, 3).map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject || 'Untitled ticket',
      priority: ticket.priority,
      ageDays: ageInDays(ticket.reported_at),
    })),
  }
}

// --- orchestrator ------------------------------------------------------------

export function useDashboardStats() {
  const loading = ref(true)
  const hasLoaded = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  const data = reactive<DashboardStats>(emptyStats())

  async function load() {
    loading.value = true
    error.value = null
    try {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      const nowIso = new Date().toISOString()
      const thirtyDaysIso = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      const regFetchSince = new Date(Date.now() - 395 * 24 * 3600 * 1000).toISOString()

      // 19 queries, down from 26: seven fed transforms that were computed and
      // then rendered nowhere.
      const [
        adminName,
        accommodations,
        rooms,
        studentTotal,
        studentNew,
        profiles,
        sexes,
        ticketRows,
        activeLeases,
        leaseAccreditation,
        regRows,
        expLeases,
        expAccred,
        accommodationManagerPaymentsPending,
        accommodationManagerPaymentsOverdue,
        verificationUsers,
        verificationDocs,
        pendingAccommodations,
        accommodationDocuments,
      ] = await settleWithin(Promise.all([
        fetchAdminName(),
        fetchAccommodationRows(),
        fetchRoomRows(),
        fetchStudentCount(),
        fetchNewStudentCount(since),
        fetchStudentProfiles(),
        fetchStudentSexes(),
        fetchTicketSummaries(),
        fetchActiveLeaseCount(),
        fetchActiveLeaseAccreditation(),
        fetchRegistrationsSince(regFetchSince),
        fetchExpiringLeases(nowIso, thirtyDaysIso),
        fetchExpiringAccommodationAccreditations(nowIso, thirtyDaysIso),
        fetchPendingAccommodationManagerPaymentVerificationCount(),
        fetchOverdueAccommodationManagerPaymentCount(),
        fetchPendingVerificationUsers(),
        fetchVerificationDocIndex(),
        fetchPendingAccommodations(),
        fetchAccommodationDocumentIndex(),
      ]))

      if (adminName) data.adminName = adminName

      // Accommodations / rooms / rent
      computeAccommodations(accommodations, rooms, data)

      // Rooms (occupancy, top occupied)
      computeRooms(rooms, data)

      // Students
      data.students.total = studentTotal
      data.students.newThisMonth = studentNew
      computeStudentDemographics(profiles, sexes, studentTotal, data)

      // Active leases
      data.activeLeases = activeLeases
      data.leasesByAccreditation = leaseAccreditation

      // Accommodation-manager lease payments.
      data.accommodationManagerPayments = {
        pendingVerification: accommodationManagerPaymentsPending,
        overdue: accommodationManagerPaymentsOverdue,
      }

      // Registration trend — the 13-month series behind the registrations chart.
      computeRegistrationTrend(regRows, data)

      // Shape, not just depth: how long the queue has been waiting.
      computeVerificationAges(verificationUsers, data)
      computeTicketMix(ticketRows, data)

      computeOperationalQueues(
        verificationUsers,
        verificationDocs,
        pendingAccommodations,
        accommodationDocuments,
        ticketRows,
        data,
      )

      // Expiring leases (active, ending within 30 days)
      data.expiringLeases = expLeases.map(l => ({
        id: l.id,
        end_date: l.end_date,
      }))

      // Expiring accommodation accreditations (within 30 days).
      data.expiringAccreditations = expAccred.length

      data.recentTickets = ticketRows
        .filter((ticket) => ['open', 'in_progress'].includes(ticket.status.toLowerCase()))
        .slice(0, 5)
        .map((ticket) => ({
          id: ticket.id,
          subject: ticket.subject,
          priority: ticket.priority,
          status: ticket.status,
          reported_at: ticket.reported_at,
        }))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard data'
    } finally {
      hasLoaded.value = true
      loading.value = false
      lastUpdated.value = new Date()
    }
  }

  return { loading, error, data, hasLoaded, lastUpdated, load }
}
