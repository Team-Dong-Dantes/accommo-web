/**
 * Icon and label per facility type.
 *
 * A copy of `FACILITY_META` in accommo-mobile/src/utils/listings.ts — the two
 * apps are separate npm projects with no shared package, and a landlord/landlady who
 * files a "Common area" in the mobile app should see it called a common area,
 * with the same icon, when OSAS opens the record here. Keep the two in step.
 *
 * The keys are the values `accommodation_facilities.facility_type` allows; its
 * check constraint is the source of truth for that list.
 */
export const FACILITY_META: Record<string, { icon: string; label: string }> = {
  bathroom: { icon: 'lucide:bath', label: 'Bathroom' },
  kitchen: { icon: 'lucide:cooking-pot', label: 'Kitchen' },
  laundry: { icon: 'lucide:washing-machine', label: 'Laundry area' },
  balcony: { icon: 'lucide:door-open', label: 'Balcony' },
  common_area: { icon: 'lucide:sofa', label: 'Common area' },
  study_area: { icon: 'lucide:book-open', label: 'Study area' },
  // Parking is an amenity now; kept so rows older APKs still create render by name.
  parking: { icon: 'lucide:car', label: 'Parking' },
  aircon: { icon: 'lucide:air-vent', label: 'Air-con' },
  other: { icon: 'lucide:box', label: 'Facility' },
}

/** The landlord/landlady's own label wins; the type's name is the fallback. */
export function facilityLabel(type: string | null | undefined, label?: string | null): string {
  return label?.trim() || FACILITY_META[type ?? 'other']?.label || 'Facility'
}

export function facilityIcon(type: string | null | undefined): string {
  return FACILITY_META[type ?? 'other']?.icon || FACILITY_META.other!.icon
}

/**
 * Amenities are what the whole place has (CCTV, a water dispenser, a
 * generator, a fire extinguisher), as opposed to facilities: shared spaces, or
 * in-room features such as air-con. Water, electricity and Wi-Fi are billing
 * terms on the accommodation now (`<utility>_billing`), not amenities. The database's
 * `accommodation_amenities_utilities_only` constraint holds the same list. Same
 * vocabulary as accommo-mobile's `AMENITY_META`, so both apps name them alike.
 */
export const AMENITY_META: Record<string, { icon: string; label: string }> = {
  cctv: { icon: 'lucide:cctv', label: 'CCTV' },
  water_dispenser: { icon: 'lucide:glass-water', label: 'Water dispenser' },
  generator: { icon: 'lucide:battery-charging', label: 'Generator' },
  fire_extinguisher: { icon: 'lucide:fire-extinguisher', label: 'Fire extinguisher' },
  parking: { icon: 'lucide:square-parking', label: 'Parking' },
}

export function amenityMeta(key: string): { icon: string; label: string } {
  return AMENITY_META[key] ?? { icon: 'lucide:check', label: key }
}

/**
 * How a room's water, electricity and Wi-Fi are paid, in one line for OSAS:
 * "Water included · Electricity own meter · Wi-Fi none". Per room since one
 * house can bill its rooms differently. Same vocabulary as accommo-mobile's
 * UTILITY_BILLING_LABEL. Empty when the room has none set yet.
 */
const BILLING_SHORT: Record<string, string> = {
  included: 'included',
  own_meter: 'own meter',
  split: 'split among tenants',
  flat_fee: 'flat fee',
  not_available: 'none',
}

export interface RoomUtilityColumns {
  water_billing?: string | null
  water_flat_fee?: number | null
  electric_billing?: string | null
  electric_flat_fee?: number | null
  wifi_billing?: string | null
  wifi_flat_fee?: number | null
}

export function roomUtilitiesSummary(r: RoomUtilityColumns): string {
  const parts: string[] = []
  for (const [label, billing, fee] of [
    ['Water', r.water_billing, r.water_flat_fee],
    ['Electricity', r.electric_billing, r.electric_flat_fee],
    ['Wi-Fi', r.wifi_billing, r.wifi_flat_fee],
  ] as const) {
    if (!billing) continue
    const how = BILLING_SHORT[billing] ?? billing
    parts.push(billing === 'flat_fee' && fee ? `${label} ₱${Number(fee).toLocaleString('en-PH')}/mo` : `${label} ${how}`)
  }
  return parts.join(' · ')
}

/** Water, electricity and Wi-Fi, keyed as in `utility_bills.utility`. */
export const UTILITIES = [
  { key: 'water', label: 'Water', icon: 'lucide:droplets' },
  { key: 'electric', label: 'Electricity', icon: 'lucide:zap' },
  { key: 'wifi', label: 'Wi-Fi', icon: 'lucide:wifi' },
] as const
export type UtilityKey = (typeof UTILITIES)[number]['key']

/** Same wording as accommo-mobile's UTILITY_BILLING_LABEL. */
export const UTILITY_BILLING_LABEL: Record<string, string> = {
  included: 'Included in rent',
  own_meter: 'Own meter',
  split: 'Split among tenants',
  flat_fee: 'Flat fee',
  not_available: 'Not available',
}

/** A posted utility bill; `paid` = a payment against it is paid or awaiting verification. */
export interface PostedBill {
  month: string
  amount: number
  dueDate: string
  paid: boolean
}

export interface UtilityStatus {
  /** How it is paid: "Own meter", "₱300 / mo". */
  terms: string
  /** Where this month's bill stands, for own meter and split only. */
  bill: string
  tone: 'muted' | 'ok' | 'warn' | 'bad'
}

const shortPeso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
const monthName = (iso: string) => new Date(`${iso.slice(0, 7)}-01T00:00:00`).toLocaleString('en-US', { month: 'short' })
const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleString('en-US', { month: 'short', day: 'numeric' })

/** Today in Manila as YYYY-MM-DD, the clock bills are due by. */
export const manilaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

/**
 * One utility of one room, for the Room Hub: its terms, and — when it is billed
 * monthly (own meter, split) — whether this month's bill is still awaited from
 * the landlord/landlady, unpaid, overdue, or paid. `bills` are the current
 * boarders' posted bills for this utility. Nothing says when a bill should
 * arrive, so "awaiting" never turns into a warning.
 */
export function utilityStatus(billing: string | null | undefined, flatFee: number | null | undefined, boarders: number, bills: PostedBill[], today: string): UtilityStatus {
  if (!billing) return { terms: '—', bill: 'Not specified', tone: 'muted' }
  if (billing === 'flat_fee') return { terms: flatFee ? `${shortPeso(flatFee)} / mo` : 'Flat fee', bill: 'flat fee', tone: 'muted' }
  if (billing !== 'own_meter' && billing !== 'split') return { terms: UTILITY_BILLING_LABEL[billing] ?? billing, bill: '', tone: 'muted' }

  const terms = billing === 'own_meter' ? 'Own meter' : 'Split'
  const unpaid = bills.filter((b) => !b.paid)
  if (unpaid.length) {
    const total = unpaid.reduce((s, b) => s + b.amount, 0)
    const due = unpaid.map((b) => b.dueDate).sort()[0]!
    if (due < today) return { terms, bill: `${shortPeso(total)} overdue`, tone: 'bad' }
    return { terms, bill: `${shortPeso(total)} · ${unpaid.length} unpaid · due ${shortDate(due)}`, tone: 'warn' }
  }
  const thisMonth = today.slice(0, 7)
  if (bills.some((b) => b.month.slice(0, 7) === thisMonth)) return { terms, bill: `${monthName(today)} paid`, tone: 'ok' }
  if (!boarders) return { terms, bill: 'No boarders to bill', tone: 'muted' }
  return { terms, bill: `Awaiting ${monthName(today)} bill`, tone: 'muted' }
}
