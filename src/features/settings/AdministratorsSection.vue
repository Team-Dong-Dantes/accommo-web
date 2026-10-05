<template>
  <q-card flat class="section-card">
    <PanelHeader title="Administrators" subtitle="Invite teammates and manage who has admin access." />

    <InviteAdmin @invited="loadAdmins" />

    <q-separator class="q-my-md" />

    <div class="field-label">Current administrators</div>
    <q-list class="toggle-list">
      <q-item v-for="a in admins" :key="a.id" class="toggle-item">
        <q-item-section avatar>
          <q-avatar size="38px" color="primary" text-color="white" class="text-weight-bold">
            <img v-if="a.avatar_url" :src="a.avatar_url" :alt="a.full_name || 'Administrator'" />
            <template v-else>{{ a.initials || '?' }}</template>
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <div class="text-weight-medium text-ink" style="font-size: 14px">{{ a.full_name || 'Pending setup' }}</div>
          <div class="text-muted" style="font-size: 12px">{{ a.email }}</div>
          <div v-if="!a.is_superadmin" class="access-line" :class="{ 'is-expired': expired(a) }">
            <Icon icon="lucide:key-square" width="12" height="12" />{{ accessSummary(a) }}
          </div>
        </q-item-section>
        <q-item-section side>
          <div class="row items-center q-gutter-xs no-wrap">
            <BadgePill :tone="adminTone(a)" :label="adminLabel(a)" />
            <q-btn flat dense round @click.stop>
              <Icon icon="lucide:ellipsis-vertical" width="18" height="18" class="text-muted" />
              <!-- Same look as the record drawer's ActionMenu. -->
              <q-menu anchor="bottom right" self="top right" :offset="[0, 6]" class="adm-menu">
                <div role="menu" :aria-label="`Actions for ${a.full_name || a.email}`" class="am">
                  <button v-if="!a.onboarding_complete" v-close-popup type="button" role="menuitem" class="am-item am-item--danger" @click="confirmAction('revoke', a)">
                    <Icon icon="lucide:mail-x" width="15" height="15" />Cancel invite
                  </button>
                  <button v-if="canRemove(a)" v-close-popup type="button" role="menuitem" class="am-item" @click="editing = a">
                    <Icon icon="lucide:key-square" width="15" height="15" />Edit access…
                  </button>
                  <template v-if="canRemove(a) && a.onboarding_complete">
                    <button v-close-popup type="button" role="menuitem" class="am-item" @click="confirmAction('password', a)">
                      <Icon icon="lucide:key-round" width="15" height="15" />Set a temporary password…
                    </button>
                    <button v-close-popup type="button" role="menuitem" class="am-item" @click="confirmAction('mfa', a)">
                      <Icon icon="lucide:shield-off" width="15" height="15" />Reset two-factor…
                    </button>
                    <div class="am-rule"></div>
                  </template>
                  <button v-if="canRemove(a)" v-close-popup type="button" role="menuitem" class="am-item am-item--danger" @click="confirmAction('remove', a)">
                    <Icon icon="lucide:user-minus" width="15" height="15" />Remove admin
                  </button>
                </div>
              </q-menu>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
      <q-item v-if="!admins.length" class="toggle-item">
        <q-item-section><div class="text-muted" style="font-size: 13px">No administrators found.</div></q-item-section>
      </q-item>
    </q-list>

    <AccessDialog :admin="editing" :access="editing ? accessById[editing.id] ?? null : null" @close="editing = null" @saved="editing = null; loadAdmins()" />
  </q-card>
</template>

<script setup lang="ts">
import { errorMessage } from '@/utils/errors'
import { ref, onMounted } from 'vue'
import InviteAdmin from './InviteAdmin.vue'
import AccessDialog, { type AdminAccess } from './AccessDialog.vue'
import { normalizeLevels, presetLabel } from '@/utils/access'
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import PanelHeader from '@/components/ui/PanelHeader.vue'
import { useNotify } from '@/utils/notify'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'
import { supabase } from '@/utils/supabase'
import { callEdgeFunction } from '@/utils/edgeFunction'
import { type StatusTone } from '@/utils/status.config'

export interface AdminRow {
  id: string
  full_name: string | null
  email: string
  initials: string
  avatar_url: string | null
  is_superadmin: boolean
  onboarding_complete: boolean
}

const notify = useNotify()
const authStore = useAuthStore()
const $q = useQuasar()

const admins = ref<AdminRow[]>([])

async function loadAdmins() {
  const { data, error } = await supabase
    .from('users_full')
    .select('id, full_name, email, initials, avatar_url, is_superadmin, onboarding_complete')
    .eq('role', 'admin')
    .order('is_superadmin', { ascending: false })
    .order('full_name')
  if (!error) admins.value = (data as AdminRow[]) ?? []
  // The system admin reads every row of admin_access.
  const { data: rows } = await supabase.from('admin_access').select('user_id, preset, levels, expires_at')
  accessById.value = Object.fromEntries((rows ?? []).map((r) => [r.user_id, { preset: r.preset, levels: normalizeLevels(r.levels), expires_at: r.expires_at }]))
}

const accessById = ref<Record<string, AdminAccess>>({})
const editing = ref<AdminRow | null>(null)

function expired(a: AdminRow): boolean {
  const until = accessById.value[a.id]?.expires_at
  return !!until && new Date(until).getTime() <= Date.now()
}

/** "Support desk · until Oct 30", "Expired Oct 30", or "No access set". */
function accessSummary(a: AdminRow): string {
  const acc = accessById.value[a.id]
  if (!acc) return 'No access set'
  const until = acc.expires_at ? new Date(acc.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  if (expired(a)) return `${presetLabel(acc.preset)} · expired ${until}`
  return until ? `${presetLabel(acc.preset)} · until ${until}` : presetLabel(acc.preset)
}

function adminTone(a: AdminRow): StatusTone {
  if (a.is_superadmin) return 'warning'
  if (expired(a)) return 'danger'
  if (!a.onboarding_complete) return 'neutral'
  return 'primary'
}

function adminLabel(a: AdminRow): string {
  if (a.is_superadmin) return 'Main admin'
  if (expired(a)) return 'Access expired'
  if (!a.onboarding_complete) return 'Pending setup'
  return 'Admin'
}

function canRemove(a: AdminRow): boolean {
  return !a.is_superadmin && a.id !== authStore.user?.id
}

type AdminAction = 'revoke' | 'remove' | 'password' | 'mfa'

const ACTIONS: Record<AdminAction, { fn: string; title: string; ok: string; done: string; message: (who: string) => string }> = {
  revoke: {
    fn: 'revoke_invite', title: 'Cancel invite', ok: 'Cancel invite', done: 'Invite cancelled',
    message: (who) => `Cancel the pending invite for ${who}? The invitation will be withdrawn and the account removed.`,
  },
  remove: {
    fn: 'remove_admin', title: 'Remove admin', ok: 'Remove', done: 'Admin access removed',
    message: (who) => `Remove admin access from ${who}? Their account is kept but demoted to a regular user.`,
  },
  password: {
    fn: 'set_temp_password', title: 'Set a temporary password', ok: 'Generate password', done: 'Temporary password set',
    message: (who) => `Give ${who} a new password? Their current password stops working. Hand the new one to them in person; they can change it in Settings.`,
  },
  mfa: {
    fn: 'reset_mfa', title: 'Reset two-factor', ok: 'Reset two-factor', done: 'Two-factor reset',
    message: (who) => `Remove ${who}'s authenticator? They sign in with only their password until they set two-factor up again in Settings.`,
  },
}

function confirmAction(action: AdminAction, a: AdminRow) {
  const spec = ACTIONS[action]
  $q.dialog({
    title: spec.title,
    message: spec.message(action === 'revoke' ? a.email : a.full_name || a.email),
    cancel: { label: 'Keep', noCaps: true, flat: true },
    ok: { label: spec.ok, color: 'negative', noCaps: true },
    persistent: true,
  }).onOk(() => manageAdmin(action, a))
}

async function manageAdmin(action: AdminAction, a: AdminRow) {
  const spec = ACTIONS[action]
  try {
    const result = await callEdgeFunction<{ temporary_password?: string }>('manage-admin', { action: spec.fn, target_id: a.id })
    notify.success(spec.done)
    if (result.temporary_password) {
      // Shown once, never stored.
      $q.dialog({
        title: 'Temporary password',
        message: `${a.email} signs in with ${result.temporary_password} — it is shown only now.`,
        ok: { label: 'Copy and close', noCaps: true },
        persistent: true,
      }).onOk(() => {
        navigator.clipboard.writeText(result.temporary_password!).then(
          () => notify.success('Password copied'),
          () => notify.error('Could not copy password'),
        )
      })
    }
    await loadAdmins()
  } catch (e) {
    notify.error(errorMessage(e, 'Action failed.'))
  }
}

onMounted(() => {
  loadAdmins()
})
</script>

<style scoped>
.section-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 24px;
  margin-bottom: 16px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-ink);
  margin-bottom: 8px;
}

.field {
  max-width: 420px;
}

.access-line {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-primary-ink);
}
.access-line.is-expired { color: var(--c-danger); }

.toggle-list {
  padding: 0;
}

.toggle-item {
  padding: 14px 4px !important;
  border-bottom: 1px solid var(--c-border);
}

.toggle-item:last-child {
  border-bottom: none;
}

@media (max-width: 860px) {
  .invite-btn {
    margin-left: 0;
    margin-top: 16px;
    width: 100%;
  }
}
</style>

<style scoped>
/* Row actions — mirrors features/drawer/accommodation/ActionMenu.vue. */
.am { display: flex; flex-direction: column; width: 240px; padding: 6px; box-sizing: border-box; }
.am-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--c-ink);
  font: inherit;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}
.am-item :deep(svg) { color: var(--c-text); flex-shrink: 0; }
.am-item:hover, .am-item:focus-visible { background: var(--c-surface-2); outline: none; }
.am-item--danger { color: var(--c-danger); font-weight: 600; }
.am-item--danger :deep(svg) { color: var(--c-danger); }
.am-rule { height: 1px; margin: 6px 4px; background: var(--c-border); }
</style>

<style>
/* QMenu teleports its frame out of this component, so it can't be scoped. */
.adm-menu {
  border: 1px solid var(--c-border);
  border-radius: 12px !important;
  background: var(--c-surface);
  box-shadow: 0 12px 32px rgba(20, 20, 19, 0.16) !important;
}
</style>
