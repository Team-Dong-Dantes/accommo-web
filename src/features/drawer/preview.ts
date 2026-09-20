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
  /** The manager's own label, falling back to the type's name. */
  label: string
  icon: string
  description?: string
  floor?: number | null
  /** How many photos are filed against it. */
  photoCount?: number
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
  accommodationManager?: string
  address?: string
  moveIn?: string
}

export interface PreviewLease {
  id: string
  accommodationId: string
  accommodationName: string
  accommodationManagerName?: string
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

export interface DrawerPreview {
  kind?: 'user' | 'accommodation' | 'room'
  title?: string
  positionLabel?: string
  viewDetailsLabel?: string
  name: string
  avatar: string
  subtitle?: string
  chips?: PreviewChip[]
  meta?: string
  metaIcon?: string
  stats?: PreviewStat[]
  detailGroups?: PreviewDetailGroup[]
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

/** Gender label helper (occupants tab). */
export function capGender(g: string | null | undefined): string {
  if (!g) return '—'
  const s = g.toLowerCase()
  if (s === 'female') return 'Female'
  if (s === 'male') return 'Male'
  return g.charAt(0).toUpperCase() + g.slice(1)
}

/** Month-year helper (occupants tab). */
export function fmtMonthYear(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
