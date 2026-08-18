import { ref } from 'vue'
import { supabase } from '@/utils/supabase'

// Real property shape pulled from Supabase. Fields the DB doesn't carry
// (audit results, inspectors, compliance permits, performance scores) are
// deliberately absent/empty — the UI renders '—' for them instead of inventing data.

export interface RealPermit {
  id: string
  type: string
  version: number | null
  fileUrl: string | null
  issuedAt: string | null
  expiresAt: string | null
  uploadedAt: string | null
}

export interface RealProperty {
  id: string
  name: string
  type: string
  landlord: string
  landlordInitials: string
  contact: string
  verified: boolean
  status: string
  rating: string
  totalRooms: number
  occupiedRooms: number
  totalStudents: number
  totalCapacity: number
  occupancyRate: number
  femaleCount: number
  maleCount: number
  image: string
  address: string
  floors: number
  lat: number | null
  lng: number | null
  // hierarchy: Property → Property Type; Room → Room Type
  propertyType: string
  roomType: string
  description: string
  // landlord profile (for PropertyHub accreditation/performance tabs)
  businessName: string | null
  accreditationStatus: string | null
  accreditedAt: string | null
  accreditationExpiresAt: string | null
  responseRate: number | null
  rooms: RealRoom[]
  permits: RealPermit[]
}

export interface RealRoom {
  id: string
  name: string
  number: string | null
  floor: number | null
  capacity: number | null
  currentPax: number | null
  status: string
  monthlyRent: number | null
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
      const [propsRes, roomsRes, leasesRes, profilesRes, permitsRes] = await Promise.all([
        supabase.from('properties').select(
          `id, name, address, city, barangay, lat, lng, room_type, property_type,
           total_rooms, total_floors, description, status, rating_avg,
           reviews_count, landlord_id, business_name, accreditation_status,
           accredited_at, accreditation_expires_at,
           landlord:users(id, full_name, phone, initials)`
        ),
        supabase.from('rooms').select(
          `id, room_number, label, floor, capacity, current_pax, status, monthly_rent, property_id`
        ),
        supabase.from('leases').select(
          `id, status, room_id, student_id, start_date,
           student:users!leases_student_id_fkey(id, full_name, initials, sex)`
        ).in('status', ['active', 'leave_requested']),
        supabase.from('landlord_profiles').select(
          `user_id, response_rate`
        ),
        supabase.from('property_documents').select(
          `id, property_id, doc_type, file_url, version, issued_at, expires_at, uploaded_at`
        ).order('version', { ascending: false }),
      ])

      if (propsRes.error) throw propsRes.error

      const props = (propsRes.data ?? []) as any[]
      const rooms = (roomsRes.data ?? []) as any[]
      const leases = (leasesRes.data ?? []) as any[]
      const landlordProfiles = (profilesRes.data ?? []) as any[]
      const permits = (permitsRes.data ?? []) as any[]

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

      // Index permits by property id
      const permitsByProperty = new Map<string, any[]>()
      for (const pm of permits) {
        const pid = pm.property_id
        if (!permitsByProperty.has(pid)) permitsByProperty.set(pid, [])
        permitsByProperty.get(pid)!.push(pm)
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

        // Gender split from THIS property's active lease occupants (filtered by
        // the property's room ids — previously counted ALL leases for every
        // property, making every row share the same global male/female total).
        const roomIdSet = new Set(roomList.map((r) => r.id))
        let femaleCount = 0
        let maleCount = 0
        for (const l of leases) {
          if (!roomIdSet.has(l.room_id)) continue
          if (!l.student?.sex) continue
          if (l.student.sex === 'F' || l.student.sex === 'Female') femaleCount += 1
          else if (l.student.sex === 'M' || l.student.sex === 'Male') maleCount += 1
        }

        const mappedRooms: RealRoom[] = roomList.map((r) => ({
          id: r.id,
          name: r.room_number || r.label || `Room ${String(r.id).slice(0, 4)}`,
          number: r.room_number ?? null,
          floor: r.floor,
          capacity: r.capacity ?? null,
          currentPax: r.current_pax ?? null,
          status: r.status ?? 'available',
          monthlyRent: r.monthly_rent ?? null,
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
          type: titleCase(p.property_type),
          landlord: landlordName,
          landlordInitials: landlord?.initials ?? initialsOf(landlordName),
          contact: landlord?.phone ?? '—',
          verified,
          status: p.status ?? 'unknown',
          rating: p.rating_avg != null ? p.rating_avg.toFixed(1) : '—',
          totalRooms,
          occupiedRooms,
          totalStudents: totalPax,
          totalCapacity,
          occupancyRate: totalCapacity > 0 ? Math.round((totalPax / totalCapacity) * 100) : 0,
          femaleCount,
          maleCount,
          image: IMAGES[i % IMAGES.length] ?? IMAGES[0] ?? '',
          address: [p.address, p.barangay, p.city].filter(Boolean).join(', ') || '—',
          floors: p.total_floors ?? 0,
          lat: p.lat,
          lng: p.lng,
          propertyType: titleCase(p.property_type),
          roomType: p.room_type ?? '—',
          description: p.description ?? '',
          businessName: p.business_name ?? null,
          accreditationStatus: p.accreditation_status ?? null,
          accreditedAt: p.accredited_at ?? null,
          accreditationExpiresAt: p.accreditation_expires_at ?? null,
          responseRate: profile?.response_rate ?? null,
          rooms: mappedRooms,
          permits: (permitsByProperty.get(p.id) ?? []).map((dm): RealPermit => ({
            id: dm.id,
            type: dm.doc_type ?? '—',
            version: dm.version ?? null,
            fileUrl: dm.file_url ?? null,
            issuedAt: dm.issued_at ?? null,
            expiresAt: dm.expires_at ?? null,
            uploadedAt: dm.uploaded_at ?? null,
          })),
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
