import { describe, expect, it } from 'vitest'
import { REPORTS } from './reports'
import type { RealAccommodation } from '@/composables/useAccommodations'
import type { BoarderRow, LandlordRow } from '@/api/reports'

const NOW = Date.parse('2026-09-23T00:00:00Z')
const inDays = (d: number) => new Date(NOW + d * 86_400_000).toISOString()

function acc(over: Partial<RealAccommodation>): RealAccommodation {
  return {
    id: over.name ?? 'a', name: 'A', address: 'Purok 1, Centro, Echague', barangay: 'Centro', type: 'Boarding House',
    landlord: 'L', landlordSex: 'F', contact: '+639171234567', verified: true, genderPolicy: 'co_ed',
    accreditedAt: inDays(-300), accreditationExpiresAt: inDays(400), totalCapacity: 10, totalStudents: 6,
    maleCount: 4, femaleCount: 2, permits: [], ...over,
  } as RealAccommodation
}

function boarder(over: Partial<BoarderRow>): BoarderRow {
  return {
    studentId: 's', name: 'Juan Dela Cruz', sex: 'M', phone: '+639171112222', schoolId: '20-0001', college: 'CCSICT',
    program: 'BSCS', yearLevel: '2', accommodationId: 'a', accommodation: 'Casa', accommodationType: 'Boarding House', barangay: 'Centro', address: '', room: 'Room 1',
    since: inDays(-90), emergency: { name: 'Maria Dela Cruz', relationship: 'Mother', phone: '+639173334444' }, ...over,
  }
}

const run = (id: keyof typeof REPORTS, input: { accommodations?: RealAccommodation[]; boarders?: BoarderRow[]; landlords?: LandlordRow[] }, params: Record<string, string | boolean> = {}) =>
  REPORTS[id].build({ accommodations: input.accommodations ?? [], boarders: input.boarders ?? [], landlords: input.landlords ?? [], now: NOW }, { ...REPORTS[id].defaults, ...params })

describe('masterlist', () => {
  it('lists only accommodations accredited on the as-of date', () => {
    const r = run('masterlist', { accommodations: [
      acc({ name: 'Valid' }),
      acc({ name: 'Lapsed', accreditationExpiresAt: inDays(-1) }),
      acc({ name: 'Pending', verified: false }),
    ] })
    expect(r.count).toBe(1)
    expect(r.bodyHtml).toContain('Valid')
    expect(r.bodyHtml).not.toContain('Lapsed')
  })

  it('shows contact numbers only when asked', () => {
    const rows = { accommodations: [acc({ name: 'Casa' })] }
    expect(run('masterlist', rows).bodyHtml).not.toContain('+63 917 123 4567')
    expect(run('masterlist', rows, { contacts: true }).bodyHtml).toContain('+63 917 123 4567')
  })
})

describe('renewals', () => {
  const fullPermits = ['fire', 'business', 'sanitary', 'building'].map((type) => ({ type, expiresAt: inDays(500) })) as RealAccommodation['permits']
  const rows = { accommodations: [
    acc({ name: 'Due45', accreditationExpiresAt: inDays(45), permits: fullPermits }),
    acc({ name: 'Expired', accreditationExpiresAt: inDays(-5), permits: fullPermits }),
    acc({ name: 'Fine', accreditationExpiresAt: inDays(300), permits: fullPermits }),
  ] }

  it('widens with the window', () => {
    expect(run('renewals', rows, { window: 'expired' }).count).toBe(1)
    expect(run('renewals', rows, { window: '30' }).count).toBe(1)
    expect(run('renewals', rows, { window: '60' }).count).toBe(2)
  })

  it('treats a missing permit as due only when asked', () => {
    const noPermits = { accommodations: [acc({ name: 'Bare', accreditationExpiresAt: inDays(300) })] }
    expect(run('renewals', noPermits, { missing: true }).count).toBe(1)
    expect(run('renewals', noPermits, { missing: false }).count).toBe(0)
  })
})

describe('occupancy', () => {
  it('totals the rows it lists', () => {
    const r = run('occupancy', { accommodations: [
      acc({ name: 'One', totalCapacity: 10, totalStudents: 6 }),
      acc({ name: 'Two', totalCapacity: 4, totalStudents: 4 }),
    ] })
    expect(r.count).toBe(2)
    // Total row: 14 beds, 10 taken, 4 vacant, 71%.
    expect(r.bodyHtml).toMatch(/Total<\/td>\s*<td class="n">14<\/td><td class="n">10<\/td><td class="n">4<\/td><td class="n">71%<\/td>/)
  })
})

describe('boarders', () => {
  it('leaves out personal details unless asked', () => {
    const rows = { boarders: [boarder({})] }
    const plain = run('boarders', rows).bodyHtml
    expect(plain).not.toContain('Maria Dela Cruz')
    expect(plain).not.toContain('+63 917 111 2222')
    expect(plain).not.toContain('RA 10173')
    const full = run('boarders', rows, { phones: true, emergency: true }).bodyHtml
    expect(full).toContain('Maria Dela Cruz')
    expect(full).toContain('+63 917 111 2222')
    expect(full).toContain('RA 10173')
  })

  it('filters by accommodation type, so dormitories can be listed on their own', () => {
    const rows = { boarders: [boarder({ name: 'A' }), boarder({ name: 'B', accommodation: 'ISU Dorm', accommodationType: 'Dormitory' })] }
    const dorm = run('boarders', rows, { type: 'Dormitory' })
    expect(dorm.count).toBe(1)
    expect(dorm.bodyHtml).toContain('ISU Dorm')
  })

  it('filters by college', () => {
    const rows = { boarders: [boarder({ name: 'A', college: 'CCSICT' }), boarder({ name: 'B', college: 'CBAPA' })] }
    expect(run('boarders', rows, { college: 'CBAPA' }).count).toBe(1)
  })
})

function landlordRow(over: Partial<LandlordRow>): LandlordRow {
  return {
    id: 'l', name: 'Rosa Santos', sex: 'F', status: 'verified', email: 'rosa@gmail.com', phone: '+639175556666', joined: inDays(-200),
    responseRate: 90, avgResponseMinutes: 60,
    accommodations: [{ id: 'a', name: 'Casa', status: 'accredited', beds: 10, taken: 7, expiresAt: inDays(300) }], ...over,
  }
}

describe('landlords', () => {
  const rows = { landlords: [landlordRow({ name: 'Rosa' }), landlordRow({ name: 'Ben', sex: 'M', status: 'pending', accommodations: [] })] }

  it('titles each person by sex and filters by status', () => {
    const all = run('landlords', rows).bodyHtml
    expect(all).toContain('Landlady')
    expect(all).toContain('Landlord')
    expect(run('landlords', rows, { status: 'pending' }).count).toBe(1)
    expect(run('landlords', rows, { withListings: true }).count).toBe(1)
  })

  it('leaves out contacts unless asked, and the status column when grouped by it', () => {
    const plain = run('landlords', rows).bodyHtml
    expect(plain).not.toContain('rosa@gmail.com')
    expect(plain).not.toContain('<th>Account</th>')
    expect(run('landlords', rows, { contacts: true }).bodyHtml).toContain('rosa@gmail.com')
    expect(run('landlords', rows, { groupBy: '' }).bodyHtml).toContain('<th>Account</th>')
  })
})
