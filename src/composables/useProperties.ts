import { ref } from 'vue'
import { supabase } from '@/utils/supabase'

// Real property shape pulled from Supabase. Fields the DB doesn't carry
// (audit results, inspectors, compliance permits, performance scores) are
// deliberately absent/empty — the UI renders '—' for them instead of inventing data.

export interface RealProperty {
  id: string
  name: string
  type: string
  landlord: string
  landlordInitials: string
  contact: string
  verified: boolean
  status: string
  price: string
  rating: string
  totalRooms: number
  occupiedRooms: number
  totalStudents: number
  occupancyRate: number
  femaleCount: number
  maleCount: number
  image: string
  address: string
  floors: number
  lat: number | null
  lng: number | null
  roomType: string
  description: string
  // landlord profile (for PropertyHub accreditation/performance tabs)
  businessName: string | null
  accreditationStatus: string | null
  accreditationExpiresAt: string | null
  responseRate: number | null
  rooms: RealRoom[]
}

export interface RealRoom {
  id: string
  name: string
  floor: number | null
  capacity: number | null
  occupants: RealOccupant[]
}

export interface RealOccupant {
  name: string
  initials: string
  gender: 'female' | 'male'
  course: string
  year: string
  since: string
}

const IMAGES = [
  'https://picsum.photos/400/300?random=21',
  'https://picsum.photos/400/300?random=22',
  'https://picsum.photos/400/300?random=23',
  'https://picsum.photos/400/300?random=24',
  'https://picsum.photos/400/300?random=25',
]

function initialsOf(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0] ?? ''
  if (parts.length > 1) {
    const last = parts[parts.length - 1] ?? ''
    return (first.charAt(0) + last.charAt(0)).toUpperCase()
  }
  return first.slice(0, 2).toUpperCase()
}

function fmtPeso(n: number | null): string {
  if (n == null) return '—'
  return `₱${n.toLocaleString('en-PH')}/mo`
}

function titleCase(s: string | null | undefined): string {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function useProperties() {
  const loading = ref(true)
  const error = ref<string | null>(null)
  const properties = ref<RealProperty[]>([])

  async function load() {
    loading.value = true
    error.value = null
    try {
      const [propsRes, roomsRes, leasesRes, profilesRes] = await Promise.all([
        supabase.from('properties').select(
          `id, name, address, city, barangay, lat, lng, room_type, property_type,
           total_rooms, total_floors, monthly_rent, description, status, rating_avg,
           reviews_count, landlord_id,
           landlord:users(id, full_name, phone, initials)`
        ),
        supabase.from('rooms').select(
          `id, room_number, label, floor, capacity, current_pax, status, property_id`
        ),
        supabase.from('leases').select(
          `id, status, room_id, student_id, start_date,
           student:users!leases_student_id_fkey(id, full_name, initials, sex)`
        ).in('status', ['active', 'leave_requested']),
        supabase.from('landlord_profiles').select(
          `user_id, business_name, accreditation_status, accreditation_expires_at, response_rate`
        ),
      ])

      if (propsRes.error) throw propsRes.error

      const props = (propsRes.data ?? []) as any[]
      const rooms = (roomsRes.data ?? []) as any[]
      const leases = (leasesRes.data ?? []) as any[]
      const landlordProfiles = (profilesRes.data ?? []) as any[]

      // Index landlord profiles by user_id
      const profileByUserId = new Map<string, any>()
      for (const lr of landlordProfiles) {
        if (lr.user_id) profileByUserId.set(lr.user_id, lr)
      }

      // Index rooms by property id
      const roomsByProperty = new Map<string, any[]>()
      for (const r of rooms) {
        const pid = r.property_id
        if (!roomsByProperty.has(pid)) roomsByProperty.set(pid, [])
        roomsByProperty.get(pid)!.push(r)
      }

      // Index active occupants by room id
      const occupantsByRoom = new Map<string, any[]>()
      for (const l of leases) {
        if (!l.room_id) continue
        if (!occupantsByRoom.has(l.room_id)) occupantsByRoom.set(l.room_id, [])
        occupantsByRoom.get(l.room_id)!.push(l)
      }

      properties.value = props.map((p, i): RealProperty => {
        const landlord = p.landlord
        const landlordName = landlord?.full_name ?? 'Unknown Landlord'
        const profile = profileByUserId.get(p.landlord_id)
        const roomList = roomsByProperty.get(p.id) ?? []
        const verified = p.status === 'accredited' || p.status === 'verified'

        const totalRooms = p.total_rooms ?? roomList.length
        const occupiedRooms = roomList.filter((r) => r.status === 'occupied').length
        const totalCapacity = roomList.reduce((s, r) => s + (r.capacity ?? 0), 0)
        const totalPax = roomList.reduce((s, r) => s + (r.current_pax ?? 0), 0)

        // Gender split from active lease occupants
        let femaleCount = 0
        let maleCount = 0
        for (const l of leases) {
          if (!l.student?.sex) continue
          if (l.student.sex === 'F' || l.student.sex === 'Female') femaleCount += 1
          else if (l.student.sex === 'M' || l.student.sex === 'Male') maleCount += 1
        }

        const mappedRooms: RealRoom[] = roomList.map((r) => ({
          id: r.id,
          name: r.room_number || r.label || `Room ${String(r.id).slice(0, 4)}`,
          floor: r.floor,
          capacity: r.capacity ?? 0,
          occupants: (occupantsByRoom.get(r.id) ?? []).map((l): RealOccupant => {
            const st = l.student ?? {}
            const sex = st.sex === 'F' || st.sex === 'Female' ? 'female' : 'male'
            return {
              name: st.full_name ?? 'Unknown',
              initials: st.initials ?? initialsOf(st.full_name),
              gender: sex,
              course: '—',
              year: '—',
              since: l.start_date ? new Date(l.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—',
            }
          }),
        }))

        return {
          id: p.id,
          name: p.name ?? 'Unnamed Property',
          type: titleCase(p.room_type),
          landlord: landlordName,
          landlordInitials: landlord?.initials ?? initialsOf(landlordName),
          contact: landlord?.phone ?? '—',
          verified,
          status: p.status ?? 'unknown',
          price: fmtPeso(p.monthly_rent),
          rating: p.rating_avg != null ? p.rating_avg.toFixed(1) : '—',
          totalRooms,
          occupiedRooms,
          totalStudents: totalPax,
          occupancyRate: totalCapacity > 0 ? Math.round((totalPax / totalCapacity) * 100) : 0,
          femaleCount,
          maleCount,
          image: IMAGES[i % IMAGES.length] ?? IMAGES[0] ?? '',
          address: [p.address, p.barangay, p.city].filter(Boolean).join(', ') || '—',
          floors: p.total_floors ?? 0,
          lat: p.lat,
          lng: p.lng,
          roomType: p.room_type ?? '—',
          description: p.description ?? '',
          businessName: profile?.business_name ?? null,
          accreditationStatus: profile?.accreditation_status ?? null,
          accreditationExpiresAt: profile?.accreditation_expires_at ?? null,
          responseRate: profile?.response_rate ?? null,
          rooms: mappedRooms,
        }
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load properties'
    } finally {
      loading.value = false
    }
  }

  return { loading, error, properties, load }
}
