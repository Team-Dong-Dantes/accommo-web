// A report on one person, opened from their record in Users: the student's
// boarding record, or the landlord/landlady's. Same form frame as the
// accommodation status report — numbered sections, ruled grids — and the same
// rule on personal details: off unless the officer asks (RA 10173).

import { escapeHtml, fmtDate, formatPhone, humanizeEnum, landlordTitle } from '@/utils/format'
import type { StayRow } from '@/api/reports'
import { fmtMinutes } from '@/features/users/userPreview'
import { table } from './document'
import { MONTHS, RENT_NOTE, SEX, ageOn, monthKey, peso, rentCell, rentYear, scopeLine, statusLabel, unpaidCell, yearOptions } from './parts'
import type { ReportDef } from './reports'

const e = escapeHtml
const date = (iso: string | null | undefined) => (iso ? fmtDate(iso) : '—')
const PRIVACY = 'This report contains personal information; handle and dispose of it in accordance with the Data Privacy Act of 2012 (RA 10173).'

/** Label | value pairs, two to a row; a pair marked wide takes the whole row. */
function formGrid(pairs: [string, string, 'wide'?][]): string {
  const rows: string[] = []
  let half: string | null = null
  for (const [label, value, wide] of pairs) {
    const cell = `<th>${e(label)}</th><td${wide ? ' colspan="3"' : ''}>${e(value || '—')}</td>`
    if (wide) {
      if (half) rows.push(`<tr>${half}<th></th><td></td></tr>`)
      half = null
      rows.push(`<tr>${cell}</tr>`)
    } else if (half) {
      rows.push(`<tr>${half}${cell}</tr>`)
      half = null
    } else half = cell
  }
  if (half) rows.push(`<tr>${half}<th></th><td></td></tr>`)
  return `<table class="form">${rows.join('')}</table>`
}

const STAY: Record<string, string> = { active: 'Current', leave_requested: 'Leaving', ended: 'Ended', terminated: 'Terminated' }
const period = (s: StayRow) => `${date(s.since)} – ${s.current ? 'present' : date(s.until)}`
const yearOf = (input: { now?: number }, p: Record<string, string | boolean>) => String(p.year || new Date(input.now ?? Date.now()).getFullYear())

// ── Student Boarding Record ─────────────────────────────────────────────────
export const studentRecord: ReportDef = {
  id: 'student',
  code: 'SBR',
  title: 'Student Boarding Record',
  blurb: "This student's profile, every stay, and their rent month by month.",
  needs: 'student',
  fields: [
    { key: 'year', label: 'Payment year', kind: 'select', options: (i) => yearOptions(i.student?.ledger, i) },
    { key: 'amounts', label: 'Show amounts', kind: 'toggle' },
    { key: 'birthdays', label: 'Include birthday and age', kind: 'toggle', personal: true },
    { key: 'contacts', label: 'Include phone number and e-mail', kind: 'toggle', personal: true },
    { key: 'emergency', label: 'Include emergency contact', kind: 'toggle', personal: true },
  ],
  defaults: { year: '', amounts: true, birthdays: false, contacts: false, emergency: false },
  build(input, p) {
    const s = input.student
    if (!s) return { bodyHtml: '', count: 0 }
    const now = input.now ?? Date.now()
    const year = yearOf(input, p)

    const profile = formGrid([
      ['Name of student', s.name, 'wide'],
      ['ID no.', s.schoolId],
      ['Sex', SEX[s.sex?.toUpperCase() ?? ''] ?? ''],
      ['College', s.college],
      ['Program / year', [s.program, s.yearLevel && `Year ${s.yearLevel}`].filter(Boolean).join(' · ')],
      ['Account status', statusLabel(s.status)],
      ['Verified by OSAS', s.verifiedAt ? fmtDate(s.verifiedAt) : 'Not yet'],
      ['Registered on', date(s.joined)],
      ...(p.birthdays ? [['Birthday', s.birthDate ? `${fmtDate(s.birthDate)} (${ageOn(s.birthDate, now)} yrs)` : ''] as [string, string]] : []),
      ...(p.contacts ? [['Phone', s.phone ? formatPhone(s.phone) : ''], ['E-mail', s.email]] as [string, string][] : []),
      ...(p.emergency ? [['Emergency contact', s.emergency ? `${s.emergency.name}${s.emergency.relationship ? ` (${s.emergency.relationship})` : ''}${s.emergency.phone ? ` · ${formatPhone(s.emergency.phone)}` : ''}` : '', 'wide']] as [string, string, 'wide'][] : []),
    ])

    const stays = [...s.stays].sort((a, b) => (b.since ?? '').localeCompare(a.since ?? ''))
    const history = stays.map((st, i) => `<tr><td class="c">${i + 1}</td><td><b>${e(st.accommodation)}</b></td><td class="c">${e(st.room)}</td>
      <td>${e(st.landlord)}</td><td>${e(period(st))}</td><td class="n">${st.monthlyRent ? peso(st.monthlyRent) : '—'}</td>
      <td>${e(STAY[st.status] ?? humanizeEnum(st.status))}${st.endedReason ? `<br><small>${e(humanizeEnum(st.endedReason))}</small>` : ''}</td></tr>`).join('')

    const rent = rentYear(s.ledger, year, now).sort((a, b) => (b.first.month ?? '').localeCompare(a.first.month ?? ''))
    const grid = rent.map((r) => `<tr><td><b>${e(r.first.accommodation)}</b><br><small>${e(r.first.room)}</small></td>
      ${r.months.map((m) => rentCell(m, r, !!p.amounts)).join('')}${unpaidCell(r, !!p.amounts)}</tr>`).join('')

    const owed = s.pastOwed.map((o) => `<tr><td>${e(o.accommodation)}</td><td class="c">${e(o.room)}</td><td class="c">${e(date(o.endedOn))}</td><td class="n"><b>${peso(o.balance)}</b></td></tr>`).join('')

    return {
      count: 1,
      bodyHtml: `
        <h2>I. Student profile</h2>${profile}
        <h2>II. Boarding history</h2>
        ${table(['No.', 'Accommodation', 'Room', 'Landlord/Landlady', 'Period', 'Monthly rent', 'Status'], history, 'No stay on file.')}
        <h2>III. Rent, January – December ${e(year)}</h2>
        ${table(['Stay', ...MONTHS, 'Unpaid'], grid, `No rent on file for ${year}.`, 'grid list')}
        ${grid ? `<p class="note">${RENT_NOTE}</p>` : ''}
        <h2>IV. Balance owed on past stays</h2>
        ${table(['Accommodation', 'Room', 'Ended on', 'Balance'], owed, 'Nothing is owed on past stays.')}
        ${p.birthdays || p.contacts || p.emergency ? `<p class="note">${PRIVACY}</p>` : ''}`,
    }
  },
}

// ── Landlord/Landlady Record ────────────────────────────────────────────────
export const landlordRecord: ReportDef = {
  id: 'landlord',
  code: 'LLR',
  title: 'Landlord/Landlady Record',
  blurb: 'This landlord/landlady, their accommodations, current boarders, and rent collected.',
  needs: 'landlord',
  fields: [
    { key: 'year', label: 'Collection year', kind: 'select', options: (i) => yearOptions(i.landlord?.ledger, i) },
    { key: 'contacts', label: 'Include phone number and e-mail', kind: 'toggle', personal: true },
  ],
  defaults: { year: '', contacts: false },
  build(input, p) {
    const l = input.landlord
    if (!l) return { bodyHtml: '', count: 0 }
    const now = input.now ?? Date.now()
    const year = yearOf(input, p)
    const pr = l.profile

    const profile = formGrid([
      ['Name', pr.name, 'wide'],
      ['Title', landlordTitle(pr.sex)],
      ['Account status', statusLabel(pr.status)],
      ['Registered on', date(pr.joined)],
      ['Accommodations', String(pr.accommodations.length)],
      ['Response rate', pr.responseRate != null ? `${pr.responseRate}%` : ''],
      ['Average response', fmtMinutes(pr.avgResponseMinutes)],
      ...(p.contacts ? [['Phone', pr.phone ? formatPhone(pr.phone) : ''], ['E-mail', pr.email]] as [string, string][] : []),
    ])

    const accs = [...pr.accommodations].sort((a, b) => a.name.localeCompare(b.name))
    const sum = (k: 'beds' | 'taken') => accs.reduce((n, a) => n + a[k], 0)
    const accRows = accs.map((a, i) => `<tr><td class="c">${i + 1}</td><td><b>${e(a.name)}</b></td><td>${e(humanizeEnum(a.status) || '—')}</td>
      <td class="c">${e(date(a.expiresAt))}</td><td class="n">${a.beds}</td><td class="n">${a.taken}</td><td class="n">${Math.max(a.beds - a.taken, 0)}</td></tr>`).join('')
      + (accs.length > 1 ? `<tr class="total"><td></td><td>Total</td><td></td><td></td><td class="n">${sum('beds')}</td><td class="n">${sum('taken')}</td><td class="n">${Math.max(sum('beds') - sum('taken'), 0)}</td></tr>` : '')

    // Current boarders under their accommodation, rooms in number order.
    const current = l.stays.filter((s) => s.current).sort((a, b) =>
      a.accommodation.localeCompare(b.accommodation) || a.room.localeCompare(b.room, 'en', { numeric: true }) || a.student.localeCompare(b.student))
    const boarderRows = current.map((s, i) =>
      (s.accommodation !== current[i - 1]?.accommodation
        ? `<tr class="grp"><td colspan="5">${e(s.accommodation)} (${current.filter((x) => x.accommodation === s.accommodation).length})</td></tr>`
        : '')
      + `<tr><td class="c">${i + 1}</td><td><b>${e(s.student)}</b></td><td class="c">${e(SEX[s.studentSex?.toUpperCase() ?? ''] ?? '—')}</td><td class="c">${e(s.room)}</td><td class="c">${e(date(s.since))}</td></tr>`).join('')

    // Rent collection: only months that have come due, so prepaid months ahead don't count twice.
    const d = new Date(now)
    const lastMonth = String(year) === String(d.getFullYear()) ? d.getMonth() : 11
    const cutoff = `${year}-${String(lastMonth + 1).padStart(2, '0')}`
    const rent = rentYear(l.ledger, year, now)
    const byAcc = new Map<string, typeof rent>()
    for (const r of rent) byAcc.set(r.first.accommodation, [...(byAcc.get(r.first.accommodation) ?? []), r])
    const totals = (list: typeof rent) => {
      const due = list.flatMap((s) => s.months).filter((r) => r && monthKey(r) <= cutoff)
      const add = (k: 'due' | 'confirmed' | 'pending') => due.reduce((n, r) => n + r![k], 0)
      return { boarders: list.length, due: add('due'), collected: add('confirmed'), pending: add('pending'),
        outstanding: list.reduce((n, s) => n + s.unpaid.reduce((m, r) => m + r.balance, 0), 0), owing: list.filter((s) => s.unpaid.length).length }
    }
    const line = (label: string, t: ReturnType<typeof totals>, total = false) => `<tr${total ? ' class="total"' : ''}><td>${total ? label : `<b>${e(label)}</b>`}</td>
      <td class="n">${t.boarders}</td><td class="n">${peso(t.due)}</td><td class="n">${peso(t.collected)}</td><td class="n">${peso(t.pending)}</td>
      <td class="n">${peso(t.outstanding)}</td><td class="n">${t.owing}</td></tr>`
    const accNames = [...byAcc.keys()].sort((a, b) => a.localeCompare(b))
    const collection = accNames.map((n) => line(n, totals(byAcc.get(n)!))).join('') + (accNames.length > 1 ? line('Total', totals(rent), true) : '')

    return {
      count: 1,
      bodyHtml: `
        <h2>I. ${e(landlordTitle(pr.sex))} profile</h2>${profile}
        <h2>II. Accommodations</h2>
        ${table(['No.', 'Accommodation', 'Status', 'Accreditation valid until', 'Beds', 'Taken', 'Vacant'], accRows, 'No accommodation on file.')}
        <h2>III. Current boarders</h2>
        ${table(['No.', 'Boarder', 'Sex', 'Room', 'Since'], boarderRows, 'No current boarders.')}
        <h2>IV. Rent collection, January – ${MONTHS[lastMonth]} ${e(year)}</h2>
        ${scopeLine(['Months that have come due', 'Pending is sent by the student, not yet confirmed'])}
        ${table(['Accommodation', 'Boarders', 'Rent due', 'Collected', 'Pending', 'Outstanding', 'With an unpaid month'], collection, `No rent on file for ${year}.`)}
        ${p.contacts ? `<p class="note">${PRIVACY}</p>` : ''}`,
    }
  },
}
