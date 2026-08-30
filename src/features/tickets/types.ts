// Ticket-window shared types + option lists.
// Shared ticket workspace types.

export interface MsgGroup {
  day: string
  items: any[]
}

export interface TicketOption {
  value: string
  label: string
}

export const STATUS_OPTS: TicketOption[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

export const PRIORITY_OPTS: TicketOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function stLabel(key: string): string {
  const map: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  }
  return map[key] ?? key
}

export function stLabelPlain(key: string): string {
  const map: Record<string, string> = {
    open: 'Open',
    in_progress: 'In progress',
    resolved: 'Resolved',
    urgent: ' Urgent',
    high: ' High',
    medium: ' Medium',
    low: ' Low',
  }
  return map[key] ?? key
}

export interface ReplyTemplate {
  key: string
  label: string
  text: string
}

export const REPLY_TEMPLATES: ReplyTemplate[] = [
  { key: 'ack', label: 'Acknowledged', text: 'Thank you for reaching out. We have received your ticket and a member of our team is looking into this now.' },
  { key: 'update', label: 'Request update', text: 'Could you share a little more detail or a photo so we can investigate further?' },
]
