<template>
  <q-card flat class="section-card">
    <PanelHeader title="Administrators" subtitle="Invite teammates and manage who has admin access." />

    <div class="invite-block">
      <div class="field-label">Invite a new administrator</div>
      <p class="text-muted invite-hint">
        Send an email invite — the new admin sets their own name and password on first sign-in. If email delivery isn't available, a one-time password is generated instead.
      </p>
      <div class="row items-start">
        <q-input outlined dense v-model="invite.email" label="Email address" type="email"
          class="field col-12 col-sm-7" @keyup.enter="inviteAdmin" />
        <q-btn unelevated color="primary" no-caps class="text-weight-bold invite-btn" :loading="inviting" @click="inviteAdmin">
          <Icon icon="lucide:send" class="on-left" width="18" height="18" />
          Send invite
        </q-btn>
      </div>
      <div v-if="inviteError" class="text-negative text-caption q-mt-sm">{{ inviteError }}</div>

      <div v-if="inviteLink" class="invite-link-box q-mt-sm">
        <div class="row items-center justify-between q-mb-xs">
          <span class="text-caption text-muted">Invite link (share if the email doesn't arrive):</span>
          <q-btn flat dense no-caps @click="copyLink">
            <Icon icon="lucide:copy" class="on-left" width="16" height="16" />
            Copy
          </q-btn>
        </div>
        <code class="invite-link">{{ inviteLink }}</code>
      </div>

      <div v-else-if="tempPassword" class="invite-link-box q-mt-sm">
        <div class="row items-center justify-between q-mb-xs">
          <span class="text-caption text-muted">One-time password (email unavailable — share securely):</span>
          <q-btn flat dense no-caps @click="copyPassword">
            <Icon icon="lucide:copy" class="on-left" width="16" height="16" />
            Copy
          </q-btn>
        </div>
        <code class="invite-link">{{ tempPassword }}</code>
        <div class="text-caption text-muted q-mt-xs">
          The admin signs in with this, then sets their name and can change the password anytime in Settings.
        </div>
      </div>
    </div>

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
        </q-item-section>
        <q-item-section side>
          <div class="row items-center q-gutter-xs no-wrap">
            <BadgePill :tone="adminTone(a)" :label="adminLabel(a)" />
            <q-btn flat dense round @click.stop>
              <Icon icon="lucide:ellipsis-vertical" width="18" height="18" class="text-muted" />
              <q-menu>
                <q-list dense style="min-width: 190px">
                  <q-item v-if="!a.onboarding_complete" clickable v-close-popup @click="confirmAction('revoke', a)">
                    <q-item-section avatar style="min-width: 32px">
                      <Icon icon="lucide:mail-x" width="18" height="18" class="text-negative" />
                    </q-item-section>
                    <q-item-section class="text-negative">Cancel invite</q-item-section>
                  </q-item>
                  <q-item v-if="canRemove(a)" clickable v-close-popup @click="confirmAction('remove', a)">
                    <q-item-section avatar style="min-width: 32px">
                      <Icon icon="lucide:user-minus" width="18" height="18" class="text-negative" />
                    </q-item-section>
                    <q-item-section class="text-negative">Remove admin</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
      <q-item v-if="!admins.length" class="toggle-item">
        <q-item-section><div class="text-muted" style="font-size: 13px">No administrators found.</div></q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import PanelHeader from '@/components/ui/PanelHeader.vue'
import { useNotify } from '@/utils/notify'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'
import { supabase } from '@/utils/supabase'
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

const invite = reactive({ email: '' })
const inviteError = ref('')
const inviteLink = ref('')
const tempPassword = ref('')
const inviting = ref(false)
const admins = ref<AdminRow[]>([])

async function loadAdmins() {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, initials, avatar_url, is_superadmin, onboarding_complete')
    .eq('role', 'admin')
    .order('is_superadmin', { ascending: false })
    .order('full_name')
  if (!error) admins.value = (data as AdminRow[]) ?? []
}

async function inviteAdmin() {
  inviteError.value = ''
  inviteLink.value = ''
  tempPassword.value = ''
  const email = invite.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    inviteError.value = 'Enter a valid email address.'
    return
  }
  inviting.value = true
  try {
    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    const invokeOpts: Record<string, unknown> = { body: { email } }
    if (token) invokeOpts.headers = { Authorization: `Bearer ${token}` }
    const { data, error } = await supabase.functions.invoke('invite-admin', invokeOpts as never)
    if (error) {
      inviteError.value = error.message || 'Invitation failed.'
      return
    }
    const result = data as { ok?: boolean; error?: string; invite_link?: string; temporary_password?: string; message?: string; promoted?: boolean; already_admin?: boolean }
    if (!result || !result.ok) {
      inviteError.value = result?.error || 'Invitation failed.'
      return
    }
    inviteLink.value = result.invite_link ?? ''
    tempPassword.value = result.temporary_password ?? ''
    if (result.already_admin) {
      notify.info(result.message || 'Already an administrator.')
    } else {
      const msg = result.message || (inviteLink.value ? 'Invitation sent to ' + email : 'Admin account created for ' + email)
      notify.success(msg)
    }
    invite.email = ''
    await loadAdmins()
  } catch (e) {
    inviteError.value = e instanceof Error ? e.message : 'Invitation failed.'
  } finally {
    inviting.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    notify.success('Invite link copied')
  } catch {
    notify.error('Could not copy link')
  }
}

async function copyPassword() {
  try {
    await navigator.clipboard.writeText(tempPassword.value)
    notify.success('One-time password copied')
  } catch {
    notify.error('Could not copy password')
  }
}

function adminTone(a: AdminRow): StatusTone {
  if (a.is_superadmin) return 'warning'
  if (!a.onboarding_complete) return 'neutral'
  return 'primary'
}

function adminLabel(a: AdminRow): string {
  if (a.is_superadmin) return 'Main admin'
  if (!a.onboarding_complete) return 'Pending setup'
  return 'Admin'
}

function canRemove(a: AdminRow): boolean {
  return !a.is_superadmin && a.id !== authStore.user?.id
}

function confirmAction(action: 'revoke' | 'remove', a: AdminRow) {
  const isRevoke = action === 'revoke'
  $q.dialog({
    title: isRevoke ? 'Cancel invite' : 'Remove admin',
    message: isRevoke
      ? `Cancel the pending invite for ${a.email}? The invitation will be withdrawn and the account removed.`
      : `Remove admin access from ${a.full_name || a.email}? Their account is kept but demoted to a regular user.`,
    cancel: { label: 'Keep', noCaps: true, flat: true },
    ok: { label: isRevoke ? 'Cancel invite' : 'Remove', color: 'negative', noCaps: true },
    persistent: true,
  }).onOk(() => manageAdmin(action, a))
}

async function manageAdmin(action: 'revoke' | 'remove', a: AdminRow) {
  try {
    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    const opts: Record<string, unknown> = {
      body: { action: action === 'revoke' ? 'revoke_invite' : 'remove_admin', target_id: a.id },
    }
    if (token) opts.headers = { Authorization: `Bearer ${token}` }
    const { error } = await supabase.functions.invoke('manage-admin', opts as never)
    if (error) {
      notify.error(error.message || 'Action failed.')
      return
    }
    notify.success(action === 'revoke' ? 'Invite cancelled' : 'Admin access removed')
    await loadAdmins()
  } catch (e) {
    notify.error(e instanceof Error ? e.message : 'Action failed.')
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

.invite-block {
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 16px;
}

.invite-hint {
  font-size: 12.5px;
  line-height: 1.4;
  margin: 0 0 12px;
}

.invite-btn {
  align-self: stretch;
  min-height: 40px;
  margin-left: 20px;
  padding: 0 18px;
  font-size: 13.5px;
  border-radius: var(--radius-btn, 12px);
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: filter 0.18s ease, transform 0.05s ease, box-shadow 0.18s ease;
  box-shadow: 0 6px 16px -8px rgba(18, 194, 153, 0.65);
}

.invite-btn:hover {
  filter: brightness(1.07);
  box-shadow: 0 10px 22px -8px rgba(18, 194, 153, 0.75);
}

.invite-btn:active {
  transform: translateY(1px);
  filter: brightness(0.96);
}

.invite-btn.q-btn--loading {
  filter: saturate(0.85) brightness(0.95);
  box-shadow: none;
}

.invite-link-box {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 10px 12px;
}

.invite-link {
  display: block;
  font-size: 11.5px;
  color: var(--c-muted);
  word-break: break-all;
  line-height: 1.5;
}

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
