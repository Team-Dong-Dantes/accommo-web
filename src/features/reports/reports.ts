// The OSAS reports. Each is a pure builder — rows and settings in, the body of
// an official form out — so the dialog can re-render it live and the tests can
// check it without a browser. document.ts supplies the letterhead around it.
//
// Personal details (phone numbers, emergency contacts) are off by default:
// under the Data Privacy Act (RA 10173) a report carries them only when the
// officer asks for them.

import { escapeHtml, fmtDate, formatPhone, landlordTitle } from '@/utils/format'
import { REQUIRED_PERMITS, findPermit } from '@/utils/permitExpiry'
import type { RealAccommodation } from '@/composables/useAccommodations'
import type { BoarderRow, LandlordRow } from '@/api/reports'
import { table } from './document'
import type { DrawerPreview } from '@/features/drawer/preview'
import { accommodationStatusBody } from '@/features/drawer/accommodation/accommodationReport'

const e = escapeHtml
const DAY = 86_400_000

export type ReportId = 'masterlist' | 'renewals' | 'occupancy' | 'boarders' | 'landlords' | 'status'

export interface ReportInput {
  /** The Accommodation Hub's rows, already narrowed by the hub's own filters. */
  accommodations: RealAccommodation[]
  boarders: BoarderRow[]
  landlords: LandlordRow[]
  /** The open accommodation record, for its status report. */
  preview?: DrawerPreview | undefined
  /** "Filtered in the Accommodation Hub: …", when the page's filters narrowed the rows. */
  scopeNote?: string | undefined
  now?: number
}

type Params = Record<string, string | boolean>

export interface ReportField {
  key: string
  label: string
  kind: 'select' | 'toggle' | 'date'
  /** For selects: fixed options, or computed from the rows. */
  options?: { value: string; label: string }[] | ((input: ReportInput) => { value: string; label: string }[])
  /** Personal data — marked in the settings panel. */
  personal?: boolean
}

export interface ReportDef {
  id: ReportId
  /** For the reference number. */
  code: string
  title: string
  /** What the report answers, one line. */
  blurb: string
  /** Which rows it needs. */
  needs: 'accommodations' | 'boarders' | 'landlords' | 'record'
  fields: ReportField[]
  defaults: Params
  build: (input: ReportInput, params: Params) => { bodyHtml: string; count: number }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const ALL = { value: '', label: 'All' }
const distinct = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b))
const optionsOf = (xs: string[]) => [ALL, ...distinct(xs).map((x) => ({ value: x, label: x }))]
const ACCEPTS: Record<string, string> = { co_ed: 'Co-ed', male: 'Male only', female: 'Female only' }
const acceptsLabel = (g: string | null) => (g ? ACCEPTS[g] ?? g : '—')
const accredited = (a: RealAccommodation) => a.verified
const date = (iso: string | null | undefined) => (iso ? fmtDate(iso) : '—')

/** Rows under group headings ("Barangay: Silauan Sur"), or flat when not grouped. */
function grouped<T>(rows: T[], keyOf: ((r: T) => string) | null, cols: number, render: (r: T, i: number) => string): string {
  if (!keyOf) return rows.map(render).join('')
  const groups = new Map<string, T[]>()
  for (const r of rows) groups.set(keyOf(r) || '—', [...(groups.get(keyOf(r) || '—') ?? []), r])
  let n = 0
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, list]) => `<tr class="grp"><td colspan="${cols}">${e(k)} (${list.length})</td></tr>` + list.map((r) => render(r, n++)).join(''))
    .join('')
}

function scopeLine(parts: (string | false | null | undefined)[], note?: string): string {
  const text = [...parts.filter(Boolean), note].filter(Boolean).join(' · ')
  return text ? `<p class="scope">${e(text)}</p>` : ''
}

// ── 1. Accredited Accommodations Masterlist ─────────────────────────────────
const masterlist: ReportDef = {
  id: 'masterlist',
  code: 'AML',
  title: 'Accredited Accommodations Masterlist',
  blurb: 'Every accommodation students may stay in, as of a date.',
  needs: 'accommodations',
  fields: [
    { key: 'asOf', label: 'Accredited as of', kind: 'date' },
    { key: 'type', label: 'Accommodation type', kind: 'select', options: (i) => optionsOf(i.accommodations.map((a) => a.type)) },
    { key: 'barangay', label: 'Barangay', kind: 'select', options: (i) => optionsOf(i.accommodations.map((a) => a.barangay)) },
    { key: 'accepts', label: 'Accepts', kind: 'select', options: [ALL, ...Object.entries(ACCEPTS).map(([value, label]) => ({ value, label }))] },
    { key: 'groupBy', label: 'Group by', kind: 'select', options: [{ value: '', label: 'None' }, { value: 'barangay', label: 'Barangay' }] },
    { key: 'contacts', label: 'Include landlord/landlady contact numbers', kind: 'toggle', personal: true },
  ],
  defaults: { asOf: '', type: '', barangay: '', accepts: '', groupBy: 'barangay', contacts: false },
  build(input, p) {
    const asOf = p.asOf ? Date.parse(String(p.asOf)) : input.now ?? Date.now()
    const rows = input.accommodations
      .filter(accredited)
      .filter((a) => !a.accreditedAt || Date.parse(a.accreditedAt) <= asOf)
      .filter((a) => !a.accreditationExpiresAt || Date.parse(a.accreditationExpiresAt) >= asOf)
      .filter((a) => !p.type || a.type === p.type)
      .filter((a) => !p.barangay || a.barangay === p.barangay)
      .filter((a) => !p.accepts || a.genderPolicy === p.accepts)
      .sort((a, b) => a.name.localeCompare(b.name))
    const head = ['No.', 'Accommodation', 'Address', 'Landlord/Landlady', 'Type', 'Accepts', 'Beds', 'Vacant', 'Valid until']
    const body = grouped(rows, p.groupBy === 'barangay' ? (a) => a.barangay : null, head.length, (a, i) => `<tr>
      <td class="c">${i + 1}</td><td><b>${e(a.name)}</b></td><td>${e(a.address)}</td>
      <td>${e(a.landlord)}<br><small>${e(landlordTitle(a.landlordSex))}${p.contacts && a.contact ? ` · ${e(formatPhone(a.contact))}` : ''}</small></td>
      <td>${e(a.type)}</td><td>${e(acceptsLabel(a.genderPolicy))}</td>
      <td class="n">${a.totalCapacity}</td><td class="n">${Math.max(a.totalCapacity - a.totalStudents, 0)}</td>
      <td class="c">${e(date(a.accreditationExpiresAt))}</td></tr>`)
    const beds = rows.reduce((n, a) => n + a.totalCapacity, 0)
    const vacant = rows.reduce((n, a) => n + Math.max(a.totalCapacity - a.totalStudents, 0), 0)
    return {
      count: rows.length,
      bodyHtml: scopeLine([`Accredited as of ${fmtDate(new Date(asOf).toISOString())}`, p.type && String(p.type), p.barangay && `Barangay ${p.barangay}`, p.accepts && `Accepts ${acceptsLabel(String(p.accepts))}`], input.scopeNote)
        + table(head, body, 'No accredited accommodation matches these settings.', 'grid list')
        + (rows.length ? `<p class="note">${rows.length} accredited accommodation${rows.length === 1 ? '' : 's'} · ${beds} beds · ${vacant} vacant.</p>` : ''),
    }
  },
}

// ── 2. Accreditation & Permit Renewal Report ────────────────────────────────
const renewals: ReportDef = {
  id: 'renewals',
  code: 'ARR',
  title: 'Accreditation and Permit Renewal Report',
  blurb: 'Who has to renew, and by when.',
  needs: 'accommodations',
  fields: [
    { key: 'window', label: 'Due within', kind: 'select', options: [
      { value: 'expired', label: 'Already expired' },
      { value: '30', label: '30 days' },
      { value: '60', label: '60 days' },
      { value: '90', label: '90 days' },
    ] },
    { key: 'missing', label: 'Count missing permits as due', kind: 'toggle' },
    { key: 'permits', label: 'Show each permit', kind: 'toggle' },
  ],
  defaults: { window: '60', missing: true, permits: true },
  build(input, p) {
    const now = input.now ?? Date.now()
    const limit = p.window === 'expired' ? now : now + Number(p.window) * DAY
    /** Due: expired, or expiring inside the window. */
    const due = (iso: string | null | undefined) => !!iso && Date.parse(iso) <= limit
    const rows = input.accommodations
      .filter((a) => a.verified || a.accreditationExpiresAt)
      .map((a) => {
        const permits = REQUIRED_PERMITS.map((rp) => {
          const doc = findPermit(a.permits, rp.key)
          return { label: rp.label, expiresAt: doc?.expiresAt ?? null, missing: !doc, due: doc ? due(doc.expiresAt) : !!p.missing }
        })
        return { a, permits, accreditationDue: due(a.accreditationExpiresAt) }
      })
      .filter((r) => r.accreditationDue || r.permits.some((x) => x.due))
      .sort((x, y) => (Date.parse(x.a.accreditationExpiresAt ?? '') || Infinity) - (Date.parse(y.a.accreditationExpiresAt ?? '') || Infinity))

    const cell = (iso: string | null | undefined, missing = false) => {
      if (missing) return 'Not submitted'
      if (!iso) return 'No expiry'
      const days = Math.ceil((Date.parse(iso) - now) / DAY)
      return `${fmtDate(iso)}<br><small>${days < 0 ? `expired ${-days} d ago` : `in ${days} d`}</small>`
    }
    const remark = (r: typeof rows[number]) => {
      const expired = (iso: string | null) => !!iso && Date.parse(iso) < now
      if (expired(r.a.accreditationExpiresAt)) return 'Accreditation expired'
      if (r.permits.some((x) => expired(x.expiresAt))) return 'Permit expired'
      if (r.permits.some((x) => x.missing && x.due)) return 'Incomplete permits'
      return 'For renewal'
    }
    const head = ['No.', 'Accommodation', 'Landlord/Landlady', 'Accreditation valid until', ...(p.permits ? REQUIRED_PERMITS.map((x) => x.label) : []), 'Remark']
    const body = rows.map((r, i) => `<tr>
      <td class="c">${i + 1}</td><td><b>${e(r.a.name)}</b><br><small>${e(r.a.address)}</small></td><td>${e(r.a.landlord)}</td>
      <td>${cell(r.a.accreditationExpiresAt)}</td>
      ${p.permits ? r.permits.map((x) => `<td>${cell(x.expiresAt, x.missing)}</td>`).join('') : ''}
      <td><b>${e(remark(r))}</b></td></tr>`).join('')
    const windowLabel = p.window === 'expired' ? 'Already expired' : `Expired or due within ${p.window} days`
    return {
      count: rows.length,
      bodyHtml: scopeLine([windowLabel, `as of ${fmtDate(new Date(now).toISOString())}`], input.scopeNote)
        + table(head, body, 'Nothing is due for renewal in this window.', 'grid list'),
    }
  },
}

// ── 3. Occupancy Summary ────────────────────────────────────────────────────
const occupancy: ReportDef = {
  id: 'occupancy',
  code: 'OCS',
  title: 'Accommodation Occupancy Summary',
  blurb: 'How full accredited accommodations are, by accommodation or barangay.',
  needs: 'accommodations',
  fields: [
    { key: 'groupBy', label: 'One row per', kind: 'select', options: [{ value: 'accommodation', label: 'Accommodation' }, { value: 'barangay', label: 'Barangay' }] },
    { key: 'type', label: 'Accommodation type', kind: 'select', options: (i) => optionsOf(i.accommodations.map((a) => a.type)) },
    { key: 'barangay', label: 'Barangay', kind: 'select', options: (i) => optionsOf(i.accommodations.map((a) => a.barangay)) },
    { key: 'gender', label: 'Show male / female split', kind: 'toggle' },
  ],
  defaults: { groupBy: 'accommodation', type: '', barangay: '', gender: true },
  build(input, p) {
    const accs = input.accommodations.filter(accredited)
      .filter((a) => !p.type || a.type === p.type)
      .filter((a) => !p.barangay || a.barangay === p.barangay)
    const byBarangay = p.groupBy === 'barangay'
    const buckets = new Map<string, { label: string; sub: string; beds: number; taken: number; male: number; female: number; count: number }>()
    for (const a of accs) {
      const key = byBarangay ? a.barangay || '—' : a.id
      const b = buckets.get(key) ?? { label: byBarangay ? a.barangay || '—' : a.name, sub: byBarangay ? '' : a.barangay, beds: 0, taken: 0, male: 0, female: 0, count: 0 }
      b.beds += a.totalCapacity
      b.taken += Math.min(a.totalStudents, a.totalCapacity)
      b.male += a.maleCount
      b.female += a.femaleCount
      b.count += 1
      buckets.set(key, b)
    }
    const rows = [...buckets.values()].sort((x, y) => x.label.localeCompare(y.label))
    const pct = (t: number, b: number) => (b ? `${Math.round((t / b) * 100)}%` : '—')
    const head = ['No.', byBarangay ? 'Barangay' : 'Accommodation', ...(byBarangay ? ['Accommodations'] : []), 'Beds', 'Taken', 'Vacant', 'Occupancy', ...(p.gender ? ['Male', 'Female'] : [])]
    const line = (r: typeof rows[number], i: number | null) => `<tr${i === null ? ' class="total"' : ''}>
      <td class="c">${i === null ? '' : i + 1}</td><td>${i === null ? 'Total' : `<b>${e(r.label)}</b>${r.sub ? `<br><small>${e(r.sub)}</small>` : ''}`}</td>
      ${byBarangay ? `<td class="n">${r.count}</td>` : ''}
      <td class="n">${r.beds}</td><td class="n">${r.taken}</td><td class="n">${Math.max(r.beds - r.taken, 0)}</td><td class="n">${pct(r.taken, r.beds)}</td>
      ${p.gender ? `<td class="n">${r.male}</td><td class="n">${r.female}</td>` : ''}</tr>`
    const total = rows.reduce((t, r) => ({ ...t, beds: t.beds + r.beds, taken: t.taken + r.taken, male: t.male + r.male, female: t.female + r.female, count: t.count + r.count }),
      { label: 'Total', sub: '', beds: 0, taken: 0, male: 0, female: 0, count: 0 })
    return {
      count: rows.length,
      bodyHtml: scopeLine([`Accredited accommodations as of ${fmtDate(new Date(input.now ?? Date.now()).toISOString())}`, p.type && String(p.type), p.barangay && `Barangay ${p.barangay}`], input.scopeNote)
        + table(head, rows.length ? rows.map((r, i) => line(r, i)).join('') + line(total, null) : '', 'No accredited accommodation matches these settings.', 'grid list'),
    }
  },
}

// ── 4. Boarders Masterlist ──────────────────────────────────────────────────
const boarders: ReportDef = {
  id: 'boarders',
  code: 'OBM',
  title: 'Boarders Masterlist',
  blurb: 'Where every student in an active stay lives, dormitories included.',
  needs: 'boarders',
  fields: [
    { key: 'type', label: 'Accommodation type', kind: 'select', options: (i) => optionsOf(i.boarders.map((b) => b.accommodationType)) },
    { key: 'college', label: 'College', kind: 'select', options: (i) => optionsOf(i.boarders.map((b) => b.college)) },
    { key: 'year', label: 'Year level', kind: 'select', options: (i) => optionsOf(i.boarders.map((b) => b.yearLevel)) },
    { key: 'accommodation', label: 'Accommodation', kind: 'select', options: (i) => optionsOf(i.boarders.map((b) => b.accommodation)) },
    { key: 'barangay', label: 'Barangay', kind: 'select', options: (i) => optionsOf(i.boarders.map((b) => b.barangay)) },
    { key: 'groupBy', label: 'Group by', kind: 'select', options: [{ value: 'accommodation', label: 'Accommodation' }, { value: 'college', label: 'College' }, { value: '', label: 'None' }] },
    { key: 'phones', label: 'Include student phone numbers', kind: 'toggle', personal: true },
    { key: 'emergency', label: 'Include emergency contacts', kind: 'toggle', personal: true },
  ],
  defaults: { type: '', college: '', year: '', accommodation: '', barangay: '', groupBy: 'accommodation', phones: false, emergency: false },
  build(input, p) {
    const rows = input.boarders
      .filter((b) => !p.type || b.accommodationType === p.type)
      .filter((b) => !p.college || b.college === p.college)
      .filter((b) => !p.year || b.yearLevel === p.year)
      .filter((b) => !p.accommodation || b.accommodation === p.accommodation)
      .filter((b) => !p.barangay || b.barangay === p.barangay)
      .sort((a, b) => a.name.localeCompare(b.name))
    // The column a group heading already names is left out of its rows.
    const byAcc = p.groupBy === 'accommodation'
    const byCollege = p.groupBy === 'college'
    const head = ['No.', 'Student', 'ID no.', byCollege ? 'Program' : 'College / Program', ...(byAcc ? [] : ['Accommodation']), 'Room', 'Since', ...(p.phones ? ['Phone'] : []), ...(p.emergency ? ['Emergency contact'] : [])]
    const keyOf = byAcc ? (b: BoarderRow) => `${b.accommodation}${b.barangay ? ` — ${b.barangay}` : ''}` : byCollege ? (b: BoarderRow) => b.college : null
    const program = (b: BoarderRow) => [b.program, b.yearLevel && `Year ${b.yearLevel}`].filter(Boolean).join(' · ')
    const body = grouped(rows, keyOf, head.length, (b, i) => `<tr>
      <td class="c">${i + 1}</td><td><b>${e(b.name)}</b></td><td class="c">${e(b.schoolId || '—')}</td>
      <td>${byCollege ? e(program(b) || '—') : `${e(b.college || '—')}<br><small>${e(program(b))}</small>`}</td>
      ${byAcc ? '' : `<td>${e(b.accommodation)}<br><small>${e(b.barangay)}</small></td>`}<td class="c">${e(b.room)}</td><td class="c">${e(date(b.since))}</td>
      ${p.phones ? `<td>${e(b.phone ? formatPhone(b.phone) : '—')}</td>` : ''}
      ${p.emergency ? `<td>${b.emergency ? `${e(b.emergency.name)}${b.emergency.relationship ? ` (${e(b.emergency.relationship)})` : ''}<br><small>${e(b.emergency.phone ? formatPhone(b.emergency.phone) : '')}</small>` : '—'}</td>` : ''}</tr>`)
    const personal = p.phones || p.emergency
    return {
      count: rows.length,
      bodyHtml: scopeLine([`Students in an active stay as of ${fmtDate(new Date(input.now ?? Date.now()).toISOString())}`, p.type && String(p.type), p.college && String(p.college), p.year && `Year ${p.year}`, p.accommodation && String(p.accommodation), p.barangay && `Barangay ${p.barangay}`], input.scopeNote)
        + table(head, body, 'No student in an active stay matches these settings.', 'grid list')
        + (rows.length ? `<p class="note">${rows.length} student${rows.length === 1 ? '' : 's'}.${personal ? ' This report contains personal information; handle and dispose of it in accordance with the Data Privacy Act of 2012 (RA 10173).' : ''}</p>` : ''),
    }
  },
}

// ── 5. Landlords/Landladies Masterlist ──────────────────────────────────────
const STATUS: Record<string, string> = { verified: 'Verified', pending: 'Pending', reviewing: 'Under review', rejected: 'Rejected', suspended: 'Suspended', unverified: 'Unverified' }
const statusLabel = (s: string) => STATUS[s] ?? (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—')

const landlords: ReportDef = {
  id: 'landlords',
  code: 'LLM',
  title: 'Landlords and Landladies Masterlist',
  blurb: 'Every landlord/landlady account, and the accommodations each runs.',
  needs: 'landlords',
  fields: [
    { key: 'status', label: 'Account status', kind: 'select', options: (i) => [ALL, ...distinct(i.landlords.map((l) => l.status)).map((s) => ({ value: s, label: statusLabel(s) }))] },
    { key: 'withListings', label: 'Only those running an accommodation', kind: 'toggle' },
    { key: 'groupBy', label: 'Group by', kind: 'select', options: [{ value: 'status', label: 'Account status' }, { value: '', label: 'None' }] },
    { key: 'contacts', label: 'Include phone numbers and e-mail', kind: 'toggle', personal: true },
  ],
  defaults: { status: '', withListings: false, groupBy: 'status', contacts: false },
  build(input, p) {
    const rows = input.landlords
      .filter((l) => !p.status || l.status === p.status)
      .filter((l) => !p.withListings || l.accommodations.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
    const head = ['No.', 'Name', ...(p.groupBy === 'status' ? [] : ['Account']), 'Accommodations', 'Beds taken', 'Response rate', 'Joined', ...(p.contacts ? ['Contact'] : [])]
    const body = grouped(rows, p.groupBy === 'status' ? (l) => statusLabel(l.status) : null, head.length, (l, i) => {
      const beds = l.accommodations.reduce((n, a) => n + a.beds, 0)
      const taken = l.accommodations.reduce((n, a) => n + a.taken, 0)
      const list = l.accommodations.map((a) => `${e(a.name)} <small>(${e(a.status.replace(/_/g, ' ') || '—')})</small>`).join('<br>')
      return `<tr>
        <td class="c">${i + 1}</td><td><b>${e(l.name)}</b><br><small>${e(landlordTitle(l.sex))}</small></td>
        ${p.groupBy === 'status' ? '' : `<td>${e(statusLabel(l.status))}</td>`}
        <td>${list || '<i>None yet</i>'}</td>
        <td class="n">${beds ? `${taken} / ${beds}` : '—'}</td>
        <td class="n">${l.responseRate != null ? `${l.responseRate}%` : '—'}</td>
        <td class="c">${e(date(l.joined))}</td>
        ${p.contacts ? `<td>${e(l.phone ? formatPhone(l.phone) : '—')}<br><small>${e(l.email)}</small></td>` : ''}</tr>`
    })
    return {
      count: rows.length,
      bodyHtml: scopeLine([`Landlord/landlady accounts as of ${fmtDate(new Date(input.now ?? Date.now()).toISOString())}`, p.status && statusLabel(String(p.status)), p.withListings && 'running an accommodation'], input.scopeNote)
        + table(head, body, 'No landlord/landlady account matches these settings.', 'grid list')
        + (rows.length ? `<p class="note">${rows.length} landlord/landlady account${rows.length === 1 ? '' : 's'}.${p.contacts ? ' This report contains personal information; handle and dispose of it in accordance with the Data Privacy Act of 2012 (RA 10173).' : ''}</p>` : ''),
    }
  },
}

// ── 6. Accommodation Status Report (one record) ────────────────────────────
const status: ReportDef = {
  id: 'status',
  code: 'ACR',
  title: 'Accommodation Status Report',
  blurb: 'Everything on file about this one accommodation, with its standing.',
  needs: 'record',
  fields: [],
  defaults: {},
  build(input) {
    return input.preview ? { bodyHtml: accommodationStatusBody(input.preview, new Date(input.now ?? Date.now())), count: 1 } : { bodyHtml: '', count: 0 }
  },
}

export const REPORTS: Record<ReportId, ReportDef> = { masterlist, renewals, occupancy, boarders, landlords, status }
