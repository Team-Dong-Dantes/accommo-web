// The announcement composer's form: its shape, its three steps, and how it
// maps to and from an `announcements` row.
import type { AnnouncementDetails } from './AnnouncementDetailsFields.vue'
import { announcementStatus, dateInput, dateTimeInput, dateToIso } from './shared'

export type ComposerForm = {
  title: string
  body: string
  audience: 'all' | 'students' | 'landlords'
  expiresAt: string | null
  summary: string
  details: AnnouncementDetails
  publishMode: 'draft' | 'now' | 'schedule'
  publishAt: string | null
}

export type FormStep = {
  label: string
  heading: string
  description: string
  guidance: string
}

export const publishOptions = [
  { label: 'Save as draft', value: 'draft' },
  { label: 'Publish now', value: 'now' },
  { label: 'Schedule', value: 'schedule' },
]

export const audienceOptions = [
  { label: 'All users', value: 'all' },
  { label: 'Students', value: 'students' },
  { label: 'Landlords/Landladies', value: 'landlords' },
]

export const steps: FormStep[] = [
  { label: 'Message', heading: 'Write the announcement', description: 'Start with the message people need to receive.', guidance: 'Keep it specific and easy to act on.' },
  { label: 'Audience & details', heading: 'Audience and details', description: 'Decide who receives it, and add any date, deadline, place or poster.', guidance: 'Choose the narrowest group that needs this update.' },
  { label: 'Publish', heading: 'Review and publish', description: 'Confirm the details and choose when it goes out.', guidance: 'You can return to any previous step before saving.' },
]

export function emptyForm(): ComposerForm {
  return {
    title: '',
    body: '',
    audience: 'all',
    expiresAt: null,
    summary: '',
    details: { eventAt: null, eventEnd: null, deadlineAt: null, location: '', imageUrl: '' },
    publishMode: 'draft',
    publishAt: null,
  }
}

export function audienceLabel(audience: ComposerForm['audience']) {
  return audienceOptions.find((option) => option.value === audience)?.label ?? audience
}

export function formFromRow(row: any): ComposerForm {
  const base = emptyForm()
  const status = announcementStatus(row)
  return {
    ...base,
    title: row.title,
    body: row.body,
    audience: row.audience ?? 'all',
    expiresAt: dateInput(row.expires_at),
    summary: row.summary ?? '',
    details: {
      eventAt: dateTimeInput(row.event_at),
      eventEnd: dateTimeInput(row.event_end),
      deadlineAt: dateTimeInput(row.deadline_at),
      location: row.location ?? '',
      imageUrl: row.image_url ?? '',
    },
    publishMode: status === 'scheduled' ? 'schedule' : 'draft',
    publishAt: status === 'scheduled' ? dateTimeInput(row.published_at) : null,
  }
}

/** The columns every save writes; publish state is decided by the caller. */
export function formPayload(form: ComposerForm): Record<string, any> {
  const d = form.details
  return {
    title: form.title.trim(),
    body: form.body.trim(),
    audience: form.audience,
    expires_at: dateToIso(form.expiresAt),
    summary: form.summary.trim() || null,
    event_at: dateToIso(d.eventAt),
    event_end: d.eventAt ? dateToIso(d.eventEnd) : null,
    deadline_at: dateToIso(d.deadlineAt),
    location: d.location.trim() || null,
    image_url: d.imageUrl || null,
  }
}
