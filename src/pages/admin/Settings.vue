<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <!-- Body: section nav + content -->
    <div class="settings-layout row q-mt-md q-gutter-md">
      <q-card flat class="section-nav">
        <q-list class="q-py-xs">
          <q-item v-for="s in sections" :key="s.id" clickable v-ripple
            :active="active === s.id" @click="active = s.id"
            class="nav-item" active-class="nav-item--active">
            <q-item-section avatar class="nav-ico">
              <Icon :icon="s.icon" width="20" height="20" />
            </q-item-section>
            <q-item-section class="text-weight-medium">{{ s.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <div class="section-content col">

        <!-- Profile -->
        <q-card flat class="section-card" v-show="active === 'profile'">
          <PanelHeader title="Profile" subtitle="Your personal information and contact details." />

          <div class="row items-center q-mb-lg profile-row">
            <q-avatar size="64px" color="primary" text-color="white" class="text-weight-bold profile-avatar" style="font-size: 24px">
              {{ initials }}
            </q-avatar>
            <div class="column q-ml-md">
              <div class="text-weight-bold text-ink" style="font-size: 16px">{{ form.name || 'Administrator' }}</div>
              <div class="text-muted" style="font-size: 13px">{{ form.email || 'admin@osas.gov.ph' }}</div>
              <BadgePill :tone="roleStyle.tone" :icon="roleStyle.icon" :label="form.role" class="q-mt-xs" />
            </div>
          </div>

          <div class="form-grid">
            <q-input outlined dense v-model="form.name" label="Full name" class="field" />
            <q-input outlined dense v-model="form.email" label="Email address" type="email" readonly class="field" />
            <q-input outlined dense v-model="form.phone" label="Phone number" class="field" />
            <q-input outlined dense v-model="form.role" label="Role" readonly class="field" />
          </div>
        </q-card>

        <!-- Notifications -->
        <q-card flat class="section-card" v-show="active === 'notifications'">
          <PanelHeader title="Notifications" subtitle="Choose how Accommo keeps you informed." />

          <q-list class="toggle-list">
            <q-item v-for="n in notificationOptions" :key="n.key" class="toggle-item">
              <q-item-section>
                <div class="text-weight-medium text-ink" style="font-size: 14px">{{ n.label }}</div>
                <div class="text-muted" style="font-size: 12px">{{ n.desc }}</div>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="notifications[n.key]" color="primary" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Security -->
        <q-card flat class="section-card" v-show="active === 'security'">
          <PanelHeader title="Security" subtitle="Protect your account and review access." />

          <q-list class="toggle-list q-mb-md">
            <q-item class="toggle-item">
              <q-item-section>
                <div class="text-weight-medium text-ink" style="font-size: 14px">Two-factor authentication</div>
                <div class="text-muted" style="font-size: 12px">Require a verification code at sign-in.</div>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="security.twoFactor" color="primary" />
              </q-item-section>
            </q-item>
            <q-item class="toggle-item">
              <q-item-section>
                <div class="text-weight-medium text-ink" style="font-size: 14px">New login alerts</div>
                <div class="text-muted" style="font-size: 12px">Email me when a new device signs in.</div>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="security.loginAlerts" color="primary" />
              </q-item-section>
            </q-item>
          </q-list>

          <div class="field-label">Change password</div>
          <div class="form-grid">
            <q-input outlined dense v-model="password.current" label="Current password" type="password" class="field" />
            <q-input outlined dense v-model="password.next" label="New password" type="password" class="field" />
            <q-input outlined dense v-model="password.confirm" label="Confirm new password" type="password" class="field" />
          </div>
          <q-btn unelevated color="primary" no-caps class="text-weight-bold q-mt-md" @click="savePassword">
            Update password
          </q-btn>
        </q-card>

        <!-- Administrators -->
        <AdministratorsSection v-if="authStore.isSuperadmin" v-show="active === 'administrators'" />

        <!-- Action row: only when there are unsaved changes -->
        <div class="action-row" v-if="dirty">
          <div class="action-hint text-muted">
            <Icon icon="mdi:circle-edit-outline" width="16" height="16" class="q-mr-xs" />
            You have unsaved changes
          </div>
          <div class="row q-gutter-sm">
            <q-btn flat color="grey-7" no-caps class="text-weight-bold" @click="cancel">Cancel</q-btn>
            <q-btn unelevated color="primary" no-caps class="text-weight-bold" @click="saveAll">
              <Icon icon="mdi:content-save-outline" class="on-left" width="18" height="18" />
              Save changes
            </q-btn>
          </div>
        </div>

      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import BadgePill from '@/components/user/BadgePill.vue'
import PanelHeader from '@/components/ui/PanelHeader.vue'
import { useNotify } from '@/utils/notify'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/utils/supabase'
import { type StatusTone } from '@/utils/status.config'
import AdministratorsSection from '@/features/settings/AdministratorsSection.vue'

const notify = useNotify()
const authStore = useAuthStore()
const active = ref('profile')

const sections = computed(() => {
  const list = [
    { id: 'profile', label: 'Profile', icon: 'mdi:account-circle-outline' },
    { id: 'notifications', label: 'Notifications', icon: 'mdi:bell-outline' },
    { id: 'security', label: 'Security', icon: 'mdi:shield-lock-outline' },
  ]
  if (authStore.isSuperadmin) {
    list.push({ id: 'administrators', label: 'Administrators', icon: 'mdi:account-cog-outline' })
  }
  return list
})

const form = reactive({
  name: '',
  email: '',
  phone: '',
  role: '',
})

const initials = computed(() =>
  authStore.user?.initials ||
  (form.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'A')
)

function applyProfile() {
  const u = authStore.user
  if (!u) return
  form.name = u.full_name
  form.phone = (u as any).phone ?? ''
  form.email = u.email
  form.role = authStore.roleLabel(u.role)
}

const roleStyle: { tone: StatusTone; icon: string } = { tone: 'primary', icon: 'mdi:shield-account' }

const notifications = reactive({
  emailAlerts: true,
  pushAlerts: false,
  weeklyDigest: true,
  grievanceAlerts: true,
})

const notificationOptions: { key: keyof typeof notifications; label: string; desc: string }[] = [
  { key: 'emailAlerts', label: 'Email alerts', desc: 'Important account and verification updates.' },
  { key: 'pushAlerts', label: 'Push notifications', desc: 'Real-time alerts in your browser.' },
  { key: 'weeklyDigest', label: 'Weekly digest', desc: 'A Monday summary of platform activity.' },
  { key: 'grievanceAlerts', label: 'Support ticket alerts', desc: 'Notify me about new student support tickets.' },
]

const security = reactive({
  twoFactor: false,
  loginAlerts: true,
})

const password = reactive({
  current: '',
  next: '',
  confirm: '',
})

async function saveAll() {
  const u = authStore.user
  if (u) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: form.name, phone: form.phone })
        .eq('id', u.id)
      if (error) {
        notify.error(error.message)
        return
      }
      u.full_name = form.name
      u.phone = form.phone
    } catch {
      notify.error('Could not save profile')
      return
    }
  }
  saved.value = snapshot()
  try {
    localStorage.setItem('accommo-settings', saved.value)
  } catch {
    /* ignore */
  }
  notify.success('Settings saved')
  password.current = ''
  password.next = ''
  password.confirm = ''
}

function cancel() {
  const snap = saved.value ? JSON.parse(saved.value) : null
  if (!snap) return
  Object.assign(form, snap.form)
  Object.assign(notifications, snap.notifications)
  Object.assign(security, snap.security)
  password.current = ''
  password.next = ''
  password.confirm = ''
}

function snapshot() {
  return JSON.stringify({
    form: { ...form },
    notifications: { ...notifications },
    security: { ...security },
  })
}

const saved = ref('')

const dirty = computed(() => {
  if (password.current || password.next || password.confirm) return true
  return snapshot() !== saved.value
})

onMounted(async () => {
  if (!authStore.user) {
    try { await authStore.getSessionProfile() } catch { /* no session */ }
  }
  applyProfile()

  const raw = localStorage.getItem('accommo-settings')
  if (raw) {
    try {
      const p = JSON.parse(raw)
      // Profile fields are sourced from the real user record, not local storage.
      if (p.notifications) Object.assign(notifications, p.notifications)
      if (p.security) Object.assign(security, p.security)
    } catch { /* ignore corrupt data */ }
  }
  saved.value = snapshot()
})

async function savePassword() {
  if (password.next && password.next !== password.confirm) {
    notify.error('New passwords do not match')
    return
  }
  if (password.next && password.next.length < 8) {
    notify.error('Password must be at least 8 characters')
    return
  }
  try {
    const { error } = await supabase.auth.updateUser({ password: password.next })
    if (error) {
      notify.error(error.message)
      return
    }
    notify.success('Password updated')
    password.current = ''
    password.next = ''
    password.confirm = ''
  } catch (e) {
    notify.error('Could not update password')
  }
}

</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

.settings-layout {
  flex: 1 1 0;
  min-height: 0;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.action-hint {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
}

.section-nav {
  width: 220px;
  flex-shrink: 0;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  align-self: flex-start;
}

.nav-item {
  border-radius: 10px !important;
  margin: 4px 8px !important;
  color: var(--c-text);
  transition: background 0.18s ease;
}

.nav-item:hover {
  background: var(--c-surface-2);
}

.nav-ico {
  min-width: 24px !important;
  width: 24px !important;
  padding: 0 !important;
  margin-right: 12px !important;
  color: var(--c-muted);
}

.nav-item--active {
  background: var(--c-primary-soft) !important;
  color: var(--c-primary-ink) !important;
  font-weight: 700;
}

.nav-item--active .nav-ico {
  color: var(--c-primary);
}

.section-content {
  min-width: 0;
  overflow: auto;
  padding-right: 4px;
}

.section-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 24px;
  margin-bottom: 16px;
}

.profile-row {
  flex-wrap: wrap;
  gap: 8px;
}

.profile-avatar {
  border-radius: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  max-width: 420px;
}

.field-block {
  margin-bottom: 20px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-ink);
  margin-bottom: 8px;
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

.density-toggle {
  border-radius: 10px;
  overflow: hidden;
  max-width: 320px;
}

.density-active {
  background: var(--c-primary) !important;
  color: #fff !important;
  font-weight: 700;
}

.swatch {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.swatch:hover {
  transform: scale(1.08);
}

.swatch--active {
  border-color: var(--c-ink);
  box-shadow: 0 0 0 2px var(--c-surface), 0 0 0 4px currentColor;
}

.danger-card {
  border-color: rgba(194, 65, 12, 0.35);
}

.danger-row {
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 860px) {
  .settings-layout {
    flex-direction: column;
  }
  .section-nav {
    width: 100%;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
