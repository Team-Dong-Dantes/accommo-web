// A student's stays and payments as the user record's Payments tab reads them.
import type { StatusTone } from '@/utils/status.config'
import { cap, fmtDate, peso } from '@/utils/format'
import type { PreviewLease, PreviewPayment } from '@/features/drawer/preview'

export function periodLabel(start: string | null, end: string | null) {
  const s = fmtDate(start)
  return end ? `${s} – ${fmtDate(end)}` : `${s} – Present`
}

function leaseStatusTone(status: string): StatusTone {
  switch (status) {
    case 'active': return 'success'
    case 'terminated': return 'danger'
    case 'leave_requested': return 'warning'
    default: return 'neutral'
  }
}

function paymentStatusTone(status: string): StatusTone {
  switch (status) {
    case 'paid':
    case 'waived': return 'success'
    case 'overdue': return 'danger'
    case 'due':
    case 'pending_verification': return 'warning'
    default: return 'neutral'
  }
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'gcash': return 'GCash'
    case 'maya': return 'Maya'
    case 'bank': return 'Bank Transfer'
    case 'cash': return 'Cash'
    case 'others': return 'Other'
    case 'deposit': return 'Paid from deposit'
    default: return cap(method) || '—'
  }
}

function fmtCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return peso(amount)
}

export function fmtMonth(month: string): string {
  if (!month) return '—'
  const [year, m] = month.split('-')
  if (!year || !m) return month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const mi = parseInt(m, 10) - 1
  if (mi < 0 || mi > 11) return month
  return `${months[mi]} ${year}`
}

export function leaseRowsOf(leases: any[] | undefined): PreviewLease[] {
  return (leases || []).map((l: any) => {
    const acc = l.room?.accommodation
    return {
      id: l.id,
      accommodationId: acc?.id ?? '',
      accommodationName: acc?.name || l.accommodationName || '—',
      landlordName: l.landlord?.full_name,
      roomName: l.room?.room_number ?? l.room?.label,
      roomType: acc?.room_type,
      startDate: l.start_date,
      endDate: l.end_date,
      status: l.status,
      statusTone: leaseStatusTone(l.status),
      statusLabel: cap(l.status),
      // Room rent is the source of truth; the lease-level rent may be unset.
      monthlyRent: l.monthly_rent ?? l.room?.monthly_rent ?? null,
      periodLabel: periodLabel(l.start_date, l.end_date),
    }
  })
}

export function paymentRowsOf(payments: any[] | undefined, leaseById: Map<string, PreviewLease>): PreviewPayment[] {
  return (payments || []).map((p: any) => {
    const lease = leaseById.get(p.lease_id)
    const row: PreviewPayment = {
      id: p.id,
      leaseId: p.lease_id,
      accommodationId: lease?.accommodationId ?? '',
      month: p.month,
      monthLabel: fmtMonth(p.month),
      amount: p.amount,
      amountLabel: fmtCurrency(p.amount),
      status: p.status,
      statusTone: paymentStatusTone(p.status),
      statusLabel: p.status === 'waived' ? 'Forgiven' : p.status === 'pending_verification' ? 'Pending' : cap(p.status),
      paidAt: p.paid_at,
      method: p.method,
      methodLabel: paymentMethodLabel(p.method),
      proofUrl: p.proof_url,
      txnReference: p.txn_reference,
      description: p.description,
    }
    if (p.paid_at) row.paidAtLabel = fmtDate(p.paid_at)
    return row
  })
}
