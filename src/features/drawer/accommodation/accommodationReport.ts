// A printable status report on one accommodation, in the shared OSAS form
// frame (features/reports/document.ts): numbered sections and ruled form grids
// inside the ISU Echague letterhead and signatory block. Built from the same preview
// the record drawer renders — so the report cannot say anything the drawer does
// not — and turned into a PDF by the browser's own print dialog.

import { escapeHtml, fmtDate, formatPhone } from '@/utils/format'
import { table } from '@/features/reports/document'
import { amenityMeta } from '@/utils/facilities'
import { groupByFloor, type DrawerPreview } from '../preview'
import { accreditationTerm, standingOf } from './standing'

const e = escapeHtml
const dash = (v: string | number | null | undefined) => (v == null || v === '' ? '—' : String(v))

/** The status report's body; the reports frame adds the letterhead and signatures. */
export function accommodationStatusBody(p: DrawerPreview, at = new Date()): string {
  const o = p.overview
  const rooms = p.rooms ?? []
  const floors = groupByFloor(rooms)
  const facilities = p.facilities ?? []
  const permits = p.files ?? []
  const roomName = new Map(rooms.map((r) => [r.id, r.name]))

  // Figures, computed the same way the record's overview computes them.
  const beds = rooms.reduce((n, r) => n + (r.capacity ?? 0), 0)
  const taken = rooms.reduce((n, r) => n + (r.occupants?.length ?? 0), 0)
  const female = rooms.reduce((n, r) => n + (r.occupants ?? []).filter((x) => x.gender === 'female').length, 0)
  const pct = beds ? Math.round((taken / beds) * 100) : 0
  const ratings = (p.reviews ?? []).map((r) => r.rating).filter((n) => n >= 1 && n <= 5)
  const average = ratings.reduce((a, b) => a + b, 0) / (ratings.length || 1)
  const term = o ? accreditationTerm(o.accredited, o.accreditedAt, o.expiresAt, at.getTime()) : null
  const standing = o && term
    ? standingOf({ accredited: o.accredited, term, hidden: o.hidden, average, reviewCount: ratings.length, campusRating: o.campus?.rating })
    : null
  const campus = o?.campus && o.campus.count > 1 ? o.campus : undefined

  // I. Profile — a two-pair form grid: label | value | label | value.
  const cell = (label: string, value: string, span = 1) =>
    `<th>${e(label)}</th><td${span > 1 ? ` colspan="${span}"` : ''}>${e(value)}</td>`
  const profile = o
    ? `<table class="form">
        <tr>${cell('Name of accommodation', p.name, 3)}</tr>
        <tr>${cell('Address', dash(o.address), 3)}</tr>
        <tr>${cell('Type', dash(o.typeLine))}${cell('Accepts', dash(o.genderPolicyLabel))}</tr>
        <tr>${cell(o.landlord.title, dash(o.landlord.name))}${cell('Contact no.', o.landlord.contact ? formatPhone(o.landlord.contact) : '—')}</tr>
        <tr>${cell('Rooms / floors', `${rooms.length} / ${floors.length}`)}${cell('Bed capacity', String(beds))}</tr>
        <tr>${cell('Accredited on', o.accreditedAt ? fmtDate(o.accreditedAt) : '—')}${cell('Valid until', o.expiresAt ? fmtDate(o.expiresAt) : '—')}</tr>
        <tr>${cell('Boarders', taken ? `${taken} (${taken - female} male, ${female} female)` : 'None')}${cell('Response rate', dash(o.responseLabel))}</tr>
        <tr>${cell('Amenities', o.amenities.map((a) => amenityMeta(a).label).join(', ') || '—', 3)}</tr>
      </table>`
    : ''

  // II. Findings — each indicator with the campus figure and a plain remark.
  const finding = (indicator: string, result: string, campusFig: string, remark: string) =>
    `<tr><td>${e(indicator)}</td><td>${e(result)}</td><td>${e(campusFig)}</td><td>${e(remark)}</td></tr>`
  const ratingRemark = !ratings.length ? 'No ratings yet'
    : campus?.rating != null && ratings.length >= 3 && average - campus.rating <= -0.3 ? 'For monitoring'
    : 'Satisfactory'
  const findings = o && term && standing
    ? `<table class="grid findings">
        <thead><tr><th>Indicator</th><th>Result</th><th>Campus average</th><th>Remark</th></tr></thead>
        <tbody>
          ${finding('Accreditation', o.expiresAt ? `${term.label}, ${term.detail.toLowerCase()}` : term.detail, '—', term.tone === 'ok' ? 'Valid' : term.tone === 'warn' ? 'For renewal' : 'Expired')}
          ${finding('Occupancy', `${taken} of ${beds} beds (${pct}%)`, campus ? `${campus.occupancyPct}%` : '—', !taken ? 'No boarders' : !campus ? '—' : pct > campus.occupancyPct ? 'Above campus average' : pct < campus.occupancyPct ? 'Below campus average' : 'At campus average')}
          ${finding('Boarder rating', ratings.length ? `${average.toFixed(1)} / 5 from ${ratings.length} rating${ratings.length === 1 ? '' : 's'}` : '—', campus?.rating != null ? `${campus.rating.toFixed(1)} / 5` : '—', ratingRemark)}
          ${finding('Student listing', o.hidden ? 'Hidden' : 'Visible', '—', o.hidden ? 'For review' : 'Satisfactory')}
        </tbody>
      </table>
      <p class="overall"><b>Overall assessment:</b> ${e(standing.title.toUpperCase())}${standing.watch.length ? ` &mdash; for monitoring: ${e(standing.watch.join('; '))}.` : '.'}</p>`
    : ''

  const roomRows = floors
    .map((g) => `<tr class="grp"><td colspan="4">${e(g.label)}</td></tr>` +
      g.items.map((r) => {
        const occ = r.occupants ?? []
        const people = occ.map((x) => e(x.name)).join(', ') || '<i>Vacant</i>'
        return `<tr><td>${e(r.name)}</td><td class="c">${e(r.capacity ?? 0)}</td><td class="c">${occ.length}</td><td>${people}</td></tr>`
      }).join(''))
    .join('')

  const facilityRows = facilities
    .map((f) => {
      const shared = (f.roomIds ?? []).map((id) => roomName.get(id)?.replace(/^Room\s+/i, '')).filter(Boolean).join(', ')
      return `<tr><td>${e(f.label)}</td><td class="c">${e(f.floor ?? '—')}</td><td>${e(shared ? `Rooms ${shared}` : '—')}</td><td>${f.status === 'under_repair' ? 'Under repair' : 'Available'}</td></tr>`
    })
    .join('')

  const permitRows = permits
    .map((f) => `<tr><td>${e(f.name)}</td><td>${e(f.status ?? '—')}</td><td>${e((f.expiry ?? '—').replace(/^Expires\s+/i, ''))}</td></tr>`)
    .join('')

  const bodyHtml = `
  <h2>I. Accommodation profile</h2>
  ${profile}
  <h2>II. Summary of findings</h2>
  ${findings}
  <h2>III. Rooms and boarders</h2>
  ${table(['Room', 'Beds', 'Occupied', 'Boarders'], roomRows, 'No rooms listed.')}
  <h2>IV. Shared facilities</h2>
  ${table(['Facility', 'Floor', 'Shared by', 'Condition'], facilityRows, 'No shared facilities listed.')}
  <h2>V. Permits and documents</h2>
  ${table(['Document', 'Status', 'Valid until'], permitRows, 'No permits on file.')}`

  return bodyHtml
}
