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
  if (diffInMins < 60) return `${diffInMins} mins ago`
  if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)} hrs ago`
  return `${Math.floor(diffInMins / 1440)} days ago`
}
