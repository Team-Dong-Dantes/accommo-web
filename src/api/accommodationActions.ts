// OSAS's own changes to an accommodation's standing — pure fetchers, no
// reactive state.

import { supabase } from '@/utils/supabase'

/**
 * Take an accredited property out of what students browse, or put it back.
 * Only an admin can flip the flag; a trigger on `accommodations` enforces that.
 */
export async function setAccommodationHidden(id: string, hidden: boolean): Promise<void> {
  const { error } = await supabase
    .from('accommodations')
    .update({ hidden_from_listings: hidden } as never)
    .eq('id', id)
  if (error) throw error
}

/**
 * status_note travels with the change so the landlord/landlady's notice
 * carries the reason (tg_accreditation_status_change); a restore clears it.
 */
export async function setAccommodationStatus(id: string, status: string, note: string | null): Promise<void> {
  const { error } = await supabase
    .from('accommodations')
    .update({ status, status_note: note } as never)
    .eq('id', id)
  if (error) throw error
}

/** Students on an active or leave-requested lease in any of its rooms; 0 when the count fails. */
export async function countCurrentBoarders(accommodationId: string): Promise<number> {
  const { count } = await supabase
    .from('leases')
    .select('id, rooms!inner(accommodation_id)', { count: 'exact', head: true })
    .eq('rooms.accommodation_id', accommodationId)
    .in('status', ['active', 'leave_requested'])
  return count ?? 0
}
