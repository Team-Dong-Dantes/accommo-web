// The Room Hub's room record: the room a row opens, the detail fetches that
// fill it in one after another, and the DrawerPreview RoomRecord reads.
import { ref, computed } from 'vue'
import type { DrawerPreview } from '@/components/ui/DetailDrawer.vue'
import {
  fetchFacilityImageIds,
  fetchFloorLabel,
  fetchLeaseBills,
  fetchRoomFull,
  fetchRoomFacilities,
  fetchRoomLeases,
  fetchRoomPhotos,
} from '@/api/rooms'
import { getTone } from '@/utils/status.config'
import { avatarUrl, getInitialsWide as initialsOf, humanizeEnum, landlordTitle, roomStatusLabel } from '@/utils/format'
import { facilityIcon, facilityLabel, manilaToday, UTILITIES, UTILITY_BILLING_LABEL, utilityStatus } from '@/utils/facilities'
import type { PostedBill } from '@/utils/facilities'
import { roomName, roomTypeName, settles, type RoomTableRow } from '@/composables/useRooms'

export function useRoomRecord() {
  const drawerOpen = ref(false)
  const detailLoading = ref(false)
  const selectedRoom = ref<any | null>(null)
  function openRoom(r: RoomTableRow) {
    const raw = r._raw
    selectedRoom.value = raw
    drawerOpen.value = true
    void fetchRoomDetail(raw)
  }

  async function fetchRoomDetail(raw: any) {
    detailLoading.value = true
    try {
      const room = await fetchRoomFull(raw.id)
      if (room) {
        const accommodation = Array.isArray(room.accommodation) ? room.accommodation[0] : room.accommodation
        const accommodationName = accommodation?.name || (typeof raw.accommodation === 'string' ? raw.accommodation : raw.accommodation?.name) || '—'
        const manager = Array.isArray(accommodation?.landlord) ? accommodation.landlord[0] : accommodation?.landlord
        const landlordName = manager?.full_name || null
        selectedRoom.value = { ...raw, ...room, accommodation: accommodationName, landlord: landlordName, landlordInfo: manager ?? null }
      }

      const leases = await fetchRoomLeases(raw.id).catch(() => null)
      if (leases) {
        const occ = leases.map((l) => {
          const student = Array.isArray(l.student) ? l.student[0] : l.student
          const name = student?.full_name || 'Unknown'
          const initials = student?.initials || initialsOf(name)
          // The student's own id, so the record can open their profile; users.sex
          // is stored as M/F, which the drawer reads as male/female.
          const sex = String(student?.sex ?? '').toUpperCase()
          return {
            id: student?.id || l.id,
            name,
            initials,
            avatarUrl: student?.avatar_url || '',
            gender: sex === 'F' ? 'female' : sex === 'M' ? 'male' : null,
            since: l.start_date || null,
            status: l.status,
            statusTone: getTone(l.status),
          }
        })
        selectedRoom.value = { ...selectedRoom.value, occupants: occ }

        // Their posted utility bills, with whose each one is.
        const boarderByLease = new Map(leases.map((l) => {
          const student = Array.isArray(l.student) ? l.student[0] : l.student
          return [l.id, student?.full_name || 'Unknown']
        }))
        const bills = boarderByLease.size ? await fetchLeaseBills([...boarderByLease.keys()]).catch(() => []) : []
        const today = manilaToday()
        selectedRoom.value = {
          ...selectedRoom.value,
          bills: bills.map((b) => ({
            id: b.id,
            utility: b.utility,
            month: b.month,
            amount: Number(b.amount),
            dueDate: b.due_date,
            paid: settles(b.payments),
            boarder: boarderByLease.get(b.lease_id) ?? 'Unknown',
            state: settles(b.payments) ? 'paid' : b.due_date < today ? 'overdue' : 'unpaid',
          })),
        }
      }

      if (room?.floor != null && room.accommodation_id) {
        const floorName = await fetchFloorLabel(room.accommodation_id, room.floor).catch(() => null)
        selectedRoom.value = { ...selectedRoom.value, floorName }
      }

      const photos = await fetchRoomPhotos(raw.id).catch(() => null)
      if (photos) {
        const imgs = photos
          .filter((p) => p.url)
          .map((p) => ({ id: p.id, url: p.url }))
        selectedRoom.value = { ...selectedRoom.value, photos: imgs }
      }

      const facilities = await fetchRoomFacilities(raw.id).catch(() => null)
      if (facilities) {
        const facilityIds = facilities.map((f) => f.id)
        const countById = new Map<string, number>()
        if (facilityIds.length) {
          const facImgs = await fetchFacilityImageIds(facilityIds).catch(() => [])
          for (const fi of facImgs) {
            countById.set(fi.facility_id, (countById.get(fi.facility_id) ?? 0) + 1)
          }
        }
        selectedRoom.value = {
          ...selectedRoom.value,
          facilities: facilities.map((f) => ({
            id: f.id,
            type: f.facility_type ?? 'other',
            label: facilityLabel(f.facility_type, f.label),
            icon: facilityIcon(f.facility_type),
            description: f.description ?? '',
            floor: f.floor ?? null,
            photoCount: countById.get(f.id) ?? 0,
          })),
        }
      }
    } catch {
      // keep the raw row already assigned above
    } finally {
      detailLoading.value = false
    }
  }

  const roomPreview = computed<DrawerPreview>(() => {
    const r = selectedRoom.value
    if (!r) return { kind: 'room', title: 'Room Preview', name: '', avatar: '' }
    const name = roomTypeName(r) || roomName(r)
    const landlord = r.landlordInfo as { id: string; full_name: string | null; sex: string | null; phone: string | null; initials: string | null; avatar_url: string | null } | null | undefined
    const firstPhoto = ((r.photos as { url: string }[] | undefined) ?? [])[0]?.url ?? ''
    return {
      kind: 'room',
      title: 'Room Preview',
      name,
      roomOverview: {
        coverUrl: firstPhoto,
        title: r.room_number ? `Room ${r.room_number}` : r.label || name,
        typeLabel: r.custom_room_type || humanizeEnum(r.room_type) || 'Room',
        accommodation: { id: r.accommodation_id ?? r.accommodationId ?? '', name: r.accommodation || '—' },
        floor: r.floor ?? null,
        capacity: r.capacity ?? 0,
        status: String(r.status ?? ''),
        statusLabel: roomStatusLabel(r.status) || 'Unknown',
        rent: r.monthly_rent ?? r.rent ?? null,
        rentBasis: r.rent_basis === 'person' && (r.capacity ?? 0) > 1 ? 'person' : 'room',
        advanceMonths: r.advance_months ?? null,
        depositMonths: r.deposit_months ?? null,
        label: r.room_number && r.label ? r.label : null,
        floorName: r.floorName ?? null,
        utilities: UTILITIES.map((u) => {
          const billing = r[`${u.key}_billing`] as string | null
          const fee = r[`${u.key}_flat_fee`] as number | null
          const bills = ((r.bills as (PostedBill & { utility: string })[] | undefined) ?? []).filter((b) => b.utility === u.key)
          const s = utilityStatus(billing, fee, (r.occupants as unknown[] | undefined)?.length ?? 0, bills, manilaToday())
          // The drawer has room for the full wording; the table keeps it short.
          const terms = !billing ? 'Not specified' : billing === 'flat_fee' ? `Flat fee · ${s.terms}` : UTILITY_BILLING_LABEL[billing] ?? billing
          return { key: u.key, label: u.label, icon: u.icon, terms, bill: billing === 'flat_fee' || !billing ? '' : s.bill, tone: s.tone }
        }),
        bills: (r.bills as any[]) ?? [],
        landlord: landlord
          ? {
              id: landlord.id,
              name: landlord.full_name || '—',
              title: landlordTitle(landlord.sex),
              contact: landlord.phone || '',
              initials: landlord.initials || initialsOf(landlord.full_name || '?'),
              avatarUrl: landlord.avatar_url || undefined,
            }
          : null,
      },
      avatar: avatarUrl(name),
      occupants: (r.occupants as any[]) || undefined,
      photos: (r.photos as any[]) || undefined,
      // Always an array once the detail has loaded, so the tab shows its empty
      // state for a bedspace room rather than vanishing.
      facilities: (r.facilities as any[]) ?? [],
    }
  })

  return { drawerOpen, detailLoading, selectedRoom, openRoom, roomPreview }
}
