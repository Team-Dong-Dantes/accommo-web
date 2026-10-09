// Pieces more than one report uses: labels, dates, money, and the January to
// December rent grid the payment timeline and the student's record share.

import { escapeHtml } from '@/utils/format'
import type { LedgerRow } from '@/api/reports'
import type { ReportInput } from './reports'

const e = escapeHtml

export const SEX: Record<string, string> = { M: 'Male', F: 'Female' }

/** "2026-09-23" in local time, to compare with plain dates. */
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Whole years old on a day. */
export function ageOn(birth: string, now: number): number {
  // date_of_birth is a plain date; read its parts so no timezone shifts the day.
  const [y, m, day] = birth.slice(0, 10).split('-').map(Number) as [number, number, number]
  const d = new Date(now)
  return d.getFullYear() - y - (d.getMonth() + 1 < m || (d.getMonth() + 1 === m && d.getDate() < day) ? 1 : 0)
}

const STATUS: Record<string, string> = { verified: 'Verified', pending: 'Pending', reviewing: 'Under review', needs_resubmission: 'Needs resubmission', rejected: 'Rejected', suspended: 'Suspended', unverified: 'Unverified' }
export const statusLabel = (s: string) => STATUS[s] ?? (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—')

export function scopeLine(parts: (string | false | null | undefined)[], note?: string): string {
  const text = [...parts.filter(Boolean), note].filter(Boolean).join(' · ')
  return text ? `<p class="scope">${e(text)}</p>` : ''
}

export const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`

// ── Rent, January to December ───────────────────────────────────────────────
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** "2026-09" for a ledger row's month. */
export const monthKey = (r: LedgerRow) => (r.month ?? '').slice(0, 7)

/** This year, then every other year with rent on file, newest first. */
export function yearOptions(ledger: LedgerRow[] | undefined, input: ReportInput) {
  const now = String(new Date(input.now ?? Date.now()).getFullYear())
  const years = [...new Set((ledger ?? []).map((r) => monthKey(r).slice(0, 4)).filter((y) => y && y !== now))].sort().reverse()
  return [{ value: '', label: `${now} (this year)` }, ...years.map((y) => ({ value: y, label: y }))]
}

export interface RentStay {
  first: LedgerRow
  /** January to December; undefined where the stay had no rent that month. */
  months: (LedgerRow | undefined)[]
  /** Months come due and not covered. */
  unpaid: LedgerRow[]
}

/** Each stay's rent over one calendar year. */
export function rentYear(ledger: LedgerRow[], year: string, now: number): RentStay[] {
  const d = new Date(now)
  const thisMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const byStay = new Map<string, LedgerRow[]>()
  for (const r of ledger) {
    if (r.kind === 'rent' && monthKey(r).startsWith(`${year}-`)) byStay.set(r.leaseId, [...(byStay.get(r.leaseId) ?? []), r])
  }
  return [...byStay.values()].map((rs) => {
    const months = MONTHS.map((_, i) => rs.find((r) => monthKey(r) === `${year}-${String(i + 1).padStart(2, '0')}`))
    // Partial and overdue are both unpaid; a month still ahead is not owed yet.
    const unpaid = rs.filter((r) => r.state !== 'paid' && r.state !== 'pending' && monthKey(r) <= thisMonth)
    return { first: rs[0]!, months, unpaid }
  })
}

/** One month: Paid, Pending (sent, not yet confirmed), Unpaid, or "—" outside the stay or not yet due. */
export function rentCell(r: LedgerRow | undefined, s: RentStay, amounts: boolean): string {
  const mark = !r ? null : r.state === 'paid' ? 'Paid' : r.state === 'pending' ? 'Pending' : s.unpaid.includes(r) ? 'Unpaid' : null
  if (!r || !mark) return '<td class="c">—</td>'
  const amount = amounts ? `<br><small>${mark === 'Unpaid' ? `${peso(r.balance)} left` : peso(r.confirmed + r.pending)}</small>` : ''
  return `<td class="c">${mark === 'Unpaid' ? '<b>Unpaid</b>' : mark}${amount}</td>`
}

/** The row's last column: how many months are unpaid, and how much. */
export function unpaidCell(s: RentStay, amounts: boolean): string {
  if (!s.unpaid.length) return '<td class="n">—</td>'
  return `<td class="n">${s.unpaid.length} mo${amounts ? `<br><small>${peso(s.unpaid.reduce((n, r) => n + r.balance, 0))}</small>` : ''}</td>`
}

export const RENT_NOTE = '"Pending" is a payment the landlord/landlady has not yet confirmed; "—" is a month outside the stay or not yet due.'
