// Data access for landlord/landlady lease payments — pure fetchers, no reactive state.

import { supabase } from '@/utils/supabase'

async function fetchLandlordPaymentCount(status: 'pending_verification' | 'overdue'): Promise<number> {
  const { count, error } = await supabase
    .from('payments')
    .select('id, lease:leases!inner(landlord_id)', { count: 'exact', head: true })
    .eq('status', status)
    .not('lease.landlord_id', 'is', null)
  if (error) throw error
  return count ?? 0
}

export function fetchPendingLandlordPaymentVerificationCount(): Promise<number> {
  return fetchLandlordPaymentCount('pending_verification')
}

export function fetchOverdueLandlordPaymentCount(): Promise<number> {
  return fetchLandlordPaymentCount('overdue')
}
