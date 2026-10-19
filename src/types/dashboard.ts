// Shared dashboard types + chart palette.
// Moved verbatim from composables/useDashboardStats.ts so both the api/ layer
// and the composable can import them without a circular dependency.
//
// Pruned in the dashboard redesign: twelve fields were computed on every load
// and rendered nowhere (users, tickets, queue, leaveRequests, trends,
// unverifiedUsers, pendingRegistrations, accommodationFunnel, roomsByType,
// ticketsByCategory). They are gone along with the fetchers that fed only them.
// `topOccupied` was in that set and has been brought back into the page.

export interface ComingUpItem {
  kind: 'accreditation' | 'permit' | 'lease'
  key: string
  name: string
  /** What lapses: "Accreditation", the permit's name, or the lease's house. */
  what: string
  date: string
  /** The record to open. */
  to: string
}

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
  registrationsByMonth: { ym: string; month: string; students: number; landlords: number }[]
  /** Active leases split by the accreditation status of the house they are in. */
  leasesByAccreditation: { accredited: number; pipeline: number; delisted: number }
  /**
   * What lapses in the next 30 days, soonest first: accreditations, the
   * permits on accredited listings (expired ones too — they are already late),
   * and leases ending. The work that is coming, before it is in a queue.
   */
  comingUp: ComingUpItem[]
  landlordPayments: { pendingVerification: number }
  /**
   * Account verification by the Verifications page's own readiness rule: what
   * can be decided now, and what the rest still lack. Null when unreadable.
   */
  verifications: {
    ready: number
    waiting: number
    /** Ready ones past the review target. */
    late: number
    /** Ready to decide, in the page's order: students holding a room first, then oldest. */
    rows: { id: string; name: string; role: 'student' | 'landlord'; ageDays: number | null; late: boolean; applying: boolean }[]
    /** The requirement the waiting ones most often lack. */
    mostMissing: { label: string; count: number } | null
  } | null
  accreditationQueue: {
    total: number
    withPermits: number
    /** Pending applications with a complete permit set, by name. */
    ready: { id: string; name: string }[]
  }
  /**
   * Support tickets by who owes the next move (utils/ticketTriage): New, Needs
   * reply, Waiting on the requester. Null when unreadable.
   */
  tickets: {
    new: number
    needsReply: number
    waiting: number
    /** Owed a reply for 48 hours or more. */
    overdue: number
    /** Owed a reply, in the queue's order. */
    rows: { id: string; ref: string; subject: string; reporter: string; waitingSince: string; overdue: boolean; mine: boolean }[]
  } | null
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
