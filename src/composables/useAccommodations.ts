import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { getInitialsWide as initialsOf } from '@/utils/format'

// Real accommodation shape pulled from Supabase. Fields the DB doesn't carry
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

export interface RealAccommodation {
  id: string
  name: string
  type: string
  accommodationManager: string
  accommodationManagerInitials: string
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
  // hierarchy: Accommodation → Accommodation Type; Room → Room Type
  accommodationType: string
  roomType: string
  description: string
  // Manager profile (for Accommodation Hub accreditation/performance tabs)
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

function titleCase(s: string | null | undefined): string {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function useAccommodations() {
  const loading = ref(true)
  const error = ref<string | null>(null)
  const accommodations = ref<RealAccommodation[]>([])

  async function load() {
    loading.value = true
    error.value = null
    try {
      const [propsRes, roomsRes, leasesRes, profilesRes, permitsRes] = await Promise.all([
        supabase.from('accommodations').select(
          `id, name, address, city, barangay, lat, lng, room_type, accommodation_type,
            total_rooms, total_floors, description, status, rating_avg,
            reviews_count, accommodation_manager_id, business_name, accreditation_status,
            accredited_at, accreditation_expires_at,
            accommodation_manager:users!accommodations_accommodation_manager_id_fkey(id, full_name, phone, initials)`
        ),
        supabase.from('rooms').select(
          `id, room_number, label, floor, capacity, current_pax, status, monthly_rent, accommodation_id`
        ),
        supabase.from('leases').select(
          `id, status, room_id, student_id, start_date,
           student:users!leases_student_id_fkey(id, full_name, initials, sex)`
        ).in('status', ['active', 'leave_requested']),
        supabase.from('accommodation_manager_profiles').select(
          `user_id, response_rate`
        ),
        supabase.from('accommodation_documents').select(
          `id, accommodation_id, doc_type, file_url, version, issued_at, expires_at, uploaded_at`
        ).order('version', { ascending: false }),
      ])

      if (propsRes.error) throw propsRes.error

      const props = (propsRes.data ?? []) as any[]
      const rooms = (roomsRes.data ?? []) as any[]
      const leases = (leasesRes.data ?? []) as any[]
      const accommodationManagerProfiles = (profilesRes.data ?? []) as any[]
      const permits = (permitsRes.data ?? []) as any[]

      // Index accommodation-manager profiles by user_id.
      const profileByUserId = new Map<string, any>()
      for (const lr of accommodationManagerProfiles) {
        if (lr.user_id) profileByUserId.set(lr.user_id, lr)
      }

      // Index rooms by accommodation id.
      const roomsByAccommodation = new Map<string, any[]>()
      for (const r of rooms) {
        const accommodationId = r.accommodation_id
        if (!roomsByAccommodation.has(accommodationId)) roomsByAccommodation.set(accommodationId, [])
        roomsByAccommodation.get(accommodationId)!.push(r)
      }

      // Index permits by accommodation id.
      const permitsByAccommodation = new Map<string, any[]>()
      for (const pm of permits) {
        const accommodationId = pm.accommodation_id
        if (!permitsByAccommodation.has(accommodationId)) permitsByAccommodation.set(accommodationId, [])
        permitsByAccommodation.get(accommodationId)!.push(pm)
      }

      // Index active occupants by room id
      const occupantsByRoom = new Map<string, any[]>()
      for (const l of leases) {
        if (!l.room_id) continue
        if (!occupantsByRoom.has(l.room_id)) occupantsByRoom.set(l.room_id, [])
        occupantsByRoom.get(l.room_id)!.push(l)
      }

      accommodations.value = props.map((p, i): RealAccommodation => {
        const accommodationManager = p.accommodation_manager
        const accommodationManagerName = accommodationManager?.full_name ?? 'Unknown Accommodation Manager'
        const profile = profileByUserId.get(p.accommodation_manager_id)
        const roomList = roomsByAccommodation.get(p.id) ?? []
        const verified = p.status === 'accredited' || p.status === 'verified'

        const totalRooms = p.total_rooms ?? roomList.length
        const occupiedRooms = roomList.filter((r) => r.status === 'occupied').length
        const totalCapacity = roomList.reduce((s, r) => s + (r.capacity ?? 0), 0)
        const totalPax = roomList.reduce((s, r) => s + (r.current_pax ?? 0), 0)

        // Gender split from this accommodation's active lease occupants (filtered by
        // the accommodation's room ids — previously counted all leases for every
        // accommodation, making every row share the same global male/female total).
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
          name: p.name ?? 'Unnamed Accommodation',
          type: titleCase(p.accommodation_type),
          accommodationManager: accommodationManagerName,
          accommodationManagerInitials: accommodationManager?.initials ?? initialsOf(accommodationManagerName),
          contact: accommodationManager?.phone ?? '—',
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
          accommodationType: titleCase(p.accommodation_type),
          roomType: p.room_type ?? '—',
          description: p.description ?? '',
          businessName: p.business_name ?? null,
          accreditationStatus: p.accreditation_status ?? null,
          accreditedAt: p.accredited_at ?? null,
          accreditationExpiresAt: p.accreditation_expires_at ?? null,
          responseRate: profile?.response_rate ?? null,
          rooms: mappedRooms,
          permits: (permitsByAccommodation.get(p.id) ?? []).map((dm): RealPermit => ({
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
      error.value = e instanceof Error ? e.message : 'Failed to load accommodations'
    } finally {
      loading.value = false
    }
  }

  return { loading, error, accommodations, load }
}
