// The verification queue's table: its columns per tab, in that tab's own
// words, and what the search box says.
import { counted } from '@/utils/filterOptions'
import type { VerificationRequest } from '@/features/verifications/queue'

export function verificationSearchPlaceholder(tab: string): string {
  if (tab === 'student') return 'Search student name...'
  if (tab === 'landlord') return 'Search landlord/landlady name...'
  return 'Search accommodation name...'
}

// Each header names exactly what sits under it, in that tab's own words. Only
// `action` is left flexible: it holds either a chevron or a lock note with a
// reviewer's name and "Take over", which is genuinely variable-width.
// Columns whose cell is drawn from other fields sort by what the cell shows.
const SORT_VALUE: Record<string, (r: VerificationRequest) => unknown> = {
  entity: (r) => r.name,
  requirements: (r) => r.requirements.filter((q) => q.ok).length,
  waiting: (r) => r.ageDays,
}
export function verificationColumns(tab: string) {
  const col = (name: string, label: string, headerClasses: string) =>
    ({ name, label, align: 'left', field: name, headerClasses, sortValue: SORT_VALUE[name] })
  const action = { name: 'action', label: '', align: 'right', field: 'action' }
  if (tab === 'student') {
    return [
      { ...col('entity', 'Student', 'col-title'), required: true },
      col('studentNumber', 'Student number', 'col-ref'),
      col('college', 'College and year', 'col-type'),
      col('requirements', 'Requirements', 'col-reqs'),
      col('waiting', 'Waiting', 'col-date'),
      action,
    ]
  }
  if (tab === 'landlord') {
    return [
      { ...col('entity', 'Landlord/Landlady', 'col-title'), required: true },
      col('phone', 'Phone number', 'col-type'),
      col('requirements', 'Requirements', 'col-reqs'),
      col('waiting', 'Waiting', 'col-date'),
      action,
    ]
  }
  return [
    { ...col('entity', 'Accommodation', 'col-title'), required: true },
    col('location', 'Location', 'col-type'),
    col('requirements', 'Permits', 'col-reqs-wide'),
    col('waiting', 'Waiting', 'col-date'),
    action,
  ]
}

export function verificationEmptyMessage(tab: string): string {
  if (tab === 'student') return 'No pending student verifications.'
  if (tab === 'landlord') return 'No pending landlord/landlady verifications.'
  return 'No pending accommodation accreditations.'
}

const READINESS: Record<string, string> = { ready: 'Ready to decide', waiting: 'Waiting on the applicant' }

/** The readiness filter, counted from the open tab's requests so an option never shows an empty list. */
export function readinessFilterConfig(rows: VerificationRequest[]) {
  return [{
    label: 'Readiness',
    key: 'readiness',
    options: counted(rows.map((r) => ({ readiness: r.ready ? 'ready' : 'waiting' })), 'readiness', (v) => READINESS[v] ?? v, ['ready', 'waiting']),
  }]
}
