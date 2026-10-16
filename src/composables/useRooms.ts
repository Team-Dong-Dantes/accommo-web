// The Room Hub's table: every room with its accommodation, boarders and
// utility standing, mapped to one row each. One instance per page.
import { ref } from 'vue'
import { fetchRoomHub } from '@/api/rooms'
import { resolveAsset } from '@/utils/cloudinaryUrl'
import { cap } from '@/utils/format'
import { manilaToday, UTILITIES, utilityStatus } from '@/utils/facilities'
import type { PostedBill, UtilityKey, UtilityStatus } from '@/utils/facilities'

/** A room row as the rooms query returns it, before mapping to a table row. */
export interface RoomQueryRow {
  id: string
  label: string | null
  room_number: string | null
  room_type: string | null
  custom_room_type: string | null
  floor: number | null
  capacity: number | null
  current_pax: number | null
  monthly_rent: number | null
  rent_basis: string | null
  status: string | null
  accommodation_id: string | null
  water_billing: string | null
  water_flat_fee: number | null
  electric_billing: string | null
  electric_flat_fee: number | null
  wifi_billing: string | null
  wifi_flat_fee: number | null
  accommodation?: unknown
  room_images?: { url: string | null; sort_order: number | null }[]
}

/** One row of the Room Hub table; `_raw` is the query row the drawer reopens. */
export interface RoomTableRow {
  id: string
  name: string
  image: string
  type: string
  accommodation: string
  accommodationId: string | null
  landlord: string
  occupantNames: string[]
  floor: number | null
  capacity: number | null
  occupants: number
  maleCount: number
  femaleCount: number
  rent: number | null
  perBoarder: boolean
  status: string | null
  utilities: Record<UtilityKey, UtilityStatus>
  // Filter buckets derived from the fields above.
  vacancy: 'empty' | 'partial' | 'full'
  floorKey: string
  rentBand: string
  rentBasis: 'boarder' | 'room'
  _raw: RoomQueryRow
}

export function roomTypeName(r: RoomQueryRow): string {
  return r.custom_room_type || (r.room_type ? cap(String(r.room_type).replace('_', ' ')) : '')
}
// Number/label tells two rooms of the same type apart; the type is the fallback.
export function roomName(r: RoomQueryRow): string {
  return r.label || (r.room_number ? `Room ${r.room_number}` : roomTypeName(r) || 'Room')
}

/** A payment against a bill settles it once it is paid or awaiting verification — the rule mobile uses. */
export const settles = (payments: { status: string }[] | null) => (payments ?? []).some((p) => p.status === 'paid' || p.status === 'pending_verification')

export function useRooms() {
  const loading = ref(true)
  const rooms = ref<RoomTableRow[]>([])

  async function fetchRooms() {
    loading.value = true
    try {
      let hub: Awaited<ReturnType<typeof fetchRoomHub>>
      try {
        hub = await fetchRoomHub()
      } catch (error) {
        console.error('Error fetching rooms:', (error as Error).message)
        return
      }
      const { rooms: data, leases, bills } = hub
      const occMap = new Map<string, { name: string; sex: string }[]>()
      for (const l of leases) {
        const student = Array.isArray(l.student) ? l.student[0] : l.student
        if (student && l.room_id) {
          if (!occMap.has(l.room_id)) occMap.set(l.room_id, [])
          // users.sex is M/F; older rows spelled it out.
          occMap.get(l.room_id)!.push({ name: student.full_name ?? '', sex: String(student.sex ?? '').charAt(0).toUpperCase() })
        }
      }
      const billMap = new Map<string, PostedBill[]>() // `${room_id}:${utility}`
      for (const b of bills) {
        const lease = Array.isArray(b.lease) ? b.lease[0] : b.lease
        if (!lease?.room_id) continue
        const k = `${lease.room_id}:${b.utility}`
        if (!billMap.has(k)) billMap.set(k, [])
        billMap.get(k)!.push({ month: b.month, amount: Number(b.amount), dueDate: b.due_date, paid: settles(b.payments) })
      }
      const today = manilaToday()
      rooms.value = (data || []).map((r: RoomQueryRow) => {
        const accommodation = Array.isArray(r.accommodation) ? r.accommodation[0] : r.accommodation
        const accommodationName = accommodation?.name || '—'
        const manager = Array.isArray(accommodation?.landlord) ? accommodation.landlord[0] : accommodation?.landlord
        const landlordName = manager?.full_name || ''
        const occ = occMap.get(r.id) || []
        // Same rule as the mobile listings: a one-person room is always whole-room.
        const perBoarder = r.rent_basis === 'person' && (r.capacity ?? 0) > 1
        const name = roomName(r)
        const cover = [...(r.room_images ?? [])]
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .find((im) => im.url)?.url
        return {
          id: r.id,
          name,
          image: resolveAsset(cover),
          type: roomTypeName(r) || 'Room',
          accommodation: accommodationName,
          accommodationId: r.accommodation_id,
          landlord: landlordName,
          occupantNames: occ.map((o) => o.name).filter(Boolean),
          floor: r.floor,
          capacity: r.capacity,
          occupants: occ.length,
          maleCount: occ.filter((o) => o.sex === 'M').length,
          femaleCount: occ.filter((o) => o.sex === 'F').length,
          rent: r.monthly_rent,
          perBoarder,
          status: r.status,
          utilities: Object.fromEntries(UTILITIES.map((u) => [
            u.key,
            utilityStatus(r[`${u.key}_billing`], r[`${u.key}_flat_fee`], occ.length, billMap.get(`${r.id}:${u.key}`) ?? [], today),
          ])) as Record<UtilityKey, UtilityStatus>,
          vacancy: occ.length === 0 ? 'empty' : occ.length >= (r.capacity ?? 0) ? 'full' : 'partial',
          floorKey: r.floor != null ? String(r.floor) : '',
          rentBand: r.monthly_rent == null ? '' : r.monthly_rent < 2000 ? 'low' : r.monthly_rent < 3000 ? 'mid' : 'high',
          rentBasis: perBoarder ? 'boarder' : 'room',
          _raw: r,
        }
      })
      // Rooms of one accommodation sit together, in room-number order.
      rooms.value.sort((a, b) =>
        a.accommodation.localeCompare(b.accommodation) ||
        a.name.localeCompare(b.name, undefined, { numeric: true }))
    } finally {
      loading.value = false
    }
  }

  return { loading, rooms, fetchRooms }
}
