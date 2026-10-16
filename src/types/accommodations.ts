// The accommodation shapes useAccommodations maps Supabase rows into, shared
// by the Accommodation Hub, the Map View and the reports.
import type { StatusTone } from '@/utils/status.config'

// Real accommodation shape pulled from Supabase. Fields the DB doesn't carry
// (audit results, inspectors, compliance permits, performance scores) are
// deliberately absent/empty — the UI renders '—' for them instead of inventing data.

/**
 * BadgePill takes a concrete icon, while the status table leaves it optional,
 * so the badge gets a floor rather than every caller guarding for it.
 */
export interface BadgeStyle { tone: StatusTone; icon: string }

export interface RealPermit {
  id: string
  type: string
  version: number | null
  fileUrl: string | null
  issuedAt: string | null
  expiresAt: string | null
  uploadedAt: string | null
}

export interface RealAccommodation {
  id: string
  /**
   * When the property was put forward, ISO. `accommodations` carries no
   * created-at column, so its age is the newest of its permit uploads — the same
   * reading the verification queue uses to order accreditation requests.
   */
  submittedAt: string | null
  name: string
  /** Fallback behind the hub's cover-photo thumbnail, from the house's name. */
  initials: string
  type: string
  landlord: string
  /** The landlord/landlady's user id, for opening their record. */
  landlordId: string
  /** `users.sex` ('F' | 'M' | null) — feeds `landlordTitle`. */
  landlordSex: string | null
  landlordInitials: string
  /** The landlord/landlady's profile photo, when they have one. */
  landlordAvatarUrl: string
  contact: string
  /** Derived: only an accredited property is visible to students. */
  verified: boolean
  status: string
  /** Sentence-case label and tone/icon for the status badge. */
  statusLabel: string
  statusStyle: BadgeStyle
  rating: string
  /** How many student reviews the rating averages over. */
  reviewsCount: number
  totalRooms: number
  occupiedRooms: number
  totalStudents: number
  totalCapacity: number
  occupancyRate: number
  femaleCount: number
  maleCount: number
  image: string
  /** Every exterior photo, by sort order; `image` is the first. */
  photos: string[]
  address: string
  /** For grouping and filtering the OSAS reports by barangay. */
  barangay: string
  floors: number
  lat: number | null
  lng: number | null
  // hierarchy: Accommodation → Accommodation Type; Room → Room Type
  accommodationType: string
  roomType: string
  description: string
  // Landlord/landlady profile (for Accommodation Hub accreditation/performance tabs)
  businessName: string | null
  accreditationStatus: string | null
  accreditedAt: string | null
  accreditationExpiresAt: string | null
  responseRate: number | null
  rooms: RealRoom[]
  permits: RealPermit[]
  /** Shared facilities (bathrooms, kitchen, study area) on this property. */
  facilities: RealFacility[]
  /** `male` | `female` | `co_ed`, or null when the landlord/landlady has not said. */
  genderPolicy: string | null
  /** OSAS has taken it out of what students browse, without touching its accreditation. */
  hiddenFromListings: boolean
}

export interface RealFacility {
  id: string
  type: string
  label: string
  icon: string
  description: string
  floor: number | null
  photoCount: number
  status: 'available' | 'under_repair'
  /** Rooms the landlord/landlady says share it. */
  roomIds: string[]
}

export interface RealRoom {
  id: string
  name: string
  number: string | null
  floor: number | null
  capacity: number | null
  currentPax: number | null
  status: string
  monthlyRent: number | null
  /** How its utilities are paid, e.g. "Water included · Electricity own meter". */
  utilities: string
  occupants: RealOccupant[]
}

export interface RealOccupant {
  /** The boarder's user id. */
  id: string
  name: string
  initials: string
  /** Their profile photo, when they have one. */
  avatarUrl: string
  gender: 'female' | 'male'
  course: string
  year: string
  since: string
}

/**
 * Shown when a property has no photo on file. It used to be one of five random
 * picsum images handed out round-robin, so the hub showed an unrelated stock
 * photo for every house whether or not real ones had been uploaded — and the
 * same house got a different building each time the list re-sorted.
 */
