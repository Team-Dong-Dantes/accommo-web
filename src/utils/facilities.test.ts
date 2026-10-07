import { describe, expect, it } from 'vitest'
import { roomUtilitiesSummary, utilityStatus } from './facilities'

describe('roomUtilitiesSummary', () => {
  it('lists each utility the room has set', () => {
    expect(
      roomUtilitiesSummary({ water_billing: 'included', electric_billing: 'own_meter', wifi_billing: 'not_available' }),
    ).toBe('Water included · Electricity own meter · Wi-Fi none')
  })

  it('shows a flat fee with its amount', () => {
    expect(roomUtilitiesSummary({ wifi_billing: 'flat_fee', wifi_flat_fee: 300 })).toBe('Wi-Fi ₱300/mo')
  })

  it('is empty for a room with nothing set', () => {
    expect(roomUtilitiesSummary({})).toBe('')
  })
})

describe('utilityStatus', () => {
  const T = '2026-10-07'
  const bill = (paid: boolean, dueDate = '2026-10-14', month = '2026-10-01') => ({ month, amount: 620, dueDate, paid })

  it('shows terms alone for included and flat fee', () => {
    expect(utilityStatus('included', null, 2, [], T)).toMatchObject({ terms: 'Included in rent', bill: '' })
    expect(utilityStatus('flat_fee', 300, 2, [], T).terms).toBe('₱300 / mo')
  })

  it('awaits the bill until the landlord/landlady posts it', () => {
    expect(utilityStatus('own_meter', null, 2, [], T)).toMatchObject({ bill: 'Awaiting Oct bill', tone: 'muted' })
    expect(utilityStatus('split', null, 0, [], T).bill).toBe('No boarders to bill')
  })

  it('totals unpaid bills, and flags them once past due', () => {
    expect(utilityStatus('split', null, 2, [bill(false), bill(false)], T)).toMatchObject({ bill: '₱1,240 · 2 unpaid · due Oct 14', tone: 'warn' })
    expect(utilityStatus('split', null, 2, [bill(false, '2026-10-01', '2026-09-01')], T)).toMatchObject({ bill: '₱620 overdue', tone: 'bad' })
  })

  it('is paid when this month is posted and settled', () => {
    expect(utilityStatus('own_meter', null, 1, [bill(true)], T)).toMatchObject({ bill: 'Oct paid', tone: 'ok' })
  })
})
