// Dashboard statistics orchestrator.
// Owns the reactive stats object + loading/error state; all Supabase access
// lives in src/api/* modules. Transform logic lifted verbatim from the
// original monolithic load() — no behavior change.

import { ref, reactive } from 'vue'
import type { DashboardStats } from '@/types/dashboard'
import { CARD_COLORS } from '@/types/dashboard'
import { getInitials as initialsOf, getTimeAgoShort as timeAgo } from '@/utils/format'
import {
  fetchAccommodationRows,
  fetchPendingAccommodationIds,
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
  fetchPendingUserRows,
  fetchUnverifiedUserCount,
  fetchUserRoles,
  fetchRegistrationsSince,
  fetchPendingRoleCounts,
  fetchStudentSexes,
  fetchPendingVerificationUsers,
  fetchVerificationDocIndex,
  type PendingUserRow,
} from '@/api/users'
import {
  fetchCollegeCounts,
  fetchYearLevelCounts,
  fetchTicketSummaries,
} from '@/api/tickets'
import {
  fetchActiveLeaseCount,
  fetchExpiringLeases,
  fetchLeaveRequestCount,
  fetchLeasesSince,
  type LeaseStartDateRow,
} from '@/api/leases'
import {
  fetchPendingAccommodationManagerPaymentVerificationCount,
  fetchOverdueAccommodationManagerPaymentCount,
} from '@/api/payments'

export type { DashboardStats } from '@/types/dashboard'
export type { PendingRegistration } from '@/types/dashboard'

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
    users: { total: 0, students: 0, accommodationManagers: 0, agents: 0, admins: 0 },
    roomsByType: [],
    topOccupied: [],
    students: { total: 0, newThisMonth: 0 },
    studentsByCollege: [],
    studentProfileQuality: { records: 0, collegeRecorded: 0, collegeMissing: 0, yearLevelMissing: 0, distinctCollegeValues: 0 },
    studentsByYear: [],
    gender: { female: 0, male: 0, other: 0, unspecified: 0 },
    tickets: {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
      urgent: 0,
    },
    ticketsByCategory: [],
    pendingRegistrations: [],
    unverifiedUsers: { total: 0, pending: 0, reviewing: 0 },
    activeLeases: 0,
    registrationsByMonth: [],
    trends: { users: [], tickets: [], accommodations: [], leases: [] },
    queue: { pendingStudents: 0, pendingAccommodationManagers: 0, pendingAccommodations: 0 },
    expiringLeases: [],
    expiringAccreditations: 0,
    recentTickets: [],
    accommodationManagerPayments: { pendingVerification: 0, overdue: 0 },
    leaveRequests: 0,
    accommodationFunnel: { pending: 0, reviewing: 0, accredited: 0, rejected: 0, delisted: 0 },
    verificationQueue: { students: 0, accommodationManagers: 0, withDocs: 0, oldestDays: 0, oldestStudentDays: 0, studentsReadyForReview: 0, studentsPastSla: 0, oldest: [] },
    accreditationQueue: {
      total: 0,
      withPermits: 0,
      documentGaps: REQUIRED_ACCOMMODATION_PERMITS.map(({ label }) => ({ label, accommodations: 0 })),
      oldest: [],
    },
    ticketQueue: { open: 0, urgent: 0, unassigned: 0, oldestDays: 0, pastSla: 0, createdLast7Days: 0, createdPrevious7Days: 0, leadingOpenCategory: null, oldest: [] },
  }
}

// --- pure transforms (verbatim from the original monolith) -----------------

function computeAccommodations(accommodations: AccommodationRow[], rooms: RoomRow[], data: DashboardStats) {
  data.accommodations.total = accommodations.length
  data.accommodations.accredited = accommodations.filter((accommodation) => accommodation.status === 'accredited').length

  const funnel = { pending: 0, reviewing: 0, accredited: 0, rejected: 0, delisted: 0 }
  for (const accommodation of accommodations) {
    if (accommodation.status === 'pending' || accommodation.status === 'reviewing' || accommodation.status === 'accredited' || accommodation.status === 'rejected' || accommodation.status === 'delisted') {
      funnel[accommodation.status] += 1
    }
  }
  data.accommodationFunnel = funnel
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

  // Rooms by type (sum capacity per room_type)
  const typeMap = new Map<string, { capacity: number; count: number }>()
  for (const r of rooms) {
    const t = r.accommodation?.room_type ?? 'unknown'
    const entry = typeMap.get(t) ?? { capacity: 0, count: 0 }
    entry.capacity += r.capacity ?? 0
    entry.count += 1
    typeMap.set(t, entry)
  }
  data.roomsByType = Array.from(typeMap.entries())
    .map(([type, v]) => ({ type, capacity: v.capacity, count: v.count }))
    .sort((a, b) => b.capacity - a.capacity)

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

function computeUsers(roleRows: string[], data: DashboardStats) {
  let uStudents = 0
  let uAccommodationManagers = 0
  let uAgents = 0
  let uAdmins = 0
  for (const role of roleRows) {
    const r = role.toLowerCase()
    if (r === 'student') uStudents += 1
    else if (r === 'accommodation_manager') uAccommodationManagers += 1
    else if (r === 'agent') uAgents += 1
    else if (r === 'admin') uAdmins += 1
  }
  data.users = {
    total: roleRows.length,
    students: uStudents,
    accommodationManagers: uAccommodationManagers,
    agents: uAgents,
    admins: uAdmins,
  }
}

function computeStudentDemographics(
  collegeSummary: Awaited<ReturnType<typeof fetchCollegeCounts>>,
  years: Map<number, number>,
  sexes: Array<{ sex: string | null }>,
  studentTotal: number,
  data: DashboardStats,
) {
  // By college
  const { counts: colleges } = collegeSummary
  const totalStudents = studentTotal || colleges.size || 1
  data.studentsByCollege = Array.from(colleges.entries())
    .map(([name, val]) => ({ name, val }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 6)
    .map((c, i) => ({
      name: c.name,
      val: c.val,
      pct: `${Math.round((c.val / totalStudents) * 100)}%`,
      ratio: totalStudents > 0 ? c.val / totalStudents : 0,
      color: CARD_COLORS[i % CARD_COLORS.length] ?? 'grey-5',
    }))
  // Keep missing or invalid profile values visible instead of silently dropping them.
  const standardYearLevels = ['1st Yr', '2nd Yr', '3rd Yr', '4th Yr'].map((year, i) => ({
    year,
    val: years.get(i + 1) ?? 0,
  }))
  const unrecordedYears = Array.from(years.entries())
    .filter(([year]) => year < 1 || year > 4)
    .reduce((total, [, count]) => total + count, 0)
  data.studentsByYear = unrecordedYears > 0
    ? [...standardYearLevels, { year: 'Not recorded', val: unrecordedYears }]
    : standardYearLevels
  data.studentProfileQuality = {
    records: collegeSummary.profileCount,
    collegeRecorded: collegeSummary.recordedCount,
    collegeMissing: collegeSummary.missingCount,
    yearLevelMissing: unrecordedYears,
    distinctCollegeValues: collegeSummary.distinctCount,
  }

  // Gender
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
}

function computeTickets(
  ticketRows: Array<{ id: string; status: string; category: string | null }>,
  data: DashboardStats,
) {
  let open = 0
  let inProgress = 0
  let resolved = 0
  let rejected = 0
  const catCounts = new Map<string, number>()
  for (const ticket of ticketRows) {
    const status = ticket.status.toLowerCase()
    if (status === 'open') open += 1
    else if (status === 'in_progress') inProgress += 1
    else if (status === 'resolved') resolved += 1
    else if (status === 'rejected') rejected += 1
    const cat = ticket.category || 'others'
    catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1)
  }
  const ticketTotal = ticketRows.length
  const securityTickets = ticketRows.filter((ticket) => ticket.category === 'security').length
  data.tickets = {
    total: ticketTotal,
    open,
    inProgress,
    resolved,
    rejected,
    urgent: securityTickets,
  }
  const maxCat = Math.max(1, ...Array.from(catCounts.values()))
  data.ticketsByCategory = Array.from(catCounts.entries())
    .map(([name, val], i) => ({
      name,
      val,
      ratio: val / maxCat,
      color: CARD_COLORS[i % CARD_COLORS.length] ?? 'grey-5',
    }))
    .sort((a, b) => b.val - a.val)
}

function computePendingRegistrations(pending: PendingUserRow[], data: DashboardStats) {
  data.pendingRegistrations = pending.map((u) => {
    const isAccommodationManager = (u.role ?? '').toLowerCase() === 'accommodation_manager'
    return {
      initials: initialsOf(u.full_name),
      name: u.full_name || 'Unknown User',
      time: timeAgo(u.created_at),
      role: isAccommodationManager ? 'Accommodation Manager' : 'Student',
      roleColor: isAccommodationManager ? 'indigo-4' : 'teal-4',
      status: (u.status ?? 'pending').charAt(0).toUpperCase() + (u.status ?? 'pending').slice(1).toLowerCase(),
      statusColor: isAccommodationManager ? 'orange' : 'orange',
      color: isAccommodationManager ? 'indigo-5' : 'teal-5',
    }
  })
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

  const accreditationReady = pendingAccommodations.filter((accommodation) => {
    const uploaded = new Set(accommodationDocuments.get(accommodation.id) ?? [])
    return REQUIRED_ACCOMMODATION_PERMITS.every(({ type }) => uploaded.has(type))
  }).length
  const documentGaps = REQUIRED_ACCOMMODATION_PERMITS.map(({ type, label }) => ({
    label,
    accommodations: pendingAccommodations.filter((accommodation) => !(new Set(accommodationDocuments.get(accommodation.id) ?? [])).has(type)).length,
  }))
  const accreditationOldest = pendingAccommodations.slice(0, 3).map((accommodation) => {
    const uploaded = new Set(accommodationDocuments.get(accommodation.id) ?? [])
    return {
      name: accommodation.name || 'Unnamed accommodation',
      roomType: accommodation.room_type,
      hasPermits: REQUIRED_ACCOMMODATION_PERMITS.every(({ type }) => uploaded.has(type)),
    }
  })
  data.accreditationQueue = {
    total: pendingAccommodations.length,
    withPermits: accreditationReady,
    documentGaps,
    oldest: accreditationOldest,
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

// Builds the 13-month trend series used by the KPI sparklines.
function computeTrends(
  regRows: Array<{ created_at: string | null; role: string }>,
  ticketRows: Array<{ reported_at: string | null }>,
  leaseRows: Array<LeaseStartDateRow>,
  data: DashboardStats,
) {
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const now = new Date()
  const monthLabels: string[] = []
  for (let i = 12; i >= 0; i--) {
    monthLabels.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }

  // Users — cumulative registered accounts.
  const regByMonth = new Map<string, number>()
  for (const u of regRows) {
    if (!u.created_at) continue
    const k = monthKey(new Date(u.created_at))
    regByMonth.set(k, (regByMonth.get(k) ?? 0) + 1)
  }
  let running = 0
  const usersTrend: number[] = []
  for (const k of monthLabels) {
    running += regByMonth.get(k) ?? 0
    usersTrend.push(running)
  }

  // Tickets — opened per month (from reported_at).
  const ticketByMonth = new Map<string, number>()
  for (const t of ticketRows) {
    if (!t.reported_at) continue
    const k = monthKey(new Date(t.reported_at))
    ticketByMonth.set(k, (ticketByMonth.get(k) ?? 0) + 1)
  }
  const ticketsTrend = monthLabels.map(k => ticketByMonth.get(k) ?? 0)

  // Leases — started per month (from start_date).
  const leaseByMonth = new Map<string, number>()
  for (const l of leaseRows) {
    if (!l.start_date) continue
    const k = monthKey(new Date(l.start_date))
    leaseByMonth.set(k, (leaseByMonth.get(k) ?? 0) + 1)
  }
  const leasesTrend = monthLabels.map(k => leaseByMonth.get(k) ?? 0)

  data.trends = { users: usersTrend, tickets: ticketsTrend, accommodations: [], leases: leasesTrend }
}

// --- orchestrator ------------------------------------------------------------

export function useDashboardStats() {
  const loading = ref(true)
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

      const [
        adminName,
        accommodations,
        rooms,
        studentTotal,
        studentNew,
        colleges,
        years,
        sexes,
        ticketRows,
        pending,
        unverifiedTotal,
        activeLeases,
        regRows,
        pendingRoles,
        pendingAccommodationIds,
        expLeases,
        expAccred,
        accommodationManagerPaymentsPending,
        accommodationManagerPaymentsOverdue,
        leaveReq,
        userRoles,
        leaseRows,
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
        fetchCollegeCounts(),
        fetchYearLevelCounts(),
        fetchStudentSexes(),
        fetchTicketSummaries(),
        fetchPendingUserRows(),
        fetchUnverifiedUserCount(),
        fetchActiveLeaseCount(),
        fetchRegistrationsSince(regFetchSince),
        fetchPendingRoleCounts(),
        fetchPendingAccommodationIds(),
        fetchExpiringLeases(nowIso, thirtyDaysIso),
        fetchExpiringAccommodationAccreditations(nowIso, thirtyDaysIso),
        fetchPendingAccommodationManagerPaymentVerificationCount(),
        fetchOverdueAccommodationManagerPaymentCount(),
        fetchLeaveRequestCount(),
        fetchUserRoles(),
        fetchLeasesSince(regFetchSince),
        fetchPendingVerificationUsers(),
        fetchVerificationDocIndex(),
        fetchPendingAccommodations(),
        fetchAccommodationDocumentIndex(),
      ]))

      if (adminName) data.adminName = adminName

      // Accommodations / rooms / funnel / rent
      computeAccommodations(accommodations, rooms, data)

      // Rooms (occupancy, by type, top occupied)
      computeRooms(rooms, data)

      // Users (all roles)
      computeUsers(userRoles, data)

      // Students
      data.students.total = studentTotal
      data.students.newThisMonth = studentNew
      computeStudentDemographics(colleges, years, sexes, studentTotal, data)

      // Support tickets
      computeTickets(ticketRows, data)

      // Pending registrations
      computePendingRegistrations(pending, data)

      // Unverified users (pending/reviewing derived from the limit-6 preview
      // rows, exactly as before)
      data.unverifiedUsers = {
        total: unverifiedTotal,
        pending: pending.filter(u => u.status === 'pending').length,
        reviewing: pending.filter(u => u.status === 'reviewing').length,
      }

      // Active leases
      data.activeLeases = activeLeases

      // Accommodation-manager lease payments and leave requests.
      data.accommodationManagerPayments = {
        pendingVerification: accommodationManagerPaymentsPending,
        overdue: accommodationManagerPaymentsOverdue,
      }
      data.leaveRequests = leaveReq

      // Registration trend (last 7 months, split by role)
      computeRegistrationTrend(regRows, data)

      // KPI sparkline trends (cumulative users / tickets / leases)
      computeTrends(regRows, ticketRows, leaseRows, data)

      // Action queue
      data.queue = {
        pendingStudents: pendingRoles.filter(r => r.role === 'student').length,
        pendingAccommodationManagers: pendingRoles.filter(r => r.role === 'accommodation_manager').length,
        pendingAccommodations: pendingAccommodationIds.length,
      }

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
      loading.value = false
      lastUpdated.value = new Date()
    }
  }

  return { loading, error, data, lastUpdated, load }
}
