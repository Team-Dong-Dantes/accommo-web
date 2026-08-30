// Shared string/date formatting helpers.
// Extracted so pages stop re-defining them inline (was duplicated in Verifications).

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length > 1) {
    const first = parts[0]?.[0] ?? ''
    const last = parts[parts.length - 1]?.[0] ?? ''
    return (first + last).toUpperCase()
  }
  if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase()
  return '?'
}

export function capitalize(val: string): string {
  if (!val) return 'Pending'
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
}

export function getTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown'
  const past = new Date(dateString).getTime()
  if (isNaN(past)) return 'Unknown'

  const diffInMins = Math.floor((new Date().getTime() - past) / 60000)
  if (diffInMins < 1) return 'just now'
  if (diffInMins < 60) return `${diffInMins} mins ago`
  if (diffInMins < 1440) {
    const h = Math.floor(diffInMins / 60)
    return `${h} ${h === 1 ? 'hr' : 'hrs'} ago`
  }
  const d = Math.floor(diffInMins / 1440)
  return `${d} ${d === 1 ? 'day' : 'days'} ago`
}

// Compact variant used on the dashboard ("5 min ago" vs "5 mins ago").
// Consolidated from identical copies in useDashboardStats.ts and Dashboard.vue.
export function getTimeAgoShort(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown'
  const past = new Date(dateStr).getTime()
  if (isNaN(past)) return 'Unknown'
  const diff = Math.floor((Date.now() - past) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff} min ago`
  if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`
  return `${Math.floor(diff / 1440)} days ago`
}

// Wide variant: single-word names yield their first TWO letters ("Mark" → "MA")
// instead of one. Consolidated from identical copies in useAccommodations.ts and
// RoomHub.vue — kept separate from getInitials to preserve rendered output.
export function getInitialsWide(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0] ?? ''
  if (parts.length > 1) {
    const last = parts[parts.length - 1] ?? ''
    return (first.charAt(0) + last.charAt(0)).toUpperCase()
  }
  return first.slice(0, 2).toUpperCase()
}

export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'admin': return 'Administrator'
    case 'student': return 'Student'
    case 'accommodation_manager': return 'Accommodation Manager'
    case 'agent': return 'Agent'
    default: return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'
  }
}

// Shared ticket-thread date helpers.
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

// Shared ticket activity timeline helpers.
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function dayLabel(day: string, now = new Date()): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(day)
  if (Number.isNaN(msgDate.getTime())) return 'Unknown date'

  const messageDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate())
  const diff = Math.round((today.getTime() - messageDay.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return msgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
