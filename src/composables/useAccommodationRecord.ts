// The full accommodation record: the row the Accommodation Hub and the Map View
// both open, the three fetches that fill it in, and the DrawerPreview every
// drawer pane reads. Moved verbatim out of pages/admin/PropertyHub.vue so the
// map's detail panel shows the same panes from the same data.

import { ref, computed, type Ref } from 'vue'
import type { DrawerPreview, PreviewChip } from '@/components/ui/DetailDrawer.vue'
import type { PreviewAccommodationOverview } from '@/features/drawer/preview'
import { getTone, type StatusTone } from '@/utils/status.config'
import { supabase } from '@/utils/supabase'
import { cap, composeAddress, escapeHtml, fmtDate, formatDateTime, humanizeEnum, landlordTitle, utcMs } from '@/utils/format'
import {
  fetchAccommodationDrawerExtras,
  fetchAccommodationEvents,
  type AccommodationDrawerExtras,
  type AccommodationEventRow,
} from '@/api/accommodations'
import { PERMIT_STATE, expiryLabel, permitStateOf } from '@/utils/permitExpiry'
import type { RealAccommodation } from '@/composables/useAccommodations'
import { AMENITY_META } from '@/utils/facilities'

/**
 * The row a record opens from. Maps the real Supabase accommodation straight
 * through — no invented audit/compliance fields — plus rooms and occupants.
 */
export function toRecordRow(p: RealAccommodation) {
  return {
    id: p.id,
    name: p.name,
    type: p.accommodationType,
    businessName: p.businessName,
    // The house's own cover photo and its own initials behind it. This mapping
    // used to drop `image` entirely and fill `initials` from the LANDLORD, so
    // every row showed a person's letters where the building should be, and no
    // photo could ever reach the table no matter what the composable resolved.
    image: p.image,
    initials: p.initials,
    landlordInitials: p.landlordInitials,
    landlordAvatarUrl: p.landlordAvatarUrl,
    landlord: p.landlord,
    landlordId: p.landlordId,
    landlordSex: p.landlordSex,
    genderPolicy: p.genderPolicy,
    hiddenFromListings: p.hiddenFromListings,
    contact: p.contact,
    verified: p.verified,
    status: p.status,
    statusLabel: p.statusLabel,
    statusStyle: p.statusStyle,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    floors: p.floors,
    totalRooms: p.totalRooms,
    occupiedRooms: p.occupiedRooms,
    totalStudents: p.totalStudents,
    totalCapacity: p.totalCapacity,
    occupancyRate: p.occupancyRate,
    femaleCount: p.femaleCount,
    maleCount: p.maleCount,
    roomType: p.roomType,
    description: p.description,
    accreditationStatus: p.accreditationStatus,
    accreditedAt: p.accreditedAt,
    accreditationExpiresAt: p.accreditationExpiresAt,
    responseRate: p.responseRate,
    submittedAt: p.submittedAt,
    rooms: p.rooms,
    permits: p.permits,
    facilities: p.facilities,
  }
}

export type RecordRow = ReturnType<typeof toRecordRow>

/** `accommodations.gender_policy` as the overview's Boarders tile reads it. */
const GENDER_POLICY_LABEL: Record<string, string> = {
  co_ed: 'Co-ed',
  male: 'Male only',
  female: 'Female only',
}

/**
 * @param rows every accommodation the page has loaded — the record's bullet
 *   graphs compare this one against the accredited ones among them.
 */
export function useAccommodationRecord(rows: Ref<RecordRow[]>) {
  const detailLoading = ref(false)
  const selectedAccommodation = ref<any | null>(null)
  const accommodationEvents = ref<AccommodationEventRow[]>([])
  const drawerExtras = ref<AccommodationDrawerExtras | null>(null)

  function openAccommodation(row: any) {
    selectedAccommodation.value = row
    accommodationEvents.value = []
    drawerExtras.value = null
    void fetchAccommodationDetail(row)
    void loadAccommodationEvents(row.id)
    void loadDrawerExtras(row)
  }

  async function loadDrawerExtras(row: any) {
    try {
      const extras = await fetchAccommodationDrawerExtras(
        row.id,
        (row.rooms ?? []).map((r: any) => r.id),
        (row.facilities ?? []).map((f: any) => f.id),
      )
      // A slow response for a record the reviewer has already left is dropped.
      if (selectedAccommodation.value?.id === row.id) drawerExtras.value = extras
    } catch {
      // Photos, amenities and reviews fill in when they arrive; without them the
      // record still reads, with empty strips and an empty Reviews tab.
    }
  }

  async function loadAccommodationEvents(id: string) {
    try {
      accommodationEvents.value = await fetchAccommodationEvents(id)
    } catch {
      // The audit trail is supporting detail; a failure here hides the Activity
      // tab rather than blocking the drawer.
      accommodationEvents.value = []
    }
  }

  async function fetchAccommodationDetail(row: any) {
    detailLoading.value = true
    try {
      const { data: p, error } = await supabase
        .from('accommodations')
        .select(
          `id, name, status, accreditation_status, accreditation_expires_at, rating_avg,
            address, barangay, city, accommodation_type, total_floors, total_rooms`
        )
        .eq('id', row.id)
        .single()
      if (error) throw error
      // A slow response for a record the reviewer has already left is dropped.
      if (p && selectedAccommodation.value?.id === row.id) {
        const d = p as any
        selectedAccommodation.value = {
          ...row,
          name: d.name ?? row.name,
          status: d.status ?? row.status,
          verified: d.status === 'accredited',
          accreditationStatus: d.accreditation_status ?? row.accreditationStatus,
          accreditationExpiresAt: d.accreditation_expires_at ?? row.accreditationExpiresAt,
          rating: d.rating_avg != null ? d.rating_avg.toFixed(1) : row.rating,
          // composeAddress drops the barangay most street lines already contain.
          address: composeAddress(d) === '—' ? row.address : composeAddress(d),
          type: d.accommodation_type ? humanizeEnum(d.accommodation_type) : row.type,
          floors: d.total_floors ?? row.floors,
          totalRooms: d.total_rooms ?? row.totalRooms,
        }
      }
    } catch {
      // keep the row-based preview already assigned above
    } finally {
      detailLoading.value = false
    }
  }

  /** Occupancy and rating across every accredited accommodation, for the record's bullet graphs. */
  const campusBenchmark = computed(() => {
    const acc = rows.value.filter((a) => a.verified)
    const cap = acc.reduce((n, a) => n + (a.totalCapacity ?? 0), 0)
    const pax = acc.reduce((n, a) => n + Math.min(a.totalStudents ?? 0, a.totalCapacity ?? 0), 0)
    const rated = acc.map((a) => Number(a.rating)).filter((n) => Number.isFinite(n) && n > 0)
    return {
      count: acc.length,
      occupancyPct: cap ? Math.round((pax / cap) * 100) : 0,
      rating: rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null,
    }
  })

  const accommodationPreview = computed<DrawerPreview>(() => {
    const p = selectedAccommodation.value
    if (!p) return { kind: 'accommodation', title: 'Accommodation Preview', name: '', avatar: '', stats: [], detailGroups: [] }
    const chips: PreviewChip[] = [
      { text: humanizeEnum(p.type), tone: 'primary', icon: 'lucide:building-2' },
      p.verified
        ? { text: 'Accredited', tone: 'success', icon: 'lucide:award' }
        : { text: 'Pending', tone: 'warning', icon: 'lucide:clock' },
    ]
    const occupancyPct = p.totalCapacity ? Math.round((p.totalStudents / p.totalCapacity) * 100) : 0
    // Occupants and occupancy are the overview's dial, which states the share and
    // the raw beds in one place; repeating either here would be one fact twice.
    const stats = [
      { label: 'Rooms', value: p.totalRooms },
      { label: 'Rating', value: p.rating != null ? `${p.rating} ★` : '—' },
      { label: 'Response', value: p.responseRate != null ? `${p.responseRate}%` : '—' },
    ]
    const overview: PreviewAccommodationOverview = {
      // '' when the landlord/landlady has uploaded none — see useAccommodations,
      // which deliberately does not substitute a stand-in photograph.
      coverUrl: p.image || '',
      typeLine: p.type,
      roomCount: p.totalRooms ?? 0,
      floors: p.floors ?? 0,
      genderPolicyLabel: GENDER_POLICY_LABEL[p.genderPolicy ?? ''] ?? 'Not set',
      ratingLabel: p.rating && p.rating !== '—' ? String(p.rating) : '—',
      reviewCount: drawerExtras.value?.reviews.length,
      responseLabel: p.responseRate != null ? `${p.responseRate}%` : '—',
      // Legacy chips (wifi, water, electric) stay in the table for old APKs; show only current ones.
      amenities: (drawerExtras.value?.amenities ?? []).filter((a) => a in AMENITY_META),
      hidden: Boolean(p.hiddenFromListings),
      address: p.address,
      accredited: Boolean(p.verified),
      accreditationLabel: p.verified ? 'Accredited' : 'Pending',
      expiryLabel: expiryLabel(p.accreditationExpiresAt),
      accreditedAt: p.accreditedAt ?? null,
      expiresAt: p.accreditationExpiresAt ?? null,
      campus: campusBenchmark.value,
      occupied: Math.min(p.totalStudents, p.totalCapacity),
      capacity: p.totalCapacity,
      occupancyPct,
      female: p.femaleCount,
      male: p.maleCount,
      landlord: {
        id: p.landlordId ?? '',
        name: p.landlord,
        title: landlordTitle(p.landlordSex),
        contact: p.contact,
        initials: p.landlordInitials,
        avatarUrl: p.landlordAvatarUrl || undefined,
      },
    }
    const detailGroups = [
      {
        title: 'Identity',
        icon: 'lucide:building-2',
        rows: [
          { label: 'Type', value: p.type },
          { label: 'Landlord/Landlady', value: p.landlord },
        ],
      },
      {
        title: 'Location',
        icon: 'lucide:map-pin',
        rows: [
          { label: 'Address', value: p.address },
          { label: 'Floors', value: p.floors ? String(p.floors) : '—' },
        ],
      },
      {
        title: 'Capacity',
        icon: 'lucide:bed',
        rows: [
          { label: 'Total Rooms', value: String(p.totalRooms) },
          { label: 'Occupants', value: `${p.totalStudents} / ${p.totalCapacity}` },
          { label: 'Female / Male', value: `${p.femaleCount} / ${p.maleCount}` },
        ],
      },
      {
        title: 'Accreditation',
        icon: 'lucide:award',
        rows: [
          { label: 'Response', value: p.responseRate != null ? `${p.responseRate}%` : '—' },
          { label: 'Expires', value: p.accreditationExpiresAt || '—' },
        ],
      },
    ]
    // Documents regarding the accommodation (permits / certificates with an uploaded file).
    // Each permit already carries its expiry from useAccommodations; the drawer
    // used to build a name and a link and throw the rest away, so a reviewer
    // could see a permit existed but not whether it was still in force.
    const files = (p.permits ?? [])
      .filter((pm: any) => pm.fileUrl)
      .map((pm: any) => {
        const state = PERMIT_STATE[permitStateOf(pm.expiresAt)]
        return {
          name: String(pm.type || 'Document').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          url: pm.fileUrl,
          docId: pm.id,
          docTable: 'accommodation_documents' as const,
          status: state.label,
          statusTone: state.tone,
          expiry: expiryLabel(pm.expiresAt),
          issued: pm.issuedAt ? fmtDate(pm.issuedAt) : '—',
          uploaded: pm.uploadedAt ? fmtDate(pm.uploadedAt) : '—',
          version: pm.version ?? null,
          daysLeft: pm.expiresAt ? Math.ceil((new Date(pm.expiresAt).getTime() - Date.now()) / 86_400_000) : null,
        }
      })
    // Rooms of this accommodation — clickable to jump to Room Hub.
    const rooms = (p.rooms ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      floor: r.floor,
      capacity: r.capacity,
      pax: r.currentPax,
      status: r.status,
      statusTone: getTone(r.status),
      utilities: r.utilities,
      accommodationId: p.id,
      occupants: (r.occupants ?? []).map((o: any) => ({
        id: o.id,
        name: o.name,
        initials: o.initials,
        avatarUrl: o.avatarUrl || '',
        gender: o.gender,
        since: o.since && o.since !== '—' ? o.since : null,
        detail: [o.course, o.year].filter((x: string) => x && x !== '—').join(' · '),
      })),
      photos: drawerExtras.value?.roomPhotos.get(r.id) ?? [],
    }))
    // Until the photos arrive a facility keeps its counted `photoCount`.
    const facilities = (p.facilities ?? []).map((f: any) => {
      const photos = drawerExtras.value?.facilityPhotos.get(f.id)
      return drawerExtras.value ? { ...f, photos: photos ?? [] } : f
    })
    const reviews = (drawerExtras.value?.reviews ?? []).map((r) => ({
      author: r.author,
      room: r.room ?? undefined,
      rating: r.rating,
      comment: r.comment ?? '',
      time: r.createdAt ? formatDateTime(r.createdAt) : '',
    }))
    // Real events from the audit trail. `text` is rendered with v-html by
    // ActivityFeed.vue, so anything spliced in is escaped — see escapeHtml() in
    // utils/format.ts. An empty trail leaves the Activity tab hidden.
    const activity = accommodationEvents.value.map((e) => {
      const changed = e.after_status && e.before_status !== e.after_status
      const meta = { ts: utcMs(e.created_at) ?? 0, logId: e.id, ...(e.actor_name ? { by: e.actor_name } : {}) }
      if (e.action === 'CREATE') {
        return {
          text: `<strong>${escapeHtml(p.name)}</strong> was listed`,
          time: formatDateTime(e.created_at),
          icon: 'lucide:circle-plus',
          tone: 'primary' as StatusTone,
          kind: 'Listing',
          ...meta,
        }
      }
      if (e.action === 'accommodation.hide' || e.action === 'accommodation.unhide') {
        const hidden = e.action === 'accommodation.hide'
        return {
          text: hidden ? 'Hidden from student listings by OSAS' : 'Shown in student listings again',
          time: formatDateTime(e.created_at),
          icon: hidden ? 'lucide:eye-off' : 'lucide:eye',
          tone: (hidden ? 'warning' : 'success') as StatusTone,
          kind: 'Visibility',
          ...meta,
        }
      }
      if (changed) {
        return {
          text: `Status changed to <strong>${escapeHtml(cap(e.after_status || ''))}</strong>`,
          time: formatDateTime(e.created_at),
          icon: 'lucide:arrow-left-right',
          tone: getTone(e.after_status || ''),
          kind: 'Status',
          ...meta,
        }
      }
      return {
        text: 'Listing details updated',
        time: formatDateTime(e.created_at),
        icon: 'lucide:pencil',
        tone: 'neutral' as StatusTone,
        kind: 'Edits',
        ...meta,
      }
    })

    return {
      kind: 'accommodation',
      title: 'Accommodation Preview',
      name: p.name,
      avatar: p.image,
      initials: p.initials,
      chips,
      meta: p.address,
      org: { name: p.landlord, icon: 'lucide:user-round' },
      stats,
      overview,
      detailGroups,
      files,
      rooms,
      facilities,
      activity,
      reviews,
    }
  })

  return {
    selectedAccommodation,
    detailLoading,
    openAccommodation,
    loadAccommodationEvents,
    accommodationPreview,
  }
}
