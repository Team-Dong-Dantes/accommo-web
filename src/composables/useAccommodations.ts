import { errorMessage } from '@/utils/errors'
import { ref } from 'vue'
import { registerReset } from '@/utils/pageCache'
import { getStatus } from '@/utils/status.config'
import { composeAddress, getInitialsWide as initialsOf, humanizeEnum } from '@/utils/format'
import { resolveAsset } from '@/utils/cloudinaryUrl'
import { facilityIcon, facilityLabel, roomUtilitiesSummary } from '@/utils/facilities'
import { fetchAccommodationTables } from '@/api/accommodations'
import type { BadgeStyle, RealAccommodation, RealFacility, RealOccupant, RealPermit, RealRoom } from '@/types/accommodations'

export type { BadgeStyle, RealAccommodation, RealFacility, RealOccupant, RealPermit, RealRoom } from '@/types/accommodations'

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

const NO_PHOTO = ''

/** `student_profiles` is one-to-one with `users`, but PostgREST may still embed it as a list. */
function profileOf(student: any): { program?: string | null; year_level?: string | null } | null {
  const sp = student?.student_profiles
  return (Array.isArray(sp) ? sp[0] : sp) ?? null
}

// `accommodation_type` holds snake_case enum values, so the old
// charAt(0).toUpperCase() rendered "boarding_house" as "Boarding_house" — the
// underscore was visible in the hub table and the map list.

// Module scope, shared by the Map View and the Accommodation Hub: a return
// visit shows the cached list at once while load() refreshes it.
// See utils/pageCache.ts.
const accommodations = ref<RealAccommodation[]>([])
const hasLoaded = ref(false)
registerReset(() => { accommodations.value = []; hasLoaded.value = false })

export function useAccommodations() {
  const loading = ref(!hasLoaded.value)
  const error = ref<string | null>(null)

  /** `show`: the refresh button — with no loading state a click looked like it did nothing. */
  async function load(show = false) {
    loading.value = show || !hasLoaded.value
    error.value = null
    try {
      const { props, rooms, leases, landlordProfiles, permits, images, facilities, facilityImages } = await fetchAccommodationTables()

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

      // Exterior photos per accommodation, by sort order. Tables and cards want
      // only the first (the cover); the Map View's pin card shows them all.
      const photosByAccommodation = new Map<string, string[]>()
      for (const im of images) {
        if (!im.accommodation_id || !im.url) continue
        const list = photosByAccommodation.get(im.accommodation_id) ?? []
        list.push(im.url)
        photosByAccommodation.set(im.accommodation_id, list)
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
        const verified = p.status === 'accredited'

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
          utilities: roomUtilitiesSummary(r),
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
          image: resolveAsset(photosByAccommodation.get(p.id)?.[0] ?? NO_PHOTO),
          photos: (photosByAccommodation.get(p.id) ?? []).map(resolveAsset),
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
      hasLoaded.value = true
    } catch (e) {
      error.value = errorMessage(e, 'Failed to load accommodations')
    } finally {
      loading.value = false
    }
  }

  return { loading, error, accommodations, load }
}
