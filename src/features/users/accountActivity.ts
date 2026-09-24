// OSAS's decisions about an account, as lines in its Activity tab.
//
// Built from audit_logs rows on `users` (status, profile edits) and on
// `account_standing` (reason, end date, restrictions). Text is rendered with
// v-html, so every spliced value goes through escapeHtml.

import { escapeHtml, fmtDate, humanizeEnum } from '@/utils/format'
import type { StatusTone } from '@/utils/status.config'
import type { AccountEvent } from '@/api/accounts'

export interface ActivityLine { text: string; time: string; ts: number; icon: string; tone: StatusTone }

const RESTRICTION_LABEL: Record<string, [on: string, off: string]> = {
  apply: ['paused their room applications', 'restored their room applications'],
  listings: ['hid their listings from students', 'made their listings visible again'],
}

/** users columns that change without anyone deciding anything. */
const NOISE = new Set(['updated_at', 'last_login_at', 'reviewing_by', 'reviewing_at', 'email_verified_at', 'notification_prefs', 'avatar_url'])

const PROFILE_LABEL: Record<string, string> = {
  full_name: 'name', initials: 'initials', sex: 'sex', date_of_birth: 'date of birth', phone: 'phone', email: 'e-mail', role: 'role',
}

/** Sign-in actions, logged by name rather than as a row change. */
const SIGN_IN: Record<string, { text: string; icon: string }> = {
  'account.sign_out_everywhere': { text: 'Signed them out everywhere', icon: 'lucide:log-out' },
  'account.disconnect_google': { text: 'Disconnected their Google account', icon: 'lucide:unlink' },
  'account.temp_password': { text: 'Set a temporary password', icon: 'lucide:key-round' },
  'account.email_changed': { text: 'Changed their sign-in e-mail', icon: 'lucide:at-sign' },
  'account.closed': { text: 'Closed the account', icon: 'lucide:user-x' },
}

const STATUS_STYLE: Record<string, { icon: string; tone: StatusTone }> = {
  suspended: { icon: 'lucide:ban', tone: 'danger' },
  rejected: { icon: 'lucide:file-warning', tone: 'warning' },
  verified: { icon: 'lucide:badge-check', tone: 'success' },
}

const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : [])
const quote = (s: unknown) => (typeof s === 'string' && s.trim() ? ` — “${escapeHtml(s.trim())}”` : '')
const by = (name: string | null) => (name ? ` by <strong>${escapeHtml(name)}</strong>` : '')

export function accountActivity(events: AccountEvent[]): ActivityLine[] {
  const out: ActivityLine[] = []
  // A status change and the reason given for it land as two rows a moment apart.
  const standing = events.filter((e) => e.table === 'account_standing')
  const reasonNear = (ts: number) =>
    standing.find((s) => Math.abs(new Date(s.createdAt).getTime() - ts) < 5000)?.after?.reason

  for (const e of events) {
    const ts = new Date(e.createdAt).getTime()
    if (isNaN(ts)) continue
    const b = e.before ?? {}
    const a = e.after ?? {}
    const time = fmtDate(e.createdAt)

    const signIn = SIGN_IN[e.action]
    if (signIn) {
      const to = e.action === 'account.email_changed' && typeof a.email === 'string' ? ` to <strong>${escapeHtml(a.email)}</strong>` : ''
      out.push({ text: `${signIn.text}${to}${by(e.actorName)}`, time, ts, icon: signIn.icon, tone: 'info' })
      continue
    }

    if (e.table === 'users') {
      if (b.status !== a.status && a.status) {
        const st = STATUS_STYLE[String(a.status)] ?? { icon: 'lucide:circle-dot', tone: 'neutral' as StatusTone }
        out.push({ text: `Account set to <strong>${escapeHtml(humanizeEnum(String(a.status)))}</strong>${by(e.actorName)}${quote(reasonNear(ts))}`, time, ts, ...st })
        continue
      }
      // An e-mail change is logged by name above; its sync onto users (no actor) is not news.
      const edited = Object.keys(a).filter((k) => !NOISE.has(k) && k !== 'status' && !(k === 'email' && !e.actorName)
        && JSON.stringify(a[k]) !== JSON.stringify(b[k]))
      if (edited.length) {
        const what = edited.map((k) => PROFILE_LABEL[k] ?? humanizeEnum(k).toLowerCase()).join(', ')
        out.push({ text: `Updated ${escapeHtml(what)}${by(e.actorName)}`, time, ts, icon: 'lucide:user-pen', tone: 'info' })
      }
      continue
    }

    // account_standing
    const before = list(b.restrictions)
    const after = list(a.restrictions)
    for (const r of after.filter((x) => !before.includes(x))) {
      out.push({ text: `OSAS ${RESTRICTION_LABEL[r]?.[0] ?? `restricted ${escapeHtml(r)}`}${by(e.actorName)}${quote(a.reason)}`, time, ts, icon: 'lucide:shield-minus', tone: 'warning' })
    }
    for (const r of before.filter((x) => !after.includes(x))) {
      out.push({ text: `OSAS ${RESTRICTION_LABEL[r]?.[1] ?? `lifted ${escapeHtml(r)}`}${by(e.actorName)}`, time, ts, icon: 'lucide:shield-check', tone: 'success' })
    }
    if (b.suspended_until && !a.suspended_until && !e.actorName) {
      out.push({ text: 'Suspension ended on schedule', time, ts, icon: 'lucide:timer-reset', tone: 'success' })
    }
  }
  return out
}
