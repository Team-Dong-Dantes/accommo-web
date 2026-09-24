// What OSAS can do to a person's account from their record, and how each
// action describes itself to AccountActionDialog. Users.vue only wires it up.

import { computed, ref, type Ref } from 'vue'
import { useNotify } from '@/utils/notify'
import {
  changeRole,
  changeSignInEmail,
  closeAccount,
  openTicketFor,
  disconnectGoogle,
  sendUserNotification,
  setAccountStatus,
  setTemporaryPassword,
  signOutEverywhere,
  type SignInMethods,
  type AccountStanding,
  type AccountStatus,
  type Restriction,
} from '@/api/accounts'

export interface MenuAction {
  label: string
  action: string
  danger?: boolean
  icon?: string
  group?: string
}

export interface AccountActionInput {
  reason: string | null
  until: string | null
  title: string
  restrictions: Restriction[]
  /** The spec's single text field, when it has one. */
  value: string
}

/** Something to show OSAS once the action has run, instead of closing. */
export interface ActionReveal { label: string; value: string; note: string }

export interface AccountActionSpec {
  title: string
  name: string
  icon: string
  blurb: string
  confirm: string
  danger?: boolean
  reason: 'required' | 'optional' | 'none'
  until?: boolean
  message?: boolean
  restrictions?: { key: Restriction; label: string; hint: string }[]
  picked?: Restriction[]
  field?: { label: string; type: 'email' | 'text'; placeholder?: string; initial?: string }
  /** For what cannot easily be undone: the admin types this (the person's name) first. */
  confirmPhrase?: string
  /** Replaces the default "Reason" label on the free-text field. */
  reasonLabel?: string
  /** Replaces the default "Title" label on a message spec. */
  titleLabel?: string
  run: (input: AccountActionInput) => Promise<ActionReveal | void>
}

/** The bits of a Users row this needs. */
export interface AccountSubject {
  rawId: string
  name: string
  role: string
  status: string
  email: string
}

const RESTRICTION_OPTIONS: Record<string, { key: Restriction; label: string; hint: string }[]> = {
  student: [{ key: 'apply', label: 'Room applications', hint: 'They can still sign in, browse and pay, but cannot apply for a room.' }],
  landlord: [{ key: 'listings', label: 'Listings', hint: 'Every one of their accommodations is hidden from students. Current boarders are unaffected.' }],
}

export interface AccountState {
  standing: Ref<AccountStanding>
  signIn: Ref<SignInMethods | null>
  /** users.closed_at: a closed account has nothing left to manage. */
  closed: Ref<boolean>
  /** The signed-in admin, and whether they are the main admin (closing needs it). */
  actorId: Ref<string>
  isSuperadmin: Ref<boolean>
}

export interface AccountHooks {
  /** Status or sign-in changed: refresh the row and the record. */
  onChanged: (status: AccountStatus) => Promise<void> | void
  onEditProfile: () => void
  /** Role changed or account closed: the table itself is out of date. */
  onReload: () => Promise<void> | void
}

export function useAccountActions(subject: Ref<AccountSubject | null>, state: AccountState, hooks: AccountHooks) {
  const { standing, signIn } = state
  const { onChanged, onEditProfile } = hooks
  const notify = useNotify()
  const spec = ref<AccountActionSpec | null>(null)

  const role = computed(() => (subject.value?.role || '').toLowerCase())
  const status = computed(() => (subject.value?.status || '').toLowerCase())
  const manageable = computed(() => role.value === 'student' || role.value === 'landlord')

  const actions = computed<MenuAction[]>(() => {
    if (!subject.value || !manageable.value || state.closed.value) return []
    const out: MenuAction[] = []
    const group = 'Status'
    if (status.value === 'suspended') {
      out.push({ group, label: 'Reactivate account', action: 'reactivate', icon: 'lucide:rotate-ccw' })
    } else {
      if (['pending', 'reviewing', 'unverified'].includes(status.value)) {
        out.push({ group, label: 'Mark as verified', action: 'verify', icon: 'lucide:badge-check' })
      }
      if (status.value === 'verified') {
        out.push({ group, label: 'Request new requirements…', action: 'resubmit', icon: 'lucide:file-warning' })
      }
      out.push({ group, label: 'Restrict…', action: 'restrict', icon: 'lucide:shield-minus' })
      out.push({ group, label: 'Suspend account…', action: 'suspend', icon: 'lucide:ban', danger: true })
    }
    out.push({ group: 'Record', label: 'Edit profile…', action: 'edit', icon: 'lucide:user-pen' })
    out.push({ group: 'Contact', label: 'Send notification…', action: 'notify', icon: 'lucide:bell-plus' })
    out.push({ group: 'Contact', label: 'Open a support ticket…', action: 'ticket', icon: 'lucide:life-buoy' })
    const sign = 'Sign-in'
    out.push({ group: sign, label: signIn.value?.hasPassword ? 'Set a temporary password…' : 'Give them a password…', action: 'temp-password', icon: 'lucide:key-round' })
    out.push({ group: sign, label: 'Change sign-in e-mail…', action: 'email', icon: 'lucide:at-sign' })
    out.push({ group: sign, label: 'Sign out everywhere…', action: 'sign-out', icon: 'lucide:log-out' })
    if (signIn.value?.hasGoogle) {
      out.push({ group: sign, label: 'Disconnect Google…', action: 'google', icon: 'lucide:unlink' })
    }
    const danger = 'Danger zone'
    out.push({ group: danger, label: role.value === 'student' ? 'Change to landlord/landlady…' : 'Change to student…', action: 'role', icon: 'lucide:repeat', danger: true })
    if (state.isSuperadmin.value) {
      out.push({ group: danger, label: 'Close account…', action: 'close', icon: 'lucide:user-x', danger: true })
    }
    return out
  })

  async function changeStatus(next: AccountStatus, input: AccountActionInput, done: string) {
    const s = subject.value!
    await setAccountStatus(s.rawId, next, { reason: input.reason, until: input.until })
    notify.success(done, s.name)
    await onChanged(next)
  }

  function open(action: string) {
    const s = subject.value
    if (!s) return
    const name = s.name
    const who = role.value === 'student' ? 'student' : 'landlord/landlady'
    switch (action) {
      case 'suspend':
        spec.value = {
          title: 'Suspend account', name, icon: 'lucide:ban', danger: true, reason: 'required', until: true,
          confirm: 'Suspend',
          blurb: role.value === 'student'
            ? 'They are signed out at once and cannot sign in. Their OSAS verification is withdrawn until the account is reactivated.'
            : 'They are signed out at once and cannot sign in. Their accredited accommodations are delisted and stay delisted after reactivation.',
          run: (i) => changeStatus('suspended', i, 'Account suspended'),
        }
        break
      case 'reactivate':
        spec.value = {
          title: 'Reactivate account', name, icon: 'lucide:rotate-ccw', reason: 'optional', confirm: 'Reactivate',
          blurb: `They can sign in again as a verified ${who}.`,
          run: (i) => changeStatus('verified', i, 'Account reactivated'),
        }
        break
      case 'verify':
        spec.value = {
          title: 'Mark as verified', name, icon: 'lucide:badge-check', reason: 'optional', confirm: 'Verify',
          blurb: 'Skips the verification queue. Use it when the requirements were checked another way, such as in person at OSAS.',
          run: (i) => changeStatus('verified', i, 'Account verified'),
        }
        break
      case 'resubmit':
        spec.value = {
          title: 'Request new requirements', name, icon: 'lucide:file-warning', reason: 'required', confirm: 'Send request',
          blurb: role.value === 'student'
            ? 'Their verification is withdrawn until they upload again, so they cannot apply for a room meanwhile. Say which requirement and why.'
            : 'Their verification is withdrawn and their accredited accommodations are delisted until they upload again. Say which requirement and why.',
          run: (i) => changeStatus('rejected', i, 'New requirements requested'),
        }
        break
      case 'restrict':
        spec.value = {
          title: 'Restrict account', name, icon: 'lucide:shield-minus', reason: 'optional', confirm: 'Save restrictions',
          blurb: 'A softer step than suspension: they keep their account and lose only what you tick. Clearing a tick lifts it.',
          restrictions: RESTRICTION_OPTIONS[role.value] ?? [],
          picked: standing.value.restrictions,
          run: async (i) => {
            await setAccountStatus(s.rawId, s.status.toLowerCase() as AccountStatus, { reason: i.reason, restrictions: i.restrictions })
            notify.success(i.restrictions.length ? 'Restrictions saved' : 'Restrictions lifted', name)
            await onChanged(s.status.toLowerCase() as AccountStatus)
          },
        }
        break
      case 'edit':
        onEditProfile()
        break
      case 'temp-password':
        spec.value = {
          title: signIn.value?.hasPassword ? 'Set a temporary password' : 'Give them a password',
          name, icon: 'lucide:key-round', reason: 'none', confirm: 'Generate password',
          blurb: (signIn.value?.hasGoogle ? 'They can keep signing in with Google, or use this with their e-mail. ' : '')
            + 'Their current password stops working and every device they are signed in on is signed out. Hand the new one to them in person.',
          run: async () => {
            const password = await setTemporaryPassword(s.rawId)
            await onChanged(s.status.toLowerCase() as AccountStatus)
            return { label: 'Temporary password', value: password, note: `Sign in with ${s.email} and this password. It is shown only now.` }
          },
        }
        break
      case 'email':
        spec.value = {
          title: 'Change sign-in e-mail', name, icon: 'lucide:at-sign', reason: 'none', confirm: 'Change e-mail',
          blurb: 'For a mistyped or lost address. The new one works at once — no confirmation e-mail is sent, so check it with them. Only @gmail.com and @isu.edu.ph are accepted.',
          field: { label: 'New e-mail', type: 'email', initial: s.email },
          run: async (i) => {
            await changeSignInEmail(s.rawId, i.value)
            notify.success('Sign-in e-mail changed', name)
            await onChanged(s.status.toLowerCase() as AccountStatus)
          },
        }
        break
      case 'sign-out':
        spec.value = {
          title: 'Sign out everywhere', name, icon: 'lucide:log-out', reason: 'none', confirm: 'Sign out',
          blurb: 'Ends every session, for a lost or shared phone. A device already open can keep working for up to an hour, until its sign-in refreshes.',
          run: async () => {
            const n = await signOutEverywhere(s.rawId)
            notify.success(n ? `Signed out of ${n} session${n === 1 ? '' : 's'}` : 'They were not signed in anywhere', name)
            await onChanged(s.status.toLowerCase() as AccountStatus)
          },
        }
        break
      case 'google':
        spec.value = {
          title: 'Disconnect Google', name, icon: 'lucide:unlink', reason: 'none', confirm: 'Disconnect', danger: true,
          blurb: signIn.value?.hasPassword
            ? 'For when the wrong Google account was connected. Afterwards they sign in with their e-mail and password.'
            : 'They have no password, so this would lock them out. Give them a password first.',
          run: async () => {
            await disconnectGoogle(s.rawId)
            notify.success('Google disconnected', name)
            await onChanged(s.status.toLowerCase() as AccountStatus)
          },
        }
        break
      case 'ticket':
        spec.value = {
          title: 'Open a support ticket', name, icon: 'lucide:life-buoy', reason: 'required', message: true, confirm: 'Open ticket',
          titleLabel: 'Subject', reasonLabel: 'First message',
          blurb: 'Starts a support ticket in their name, assigned to you, with your message as the first reply. They are notified and can answer it from the app.',
          run: async (i) => {
            await openTicketFor(s.rawId, role.value === 'student' ? 'student' : 'landlord', state.actorId.value, i.title, i.reason ?? '')
            notify.success('Support ticket opened', name)
          },
        }
        break
      case 'role': {
        const next = role.value === 'student' ? 'landlord' : 'student'
        spec.value = {
          title: next === 'landlord' ? 'Change to landlord/landlady' : 'Change to student',
          name, icon: 'lucide:repeat', danger: true, reason: 'required', confirm: 'Change role', confirmPhrase: name,
          blurb: 'Their registration starts over as the new role: they are signed out, and on their next sign-in they register and upload that role’s requirements for OSAS to verify. Refused while they have a current stay or application, or own an accommodation.',
          run: async (i) => {
            await changeRole(s.rawId, next, i.reason ?? '')
            notify.success('Role changed — they will re-register on their next sign-in', name)
            await hooks.onReload()
          },
        }
        break
      }
      case 'close':
        spec.value = {
          title: 'Close account', name, icon: 'lucide:user-x', danger: true, reason: 'required', confirm: 'Close account', confirmPhrase: name,
          blurb: 'Cannot be undone. Their name, contact details, ID numbers and requirements are erased and they can no longer sign in. Leases, payments and ratings stay — anonymized — so other people’s records survive. Refused while they have a current stay or an accredited accommodation.',
          run: async (i) => {
            await closeAccount(s.rawId, i.reason ?? '')
            notify.success('Account closed')
            await hooks.onReload()
          },
        }
        break
      case 'notify':
        spec.value = {
          title: 'Send notification', name, icon: 'lucide:bell-plus', reason: 'required', message: true, confirm: 'Send',
          blurb: 'Appears in their Accommo notifications. Nothing is e-mailed.',
          run: async (i) => {
            await sendUserNotification(s.rawId, i.title, i.reason ?? '')
            notify.success('Notification sent', name)
          },
        }
        break
    }
  }

  return { actions, spec, open, close: () => { spec.value = null } }
}
