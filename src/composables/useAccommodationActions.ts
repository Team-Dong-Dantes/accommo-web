// The Accommodation Hub record's management menu: hide or show a listing,
// suspend or restore accreditation, each audited. One instance per page.
import { computed, ref, type Ref } from 'vue'
import { countCurrentBoarders, setAccommodationHidden, setAccommodationStatus } from '@/api/accommodations'
import { insertAuditLog } from '@/api/audit'
import { currentUserId } from '@/api/notifications'
import { useAuthStore } from '@/stores/auth'
import { useNotify } from '@/utils/notify'
import { getStatus } from '@/utils/status.config'
import { humanizeEnum, landlordTitle } from '@/utils/format'
import type { AccountActionSpec } from '@/features/users/accountActions'
import type { RealAccommodation } from '@/composables/useAccommodations'

export function useAccommodationActions(opts: {
  /** The open record. */
  selected: Ref<any | null>
  /** The composable's rows, and the hub's mapped rows, kept in step with a change. */
  realRows: Ref<RealAccommodation[]>
  rows: Ref<any[]>
  loadEvents: (id: string) => Promise<void> | void
  /** "Generate report…" opens the record's own report window. */
  openReport: () => void
}) {
  const { selected, realRows, rows, loadEvents, openReport } = opts
  const notify = useNotify()

  type ManagementAction = { label: string; action: string; danger?: boolean; group?: string; icon?: string }

  /**
   * OSAS pulling an accredited property is a different act from the landlord/landlady
   * delisting their own, and from a refusal at accreditation — so it gets its own
   * status rather than another meaning loaded onto `rejected`. Same shape as the
   * account actions in Users.vue.
   */
  const authStore = useAuthStore()
  const accommodationActions = computed<ManagementAction[]>(() => {
    const a = selected.value
    if (!a) return []
    const status = String(a.status || '').toLowerCase()
    // Grouped under headings, as a person's record is in Users.
    const actions: ManagementAction[] = authStore.can('reports')
      ? [{ group: 'Record', label: 'Generate report…', action: 'export', icon: 'lucide:file-chart-column' }]
      : []
    // Hide, suspend and restore are Accommodations edit (the database checks too).
    if (!authStore.can('accommodations', 'edit')) return actions
    if (status === 'accredited') {
      actions.push(
        a.hiddenFromListings
          ? { group: 'Listing', label: 'Show in listings', action: 'unhide', icon: 'lucide:eye' }
          : { group: 'Listing', label: 'Hide from listings', action: 'hide', icon: 'lucide:eye-off' },
        { group: 'Accreditation', label: 'Suspend accreditation…', action: 'suspend', icon: 'lucide:ban', danger: true },
      )
    }
    if (status === 'suspended') actions.push({ group: 'Accreditation', label: 'Restore accreditation', action: 'restore', icon: 'lucide:rotate-ccw' })
    return actions
  })

  /**
   * Hiding takes an accredited property out of what students browse without
   * touching its accreditation — current boarders still see their own stay. Only
   * an admin can flip the flag; a trigger on `accommodations` enforces that.
   */
  async function setHidden(a: any, hidden: boolean) {
    try {
      await setAccommodationHidden(a.id, hidden)
    } catch (error) {
      notify.error('Could not change whether it is listed', (error as Error).message)
      return
    }
    selected.value = { ...a, hiddenFromListings: hidden }
    const row = realRows.value.find((r) => r.id === a.id)
    if (row) row.hiddenFromListings = hidden

    await insertAuditLog({
      action: hidden ? 'accommodation.hide' : 'accommodation.unhide',
      actor_id: await currentUserId(),
      entity_id: a.id,
      entity_type: 'accommodation',
      before_json: { hidden_from_listings: !hidden },
      after_json: { hidden_from_listings: hidden },
    }).catch((auditErr) => notify.warning('Change not recorded in the audit log', auditErr.message))

    notify.success(hidden ? 'Hidden from student listings.' : 'Shown in student listings again.')
    void loadEvents(a.id)
  }

  async function onManageAccommodation(action: string) {
    const a = selected.value
    if (!a?.id) return
    if (action === 'export') {
      openReport()
      return
    }
    if (action === 'unhide') {
      await setHidden(a, false)
      return
    }
    if (action === 'hide') {
      actionSpec.value = {
        title: 'Hide from listings', name: a.name, icon: 'lucide:eye-off', reason: 'none', confirm: 'Hide',
        blurb: 'Students browsing accommodations stop seeing it. Its accreditation and current boarders are not affected, and you can show it again at any time.',
        run: () => setHidden(a, true),
      }
      return
    }
    if (action === 'restore') {
      await setStatus(a, 'restore', 'accredited', '')
      return
    }
    if (action !== 'suspend') return

    // Suspending takes a property off Discover and tells everyone staying there
    // (tg_accreditation_status_change), so the reviewer sees how many first.
    const boarders = await countCurrentBoarders(a.id)
    actionSpec.value = {
      title: 'Suspend accreditation', name: a.name, icon: 'lucide:ban', danger: true, reason: 'required', confirm: 'Suspend',
      blurb: (boarders
        ? `${boarders} student${boarders === 1 ? ' stays' : 's stay'} here and will be notified. `
        : 'Nobody stays here right now. ')
        + `It leaves student listings until you restore it. The reason is recorded in the audit log and shown to the ${landlordTitle(a.landlordSex).toLowerCase()}.`,
      run: (i) => setStatus(a, 'suspend', 'suspended', i.reason ?? ''),
    }
  }

  /** Hide's and Suspend's confirmation; null when closed. */
  const actionSpec = ref<AccountActionSpec | null>(null)

  async function setStatus(a: any, action: 'suspend' | 'restore', next: 'suspended' | 'accredited', reason: string) {
    // status_note travels with the change so the landlord/landlady's notice
    // carries the reason (tg_accreditation_status_change); a restore clears it.
    try {
      await setAccommodationStatus(a.id, next, reason || null)
    } catch (error) {
      notify.error('Could not change the property status', (error as Error).message)
      return
    }

    // Only now is the row actually in this state, so only now does the UI say so.
    const def = getStatus(next)
    selected.value = {
      ...a,
      status: next,
      verified: next === 'accredited',
      statusLabel: humanizeEnum(next),
      statusStyle: { tone: def.tone, icon: def.icon ?? 'lucide:circle' },
    }
    const row = rows.value.find((r) => r.id === a.id)
    if (row) Object.assign(row, selected.value)

    await insertAuditLog({
      action: `accommodation.${action}`,
      actor_id: await currentUserId(),
      entity_id: a.id,
      entity_type: 'accommodation',
      before_json: { status: a.status },
      after_json: { status: next, reason: reason || null },
    }).catch((auditErr) => notify.warning('Change not recorded in the audit log', auditErr.message))

    notify.success(action === 'suspend' ? 'Property suspended.' : 'Accreditation restored.')
    void loadEvents(a.id)
  }

  return { accommodationActions, onManageAccommodation, actionSpec }
}
