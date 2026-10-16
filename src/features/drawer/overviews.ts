// The left panel of each drawer record — accommodation, person, room — as one
// typed block per kind. Re-exported from preview.ts.

/**
 * The accommodation overview, as one typed block rather than as strings the
 * pane would have to parse back out of `stats` and `detailGroups`.
 *
 * When this is set, the record renders the cover-led layout in place of the
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
  /** The room's own label when it also has a number ("Corner room"). */
  label?: string | null
  /** The floor's name ("Ground"), when the landlord/landlady gave it one. */
  floorName?: string | null
  /** Water, electricity, Wi-Fi: how each is paid and where this month's bill stands. */
  utilities?: { key: string; label: string; icon: string; terms: string; bill: string; tone: 'muted' | 'ok' | 'warn' | 'bad' }[]
  /** The current boarders' posted utility bills, newest month first. */
  bills?: { id: string; utility: string; month: string; amount: number; dueDate: string; boarder: string; state: 'paid' | 'unpaid' | 'overdue' }[]
  landlord: { id: string; name: string; title: string; contact: string; initials: string; avatarUrl?: string | undefined } | null
}
