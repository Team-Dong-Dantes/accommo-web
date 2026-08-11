import { ref, reactive } from 'vue'
import { supabase } from '@/utils/supabase'

export interface PendingRegistration {
  initials: string
  name: string
  time: string
  role: string
  roleColor: string
  status: string
  statusColor: string
  color: string
}

export interface DashboardStats {
  loading: boolean
  error: string | null
  properties: { total: number; accredited: number; avgRent: number }
  rooms: { total: number; occupied: number; available: number; capacity: number; occupancyPct: number }
  roomsByType: { type: string; capacity: number; count: number }[]
  topOccupied: { name: string; ratio: string; val: number }[]
  students: { total: number; newThisMonth: number }
  studentsByCollege: { name: string; val: number; pct: string; ratio: number; color: string }[]
  studentsByYear: { year: string; val: number }[]
  gender: { female: number; male: number; other: number }
  concerns: {
    total: number
    open: number
    inProgress: number
    resolved: number
    rejected: number
    urgent: number
  }
  concernsByCategory: { name: string; val: number; ratio: number; color: string }[]
  complaints: { total: number; open: number; urgent: number }
  pendingRegistrations: PendingRegistration[]
  unverifiedUsers: { total: number; pending: number; reviewing: number }
  activeLeases: number
}

const CARD_COLORS = [
  'teal-5',
  'indigo-5',
  'orange-5',
  'blue-5',
  'pink-4',
  'deep-purple-4',
  'green-5',
  'red-5',
]

function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]?.[0] ?? ''
  if (parts.length > 1) {
    const last = parts[parts.length - 1]?.[0] ?? ''
    return (first + last).toUpperCase()
  }
  return first.toUpperCase()
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown'
  const past = new Date(dateStr).getTime()
  if (isNaN(past)) return 'Unknown'
  const diff = Math.floor((Date.now() - past) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff} min ago`
  if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`
  return `${Math.floor(diff / 1440)} days ago`
}

function emptyStats(): DashboardStats {
  return {
    loading: true,
    error: null,
    properties: { total: 0, accredited: 0, avgRent: 0 },
    rooms: { total: 0, occupied: 0, available: 0, capacity: 0, occupancyPct: 0 },
    roomsByType: [],
    topOccupied: [],
    students: { total: 0, newThisMonth: 0 },
    studentsByCollege: [],
    studentsByYear: [],
    gender: { female: 0, male: 0, other: 0 },
    concerns: { total: 0, open: 0, inProgress: 0, resolved: 0, rejected: 0, urgent: 0 },
    concernsByCategory: [],
    complaints: { total: 0, open: 0, urgent: 0 },
    pendingRegistrations: [],
    unverifiedUsers: { total: 0, pending: 0, reviewing: 0 },
    activeLeases: 0,
  }
}

export function useDashboardStats() {
  const loading = ref(true)
  const error = ref<string | null>(null)
  const data = reactive<DashboardStats>(emptyStats())

  async function load() {
    loading.value = true
    error.value = null
    try {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

      const [
        propertiesRes,
        roomsRes,
        studentTotalRes,
        studentNewRes,
        collegeRes,
        yearRes,
        sexRes,
        concernsRes,
        urgentRes,
        pendingRes,
        unverifiedRes,
        leaseRes,
        complaintOpenRes,
      ] = await Promise.all([
        supabase.from('properties').select('id, status, capacity, total_rooms, room_type, name, monthly_rent'),
        supabase.from('rooms').select('capacity, current_pax, status, property:properties(name, room_type)'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')
          .gte('created_at', since),
        supabase.from('student_profiles').select('college'),
        supabase.from('student_profiles').select('year_level'),
        supabase.from('users').select('sex').eq('role', 'student'),
        supabase.from('concerns').select('id, status, category'),
        supabase
          .from('complaints')
          .select('*', { count: 'exact', head: true })
          .eq('priority', 'urgent')
          .neq('status', 'resolved'),
        supabase
          .from('users')
          .select('id, full_name, created_at, role, status')
          .in('status', ['pending', 'reviewing'])
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'reviewing']),
        supabase
          .from('leases')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'resolved'),
      ])

      const props = (propertiesRes.data ?? []) as Array<{
        id: string
        status: string
        capacity: number | null
        total_rooms: number | null
        room_type: string
        name: string
        monthly_rent: number | null
      }>
      const rooms = (roomsRes.data ?? []) as Array<{
        capacity: number | null
        current_pax: number | null
        status: string
        property: { name: string | null; room_type: string } | null
      }>
      const colleges = (collegeRes.data ?? []) as Array<{ college: string | null }>
      const years = (yearRes.data ?? []) as Array<{ year_level: number | null }>
      const sexes = (sexRes.data ?? []) as Array<{ sex: string | null }>
      const concernRows = (concernsRes.data ?? []) as Array<{
        id: string
        status: string
        category: string
      }>
      const pending = (pendingRes.data ?? []) as Array<{
        id: string
        full_name: string | null
        created_at: string | null
        role: string
        status: string
      }>

      // Properties
      data.properties.total = props.length
      data.properties.accredited = props.filter((p) => p.status === 'accredited').length
      const rents = props.map((p) => p.monthly_rent).filter((r): r is number => r != null)
      data.properties.avgRent = rents.length
        ? Math.round(rents.reduce((s, r) => s + r, 0) / rents.length)
        : 0

      // Rooms
      const totalRooms = rooms.length
      const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length
      const availableRooms = rooms.filter((r) => r.status === 'available').length
      const totalCapacity = rooms.reduce((s, r) => s + (r.capacity ?? 0), 0)
      const totalPax = rooms.reduce((s, r) => s + (r.current_pax ?? 0), 0)
      data.rooms = {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
        capacity: totalCapacity,
        occupancyPct: totalCapacity > 0 ? Math.round((totalPax / totalCapacity) * 100) : 0,
      }

      // Rooms by type (sum capacity per room_type)
      const typeMap = new Map<string, { capacity: number; count: number }>()
      for (const r of rooms) {
        const t = r.property?.room_type ?? 'unknown'
        const entry = typeMap.get(t) ?? { capacity: 0, count: 0 }
        entry.capacity += r.capacity ?? 0
        entry.count += 1
        typeMap.set(t, entry)
      }
      data.roomsByType = Array.from(typeMap.entries())
        .map(([type, v]) => ({ type, capacity: v.capacity, count: v.count }))
        .sort((a, b) => b.capacity - a.capacity)

      // Most occupied properties
      const propAgg = new Map<string, { occupied: number; total: number }>()
      for (const r of rooms) {
        const name = r.property?.name ?? 'Unknown'
        const agg = propAgg.get(name) ?? { occupied: 0, total: 0 }
        agg.total += 1
        if (r.status === 'occupied') agg.occupied += 1
        propAgg.set(name, agg)
      }
      data.topOccupied = Array.from(propAgg.entries())
        .map(([name, v]) => ({
          name,
          val: v.total > 0 ? v.occupied / v.total : 0,
          ratio: `${v.occupied}/${v.total}`,
        }))
        .filter((p) => p.val > 0)
        .sort((a, b) => b.val - a.val)
        .slice(0, 5)

      // Students
      data.students.total = studentTotalRes.count ?? 0
      data.students.newThisMonth = studentNewRes.count ?? 0

      // By college
      const collegeCounts = new Map<string, number>()
      for (const c of colleges) {
        const key = c.college || 'Unspecified'
        collegeCounts.set(key, (collegeCounts.get(key) ?? 0) + 1)
      }
      const totalStudents = data.students.total || collegeCounts.size || 1
      data.studentsByCollege = Array.from(collegeCounts.entries())
        .map(([name, val]) => ({ name, val }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 6)
        .map((c, i) => ({
          name: c.name,
          val: c.val,
          pct: `${Math.round((c.val / totalStudents) * 100)}%`,
          ratio: totalStudents > 0 ? c.val / totalStudents : 0,
          color: CARD_COLORS[i % CARD_COLORS.length] ?? 'grey-5',
        }))

      // By year level
      const yearCounts = new Map<number, number>()
      for (const y of years) {
        const key = y.year_level ?? 0
        yearCounts.set(key, (yearCounts.get(key) ?? 0) + 1)
      }
      data.studentsByYear = ['1st Yr', '2nd Yr', '3rd Yr', '4th Yr'].map((year, i) => ({
        year,
        val: yearCounts.get(i + 1) ?? 0,
      }))

      // Gender
      let female = 0
      let male = 0
      let other = 0
      for (const s of sexes) {
        if (s.sex === 'F' || s.sex === 'Female') female += 1
        else if (s.sex === 'M' || s.sex === 'Male') male += 1
        else other += 1
      }
      data.gender = { female, male, other }

      // Concerns
      let open = 0
      let inProgress = 0
      let resolved = 0
      let rejected = 0
      const catCounts = new Map<string, number>()
      for (const c of concernRows) {
        if (c.status === 'open') open += 1
        else if (c.status === 'in_progress') inProgress += 1
        else if (c.status === 'resolved') resolved += 1
        else if (c.status === 'rejected') rejected += 1
        const cat = c.category || 'others'
        catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1)
      }
      const concernTotal = concernRows.length
      data.concerns = {
        total: concernTotal,
        open,
        inProgress,
        resolved,
        rejected,
        urgent: urgentRes.count ?? 0,
      }
      const maxCat = Math.max(1, ...Array.from(catCounts.values()))
      data.concernsByCategory = Array.from(catCounts.entries())
        .map(([name, val], i) => ({
          name,
          val,
          ratio: val / maxCat,
          color: CARD_COLORS[i % CARD_COLORS.length] ?? 'grey-5',
        }))
        .sort((a, b) => b.val - a.val)

      // Pending registrations
      data.pendingRegistrations = pending.map((u) => {
        const isLandlord = (u.role ?? '').toLowerCase() === 'landlord'
        return {
          initials: initialsOf(u.full_name),
          name: u.full_name || 'Unknown User',
          time: timeAgo(u.created_at),
          role: isLandlord ? 'Landlord' : 'Student',
          roleColor: isLandlord ? 'indigo-4' : 'teal-4',
          status: (u.status ?? 'pending').charAt(0).toUpperCase() + (u.status ?? 'pending').slice(1).toLowerCase(),
          statusColor: isLandlord ? 'orange' : 'orange',
          color: isLandlord ? 'indigo-5' : 'teal-5',
        }
      })

      // Unverified users
      data.unverifiedUsers = {
        total: unverifiedRes.count ?? 0,
        pending: pending.filter(u => u.status === 'pending').length,
        reviewing: pending.filter(u => u.status === 'reviewing').length,
      }

      // Active leases
      data.activeLeases = leaseRes.count ?? 0

      // Open complaints
      data.complaints = {
        total: (complaintOpenRes.count ?? 0),
        open: complaintOpenRes.count ?? 0,
        urgent: urgentRes.count ?? 0,
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard data'
    } finally {
      loading.value = false
    }
  }

  return { loading, error, data, load }
}
