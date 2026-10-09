import { describe, expect, it } from 'vitest'
import { REPORTS, type ReportInput } from './reports'
import type { RealAccommodation } from '@/composables/useAccommodations'
import type { BoarderRow, LandlordRow, LedgerRow, StayRow, StudentDossier } from '@/api/reports'

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
    studentId: 's', name: 'Juan Dela Cruz', sex: 'M', birthDate: '2005-09-24', phone: '+639171112222', email: 'juan@isu.edu.ph', schoolId: '20-0001', college: 'CCSICT',
    program: 'BSCS', yearLevel: '2', accommodationId: 'a', accommodation: 'Casa', accommodationType: 'Boarding House', barangay: 'Centro', address: '', room: 'Room 1',
    since: inDays(-90), until: inDays(200), current: true, emergency: { name: 'Maria Dela Cruz', relationship: 'Mother', phone: '+639173334444' }, ...over,
  }
}

const run = (id: keyof typeof REPORTS, input: Partial<ReportInput>, params: Record<string, string | boolean> = {}) =>
  REPORTS[id].build({ accommodations: [], boarders: [], landlords: [], ...input, now: NOW }, { ...REPORTS[id].defaults, ...params })

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
    const full = run('boarders', rows, { contacts: true, emergency: true }).bodyHtml
    expect(full).toContain('Maria Dela Cruz')
    expect(full).toContain('+63 917 111 2222')
    expect(full).toContain('RA 10173')
    expect(full).toContain('juan@isu.edu.ph')
  })

  it('lists who was boarding on the as-of day, current and past stays alike', () => {
    const rows = { boarders: [
      boarder({ name: 'Now' }),
      boarder({ name: 'Left', current: false, since: '2025-06-01', until: '2026-03-31' }),
      boarder({ name: 'Later', since: '2026-09-01' }),
    ] }
    const today = run('boarders', rows)
    expect(today.count).toBe(2)
    expect(today.bodyHtml).not.toContain('Left')
    const past = run('boarders', rows, { asOf: '2026-01-15' })
    expect(past.count).toBe(1)
    expect(past.bodyHtml).toContain('to Mar 31, 2026')
  })

  it('always shows sex; birthday and age only when asked', () => {
    const rows = { boarders: [boarder({})] }
    expect(run('boarders', rows).bodyHtml).toContain('Male')
    expect(run('boarders', rows).bodyHtml).not.toContain('Birthday')
    // NOW is 2026-09-23: a day short of turning 21.
    expect(run('boarders', rows, { birthdays: true }).bodyHtml).toContain('20 yrs')
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

function charge(over: Partial<LedgerRow>): LedgerRow {
  return {
    leaseId: 'l1', student: 'Juan', accommodation: 'Casa', room: 'Room 1', current: true, kind: 'rent', month: '2026-09-01', dueDate: '2026-09-05',
    due: 2000, confirmed: 2000, waived: 0, pending: 0, balance: 0, state: 'paid', ...over,
  }
}

describe('payments', () => {
  // NOW is 2026-09-23.
  const ledger = [
    charge({ month: '2026-08-01' }),
    charge({ month: '2026-09-01', confirmed: 500, balance: 1500, state: 'overdue' }),
    charge({ month: '2026-10-01', confirmed: 0, balance: 2000, state: 'unpaid' }), // not due yet
    charge({ month: '2026-11-01', confirmed: 0, pending: 2000, state: 'pending' }), // sent ahead
    charge({ month: '2025-12-01' }),
    charge({ kind: 'bill', month: '2026-09-01', due: 300, confirmed: 300 }),
    charge({ leaseId: 'l2', student: 'Ana', current: false, month: '2026-09-01', confirmed: 0, balance: 2000, state: 'overdue' }),
  ]

  it('marks each month of the year paid or unpaid, leaving months not yet due blank', () => {
    const r = run('payments', { ledger })
    expect(r.count).toBe(1)
    expect(r.bodyHtml).toContain('<th>Jan</th>')
    expect(r.bodyHtml).toContain('<th>Dec</th>')
    const cells = [...r.bodyHtml.matchAll(/<td class="c">([^<]*(?:<b>[^<]*<\/b>)?)/g)].map((m) => m[1]).slice(1)
    expect(cells).toEqual(['—', '—', '—', '—', '—', '—', '—', 'Paid', '<b>Unpaid</b>', '—', 'Pending', '—'])
  })

  it('picks another year, adds former boarders, and narrows to those owing', () => {
    expect(run('payments', { ledger }, { year: '2025' }).bodyHtml).toContain('Paid')
    expect(run('payments', { ledger }, { former: true }).count).toBe(2)
    expect(run('payments', { ledger }, { year: '2025', owing: true }).count).toBe(0)
    expect(run('payments', { ledger }, { amounts: true }).bodyHtml).toContain('₱1,500 left')
  })

  it('groups boarders under their rooms, in room-number order', () => {
    const rooms = [charge({ leaseId: 'a', student: 'Ana', room: 'Room 10' }), charge({ leaseId: 'b', student: 'Ben', room: 'Room 2' })]
    const html = run('payments', { ledger: rooms }).bodyHtml
    expect(html.indexOf('Room 2 (1)')).toBeLessThan(html.indexOf('Room 10 (1)'))
    expect(run('payments', { ledger: rooms }, { groupBy: '' }).bodyHtml).not.toContain('class="grp"')
  })
})

function stay(over: Partial<StayRow>): StayRow {
  return {
    leaseId: 'l1', studentId: 's', student: 'Juan', studentSex: 'M', landlord: 'Rosa Santos', accommodationId: 'a', accommodation: 'Casa',
    room: 'Room 1', status: 'active', current: true, since: '2026-06-01', until: '2027-05-31', monthlyRent: 2000, endedReason: null, ...over,
  }
}

describe('student record', () => {
  const student: StudentDossier = {
    name: 'Juan Dela Cruz', sex: 'M', birthDate: '2005-09-24', email: 'juan@isu.edu.ph', phone: '+639171112222', status: 'verified',
    joined: inDays(-400), schoolId: '20-0001', college: 'CCSICT', program: 'BSCS', yearLevel: '2', verifiedAt: inDays(-390), emergency: null,
    stays: [stay({}), stay({ leaseId: 'l0', accommodation: 'Old Place', status: 'ended', current: false, since: '2025-06-01', until: '2026-03-31', endedReason: 'leave_approved' })],
    ledger: [charge({ month: '2026-08-01' }), charge({ month: '2026-09-01', confirmed: 0, balance: 2000, state: 'overdue' })],
    pastOwed: [{ accommodation: 'Old Place', room: 'Room 3', endedOn: '2026-03-31', balance: 1500 }],
  }

  it('has the profile, every stay, the rent grid and what is owed — personal details only when asked', () => {
    const html = run('student', { student }).bodyHtml
    expect(html).toContain('Juan Dela Cruz')
    expect(html).toContain('Old Place')
    expect(html).toContain('Leave Approved')
    expect(html).toContain('<b>Unpaid</b>')
    expect(html).toContain('<b>₱1,500</b>')
    expect(html).not.toContain('juan@isu.edu.ph')
    expect(run('student', { student }, { contacts: true, birthdays: true }).bodyHtml).toContain('20 yrs')
  })
})

describe('landlord record', () => {
  const landlord = {
    profile: landlordRow({ accommodations: [{ id: 'a', name: 'Casa', status: 'accredited', beds: 10, taken: 2, expiresAt: inDays(300) }] }),
    stays: [stay({}), stay({ leaseId: 'l2', student: 'Ana', studentSex: 'F', room: 'Room 10' }), stay({ leaseId: 'l3', student: 'Gone', current: false, status: 'ended' })],
    ledger: [
      charge({ month: '2026-09-01' }),
      charge({ month: '2026-12-01', confirmed: 2000 }), // paid ahead: not due yet, not counted
      charge({ leaseId: 'l2', student: 'Ana', month: '2026-09-01', confirmed: 500, balance: 1500, state: 'overdue' }),
    ],
  }

  it('lists current boarders only, and totals rent that has come due', () => {
    const html = run('landlord', { landlord }).bodyHtml
    expect(html).toContain('Landlady profile')
    expect(html).toContain('Ana')
    expect(html).not.toContain('Gone')
    // Due Sep: 2,000 + 2,000; collected 2,000 + 500; Ana owes 1,500.
    expect(html).toContain('<td class="n">₱4,000</td><td class="n">₱2,500</td><td class="n">₱0</td>\n      <td class="n">₱1,500</td><td class="n">1</td>')
  })
})
