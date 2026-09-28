// Triage rules for the Support Tickets queue: who is waiting on whom, when
// that becomes overdue, which board column a ticket sits in, and the order the
// queue is worked in. Every ticket is its own row: reports are never merged,
// since matching subjects made separate students' questions look like one. Pure functions â€” useTickets shapes rows with them and the
// page/board consume the result â€” so ticketTriage.test.ts can pin every rule.

import type { Ticket } from '@/composables/useTickets'

/** A ticket waiting on a support reply this long is overdue, whatever its priority. */
export const OVERDUE_MS = 48 * 3600 * 1000

const PRIORITY_RANK: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 }

export function ticketRef(ticketNo: number | null | undefined, id: string): string {
  // ticket_no arrived with migration 20260926101320; the uuid prefix is only a
  // fallback for a database that predates it (and read TKT-0000 for every
  // seeded row, which is why the column exists).
  if (ticketNo) return 'TKT-' + String(ticketNo).padStart(4, '0')
  return 'TKT-' + id.replace(/-/g, '').slice(0, 4).toUpperCase()
}

interface Msg {
  authorRole: 'student' | 'agent'
  isInternal: boolean
  createdAt: string
}

/**
 * When the requester started waiting on support, or null when they are not:
 * the ticket is resolved, or support's public reply is the latest word.
 * Internal notes are not replies â€” the requester never sees them. A ticket no
 * one has answered has been waiting since it was reported.
 */
export function waitingSince(messages: Msg[], reportedAt: string, status: string): string | null {
  if (status === 'resolved') return null
  let lastReply = -1
  messages.forEach((m, i) => {
    if (m.authorRole === 'agent' && !m.isInternal) lastReply = i
  })
  if (lastReply === -1) return reportedAt
  const next = messages.slice(lastReply + 1).find((m) => m.authorRole === 'student')
  return next ? next.createdAt : null
}

/**
 * The board's column: who owes the next move, read off the conversation rather
 * than the status field. Replying moves a ticket on its own â€” nobody drags it.
 *   new          nobody has picked it up: unassigned and never answered
 *   needs_reply  OSAS owes the requester a reply (claimed, or they wrote since)
 *   waiting      OSAS has the last word; the requester owes the next move
 *   resolved     closed
 */
export type BoardLane = 'new' | 'needs_reply' | 'waiting' | 'resolved'

export function boardLane(t: Pick<Ticket, 'status' | 'lastReplyAt' | 'waitingSince' | 'assigneeId'>): BoardLane {
  if (t.status === 'resolved') return 'resolved'
  if (!t.lastReplyAt && !t.assigneeId) return 'new'
  return t.waitingSince ? 'needs_reply' : 'waiting'
}

export function isOverdue(since: string | null, now = Date.now()): boolean {
  return !!since && now - new Date(since).getTime() >= OVERDUE_MS
}

/**
 * Queue order: waiting on us first, then priority, then longest wait. Tickets
 * waiting on the requester (or resolved) follow, most recently updated first.
 */
export function compareTickets(a: Ticket, b: Ticket): number {
  const wa = a.waitingSince ? 1 : 0
  const wb = b.waitingSince ? 1 : 0
  if (wa !== wb) return wb - wa
  const pr = (PRIORITY_RANK[b.priority] ?? 1) - (PRIORITY_RANK[a.priority] ?? 1)
  if (pr) return pr
  if (a.waitingSince && b.waitingSince) {
    return new Date(a.waitingSince).getTime() - new Date(b.waitingSince).getTime()
  }
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export function sortTickets(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort(compareTickets)
}

/** "5d", "7h", "40m" â€” a wait is read as a size, so it drops the "ago". */
export function waitAge(since: string, now = Date.now()) {
  const ms = now - new Date(since).getTime()
  const m = Math.max(1, Math.floor(ms / 60000))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
