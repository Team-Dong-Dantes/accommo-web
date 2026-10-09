// Data access for landlord/landlady lease payments — pure fetchers, no reactive state.

import { supabase } from '@/utils/supabase'

// Overdue is not a payment status any more: a month nobody paid has no row at
// all (record_payments, 20261006080000). It lives in lease_ledger().
async function fetchLandlordPaymentCount(status: 'pending_verification'): Promise<number> {
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
