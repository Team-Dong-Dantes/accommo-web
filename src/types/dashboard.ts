// Shared dashboard types + chart palette.
// Moved verbatim from composables/useDashboardStats.ts so both the api/ layer
// and the composable can import them without a circular dependency.

export interface PendingRegistration {
  initials: string
  name: string
  time: string
  role: string
  roleColor: string
  status: string
  statusColor: string
  color: string
}

export interface DashboardStats {
  loading: boolean
  error: string | null
  adminName: string
  accommodations: { total: number; accredited: number; avgRent: number }
  rooms: { total: number; occupied: number; available: number; capacity: number; pax: number; occupancyPct: number }
  users: { total: number; students: number; accommodationManagers: number; agents: number; admins: number }
  roomsByType: { type: string; capacity: number; count: number }[]
  topOccupied: { name: string; ratio: string; val: number }[]
  students: { total: number; newThisMonth: number }
  studentsByCollege: { name: string; val: number; pct: string; ratio: number; color: string }[]
  studentProfileQuality: { records: number; collegeRecorded: number; collegeMissing: number; yearLevelMissing: number; distinctCollegeValues: number }
  studentsByYear: { year: string; val: number }[]
  gender: { female: number; male: number; other: number; unspecified: number }
  tickets: {
    total: number
    open: number
    inProgress: number
    resolved: number
    rejected: number
    urgent: number
  }
  ticketsByCategory: { name: string; val: number; ratio: number; color: string }[]
  pendingRegistrations: PendingRegistration[]
  unverifiedUsers: { total: number; pending: number; reviewing: number }
  activeLeases: number
  registrationsByMonth: { ym: string; month: string; students: number; accommodationManagers: number }[]
  trends: { users: number[]; tickets: number[]; accommodations: number[]; leases: number[] }
  queue: { pendingStudents: number; pendingAccommodationManagers: number; pendingAccommodations: number }
  expiringLeases: { id: string; end_date: string | null }[]
  expiringAccreditations: number
  recentTickets: { id: string; subject: string | null; priority: string; status: string; reported_at: string }[]
  accommodationManagerPayments: { pendingVerification: number; overdue: number }
  leaveRequests: number
  accommodationFunnel: { pending: number; reviewing: number; accredited: number; rejected: number; delisted: number }
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
    documentGaps: { label: string; accommodations: number }[]
    oldest: { name: string; roomType: string | null; hasPermits: boolean }[]
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
