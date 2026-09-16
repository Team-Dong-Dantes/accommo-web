// Data access for accommodations — pure fetchers, no reactive state.
// Query shapes lifted verbatim from the former useDashboardStats.load().

import { supabase } from '@/utils/supabase'

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
    .eq('entity_type', 'accommodations')
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

/** What the manager filled in alongside the property, beyond its own columns. */
export interface AccommodationExtras {
  amenities: string[]
  policies: {
    curfew_time: string | null
    quiet_hours: string | null
    visitor_policy: string | null
    cooking: boolean | null
    laundry: boolean | null
    pets: boolean | null
    smoking: boolean | null
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
      .select('curfew_time, quiet_hours, visitor_policy, cooking, laundry, pets, smoking')
      .eq('accommodation_id', accommodationId)
      .maybeSingle(),
  ])
  return {
    amenities: (amenityRes.data ?? []).map((row) => String((row as { amenity: string }).amenity)),
    policies: (policyRes.data ?? null) as AccommodationExtras['policies'],
  }
}
