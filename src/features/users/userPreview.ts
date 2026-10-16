// User → DetailDrawer preview construction + private helpers.
// Extracted verbatim from pages/admin/Users.vue; the page keeps the fetch
// logic and passes its refs' values in.

import { getTone } from '@/utils/status.config'
import { cap, composeAddress, fmtDate, humanizeEnum, landlordTitle } from '@/utils/format'
import { PERMIT_STATE, expiryLabel, permitStateOf } from '@/utils/permitExpiry'
import type { DrawerPreview, PreviewLease } from '@/features/drawer/preview'
import { DOC_LABELS, userActivity } from './userActivity'
import { fmtMonth, leaseRowsOf, paymentRowsOf, periodLabel } from './userLedger'
import { NO_STANDING, type AccountEvent, type AccountStanding } from '@/api/accounts'
import type { LeaseLedgerRow } from '@/api/leases'

// Re-exported so Users.vue keeps one import surface for the drawer; the
// implementations live in utils/format.ts (ARCHITECTURE.md rule 4).
export { cap, composeAddress, fmtDate, periodLabel }


export function fmtMinutes(m: number | null | undefined) {
  if (m == null) return '—'
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

/**
 * One accommodation a landlord/landlady runs, as Users.vue selects it. Only the columns
 * this builder reads — widening it means widening the query too.
 */
export interface PreviewAccommodationRow {
  id: string
  name: string | null
  status: string | null
  room_type: string | null
  total_rooms: number | null
  rating_avg: number | null
  reviews_count: number | null
  address: string | null
  barangay: string | null
  city: string | null
  /** Its rooms, for the portfolio chart's beds taken / capacity. */
  rooms?: { capacity: number | null; current_pax: number | null }[] | null
}

/** A review of this person, from the `review_admin_feed` view. */
export interface PreviewReviewRow {
  author_name: string | null
  rating: number
  comment: string | null
  created_at: string
}

/** A past tenancy, already mapped by Users.vue out of `boarding_history`. */
export interface PreviewBoardingRow {
  accommodationId?: string
  accommodationName: string
  roomType: string
  address: string
  period: string
  period_start: string
}

/** The student's current placement, mapped by Users.vue from the active lease. */
export interface PreviewHousing {
  placed: boolean
  accommodationId?: string
  accommodationName?: string
  roomType?: string
  landlordName?: string
  address?: string
  moveIn?: string | null
  /** "Room 304", when the lease names its room. */
  room?: string
}

export interface UserDetailInput {
  /**
   * The table row for the selected person (mapUserData's output in Users.vue).
   * Left loose on purpose: the drawer reads a dozen presentational fields that
   * the row builder derives rather than selects, and pinning them here would
   * duplicate that shape in two places. The rows below are database shapes and
   * are typed.
   */
  selectedUser: any | null
  /** student_profiles or landlord_profiles, depending on role. */
  userDetail: any | null
  housing: PreviewHousing | null
  boardingHistory: PreviewBoardingRow[]
  accommodationRows: PreviewAccommodationRow[]
  userReviews: PreviewReviewRow[]
  /** Rows from `verification_documents` for this user. */
  verificationDocs?: {
    id: string
    doc_type: string
    filename: string | null
    file_url: string | null
    status: string | null
    uploaded_at?: string | null
    verified_at?: string | null
    expires_at?: string | null
  }[]
  /** Rows from `accommodation_documents` for every accommodation this landlord/landlady runs. */
  accommodationDocs?: {
    id: string
    accommodation_id: string
    doc_type: string
    file_url: string | null
    version: number | null
    expires_at: string | null
  }[]
  leases?: any[]
  payments?: any[]
  ledger?: LeaseLedgerRow[]
  /** Mean response rate over every landlord/landlady in the Users list. */
  campusResponseRate?: number | null
  /** Reason, end date and restrictions from `account_standing`. */
  standing?: AccountStanding
  /** OSAS decisions about the account, from `audit_logs`. */
  accountEvents?: AccountEvent[]
}

export function buildUserPreview(input: UserDetailInput): DrawerPreview {
  const { selectedUser: u, userDetail: detail, housing, boardingHistory, accommodationRows, userReviews, verificationDocs, accommodationDocs, leases, payments } = input
  if (!u) return { title: 'User Preview', name: '', avatar: '' }

  const isStudent = (u.role || '').toLowerCase() === 'student'
  const isLandlord = (u.role || '').toLowerCase() === 'landlord'
  const respTime = fmtMinutes(detail?.avg_response_minutes)

  let card: DrawerPreview['card']
  const historyCards: any[] = []
  if (isStudent) {
    if (housing?.placed) {
      const h = housing
      historyCards.push({
        icon: 'lucide:house',
        title: h.accommodationName,
        status: 'Current',
        statusTone: 'success',
        active: true,
        roomType: h.roomType || '—',
        location: h.address,
        date: `Move-in ${fmtDate(h.moveIn)}`,
        accommodationId: h.accommodationId,
      })
    }
    boardingHistory.forEach((hh) => {
      historyCards.push({
        icon: 'lucide:history',
        title: hh.accommodationName,
        status: 'Past',
        statusTone: 'neutral',
        roomType: hh.roomType || '—',
        location: hh.address,
        date: hh.period,
        accommodationId: hh.accommodationId,
      })
    })
  } else if (isLandlord && accommodationRows.length) {
    // `accommodationRows.length` is checked above, but the compiler cannot see
    // that through the index — and `name` really is nullable in the database.
    const p = accommodationRows[0]!
    card = {
      title: 'Active Listing',
      accommodationId: p.id,
      head: { title: p.name ?? 'Unnamed accommodation', location: composeAddress(p), status: cap(p.status), statusTone: getTone(p.status) },
      cells: [
        { label: 'Type', value: cap(p.room_type) },
        { label: 'Rooms', value: p.total_rooms != null ? String(p.total_rooms) : '—' },
        { label: 'Rating', value: p.rating_avg != null ? `${p.rating_avg.toFixed(1)} ★` : 'No rating' },
        { label: 'Ratings', value: String(p.reviews_count || 0) },
      ],
    }
  }

  type PReview = NonNullable<DrawerPreview['reviews']>
  const reviews: PReview = userReviews.map((r: PreviewReviewRow) => ({
    author: r.author_name || 'Anonymous',
    rating: r.rating,
    // Omitted rather than set to undefined — exactOptionalPropertyTypes.
    ...(r.comment ? { comment: r.comment } : {}),
    time: fmtDate(r.created_at),
  }))

  const events = userActivity(input, isStudent)

  const activity = events

  // Uploads live in `verification_documents`, which is also the only place a
  // landlord/landlady's business permit exists. The profile URL columns are kept as a
  // fallback for records written before uploads were tracked there.
  const files: NonNullable<DrawerPreview['files']> = []
  const seen = new Set<string>()
  const ownGroup = isLandlord ? 'Account documents' : ''
  for (const doc of verificationDocs ?? []) {
    if (!doc.file_url) continue
    const label = DOC_LABELS[doc.doc_type] || humanizeEnum(doc.doc_type)
    // The status used to be spliced into the name, and only when it was not
    // 'approved' — so an approved document looked like it had no state at all
    // and the badge column stayed empty for most rows.
    files.push({
      name: label,
      url: doc.file_url,
      docId: doc.id,
      docTable: 'verification_documents',
      status: cap(doc.status) || 'Pending',
      statusTone: getTone(doc.status ?? 'pending'),
      expiry: expiryLabel(doc.expires_at),
      ...(ownGroup ? { group: ownGroup } : {}),
      ...(doc.filename ? { filename: doc.filename } : {}),
    })
    seen.add(doc.doc_type)
  }
  const fallback = (type: string, label: string, url: string | null | undefined) => {
    if (url && !seen.has(type)) {
      files.push({ name: label, ...(ownGroup ? { group: ownGroup } : {}), url })
    }
  }
  if (isStudent) {
    fallback('school_id', 'School ID', detail?.school_id_url)
    fallback('assessment_of_fees', 'Assessment of Fees', detail?.assessment_of_fees_url)
  } else if (isLandlord) {
    fallback('government_id', 'Government ID', detail?.government_id_url)

    // Permits filed against the properties this landlord/landlady runs. A lapsed permit
    // on one of their houses belongs on their record — reviewing the landlord/landlady
    // without it means reviewing half the compliance picture.
    //
    // Only the newest version of each permit type per accommodation: the rows
    // arrive version-descending, and older versions are superseded paperwork,
    // not additional documents.
    const nameById = new Map<string, string>(
      (accommodationRows ?? []).map((p: PreviewAccommodationRow) => [p.id, p.name || 'Accommodation']),
    )
    const newest = new Set<string>()
    for (const doc of accommodationDocs ?? []) {
      if (!doc.file_url) continue
      const key = `${doc.accommodation_id}:${doc.doc_type}`
      if (newest.has(key)) continue
      newest.add(key)

      const state = PERMIT_STATE[permitStateOf(doc.expires_at)]
      files.push({
        name: DOC_LABELS[doc.doc_type] || humanizeEnum(doc.doc_type),
        url: doc.file_url,
        docId: doc.id,
        docTable: 'accommodation_documents',
        status: state.label,
        statusTone: state.tone,
        expiry: expiryLabel(doc.expires_at),
        group: nameById.get(doc.accommodation_id) || 'Accommodation',
      })
    }
  }

  type PHistory = NonNullable<DrawerPreview['history']>
  const history: PHistory = []
  if (isStudent) {
    if (housing?.placed) {
      const h = housing
      history.push({
        title: h.accommodationName || 'Active Placement',
        desc: [cap(h.roomType), h.landlordName, h.address].filter(Boolean).join(' · '),
        meta: `Move-in ${fmtDate(h.moveIn)}`,
        tone: 'success',
        icon: 'lucide:house',
        active: true,
      })
    }
    boardingHistory.forEach((hh) => {
      history.push({
        title: hh.accommodationName || 'Boarding',
        desc: [hh.roomType ? cap(hh.roomType) : '', hh.address].filter(Boolean).join(' · '),
        meta: hh.period,
        tone: 'neutral',
        icon: 'lucide:history',
      })
    })
  }

    

  const leaseRows: PreviewLease[] = isStudent ? leaseRowsOf(leases) : []

  const leaseById = new Map<string, PreviewLease>()
  leaseRows.forEach((l) => leaseById.set(l.id, l))

  const paymentRows = paymentRowsOf(payments, leaseById)

  const result: DrawerPreview = {
    title: 'User Preview',
    name: u.name,
    // Their own photo when they have one; the generated initials image is the
    // fallback, since this drawer header is always an image slot.
    avatar: u.avatarUrl,
    initials: u.initials,
    activity,
  }
  if (card) result.card = card
  result.kind = 'user'
  result.userOverview = {
    userId: u.rawId ?? '',
    role: isStudent ? 'student' : isLandlord ? 'landlord' : 'other',
    roleLabel: isStudent ? 'Student' : isLandlord ? landlordTitle(u.sex) : cap(u.role),
    statusLabel: u.status,
    status: String(u.status || '').toLowerCase(),
    email: u.email || '',
    phone: u.contact && u.contact !== 'No phone provided' ? u.contact : '',
    joined: u.joined,
    lastLoginAt: u.lastLoginAt ?? null,
    academic: isStudent
      ? {
          college: detail?.college || '—',
          program: detail?.program || '—',
          yearLevel: detail?.year_level != null ? String(detail.year_level) : '—',
          studentId: detail?.student_id || '—',
        }
      : undefined,
    placement: isStudent
      ? housing?.placed
        ? {
            accommodation: housing.accommodationName || '—',
            accommodationId: housing.accommodationId,
            room: housing.room || '—',
            landlord: housing.landlordName || '—',
            since: housing.moveIn ?? null,
          }
        : null
      : undefined,
    portfolio: isLandlord
      ? accommodationRows.map((a) => ({
          id: a.id,
          name: a.name ?? 'Unnamed accommodation',
          status: a.status ?? '',
          address: composeAddress(a),
          beds: (a.rooms ?? []).reduce((n, r) => n + (r.capacity ?? 0), 0),
          taken: (a.rooms ?? []).reduce((n, r) => n + Math.min(r.current_pax ?? 0, r.capacity ?? 0), 0),
          rating: a.rating_avg,
          reviews: a.reviews_count ?? 0,
        }))
      : undefined,
    responseRate: isLandlord ? (detail?.response_rate ?? null) : undefined,
    avgResponse: isLandlord ? respTime : undefined,
    campusResponseRate: isLandlord ? (input.campusResponseRate ?? null) : undefined,
    standing: input.standing ?? NO_STANDING,
  }
  if (isStudent) {
       result.history = history
       result.historyCards = historyCards
       result.studentId = u.id
       result.leases = leaseRows
       result.payments = paymentRows
       result.ledger = (input.ledger ?? []).map((r) => ({
         ...r,
         accommodationId: leaseById.get(r.leaseId)?.accommodationId ?? '',
         monthLabel: r.month ? fmtMonth(r.month) : '',
       }))
       result.kind = 'user'
   }
  result.files = files
  result.reviews = reviews
  return result
}
