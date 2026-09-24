// DetailDrawer preview contract — the data-driven shape rendered by the
// drawer's reference layout. Moved verbatim from DetailDrawer.vue so
// feature components can import it without circular dependencies.
// DetailDrawer.vue re-exports everything for backward compatibility
// (RoomHub/AccommodationHub/Users import types from it).

import type { StatusTone } from '@/utils/status.config'

export interface PreviewChip {
  text: string
  tone?: StatusTone
  icon?: string
}
export interface PreviewStat {
  label: string
  value: string | number
  sub?: string
  subTone?: StatusTone
}
export interface PreviewDetail {
  label: string
  value?: string
  link?: string
  tone?: StatusTone
  icon?: string
  avatar?: { initials: string; name?: string }
}
/**
 * A titled group of detail rows, rendered as one section of the detail card.
 * Mirrors accommo-mobile's ProfileBlock: an icon, an uppercase title, and rows
 * beneath it. Replaces the flat `details` list, which put a student's e-mail,
 * college and join date at the same level with no grouping.
 */
export interface PreviewDetailGroup {
  title: string
  icon?: string
  rows: PreviewDetail[]
}
export interface PreviewCardCell {
  label: string
  value?: string
  tone?: StatusTone
  icon?: string
  avatar?: { initials: string; name: string }
}
export interface PreviewCard {
  title: string
  footerLink?: string
  accommodationId?: string
  head: { code?: string; title: string; status: string; statusTone?: StatusTone; location?: string }
  cells?: PreviewCardCell[]
}
export interface PreviewActivity {
  text: string
  time: string
  active?: boolean
  icon?: string
  tone?: StatusTone
}
export interface PreviewReview {
  author: string
  rating: number
  comment?: string
  time?: string
  /** The room the reviewer stayed in, when the review names its lease. */
  room?: string | undefined
}
export interface PreviewHistoryCard {
  icon?: string
  title: string
  status: string
  statusTone?: StatusTone
  active?: boolean
  roomType?: string
  location?: string
  date?: string
  accommodationId?: string
}
export interface PreviewFile {
  name: string
  /**
   * Stored reference. Documents live in Cloudinary under `authenticated`
   * delivery, so this is a `cld:` reference, not something a browser can open —
   * `docId` is what turns it into a signed URL via `utils/docUrl`.
   */
  url: string
  docId?: string
  docTable?: 'verification_documents' | 'accommodation_documents'
  /** The uploaded file's own name, for classifying and icon choice. */
  filename?: string
  /**
   * Review or compliance state, as a badge. An account document carries its own
   * `status` from the reviewer; a property permit has none and gets one derived
   * from its expiry by `utils/permitExpiry`.
   */
  status?: string
  statusTone?: StatusTone
  /** Already phrased for display ("Expires 14 Mar 2027" / "No expiry recorded"). */
  expiry?: string
  /** Section heading to file this document under, e.g. an accommodation name. */
  group?: string
  /** Permit detail for the accommodation record's document viewer. */
  issued?: string | undefined
  uploaded?: string | undefined
  version?: number | null | undefined
  /** Whole days until expiry; negative once expired, null when no date is on file. */
  daysLeft?: number | null | undefined
}
/**
 * A facility on an accommodation (shared) or a room (private). Which of the two
 * is decided by where the row hangs in `accommodation_facilities`, not by a flag
 * carried here — the drawer only ever shows one scope at a time.
 */
export interface PreviewFacility {
  id: string
  /** `facility_type` from the database. */
  type: string
  /** The landlord/landlady's own label, falling back to the type's name. */
  label: string
  icon: string
  description?: string
  floor?: number | null
  /** How many photos are filed against it. */
  photoCount?: number
  /** Its photos, once the record has loaded them. */
  photos?: string[]
  status?: 'available' | 'under_repair'
  /** Rooms that share it, from `accommodation_facility_rooms`. */
  roomIds?: string[]
}
export interface PreviewRoom {
  id: string
  name: string
  floor?: string | number | null
  capacity?: number | null
  pax?: number | null
  status?: string | null
  statusTone?: StatusTone
  accommodationId?: string
  /** Its current boarders — the accommodation record lists them under the room. */
  occupants?: PreviewOccupant[]
  /** Its photos, once the record has loaded them. */
  photos?: string[]
}
export interface PreviewOccupant {
  id: string
  name: string
  initials: string
  /** Their profile photo, when they have one. */
  avatarUrl?: string
  gender?: string | null
  since?: string | null
  status?: string | null
  statusTone?: StatusTone
  /** "BS Nursing · 2nd year" — program and year level, when on file. */
  detail?: string | undefined
}
export interface PreviewPhoto {
  id: string
  url: string
}
export interface PreviewTimelineItem {
  title: string
  desc?: string
  meta?: string
  tone?: StatusTone
  icon?: string
  active?: boolean
}
export interface PreviewPlacement {
  status: string
  statusTone?: StatusTone
  accommodation: string
  roomType?: string
  landlord?: string
  address?: string
  moveIn?: string
}

export interface PreviewLease {
  id: string
  accommodationId: string
  accommodationName: string
  landlordName?: string
  roomName?: string
  roomType?: string | null
  startDate: string | null
  endDate: string | null
  status: string
  statusTone?: StatusTone
  statusLabel?: string
  monthlyRent?: number | null
  moveInLabel?: string
  periodLabel?: string
}

export interface PreviewPayment {
  id: string
  leaseId: string
  accommodationId: string
  month: string
  monthLabel: string
  amount: number
  amountLabel: string
  status: string
  statusTone?: StatusTone
  statusLabel?: string
  paidAt?: string | null
  paidAtLabel?: string
  method: string
  methodLabel?: string
  proofUrl?: string | null
  txnReference?: string | null
  description?: string | null
}

/**
 * The accommodation overview, as one typed block rather than as strings the
 * pane would have to parse back out of `stats` and `detailGroups`.
 *
 * When this is set, PreviewBody renders the cover-led layout in place of the
 * generic identity block, stat strip and field list. Nothing is lost by that
 * swap: type and floors read as a line under the name, the address sits beneath
 * them, occupancy and the sex split are the dial, accreditation and its expiry
 * are their own band, and the landlord/landlady is the pane's foot.
 */
export interface PreviewAccommodationOverview {
  /**
   * Resolved cover URL, or '' when none is on file — `useAccommodations` maps a
   * missing cover to an empty string rather than to a stand-in photograph, so
   * emptiness here is a real signal and drives the pane's own empty state.
   */
  coverUrl: string
  /** The kind of building, e.g. "Boarding House". */
  typeLine: string
  roomCount: number
  /** `total_floors`. */
  floors: number
  /** "Co-ed", "Male only", "Female only", or "Not set" — shown as "Accepts". */
  genderPolicyLabel: string
  /** The average, e.g. "3.9", or "—" with no reviews. */
  ratingLabel: string
  /** Undefined until the record's reviews have loaded. */
  reviewCount?: number | undefined
  /** The landlord/landlady's response rate — theirs, not the accommodation's. */
  responseLabel: string
  amenities: string[]
  /** OSAS has hidden it from what students browse. */
  hidden: boolean
  address: string
  accredited: boolean
  accreditationLabel: string
  /** Already phrased by `expiryLabel` ("Expires 30 Jun 2027"). */
  expiryLabel: string
  /** ISO timestamps bounding the accreditation, for its timeline. */
  accreditedAt: string | null
  expiresAt: string | null
  /** Averages over the accredited accommodations in the hub, for comparison. */
  campus?: { count: number; occupancyPct: number; rating: number | null } | undefined
  occupied: number
  capacity: number
  occupancyPct: number
  female: number
  male: number
  landlord: {
    id: string
    name: string
    /** From `landlordTitle(sex)`; neutral when the sex is not on file. */
    title: string
    contact: string
    initials: string
    avatarUrl?: string
  }
}

/** One accommodation a landlord/landlady runs, as their portfolio chart draws it. */
export interface PreviewPortfolioItem {
  id: string
  name: string
  status: string
  address: string
  beds: number
  taken: number
  rating: number | null
  reviews: number
}

/** The left panel of a person's record, for either role. */
export interface PreviewUserOverview {
  userId: string
  role: 'student' | 'landlord' | 'other'
  /** "Student", or "Landlord"/"Landlady" from users.sex. */
  roleLabel: string
  /** Account status as a word ("Verified", "Pending", "Suspended"…) and its raw value. */
  statusLabel: string
  status: string
  email: string
  phone: string
  /** "Mar 3, 2025". */
  joined: string
  lastLoginAt: string | null
  /** Students only. */
  academic?: { college: string; program: string; yearLevel: string; studentId: string } | undefined
  /** Students only; null when not placed anywhere. */
  placement?: { accommodation: string; accommodationId?: string | undefined; room: string; landlord: string; since: string | null } | null | undefined
  /** Landlords/landladies only. */
  portfolio?: PreviewPortfolioItem[] | undefined
  responseRate?: number | null | undefined
  avgResponse?: string | undefined
  /** Mean response rate over every landlord/landlady in the Users list. */
  campusResponseRate?: number | null | undefined
  /** Why the account is in its state, when a suspension ends, what it is restricted from. */
  standing: { reason: string | null; suspendedUntil: string | null; restrictions: string[] }
}

/** The left panel of a room's record. */
export interface PreviewRoomOverview {
  coverUrl: string
  /** "Room 304". */
  title: string
  typeLabel: string
  accommodation: { id: string; name: string }
  floor: number | null
  capacity: number
  status: string
  statusLabel: string
  rent: number | null
  /** "room" — the whole room — or "person", each boarder paying the rent. */
  rentBasis: 'room' | 'person'
  advanceMonths: number | null
  depositMonths: number | null
  landlord: { id: string; name: string; title: string; contact: string; initials: string; avatarUrl?: string | undefined } | null
}

export interface DrawerPreview {
  kind?: 'user' | 'accommodation' | 'room'
  title?: string
  positionLabel?: string
  viewDetailsLabel?: string
  name: string
  avatar: string
  /**
   * Shown in place of `avatar` when there is no real photo, or the URL fails
   * to load — a colored circle with these letters, the same fallback the
   * table rows already use (`UserInfoCell.vue`), rather than a third-party
   * generated placeholder image.
   */
  initials?: string
  subtitle?: string
  chips?: PreviewChip[]
  meta?: string
  metaIcon?: string
  stats?: PreviewStat[]
  detailGroups?: PreviewDetailGroup[]
  /** Accommodations only — see PreviewAccommodationOverview. */
  overview?: PreviewAccommodationOverview
  /** A person's record overview (Users); drives UserRecord. */
  userOverview?: PreviewUserOverview
  /** A room's record overview (Room Hub); drives RoomRecord. */
  roomOverview?: PreviewRoomOverview
  placement?: PreviewPlacement
  history?: PreviewTimelineItem[]
  files?: PreviewFile[]
  rooms?: PreviewRoom[]
  /**
   * Shared facilities on an accommodation, private ones on a room. Undefined
   * means this kind of record has no facilities concept and the tab is hidden;
   * an empty array means none are on file and the tab shows its empty state.
   */
  facilities?: PreviewFacility[]
  occupants?: PreviewOccupant[]
  photos?: PreviewPhoto[]
  card?: PreviewCard
  activity?: PreviewActivity[]
  reviews?: PreviewReview[]
  historyCards?: PreviewHistoryCard[]
  /** Student boarding history with payment data (student detail drawer). */
  leases?: PreviewLease[]
  payments?: PreviewPayment[]
}

/** Who to show, and what the accommodation record already knows about them. */
export interface PersonTarget {
  userId: string
  role: 'student' | 'landlord'
  name: string
  initials?: string | undefined
  avatarUrl?: string | undefined
  /** 'female' | 'male' for a boarder; the landlord/landlady keeps the brand color. */
  gender?: string | null | undefined
  roleLine: string
  /** The boarder's place in this accommodation, from the room they were opened from. */
  stay?: { room: string; floor?: string | number | null | undefined; since?: string | null | undefined }
}

/** Hub destinations reachable from hover-overlays and room rows. */
export type HubKind = 'map' | 'accommodation' | 'room'

/** Shared tone → soft icon-chip style (activity feeds in tabs). */
export function activityIconStyle(a: { tone?: string }) {
  const base =
    a.tone === 'primary' ? 'var(--c-primary)'
    : a.tone === 'success' ? 'var(--c-success)'
    : a.tone === 'warning' ? 'var(--c-warning)'
    : a.tone === 'danger' ? 'var(--c-danger)'
    : a.tone === 'info' ? 'var(--c-info, var(--c-primary))'
    : 'var(--c-muted)'
  return {
    background: `color-mix(in srgb, ${base} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${base} 34%, transparent)`,
    color: base,
  }
}

// The occupants tab used to call a `capGender` that special-cased 'male' and
// 'female'; both branches produced exactly what plain sentence-casing produces,
// so it was the shared `cap` with extra steps.
export { cap } from '@/utils/format'

/** Month-year helper (occupants tab). */
export function fmtMonthYear(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/** Rooms or facilities on one floor, in the drawer's floor-grouped lists. */
export interface FloorGroup<T> {
  key: string
  /** "Floor 2" — the same wording accommo-mobile's landlord screens use. */
  label: string
  items: T[]
}

/** Groups by `floor`, lowest first, with anything unplaced last. */
export function groupByFloor<T extends { floor?: string | number | null }>(items: T[]): FloorGroup<T>[] {
  const byFloor = new Map<number, T[]>()
  const unplaced: T[] = []
  for (const it of items) {
    const n = it.floor == null || it.floor === '' ? NaN : Number(it.floor)
    if (Number.isNaN(n)) unplaced.push(it)
    else byFloor.set(n, [...(byFloor.get(n) ?? []), it])
  }
  const groups: FloorGroup<T>[] = [...byFloor.entries()]
    .sort(([a], [b]) => a - b)
    .map(([n, list]) => ({ key: String(n), label: `Floor ${n}`, items: list }))
  if (unplaced.length) groups.push({ key: 'none', label: 'No floor set', items: unplaced })
  return groups
}
