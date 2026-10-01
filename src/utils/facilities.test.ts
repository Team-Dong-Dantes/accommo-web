import { describe, expect, it } from 'vitest'
import { roomUtilitiesSummary } from './facilities'

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
