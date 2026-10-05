<template>
  <!-- Invite form for Settings → Administrators: the e-mail, then what the new
       admin may do (admin_access), sent together to the invite-admin function. -->
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
    <div class="field-label q-mt-md">Their access</div>
    <AccessEditor v-model="access" />
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
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import AccessEditor, { type AccessDraft } from './AccessEditor.vue'
import { useNotify } from '@/utils/notify'
import { callEdgeFunction } from '@/utils/edgeFunction'
import { errorMessage } from '@/utils/errors'
import { PRESETS, endOfDayIso } from '@/utils/access'

const emit = defineEmits<{ (e: 'invited'): void }>()
const notify = useNotify()

// Least access by default; the system admin raises it before sending.
const access = ref<AccessDraft>({ preset: 'viewer', levels: { ...PRESETS.find((x) => x.key === 'viewer')!.levels }, expiresAt: null })

const invite = reactive({ email: '' })
const inviteError = ref('')
const inviteLink = ref('')
const tempPassword = ref('')
const inviting = ref(false)
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
    const result = await callEdgeFunction<{ invite_link?: string; temporary_password?: string; message?: string; promoted?: boolean; already_admin?: boolean }>('invite-admin', {
      email,
      access: { preset: access.value.preset, levels: access.value.levels, expires_at: access.value.expiresAt ? endOfDayIso(access.value.expiresAt) : null },
    })
    inviteLink.value = result.invite_link ?? ''
    tempPassword.value = result.temporary_password ?? ''
    if (result.already_admin) {
      notify.info(result.message || 'Already an administrator.')
    } else {
      const msg = result.message || (inviteLink.value ? 'Invitation sent to ' + email : 'Admin account created for ' + email)
      notify.success(msg)
    }
    invite.email = ''
    emit('invited')
  } catch (e) {
    inviteError.value = errorMessage(e, 'Invitation failed.')
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
</script>

<style scoped>
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
</style>
