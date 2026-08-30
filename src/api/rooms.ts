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
