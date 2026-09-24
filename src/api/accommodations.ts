// Data access for accommodations — pure fetchers, no reactive state.
// Query shapes lifted verbatim from the former useDashboardStats.load().

import { supabase } from '@/utils/supabase'
import { resolveAsset } from '@/utils/cloudinaryUrl'

export interface AccommodationRow {
  id: string
  status: string
  capacity: number | null
  total_rooms: number | null
  room_type: string
  name: string
}

export interface AccommodationExpiryRow {
  id: string
  accreditation_expires_at: string | null
}

export async function fetchAccommodationRows(): Promise<AccommodationRow[]> {
  const { data, error } = await supabase
    .from('accommodations')
    .select('id, status, capacity, total_rooms, room_type, name')
  if (error) throw error
  return (data ?? []) as unknown as AccommodationRow[]
}


export async function fetchExpiringAccommodationAccreditations(
  nowIso: string,
  thirtyDaysIso: string,
): Promise<AccommodationExpiryRow[]> {
  const { data, error } = await supabase
    .from('accommodations')
    .select('id, accreditation_expires_at')
    .gte('accreditation_expires_at', nowIso)
    .lte('accreditation_expires_at', thirtyDaysIso)
  if (error) throw error
  return (data ?? []) as unknown as AccommodationExpiryRow[]
}

// --- admin home: accreditation queue ----------------------------------------

export interface PendingAccommodationRow {
  id: string
  name: string | null
  room_type: string | null
}

/** Accommodations awaiting accreditation. */
export async function fetchPendingAccommodations(): Promise<PendingAccommodationRow[]> {
  const { data, error } = await supabase
    .from('accommodations')
    .select('id, name, room_type')
    .eq('status', 'pending')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PendingAccommodationRow[]
}

/** One audit-trail entry for an accommodation. */
export interface AccommodationEventRow {
  action: string
  created_at: string
  before_status: string | null
  after_status: string | null
}

/**
 * What has actually happened to an accommodation, from `audit_logs`. The drawer
 * used to build its "activity" by listing the accommodation's first five rooms
 * with a capacity string in the timestamp slot — not events, and not times.
 */
export async function fetchAccommodationEvents(
  accommodationId: string,
  limit = 8,
): Promise<AccommodationEventRow[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, created_at, before_json, after_json')
    // PropertyHub's own actions have always logged `accommodation` (singular)
    // while other writers use the table name, so reading only one spelling left
    // every suspend and restore out of the Activity tab.
    .in('entity_type', ['accommodations', 'accommodation'])
    .eq('entity_id', accommodationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  const rows = (data ?? []) as Array<{
    action: string
    created_at: string
    before_json: { status?: string } | null
    after_json: { status?: string } | null
  }>
  return rows.map((r) => ({
    action: r.action,
    created_at: r.created_at,
    before_status: r.before_json?.status ?? null,
    after_status: r.after_json?.status ?? null,
  }))
}

/** accommodation_id → permit doc types uploaded, for the whole pipeline. */
export async function fetchAccommodationDocumentIndex(): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from('accommodation_documents')
    .select('accommodation_id, doc_type')
  if (error) throw error
  const rows = (data ?? []) as Array<{ accommodation_id: string | null; doc_type: string }>
  const map = new Map<string, string[]>()
  for (const r of rows) {
    if (!r.accommodation_id) continue
    map.set(r.accommodation_id, [...(map.get(r.accommodation_id) ?? []), r.doc_type])
  }
  return map
}

/** A property as it appears on a map: just enough to place and name a marker. */
export interface AccommodationPin {
  id: string
  name: string
  lat: number
  lng: number
  status: string
}

/**
 * Every pinned property, whatever its status. A reviewer checking a new
 * accreditation for a duplicate submission or a misplaced pin needs to see the
 * accredited neighbours *and* the pending, rejected and delisted ones — each is
 * a different thing to know about the address being claimed.
 */
export async function fetchAccommodationPins(): Promise<AccommodationPin[]> {
  const { data, error } = await supabase
    .from('accommodations')
    .select('id, name, lat, lng, status')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
  if (error) throw error
  return (data ?? []) as unknown as AccommodationPin[]
}

/** What the landlord/landlady filled in alongside the property, beyond its own columns. */
export interface AccommodationExtras {
  amenities: string[]
  policies: {
    curfew_time: string | null
    quiet_hours: string | null
    visitor_policy: string | null
    cooking: boolean | null
    laundry: boolean | null
    pets: boolean | null
  } | null
}

/**
 * The amenities and house rules submitted with an accreditation request. Loaded
 * when the review window opens rather than with the queue: two extra queries per
 * property is worth paying once for the one being read, not twenty-three times
 * for a list nobody has opened.
 */
export async function fetchAccommodationExtras(accommodationId: string): Promise<AccommodationExtras> {
  const [amenityRes, policyRes] = await Promise.all([
    supabase.from('accommodation_amenities').select('amenity').eq('accommodation_id', accommodationId),
    supabase
      .from('accommodation_policies')
      .select('curfew_time, quiet_hours, visitor_policy, cooking, laundry, pets')
      .eq('accommodation_id', accommodationId)
      .maybeSingle(),
  ])
  return {
    amenities: (amenityRes.data ?? []).map((row) => String((row as { amenity: string }).amenity)),
    policies: (policyRes.data ?? null) as AccommodationExtras['policies'],
  }
}

/** One review of an accommodation, with its author resolved. */
export interface AccommodationReviewRow {
  author: string
  /** The room named on the reviewer's lease, when there is one. */
  room: string | null
  rating: number
  comment: string | null
  createdAt: string | null
}

/** What the accommodation record loads on open, beyond the hub's list query. */
export interface AccommodationDrawerExtras {
  amenities: string[]
  /** room id → photo URLs, in the landlord/landlady's own order. */
  roomPhotos: Map<string, string[]>
  /** facility id → photo URLs. */
  facilityPhotos: Map<string, string[]>
  reviews: AccommodationReviewRow[]
}

/**
 * Photos, amenities and reviews for the one accommodation being read. Fetched
 * when its record opens, like its audit trail, so the hub's list query does not
 * pull every room's gallery for properties nobody opens. Reviews come through
 * `review_admin_feed`, the one place a review keeps its author for OSAS.
 */
export async function fetchAccommodationDrawerExtras(
  accommodationId: string,
  roomIds: string[],
  facilityIds: string[],
): Promise<AccommodationDrawerExtras> {
  const [extras, roomRes, facilityRes, reviewRes] = await Promise.all([
    fetchAccommodationExtras(accommodationId),
    roomIds.length
      ? supabase.from('room_images').select('room_id, url, sort_order').in('room_id', roomIds)
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] as Array<{ room_id: string; url: string }> }),
    facilityIds.length
      ? supabase.from('accommodation_facility_images').select('facility_id, url, sort_order').in('facility_id', facilityIds)
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] as Array<{ facility_id: string; url: string }> }),
    supabase
      .from('review_admin_feed')
      .select('rating, comment, created_at, author_id, lease_id')
      .eq('kind', 'accommodation')
      .eq('subject_id', accommodationId)
      .order('created_at', { ascending: false }),
  ])

  const group = (rows: Array<{ url: string }>, key: (r: any) => string) => {
    const map = new Map<string, string[]>()
    for (const r of rows) {
      if (!r.url) continue
      const k = key(r)
      map.set(k, [...(map.get(k) ?? []), resolveAsset(r.url)])
    }
    return map
  }

  const reviewRows = (reviewRes.data ?? []) as Array<{
    rating: number | null
    comment: string | null
    created_at: string | null
    author_id: string | null
    lease_id: string | null
  }>
  const authorIds = [...new Set(reviewRows.map((r) => r.author_id).filter((id): id is string => !!id))]
  const nameById = new Map<string, string>()
  if (authorIds.length) {
    const { data } = await supabase.from('users').select('id, full_name').in('id', authorIds)
    for (const a of (data ?? []) as Array<{ id: string; full_name: string | null }>) {
      nameById.set(a.id, a.full_name || '')
    }
  }

  const leaseIds = [...new Set(reviewRows.map((r) => r.lease_id).filter((id): id is string => !!id))]
  const roomByLease = new Map<string, string>()
  if (leaseIds.length) {
    const { data } = await supabase.from('leases').select('id, room:rooms(room_number, label)').in('id', leaseIds)
    for (const l of (data ?? []) as Array<{ id: string; room: { room_number: string | null; label: string | null } | null }>) {
      const name = l.room?.room_number || l.room?.label
      if (name) roomByLease.set(l.id, name)
    }
  }

  return {
    amenities: extras.amenities,
    roomPhotos: group((roomRes.data ?? []) as Array<{ room_id: string; url: string }>, (r) => r.room_id),
    facilityPhotos: group((facilityRes.data ?? []) as Array<{ facility_id: string; url: string }>, (r) => r.facility_id),
    reviews: reviewRows.map((r) => ({
      author: (r.author_id && nameById.get(r.author_id)) || 'A former boarder',
      room: (r.lease_id && roomByLease.get(r.lease_id)) || null,
      rating: r.rating ?? 0,
      comment: r.comment,
      createdAt: r.created_at,
    })),
  }
}
