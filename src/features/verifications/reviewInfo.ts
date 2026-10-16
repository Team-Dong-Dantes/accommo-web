// What the verification review window reads off a request: the facts grouped
// by the question each answers, the round's history, and how dates, labels and
// permit expiry read. Pure — the window and its rail sections render it.
import { ROUND_KIND_LABEL, type RoundInfo } from '@/features/verifications/queue'

/** Birth date with the age beside it, which is what a reviewer reads for. */
export function birthLine(value: string | null | undefined): string {
  const shown = stamp(value)
  if (!shown) return ''
  const born = new Date(String(value))
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())
  if (beforeBirthday) age -= 1
  return age >= 0 && age < 130 ? `${shown} · ${age}` : shown
}

export function stamp(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const SEX_LABEL: Record<string, string> = { F: 'Female', M: 'Male', O: 'Other' }

/** Enum columns ('bedspace', 'mixed_gender') read as words; typed text is left
 *  exactly as the landlord/landlady entered it. */
export function label(value: string | null | undefined): string {
  if (!value) return ''
  const words = String(value).replace(/_/g, ' ')
  return /^[a-z ]+$/.test(words) ? words.charAt(0).toUpperCase() + words.slice(1) : words
}

export interface InfoRow {
  label: string
  value: string
  /** A sentence or a list, which reads left-aligned under its label rather
   *  than squeezed into the right-hand half of the row. */
  block?: boolean
}
export interface InfoGroup {
  title: string
  icon: string
  rows: InfoRow[]
  /** Set when the group has something to look at, opened from its heading. */
  view?: 'map'
}

/**
 * An accreditation request is about a property, not a person, so it gets its
 * own record: what it is, where it is, who runs it, and where its accreditation
 * stands. The account groups below would be entirely blank for one.
 *
 * Only what the landlord/landlady submits with the property belongs here. Its size —
 * rooms, floors, per-room types, the capacity summed from them — is built after
 * accreditation, so those fields are empty at exactly the moment this panel is
 * read, and nothing in either app ever writes `business_name` or `address`.
 */
/** A house rule is a yes or a no, and an unanswered one is neither. */
export function allowed(value: boolean | null | undefined): string {
  return value == null ? '' : value ? 'Allowed' : 'Not allowed'
}

export function accommodationInfoGroups(request: Record<string, any> | null): InfoGroup[] {
  const a = request?.accommodation ?? {}
  const rules = a.extras?.policies
  return [
    {
      title: 'Property',
      icon: 'lucide:building-2',
      rows: [
        { label: 'Name', value: request?.name || '' },
        { label: 'Type', value: label(a.accommodation_type) },
        { label: 'Gender policy', value: label(a.gender_policy) },
        { label: 'Description', value: a.description || '', block: true },
      ],
    },
    {
      title: 'Location',
      icon: 'lucide:map-pin',
      // No street address is collected — the listing shows "Barangay, City", and
      // where the property really sits is a question for the map, not for a pair
      // of coordinates nobody can read.
      ...(a.lat != null && a.lng != null ? { view: 'map' as const } : {}),
      rows: [
        { label: 'Purok', value: a.purok || '' },
        { label: 'Barangay', value: a.barangay || '' },
        { label: 'City', value: a.city || '' },
      ],
    },
    {
      title: 'House rules',
      icon: 'lucide:scroll-text',
      rows: [
        { label: 'Curfew', value: rules?.curfew_time || '' },
        { label: 'Quiet hours', value: rules?.quiet_hours || '' },
        { label: 'Cooking', value: allowed(rules?.cooking) },
        { label: 'Laundry', value: allowed(rules?.laundry) },
        { label: 'Pets', value: allowed(rules?.pets) },
        { label: 'Visitors', value: rules?.visitor_policy || '', block: true },
      ],
    },
    {
      title: 'Amenities',
      icon: 'lucide:list-checks',
      rows: [
        {
          label: 'Offered',
          value: (a.extras?.amenities ?? []).map(label).join(' · '),
          block: true,
        },
      ],
    },
    {
      title: 'Landlord/Landlady',
      icon: 'lucide:user-round',
      rows: [
        { label: 'Name', value: request?.owner || '' },
        { label: 'Email', value: a.landlord_email || '' },
        { label: 'Phone', value: a.landlord_phone || '' },
        { label: 'Account', value: label(a.landlord_status) },
      ],
    },
  ]
}

/**
 * Grouped by the question each answers: who are they, are they really a student,
 * and what has the account itself done. All of it was already stored — the queue
 * function just never returned it.
 */
export function accountInfoGroups(request: Record<string, any> | null, isLandlord: boolean): InfoGroup[] {
  const p: Record<string, any> = request?.profile ?? {}
  const groups: InfoGroup[] = []

  groups.push({
    title: 'Applicant',
    icon: 'lucide:user',
    rows: [
      { label: 'Name', value: request?.name || '' },
      { label: 'Email', value: request?.email || '' },
      { label: 'Phone', value: p.phone || '' },
      { label: 'Sex', value: SEX_LABEL[String(p.sex ?? '').trim().toUpperCase()] || '' },
      // The field the ID is checked against: a school or government ID prints a
      // birth date, so this is the one comparable fact besides the name.
      { label: 'Date of birth', value: birthLine(p.date_of_birth) },
    ],
  })

  if (!isLandlord) {
    groups.push({
      title: 'Academic',
      icon: 'lucide:graduation-cap',
      rows: [
        { label: 'Student no.', value: p.student_id || '' },
        { label: 'College', value: p.college || '' },
        { label: 'Program', value: p.program || '' },
        { label: 'Year level', value: p.year_level != null ? String(p.year_level) : '' },
      ],
    })
  }

  groups.push({
    title: 'Account',
    icon: 'lucide:shield-user',
    rows: [
      { label: 'Registered', value: stamp(p.registered_at || p.created_at) },
      { label: 'Email confirmed', value: stamp(p.email_verified_at) },
      { label: 'Terms accepted', value: stamp(p.terms_accepted_at) },
      { label: 'Privacy notice', value: stamp(p.privacy_accepted_at) },
      {
        label: 'Sign-up',
        value: p.onboarding_complete == null ? '' : p.onboarding_complete ? 'Complete' : 'Incomplete',
      },
      { label: 'Last login', value: stamp(p.last_login_at) },
    ],
  })

  return groups
}

/** The four permits, in the order the landlord/landlady uploads them. */
export const PERMITS = [
  { type: 'sanitary_permit', label: 'Sanitary permit' },
  { type: 'fire_safety', label: 'Fire safety permit' },
  { type: 'business_permit', label: 'Business permit' },
  { type: 'building_permit', label: 'Building permit' },
]
export function permitName(type: string) {
  return PERMITS.find((p) => p.type === type)?.label ?? type
}
export const PREVIOUS_LABEL: Record<string, string> = {
  approved: 'approved',
  returned: 'sent back for changes',
  rejected: 'refused',
}

export function roundTitleOf(r: RoundInfo | null): string {
  if (!r) return ''
  const base = ROUND_KIND_LABEL[r.kind] ?? 'Request'
  return r.kind === 'resubmission' ? `${base} · round ${r.number}` : base
}
/** kind = 'change': each column asked for, beside what the listing says now. */
const CHANGE_LABEL: Record<string, string> = {
  name: 'Name',
  accommodation_type: 'Type',
  gender_policy: 'Gender policy',
  purok: 'Purok',
  barangay: 'Barangay',
  city: 'City',
  lat: 'Map pin (latitude)',
  lng: 'Map pin (longitude)',
}
export function changeRowsOf(request: Record<string, any> | null, round: RoundInfo | null) {
  const changes = round?.proposedChanges
  if (!changes) return []
  const a = (request?.accommodation ?? {}) as Record<string, unknown>
  const current: Record<string, unknown> = { ...a, name: request?.name }
  return Object.entries(changes).map(([key, to]) => ({
    label: CHANGE_LABEL[key] ?? key,
    from: label(current[key] == null ? '' : String(current[key])),
    to: label(String(to)),
  }))
}

/** A permit with no date, or one already past it, is the reviewer's problem. */
export function expiryTone(f: { expiresAt?: string | null }): 'bad' | 'ok' {
  if (!f.expiresAt) return 'bad'
  return new Date(f.expiresAt) < new Date() ? 'bad' : 'ok'
}
export function expiryText(f: { expiresAt?: string | null }): string {
  if (!f.expiresAt) return 'No expiry date given'
  const when = stamp(f.expiresAt)
  return new Date(f.expiresAt) < new Date() ? `Expired ${when}` : `Expires ${when}`
}
