import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { getStatus, type StatusTone } from '@/utils/status.config'
import { composeAddress, getInitialsWide as initialsOf, humanizeEnum } from '@/utils/format'
import { resolveAsset } from '@/utils/cloudinaryUrl'
import { facilityIcon, facilityLabel } from '@/utils/facilities'

// Real accommodation shape pulled from Supabase. Fields the DB doesn't carry
// (audit results, inspectors, compliance permits, performance scores) are
// deliberately absent/empty — the UI renders '—' for them instead of inventing data.

/**
 * BadgePill takes a concrete icon, while the status table leaves it optional,
 * so the badge gets a floor rather than every caller guarding for it.
 */
export interface BadgeStyle { tone: StatusTone; icon: string }

function badgeStyle(status: string): BadgeStyle {
  const def = getStatus(status)
  return { tone: def.tone, icon: def.icon ?? 'lucide:circle' }
}

/** The most recent upload among a property's permits, ISO, or null. */
function newestUpload(rows: { uploaded_at?: string | null }[]): string | null {
  return rows.reduce<string | null>(
    (latest, row) =>
      row.uploaded_at && (!latest || row.uploaded_at > latest) ? row.uploaded_at : latest,
    null,
  )
}

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
  /**
   * When the property was put forward, ISO. `accommodations` carries no
   * created-at column, so its age is the newest of its permit uploads — the same
   * reading the verification queue uses to order accreditation requests.
   */
  submittedAt: string | null
  name: string
  /** Fallback behind the hub's cover-photo thumbnail, from the house's name. */
  initials: string
  type: string
  landlord: string
  /** The landlord/landlady's user id, for opening their record. */
  landlordId: string
  /** `users.sex` ('F' | 'M' | null) — feeds `landlordTitle`. */
  landlordSex: string | null
  landlordInitials: string
  /** The landlord/landlady's profile photo, when they have one. */
  landlordAvatarUrl: string
  contact: string
  /** Derived: only an accredited property is visible to students. */
  verified: boolean
  status: string
  /** Sentence-case label and tone/icon for the status badge. */
  statusLabel: string
  statusStyle: BadgeStyle
  rating: string
  /** How many student reviews the rating averages over. */
  reviewsCount: number
  totalRooms: number
  occupiedRooms: number
  totalStudents: number
  totalCapacity: number
  occupancyRate: number
  femaleCount: number
  maleCount: number
  image: string
  address: string
  /** For grouping and filtering the OSAS reports by barangay. */
  barangay: string
  floors: number
  lat: number | null
  lng: number | null
  // hierarchy: Accommodation → Accommodation Type; Room → Room Type
  accommodationType: string
  roomType: string
  description: string
  // Landlord/landlady profile (for Accommodation Hub accreditation/performance tabs)
  businessName: string | null
  accreditationStatus: string | null
  accreditedAt: string | null
  accreditationExpiresAt: string | null
  responseRate: number | null
  rooms: RealRoom[]
  permits: RealPermit[]
  /** Shared facilities (bathrooms, kitchen, study area) on this property. */
  facilities: RealFacility[]
  /** `male` | `female` | `co_ed`, or null when the landlord/landlady has not said. */
  genderPolicy: string | null
  /** OSAS has taken it out of what students browse, without touching its accreditation. */
  hiddenFromListings: boolean
}

export interface RealFacility {
  id: string
  type: string
  label: string
  icon: string
  description: string
  floor: number | null
  photoCount: number
  status: 'available' | 'under_repair'
  /** Rooms the landlord/landlady says share it. */
  roomIds: string[]
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
  /** The boarder's user id. */
  id: string
  name: string
  initials: string
  /** Their profile photo, when they have one. */
  avatarUrl: string
  gender: 'female' | 'male'
  course: string
  year: string
  since: string
}

/**
 * Shown when a property has no photo on file. It used to be one of five random
 * picsum images handed out round-robin, so the hub showed an unrelated stock
 * photo for every house whether or not real ones had been uploaded — and the
 * same house got a different building each time the list re-sorted.
 */
const NO_PHOTO = ''

/** `student_profiles` is one-to-one with `users`, but PostgREST may still embed it as a list. */
function profileOf(student: any): { program?: string | null; year_level?: string | null } | null {
  const sp = student?.student_profiles
  return (Array.isArray(sp) ? sp[0] : sp) ?? null
}

// `accommodation_type` holds snake_case enum values, so the old
// charAt(0).toUpperCase() rendered "boarding_house" as "Boarding_house" — the
// underscore was visible in the hub table and the map list.

export function useAccommodations() {
  const loading = ref(true)
  const error = ref<string | null>(null)
  const accommodations = ref<RealAccommodation[]>([])

  async function load() {
    loading.value = true
    error.value = null
    try {
      const [propsRes, roomsRes, leasesRes, profilesRes, permitsRes, imagesRes, facilitiesRes, facilityImagesRes] = await Promise.all([
        supabase.from('accommodations').select(
          `id, name, address, city, barangay, lat, lng, room_type, accommodation_type,
            total_rooms, total_floors, description, status, rating_avg,
            reviews_count, landlord_id, business_name, accreditation_status,
            accredited_at, accreditation_expires_at, gender_policy, hidden_from_listings,
            landlord:users!accommodations_landlord_id_fkey(id, full_name, phone, initials, avatar_url, sex)`
        ),
        supabase.from('rooms').select(
          `id, room_number, label, floor, capacity, current_pax, status, monthly_rent, accommodation_id`
        ),
        supabase.from('leases').select(
          `id, status, room_id, student_id, start_date,
           student:users!leases_student_id_fkey(id, full_name, initials, sex, avatar_url, student_profiles(program, year_level))`
        ).in('status', ['active', 'leave_requested']),
        supabase.from('landlord_profiles').select(
          `user_id, response_rate`
        ),
        supabase.from('accommodation_documents').select(
          `id, accommodation_id, doc_type, file_url, version, issued_at, expires_at, uploaded_at`
        ).order('version', { ascending: false }),
        supabase.from('accommodation_images').select('accommodation_id, url, sort_order')
          .order('sort_order', { ascending: true }),
        supabase.from('accommodation_facilities')
          .select('id, accommodation_id, facility_type, label, description, floor, sort_order, status, accommodation_facility_rooms(room_id)')
          .eq('access_scope', 'shared')
          .order('sort_order', { ascending: true }),
        supabase.from('accommodation_facility_images').select('facility_id'),
      ])

      if (propsRes.error) throw propsRes.error

      const props = (propsRes.data ?? []) as any[]
      const rooms = (roomsRes.data ?? []) as any[]
      const leases = (leasesRes.data ?? []) as any[]
      const landlordProfiles = (profilesRes.data ?? []) as any[]
      const permits = (permitsRes.data ?? []) as any[]
      const images = (imagesRes.data ?? []) as any[]
      const facilities = (facilitiesRes.data ?? []) as any[]
      const facilityImages = (facilityImagesRes.data ?? []) as any[]

      // Photo count per facility, so a row can say "3" without fetching the URLs
      // the hub never renders.
      const photoCountByFacility = new Map<string, number>()
      for (const fi of facilityImages) {
        if (!fi.facility_id) continue
        photoCountByFacility.set(fi.facility_id, (photoCountByFacility.get(fi.facility_id) ?? 0) + 1)
      }

      // Shared facilities by accommodation. The query already filters to
      // access_scope='shared', and the table's own check constraint guarantees
      // those are exactly the rows with no room_id.
      const facilitiesByAccommodation = new Map<string, RealFacility[]>()
      for (const f of facilities) {
        if (!f.accommodation_id) continue
        if (!facilitiesByAccommodation.has(f.accommodation_id)) {
          facilitiesByAccommodation.set(f.accommodation_id, [])
        }
        facilitiesByAccommodation.get(f.accommodation_id)!.push({
          id: f.id,
          type: f.facility_type ?? 'other',
          label: facilityLabel(f.facility_type, f.label),
          icon: facilityIcon(f.facility_type),
          description: f.description ?? '',
          floor: f.floor ?? null,
          photoCount: photoCountByFacility.get(f.id) ?? 0,
          status: f.status === 'under_repair' ? 'under_repair' : 'available',
          roomIds: (f.accommodation_facility_rooms ?? []).map((l: { room_id: string }) => l.room_id),
        })
      }

      // First photo per accommodation, by sort order — the card wants one image,
      // not the gallery.
      const coverByAccommodation = new Map<string, string>()
      for (const im of images) {
        if (im.accommodation_id && im.url && !coverByAccommodation.has(im.accommodation_id)) {
          coverByAccommodation.set(im.accommodation_id, im.url)
        }
      }

      // Index landlord/landlady profiles by user_id.
      const profileByUserId = new Map<string, any>()
      for (const lr of landlordProfiles) {
        if (lr.user_id) profileByUserId.set(lr.user_id, lr)
      }

      // Index rooms by accommodation id.
      const roomsByAccommodation = new Map<string, any[]>()
      for (const r of rooms) {
        const accommodationId = r.accommodation_id
        if (!roomsByAccommodation.has(accommodationId)) roomsByAccommodation.set(accommodationId, [])
        roomsByAccommodation.get(accommodationId)!.push(r)
      }

      // Index permits by accommodation id, newest version of each type only.
      //
      // accommodation_documents keeps every version on purpose — replacing a
      // permit inserts version n+1 rather than overwriting — but a superseded
      // version is history, not a second document. Passing them all through
      // listed one property's business permit three times in the detail
      // drawer, the two older copies both reading "Expired" because they were.
      // The rows arrive version-descending, so the first of each type wins.
      const permitsByAccommodation = new Map<string, any[]>()
      const newestPermit = new Set<string>()
      for (const pm of permits) {
        const accommodationId = pm.accommodation_id
        const key = `${accommodationId}:${pm.doc_type}`
        if (newestPermit.has(key)) continue
        newestPermit.add(key)
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

      accommodations.value = props.map((p): RealAccommodation => {
        const landlord = p.landlord
        const landlordName = landlord?.full_name ?? 'Unknown Landlord/Landlady'
        const profile = profileByUserId.get(p.landlord_id)
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
              id: st.id ?? '',
              name: st.full_name ?? 'Unknown',
              initials: st.initials ?? initialsOf(st.full_name),
              avatarUrl: st.avatar_url ?? '',
              gender: sex,
              course: profileOf(st)?.program ?? '—',
              year: profileOf(st)?.year_level ?? '—',
              since: l.start_date ? new Date(l.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—',
            }
          }),
        }))

        return {
          id: p.id,
          name: p.name ?? 'Unnamed Accommodation',
          // The interface has always declared this, but nothing set it — so the
          // hub's accommodation cell had no fallback behind its photo. Needed
          // for a house whose landlord has not uploaded one yet.
          initials: initialsOf(p.name ?? 'Unnamed Accommodation'),
          type: humanizeEnum(p.accommodation_type),
          landlord: landlordName,
          landlordId: p.landlord_id ?? '',
          landlordSex: landlord?.sex ?? null,
          // Computed from the name rather than trusting `users.initials`: that
          // column is stale for most landlord accounts on file (several
          // unrelated people all stored as "DU"), so preferring it rendered
          // the wrong letters — accurate but occasionally different from
          // whatever a profile screen still reads straight off that column.
          landlordInitials: initialsOf(landlordName),
          landlordAvatarUrl: landlord?.avatar_url ?? '',
          contact: landlord?.phone ?? '—',
          verified,
          status: p.status ?? 'unknown',
          statusLabel: humanizeEnum(p.status ?? 'unknown'),
          statusStyle: badgeStyle(p.status ?? 'unknown'),
          rating: p.rating_avg != null ? p.rating_avg.toFixed(1) : '—',
          reviewsCount: p.reviews_count ?? 0,
          totalRooms,
          occupiedRooms,
          totalStudents: totalPax,
          totalCapacity,
          occupancyRate: totalCapacity > 0 ? Math.round((totalPax / totalCapacity) * 100) : 0,
          femaleCount,
          maleCount,
          // Served through resolveAsset so the hub's 48px thumbnail pulls an
          // f_auto,q_auto derivative rather than the full-size upload.
          image: resolveAsset(coverByAccommodation.get(p.id) ?? NO_PHOTO),
          address: composeAddress(p),
          barangay: p.barangay ?? '',
          floors: p.total_floors ?? 0,
          lat: p.lat,
          lng: p.lng,
          accommodationType: humanizeEnum(p.accommodation_type),
          roomType: p.room_type ?? '—',
          description: p.description ?? '',
          businessName: p.business_name ?? null,
          accreditationStatus: p.accreditation_status ?? null,
          accreditedAt: p.accredited_at ?? null,
          accreditationExpiresAt: p.accreditation_expires_at ?? null,
          responseRate: profile?.response_rate ?? null,
          submittedAt: newestUpload(permitsByAccommodation.get(p.id) ?? []),
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
          facilities: facilitiesByAccommodation.get(p.id) ?? [],
          genderPolicy: p.gender_policy ?? null,
          hiddenFromListings: Boolean(p.hidden_from_listings),
        }
      })
      // Newest first, so the map and its list open on what just came in rather
      // than on whatever order Postgres happened to return. Undated properties
      // sort last instead of jumping the queue.
      accommodations.value.sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load accommodations'
    } finally {
      loading.value = false
    }
  }

  return { loading, error, accommodations, load }
}
