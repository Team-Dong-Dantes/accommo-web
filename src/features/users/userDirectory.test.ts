import { describe, expect, it } from 'vitest'
import { activeState, campusRate, matches, portfoliosByLandlord, staysByStudent } from './useUserDirectory'

describe('staysByStudent', () => {
  it("maps each student to their active lease's accommodation and room", () => {
    const stays = staysByStudent([
      { student_id: 's1', room: { room_number: '307', label: null, accommodation: { id: 'a1', name: 'Casa Pascua' } } },
      { student_id: 's2', room: [{ room_number: null, label: 'Loft', accommodation: [{ id: 'a2', name: 'Dalisay' }] }] },
      { student_id: null, room: null },
    ])
    expect(stays.get('s1')).toEqual({ accommodationId: 'a1', accommodation: 'Casa Pascua', room: 'Room 307' })
    expect(stays.get('s2')?.room).toBe('Loft')
    expect(stays.size).toBe(2)
  })
})

describe('portfoliosByLandlord', () => {
  it('counts accommodations, accredited ones, and beds taken (never more than capacity)', () => {
    const p = portfoliosByLandlord([
      { landlord_id: 'l1', status: 'accredited', rooms: [{ capacity: 4, current_pax: 3 }, { capacity: 2, current_pax: 5 }] },
      { landlord_id: 'l1', status: 'pending', rooms: [{ capacity: 3, current_pax: 0 }] },
    ])
    expect(p.get('l1')).toEqual({ count: 2, accredited: 1, beds: 9, taken: 5 })
  })
})

describe('campusRate', () => {
  it('averages only the landlords/landladies who have a rate', () => {
    expect(campusRate([{ responseRate: 80 }, { responseRate: 90 }, { responseRate: null }])).toBe(85)
    expect(campusRate([{ responseRate: null }])).toBeNull()
  })
})

describe('activeState', () => {
  const now = Date.parse('2026-09-24T12:00:00Z')
  it('buckets the last sign-in into week, month, stale, or never', () => {
    expect(activeState('2026-09-20T12:00:00Z', now)).toBe('week')
    expect(activeState('2026-09-01T12:00:00Z', now)).toBe('month')
    expect(activeState('2026-06-01T12:00:00Z', now)).toBe('stale')
    expect(activeState(null, now)).toBe('never')
  })
})

describe('matches', () => {
  it('keeps a row whose field equals any chosen value, ignoring case', () => {
    expect(matches({ status: 'Pending' }, 'status', ['pending', 'reviewing'])).toBe(true)
    expect(matches({ status: 'Verified' }, 'status', ['pending'])).toBe(false)
    expect(matches({}, 'status', ['pending'])).toBe(false)
  })
})
