// Payment Timeline: one accommodation's boarders down the side, January to
// December across the top, and whether each month's rent is paid. Built on the
// database's ledger_rows (through lease_ledger), so it agrees with what the
// student and the landlord/landlady see in the app. The grid itself is in
// parts.ts; the student's record draws it too.

import { escapeHtml } from '@/utils/format'
import type { LedgerRow } from '@/api/reports'
import { table } from './document'
import { MONTHS, RENT_NOTE, rentCell, rentYear, scopeLine, unpaidCell, yearOptions } from './parts'
import type { ReportDef } from './reports'

const e = escapeHtml

export const payments: ReportDef = {
  id: 'payments',
  code: 'PTL',
  title: 'Boarders Payment Timeline',
  blurb: "Each boarder's rent from January to December: paid or not.",
  needs: 'ledger',
  fields: [
    { key: 'year', label: 'Year', kind: 'select', options: (i) => yearOptions(i.ledger, i) },
    { key: 'groupBy', label: 'Group by', kind: 'select', options: [{ value: 'room', label: 'Room' }, { value: '', label: 'None' }] },
    { key: 'former', label: 'Include former boarders', kind: 'toggle' },
    { key: 'owing', label: 'Only boarders with an unpaid month', kind: 'toggle' },
    { key: 'amounts', label: 'Show amounts', kind: 'toggle' },
  ],
  defaults: { year: '', groupBy: 'room', former: false, owing: false, amounts: false },
  build(input, p) {
    const now = input.now ?? Date.now()
    const year = String(p.year || new Date(now).getFullYear())
    const list = rentYear(input.ledger ?? [], year, now)
      .filter((s) => p.former || s.first.current)
      .filter((s) => !p.owing || s.unpaid.length)
      .sort((a, b) => a.first.student.localeCompare(b.first.student))
    const byRoom = p.groupBy === 'room'
    // Room 2 before Room 10.
    if (byRoom) list.sort((a, b) => a.first.room.localeCompare(b.first.room, 'en', { numeric: true }))

    const head = ['No.', 'Boarder', ...MONTHS, 'Unpaid']
    const heading = (s: typeof list[number], i: number) =>
      byRoom && s.first.room !== list[i - 1]?.first.room
        ? `<tr class="grp"><td colspan="${head.length}">${e(s.first.room)} (${list.filter((x) => x.first.room === s.first.room).length})</td></tr>`
        : ''
    // The room is already the heading when grouped by it.
    const sub = (r: LedgerRow) => [!byRoom && r.room, !r.current && 'former'].filter(Boolean).join(' · ')
    const body = list.map((s, i) => `${heading(s, i)}<tr><td class="c">${i + 1}</td>
      <td><b>${e(s.first.student)}</b>${sub(s.first) ? `<br><small>${e(sub(s.first))}</small>` : ''}</td>
      ${s.months.map((r) => rentCell(r, s, !!p.amounts)).join('')}${unpaidCell(s, !!p.amounts)}</tr>`).join('')

    const owing = list.filter((s) => s.unpaid.length).length
    const scope = [`January – December ${year}`, 'Rent', p.former ? 'including former boarders' : 'current boarders', p.owing && 'only boarders with an unpaid month']
    return {
      count: list.length,
      bodyHtml: scopeLine(scope, input.scopeNote)
        + table(head, body, `No boarder has rent on file for ${year}.`, 'grid list')
        + (list.length ? `<p class="note">${list.length} boarder${list.length === 1 ? '' : 's'} · ${owing} with an unpaid month. ${RENT_NOTE}</p>` : ''),
    }
  },
}
