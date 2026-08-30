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

export async function fetchPendingAccommodationIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('accommodations')
    .select('id')
    .in('status', ['pending', 'reviewing'])
  if (error) throw error
  return ((data ?? []) as Array<{ id: string }>).map((r) => r.id)
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
