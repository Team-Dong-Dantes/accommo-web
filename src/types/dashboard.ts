// Shared dashboard types + chart palette.
// Moved verbatim from composables/useDashboardStats.ts so both the api/ layer
// and the composable can import them without a circular dependency.
//
// Pruned in the dashboard redesign: twelve fields were computed on every load
// and rendered nowhere (users, tickets, queue, leaveRequests, trends,
// unverifiedUsers, pendingRegistrations, accommodationFunnel, roomsByType,
// ticketsByCategory). They are gone along with the fetchers that fed only them.
// `topOccupied` was in that set and has been brought back into the page.

export interface DashboardStats {
  loading: boolean
  error: string | null
  adminName: string
  accommodations: { total: number; accredited: number; avgRent: number }
  rooms: { total: number; occupied: number; available: number; capacity: number; pax: number; occupancyPct: number }
  topOccupied: { name: string; ratio: string; val: number }[]
  students: { total: number; newThisMonth: number }
  /** Recorded year levels only; `yearMissing` carries the rest. */
  studentsByYear: { year: string; val: number }[]
  /** Recorded colleges only, largest first; `collegeMissing` carries the rest. */
  studentsByCollege: { name: string; val: number }[]
  /**
   * What OSAS holds on file. `documents` is the identity paperwork — the part
   * that is nearly empty and that verification depends on.
   */
  studentProfileQuality: {
    accounts: number
    records: number
    documents: { label: string; recorded: number }[]
    verified: number
    verifiedWithoutSchoolId: number
    yearMissing: number
    collegeMissing: number
  }
  gender: { female: number; male: number; other: number; unspecified: number }
  activeLeases: number
  registrationsByMonth: { ym: string; month: string; students: number; accommodationManagers: number }[]
  /**
   * How long the verification queue has been waiting, not just how deep it is.
   * A single "69 waiting" hid that 47 of them had sat for over a fortnight.
   */
  verificationAges: { label: string; students: number; managers: number; overdue: boolean }[]
  /** Accreditation pipeline by stage — shows where applications actually stop. */
  accommodationFunnel: { stage: string; count: number }[]
  /**
   * Pending accommodations bucketed by how many of the four permits they have
   * submitted. A per-permit "which is missing most" chart was tried first and
   * rendered four identical bars: houses submit everything or nothing, so the
   * distribution is the informative cut, not the per-permit tally.
   */
  permitCompleteness: { submitted: number; accommodations: number }[]
  ticketsByCategory: { name: string; val: number }[]
  /**
   * How long open tickets have waited, in the same buckets the verification
   * backlog uses. Priority was the old breakdown and it is near-constant —
   * 17 medium, 1 urgent — while every ticket is weeks past the response target.
   */
  ticketAges: { label: string; val: number; overdue: boolean }[]
  /** The oldest urgent ticket still open, if there is one. */
  oldestUrgent: { category: string; ageDays: number } | null
  ticketsByPriority: { name: string; val: number }[]
  /** Active leases split by the accreditation status of the house they are in. */
  leasesByAccreditation: { accredited: number; pipeline: number; delisted: number }
  expiringLeases: { id: string; end_date: string | null }[]
  expiringAccreditations: number
  recentTickets: { id: string; subject: string | null; priority: string; status: string; reported_at: string }[]
  accommodationManagerPayments: { pendingVerification: number; overdue: number }
  /** Admin home — triage queues with the oldest rows surfaced. */
  verificationQueue: {
    students: number
    accommodationManagers: number
    withDocs: number
    oldestDays: number
    oldestStudentDays: number
    studentsReadyForReview: number
    studentsPastSla: number
    oldest: { name: string; role: string; ageDays: number; hasDocs: boolean }[]
  }
  accreditationQueue: {
    total: number
    withPermits: number
    /** Pending applications with a complete permit set, by name. */
    ready: string[]
  }
  ticketQueue: {
    open: number
    urgent: number
    unassigned: number
    oldestDays: number
    pastSla: number
    createdLast7Days: number
    createdPrevious7Days: number
    leadingOpenCategory: { name: string; count: number } | null
    oldest: { id: string; subject: string; priority: string; ageDays: number }[]
  }
}

// Quasar palette names used by the chart series on the dashboard.
export const CARD_COLORS = [
  'teal-5',
  'indigo-5',
  'orange-5',
  'blue-5',
  'pink-4',
  'deep-purple-4',
  'green-5',
  'red-5',
]
