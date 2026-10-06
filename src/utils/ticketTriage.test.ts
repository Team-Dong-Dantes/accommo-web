import { describe, expect, it } from 'vitest'
import type { Ticket } from '@/composables/useTickets'
import { boardLane, isOverdue, sortTickets, ticketRef, waitAge, waitingSince } from './ticketTriage'

const H = 3600 * 1000
const iso = (hAgo: number, now = Date.parse('2026-09-26T12:00:00Z')) => new Date(now - hAgo * H).toISOString()

function t(p: Partial<Ticket> & { id: string }): Ticket {
  return {
    ref: '', subject: 'x', description: '', category: 'other', priority: 'medium', status: 'open',
    assignee: null, assigneeId: null, reporterName: p.id, reporterEmail: '', reporterPhone: '', reporterTitle: 'Student',
    accommodationName: null, accommodationId: null, room: '—', landlordName: null, landlordSex: null, initials: '', avatarColor: 'teal-6', avatarUrl: '',
    reportedAt: iso(10), updatedAt: iso(10), resolvedAt: null, photoUrls: [], messages: [], lastPreview: '', lastRequesterText: '', lastReplyAt: null,
    waitingSince: iso(10), unread: 0, ...p,
  }
}

describe('ticketRef', () => {
  it('pads the ticket number', () => expect(ticketRef(42, 'abcd')).toBe('TKT-0042'))
  it('falls back to the uuid prefix without one', () => expect(ticketRef(null, '3f9a-1c')).toBe('TKT-3F9A'))
})

describe('waitingSince', () => {
  const student = (h: number) => ({ authorRole: 'student' as const, isInternal: false, createdAt: iso(h) })
  const reply = (h: number) => ({ authorRole: 'agent' as const, isInternal: false, createdAt: iso(h) })
  const note = (h: number) => ({ authorRole: 'agent' as const, isInternal: true, createdAt: iso(h) })

  it('is the report time when nobody has replied', () => expect(waitingSince([], iso(50), 'open')).toBe(iso(50)))
  it('is null once support has the last word', () => expect(waitingSince([student(9), reply(5)], iso(10), 'open')).toBeNull())
  it('restarts at the first requester message after a reply', () =>
    expect(waitingSince([reply(9), student(6), student(3)], iso(10), 'in_progress')).toBe(iso(6)))
  it('does not count an internal note as a reply', () => expect(waitingSince([note(5)], iso(10), 'open')).toBe(iso(10)))
  it('is null for a resolved ticket', () => expect(waitingSince([], iso(99), 'resolved')).toBeNull())
})

describe('boardLane', () => {
  it('is new until OSAS first replies', () => expect(boardLane(t({ id: 'a' }))).toBe('new'))
  it('stays new when only an internal note was added', () =>
    expect(boardLane(t({ id: 'a', status: 'in_progress', lastReplyAt: null }))).toBe('new'))
  it('needs a reply once someone claims it, answered or not', () =>
    expect(boardLane(t({ id: 'a', assigneeId: 'me' }))).toBe('needs_reply'))
  it('needs a reply when the requester wrote after OSAS', () =>
    expect(boardLane(t({ id: 'a', lastReplyAt: iso(9), waitingSince: iso(5) }))).toBe('needs_reply'))
  it('waits on the requester when OSAS has the last word', () =>
    expect(boardLane(t({ id: 'a', lastReplyAt: iso(5), waitingSince: null }))).toBe('waiting'))
  it('is resolved whatever the conversation says', () =>
    expect(boardLane(t({ id: 'a', status: 'resolved', lastReplyAt: null }))).toBe('resolved'))
})

describe('isOverdue', () => {
  const now = Date.parse('2026-09-26T12:00:00Z')
  it('turns at 48 hours', () => {
    expect(isOverdue(iso(47.9), now)).toBe(false)
    expect(isOverdue(iso(48), now)).toBe(true)
  })
  it('is never overdue when not waiting', () => expect(isOverdue(null, now)).toBe(false))
})

describe('sortTickets', () => {
  it('puts waiting first, then priority, then longest wait', () => {
    const rows = sortTickets([
      t({ id: 'answered-high', priority: 'high', waitingSince: null }),
      t({ id: 'low-old', priority: 'low', waitingSince: iso(100) }),
      t({ id: 'high-new', priority: 'high', waitingSince: iso(5) }),
      t({ id: 'high-old', priority: 'high', waitingSince: iso(50) }),
    ])
    expect(rows.map((r) => r.id)).toEqual(['high-old', 'high-new', 'low-old', 'answered-high'])
  })
})

describe('waitAge', () => {
  const now = Date.parse('2026-09-26T12:00:00Z')
  it('reads as a size', () => {
    expect(waitAge(iso(0.5), now)).toBe('30m')
    expect(waitAge(iso(47), now)).toBe('47h')
    expect(waitAge(iso(120), now)).toBe('5d')
  })
})
