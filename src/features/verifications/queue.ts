// The verification queues as OSAS works them: what a request is, what each
// role must supply, and how the queue's rows become requests. Pure — the
// composable (useVerifications) fetches, this shapes.
import { getStatus } from '@/utils/status.config'
import { isStudentId } from '@/utils/format'
import type { AccommodationExtras } from '@/api/accommodations'
import type { ApplicantDetails, ReviewProfile } from '@/api/users'

/**
 * The property behind an accreditation request. An accommodation is not an
 * account, so none of `ReviewProfile` applies to it — what a reviewer checks
 * the permits against is the address, the size and the landlord/landlady behind it.
 */
export interface AccommodationFacts {
  accommodation_type: string | null
  description: string | null
  /** Amenities and house rules, loaded when the review window opens. */
  extras?: AccommodationExtras
  gender_policy: string | null
  purok?: string | null
  barangay: string | null
  city: string | null
  lat: number | null
  lng: number | null
  landlord_email: string | null
  landlord_phone: string | null
  landlord_status: string | null
  landlord_sex: string | null
}

export interface VerificationRequest {
  id: string
  rawId: string
  name: string
  email: string
  owner: string
  initials: string
  type: string
  files: QueueFile[]
  status: string
  statusStyle: { tone: string; icon: string }
  submitted: string
  /** When it arrived, ISO, for ordering. `submitted` is the same thing in words. */
  submittedAt: string | null
  /** When the current review claim was taken, ISO. Null when nobody holds it. */
  reviewingAt: string | null
  /** Who holds the claim (reviewing_by). Null when nobody does. */
  reviewingBy: string | null
  /** The account behind the request, loaded when the review window opens. */
  profile?: ReviewProfile
  /** The property behind an accreditation request, carried from the queue. */
  accommodation?: AccommodationFacts
  /** Accommodation tab: the open accreditation round this request is. */
  round?: RoundInfo
  avatarColor: string
  /** The applicant's profile photo. Empty for an accreditation request. */
  avatarUrl: string
  ownerId?: string
  /** Each file the applicant must supply, and whether it is in. */
  requirements: { label: string; ok: boolean }[]
  /** Every requirement is in, so the request can be decided now. */
  ready: boolean
  /** Student tab: an application is waiting on a landlord/landlady, held up by this decision. */
  applying: boolean
  /** Whole days since it arrived; null when the arrival time is unknown. */
  ageDays: number | null
  /** Past the review target. Accreditation has no target, so never late. */
  late: boolean
  /** A student whose e-mail is not the university's own domain. */
  nonInstitutionalEmail: boolean
  /** Student tab: the student number, empty when not given. */
  studentNumber: string
  /** Student tab: the college, empty when not recorded. */
  college: string
  /** Student tab: "3rd year", empty when not recorded. */
  yearLevel: string
  /** Landlord/Landlady tab: the contact number. */
  phone: string
  /** Accommodation tab: barangay and city. */
  location: string
  /** Accommodation tab: the kind of accommodation, in words. */
  accommodationType: string
}

/**
 * OSAS's review target for account verifications, in days. Mirrors
 * VERIFICATION_REVIEW_SLA_DAYS on the dashboard.
 */
export const REVIEW_TARGET_DAYS = 3

/**
 * The files each applicant role must supply, by the `doc_type` accommo-mobile
 * uploads them as (see its stores/auth.ts). A request is ready to decide when
 * all of them are in — a count of files, which is what this used to check,
 * called a landlord/landlady with a business permit and no ID complete.
 */
export const APPLICANT_REQUIREMENTS: Record<'student' | 'landlord', { type: string; label: string }[]> = {
  student: [
    { type: 'school_id', label: 'School ID' },
    { type: 'assessment_of_fees', label: 'Assessment of fees' },
  ],
  landlord: [
    { type: 'government_id', label: 'Government ID' },
    { type: 'business_permit', label: 'Business permit' },
  ],
}

export const INSTITUTIONAL_DOMAIN = '@isu.edu.ph'

export function checklist(required: { type: string; label: string }[], files: { type?: string }[]) {
  const have = new Set(files.map((file) => file.type))
  return required.map((item) => ({ label: item.label, ok: have.has(item.type) }))
}

export function ordinalYear(year: number | null | undefined) {
  if (!year) return ''
  const suffix = year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'
  return `${year}${suffix} year`
}

/**
 * The school record a student must have filled in before OSAS can decide.
 * The student ID is skippable at registration (freshmen sign up before ISU
 * issues one) and addable later from Profile, so it is chased here rather than
 * at sign-up. Only the student number is a chip of its own, because it is the
 * one commonly missing; the rest is required at registration.
 */
export function studentRecordChecks(detail: ApplicantDetails) {
  return [
    { label: 'Student ID', ok: isStudentId(detail.student_id) },
    { label: 'Course', ok: Boolean(detail.college && detail.program && detail.year_level) },
  ]
}

/**
 * Ready to decide first, then those still waiting on the applicant. Inside
 * each, a student with an application waiting on a landlord/landlady comes
 * first — this decision is what holds their room — then oldest first. A
 * request that has waited longest is the one most overdue, so it leads its
 * group instead of sinking to the last page.
 */
export function byQueueOrder(a: VerificationRequest, b: VerificationRequest) {
  if (a.ready !== b.ready) return a.ready ? -1 : 1
  if (a.applying !== b.applying) return a.applying ? -1 : 1
  return (a.submittedAt ?? '9999').localeCompare(b.submittedAt ?? '9999')
}

/** What an accreditation round asks OSAS to look at. */
export type RoundKind = 'new' | 'resubmission' | 'appeal' | 'renewal' | 'change' | 'permit_update'

export const ROUND_KIND_LABEL: Record<RoundKind, string> = {
  new: 'New accreditation',
  resubmission: 'Resubmission',
  appeal: 'Appeal',
  renewal: 'Renewal',
  change: 'Listing change',
  permit_update: 'Permit update',
}

/**
 * The open round behind an accommodation request, and the decision before it.
 * The accreditation term itself now lives in the database
 * (public.accreditation_term), next to the one function that stamps it.
 */
export interface RoundInfo {
  id: string
  number: number
  kind: RoundKind
  /** The listing stays visible to students while this is decided. */
  live: boolean
  /** accommodations.status as it stands. */
  listingStatus: string
  /** What the landlord/landlady wrote with it: the appeal, or a resubmission note. */
  message: string | null
  /** kind = 'change': the values asked for, by column. */
  proposedChanges: Record<string, unknown> | null
  expiresAt: string | null
  previous: {
    decision: 'approved' | 'returned' | 'rejected'
    decidedAt: string
    flaggedDocs: string[]
    tags: string[]
    note: string | null
  } | null
}

export function getStatusStyle(status: string) {
  const def = getStatus(status)
  return { tone: def.tone, icon: def.icon || 'lucide:clock' }
}

export const ACCOMMODATION_PERMITS = [
  { type: 'sanitary_permit', label: 'Sanitary permit' },
  { type: 'fire_safety', label: 'Fire safety certificate' },
  { type: 'business_permit', label: 'Business permit' },
  { type: 'building_permit', label: 'Building permit' },
]

/** A document as the verification queue view returns it. */
export interface QueueDocumentRow {
  id: string
  filename: string | null
  doc_type: string | null
}

/**
 * A file already mapped onto a queue request. `url` is empty until the request
 * is opened — documents have no readable URL without a signature — and `id` is
 * optional because the profile-column fallbacks carry a URL but no row.
 */
export interface QueueFile {
  id?: string
  name: string
  url: string
  type?: string
  /** Permits only: the expiry date the landlord/landlady gave, ISO date. */
  expiresAt?: string | null
  version?: number
  /** Permits only: SHA-256 of the file, for the duplicate check. */
  sha256?: string | null
  /** Permits only: replaced since OSAS last flagged it. */
  replaced?: boolean
}

// Module scope: the three queues survive navigation, so returning to
