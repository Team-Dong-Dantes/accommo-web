// Data access for accommodation-manager lease payments — pure fetchers, no reactive state.

import { supabase } from '@/utils/supabase'

async function fetchAccommodationManagerPaymentCount(status: 'pending_verification' | 'overdue'): Promise<number> {
  const { count, error } = await supabase
    .from('payments')
    .select('id, lease:leases!inner(accommodation_manager_id)', { count: 'exact', head: true })
    .eq('status', status)
    .not('lease.accommodation_manager_id', 'is', null)
  if (error) throw error
  return count ?? 0
}

export function fetchPendingAccommodationManagerPaymentVerificationCount(): Promise<number> {
  return fetchAccommodationManagerPaymentCount('pending_verification')
}

export function fetchOverdueAccommodationManagerPaymentCount(): Promise<number> {
  return fetchAccommodationManagerPaymentCount('overdue')
}
