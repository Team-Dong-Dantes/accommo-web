// An accommodation's accreditation term and overall standing, worked out once
// so the record's overview and its printed report can never disagree.

export type Tone = 'ok' | 'warn' | 'bad'

const DAY = 86_400_000
const MONTH = 30.44 * DAY

export interface Term {
  tone: Tone
  label: string
  detail: string
  daysLeft: number | null
  /** One entry per month of the term, for the month strip. */
  months: ('past' | 'now' | 'left')[]
}

export function accreditationTerm(
  accredited: boolean,
  accreditedAt: string | null,
  expiresAt: string | null,
  now = Date.now(),
): Term {
  if (!accredited) return { tone: 'warn', label: 'Pending', detail: 'Not yet accredited by OSAS.', daysLeft: null, months: [] }
  const end = expiresAt ? Date.parse(expiresAt) : NaN
  if (Number.isNaN(end)) return { tone: 'ok', label: 'Accredited', detail: 'No expiry on file.', daysLeft: null, months: [] }
  const daysLeft = Math.ceil((end - now) / DAY)
  const detail = daysLeft < 0 ? `Expired ${-daysLeft} day${daysLeft === -1 ? '' : 's'} ago`
    : daysLeft <= 90 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
    : `${Math.round(daysLeft / 30.44)} months left`
  const tone: Tone = daysLeft < 0 ? 'bad' : daysLeft <= 90 ? 'warn' : 'ok'
  const start = accreditedAt ? Date.parse(accreditedAt) : NaN
  const total = Number.isNaN(start) ? 0 : Math.min(Math.round((end - start) / MONTH), 60)
  const elapsed = Math.floor((now - start) / MONTH)
  const months = Array.from({ length: Math.max(total, 0) }, (_, i): Term['months'][number] =>
    i < elapsed ? 'past' : i === elapsed ? 'now' : 'left')
  return { tone, label: daysLeft < 0 ? 'Expired' : 'Accredited', detail, daysLeft, months }
}

export interface Standing {
  tone: Tone
  title: string
  /** What to look at, in plain words; empty when nothing needs watching. */
  watch: string[]
}

export function standingOf(input: {
  accredited: boolean
  term: Term
  hidden: boolean
  average: number
  reviewCount: number
  campusRating: number | null | undefined
}): Standing {
  const watch: string[] = []
  let bad = false
  const days = input.term.daysLeft
  if (!input.accredited) watch.push('not yet accredited')
  else if (days !== null && days < 0) { bad = true; watch.push('accreditation has expired') }
  else if (days !== null && days <= 90) watch.push(`accreditation expires in ${days} days`)
  if (input.hidden) watch.push('hidden from student listings')
  if (input.campusRating != null && input.reviewCount >= 3 && input.average - input.campusRating <= -0.3) {
    watch.push('rating is below the campus average')
  }
  const title = bad ? 'Needs attention' : input.accredited ? 'In good standing' : 'Awaiting accreditation'
  return { tone: bad ? 'bad' : watch.length ? 'warn' : 'ok', title, watch }
}

/** "2 things to watch: …", or a plain all-clear. */
export function watchLine(watch: string[]): string {
  return watch.length
    ? `${watch.length} thing${watch.length === 1 ? '' : 's'} to watch: ${watch.join('; ')}`
    : 'Nothing to watch right now'
}
