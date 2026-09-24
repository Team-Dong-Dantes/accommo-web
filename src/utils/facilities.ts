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
 * Amenities are utilities and services that come with the whole place (Wi-Fi,
 * water, electricity, CCTV), as opposed to facilities: shared spaces, or
 * in-room features such as air-con. The database's
 * `accommodation_amenities_utilities_only` constraint holds the same list. Same
 * vocabulary as accommo-mobile's `AMENITY_META`, so both apps name them alike.
 */
export const AMENITY_META: Record<string, { icon: string; label: string }> = {
  wifi: { icon: 'lucide:wifi', label: 'Wi-Fi' },
  water: { icon: 'lucide:droplets', label: 'Water' },
  electric: { icon: 'lucide:zap', label: 'Electricity' },
  cctv: { icon: 'lucide:cctv', label: 'CCTV' },
}

export function amenityMeta(key: string): { icon: string; label: string } {
  return AMENITY_META[key] ?? { icon: 'lucide:check', label: key }
}
