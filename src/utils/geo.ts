// Campus location and distance maths. Mirrors accommo-mobile/src/utils/geo.ts
// so both apps agree on where the campus is — the web side previously carried
// its own literal, hardcoded in two map files as [121.720, 16.710] and labelled
// "ISU Echague", which is about 4 km east-south-east of the actual gate. The
// admin map centred on it and opened on empty ground.

/** Isabela State University — Echague campus gate. */
export const CAMPUS = { lat: 16.721560301578872, lng: 121.68526268921849, label: 'ISU Echague' }

const EARTH_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance in kilometres. */
export function kmBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h))
}
