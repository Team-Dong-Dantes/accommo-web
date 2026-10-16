// Data access for rooms — pure fetchers, no reactive state.

import { supabase } from '@/utils/supabase'

export interface RoomRow {
  capacity: number | null
  current_pax: number | null
  status: string
  monthly_rent: number | null
  accommodation: { name: string; room_type: string } | null
}

export async function fetchRoomRows(): Promise<RoomRow[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('capacity, current_pax, status, monthly_rent, accommodation:accommodations(name, room_type)')
  if (error) throw error
  return (data ?? []) as unknown as RoomRow[]
}

/**
 * The Room Hub table: every room, the current boarders in them, and their
 * posted bills. Only the rooms are required — occupancy and bills read as
 * empty when their queries fail.
 */
export async function fetchRoomHub() {
  const [roomsRes, leasesRes, billsRes] = await Promise.all([
    supabase
      .from('rooms')
      .select(
        'id, label, room_number, room_type, custom_room_type, floor, capacity, current_pax, monthly_rent, rent_basis, status, accommodation_id, water_billing, water_flat_fee, electric_billing, electric_flat_fee, wifi_billing, wifi_flat_fee, room_images ( url, sort_order ), accommodation:accommodation_id ( name, landlord:landlord_id ( full_name ) )',
      )
      .order('room_number', { ascending: true }),
    supabase
      .from('leases')
      .select('id, room_id, student:users!leases_student_id_fkey(full_name, sex)')
      .in('status', ['active', 'leave_requested']),
    // The current boarders' posted bills; the lease join keeps them to this stay.
    supabase
      .from('utility_bills')
      .select('utility, month, amount, due_date, payments ( status ), lease:leases!inner ( room_id, status )')
      .in('lease.status', ['active', 'leave_requested']),
  ])
  if (roomsRes.error) throw roomsRes.error
  return { rooms: roomsRes.data || [], leases: (leasesRes.data || []) as any[], bills: (billsRes.data || []) as any[] }
}

/** One room in full, with its accommodation and that accommodation's landlord/landlady. */
export async function fetchRoomFull(id: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, label, room_number, room_type, custom_room_type, floor, capacity, current_pax, monthly_rent, advance_months, deposit_months, rent_basis, status, accommodation_id, water_billing, water_flat_fee, electric_billing, electric_flat_fee, wifi_billing, wifi_flat_fee, accommodation:accommodation_id ( name, landlord:users_full!accommodations_landlord_id_fkey ( id, full_name, sex, phone, initials, avatar_url ) )')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

/** The room's current stays and who is in each. */
export async function fetchRoomLeases(roomId: string) {
  const { data, error } = await supabase
    .from('leases')
    .select(
      `id, status, start_date,
       student:users!leases_student_id_fkey(id, full_name, initials, sex, avatar_url)`,
    )
    .eq('room_id', roomId)
    .in('status', ['active', 'leave_requested'])
  if (error) throw error
  return data
}

/** Utility bills posted against these leases, newest month first. */
export async function fetchLeaseBills(leaseIds: string[]) {
  const { data, error } = await supabase
    .from('utility_bills')
    .select('id, lease_id, utility, month, amount, due_date, payments ( status )')
    .in('lease_id', leaseIds)
    .order('month', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** The name the landlord/landlady gave a floor, if any. */
export async function fetchFloorLabel(accommodationId: string, floor: number) {
  const { data, error } = await supabase
    .from('accommodation_floors')
    .select('label')
    .eq('accommodation_id', accommodationId)
    .eq('floor_number', floor)
    .maybeSingle()
  if (error) throw error
  return data?.label ?? null
}

export async function fetchRoomPhotos(roomId: string) {
  const { data, error } = await supabase
    .from('room_images')
    .select('id, url, sort_order')
    .eq('room_id', roomId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

/**
 * This room's own facilities — its private bathroom or balcony. The scope
 * filter is belt and braces: accommodation_facilities already constrains a
 * private row to carry a room_id and a shared one not to.
 */
export async function fetchRoomFacilities(roomId: string) {
  const { data, error } = await supabase
    .from('accommodation_facilities')
    .select('id, facility_type, label, description, floor, sort_order')
    .eq('room_id', roomId)
    .eq('access_scope', 'private')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

/** One row per photo, so the caller can count them per facility. */
export async function fetchFacilityImageIds(facilityIds: string[]) {
  const { data, error } = await supabase
    .from('accommodation_facility_images')
    .select('facility_id')
    .in('facility_id', facilityIds)
  if (error) throw error
  return data ?? []
}
