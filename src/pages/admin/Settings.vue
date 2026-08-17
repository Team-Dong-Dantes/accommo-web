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
          <div class="card-head">
            <div class="card-title">Profile</div>
            <div class="card-sub">Your personal information and contact details.</div>
          </div>

          <div class="row items-center q-mb-lg profile-row">
            <q-avatar size="64px" color="primary" text-color="white" class="text-weight-bold profile-avatar" style="font-size: 24px">
              {{ initials }}
            </q-avatar>
            <div class="column q-ml-md">
              <div class="text-weight-bold text-ink" style="font-size: 16px">{{ form.name || 'Administrator' }}</div>
              <div class="text-muted" style="font-size: 13px">{{ form.email || 'admin@osas.gov.ph' }}</div>
              <BadgePill :bg="roleStyle.bg" :text-color="roleStyle.text" :icon="roleStyle.icon" :label="form.role" class="q-mt-xs" />
            </div>
          </div>

          <div class="form-grid">
            <q-input outlined dense v-model="form.name" label="Full name" class="field" />
            <q-input outlined dense v-model="form.email" label="Email address" type="email" class="field" />
            <q-input outlined dense v-model="form.phone" label="Phone number" class="field" />
            <q-input outlined dense v-model="form.role" label="Role" readonly class="field" />
          </div>
        </q-card>

        <!-- Notifications -->
        <q-card flat class="section-card" v-show="active === 'notifications'">
          <div class="card-head">
            <div class="card-title">Notifications</div>
            <div class="card-sub">Choose how Accommo keeps you informed.</div>
          </div>

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

        <!-- Appearance -->
        <q-card flat class="section-card" v-show="active === 'appearance'">
          <div class="card-head">
            <div class="card-title">Appearance</div>
            <div class="card-sub">Personalize the look and feel of your workspace.</div>
          </div>

          <div class="field-block">
            <div class="field-label">Theme</div>
            <q-select outlined dense v-model="appearance.theme" :options="themeOptions" emit-value map-options class="field" />
          </div>

          <div class="field-block">
            <div class="field-label">Density</div>
            <q-btn-toggle v-model="appearance.density" spread no-caps unelevated
              :options="densityOptions" color="grey-3" text-color="grey-8"
              class="density-toggle" active-class="density-active" />
          </div>

          <div class="field-block">
            <div class="field-label">Accent color</div>
            <div class="row q-gutter-sm items-center">
              <button v-for="c in accentColors" :key="c" type="button"
                class="swatch" :class="{ 'swatch--active': appearance.accent === c }"
                :style="{ background: c }" @click="appearance.accent = c" :aria-label="c" />
              <span class="text-muted" style="font-size: 12px; margin-left: 4px">{{ appearance.accent }}</span>
            </div>
          </div>
        </q-card>

        <!-- Security -->
        <q-card flat class="section-card" v-show="active === 'security'">
          <div class="card-head">
            <div class="card-title">Security</div>
            <div class="card-sub">Protect your account and review access.</div>
          </div>

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

        <!-- Danger zone -->
        <q-card flat class="section-card danger-card" v-show="active === 'danger'">
          <div class="card-head">
            <div class="card-title text-negative">Danger zone</div>
            <div class="card-sub">Irreversible and destructive actions.</div>
          </div>

          <div class="row items-center justify-between danger-row">
            <div>
              <div class="text-weight-medium text-ink" style="font-size: 14px">Delete account</div>
              <div class="text-muted" style="font-size: 12px">Permanently remove your account and all associated data.</div>
            </div>
            <q-btn outline color="negative" no-caps class="text-weight-bold" @click="confirmDelete">
              Delete account
            </q-btn>
          </div>
        </q-card>

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
import { useQuasar } from 'quasar'
import BadgePill from '@/components/user/BadgePill.vue'

const $q = useQuasar()
const active = ref('profile')

const sections = [
  { id: 'profile', label: 'Profile', icon: 'mdi:account-circle-outline' },
  { id: 'notifications', label: 'Notifications', icon: 'mdi:bell-outline' },
  { id: 'appearance', label: 'Appearance', icon: 'mdi:palette-outline' },
  { id: 'security', label: 'Security', icon: 'mdi:shield-lock-outline' },
  { id: 'danger', label: 'Danger zone', icon: 'mdi:alert-octagon-outline' },
]

const form = reactive({
  name: 'Maria Admin',
  email: 'admin@osas.gov.ph',
  phone: '+63 912 345 6789',
  role: 'Administrator',
})

const initials = computed(() =>
  form.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'A'
)

const roleStyle = { bg: 'teal-1', text: 'teal-8', icon: 'mdi:shield-account' }

const notifications = reactive({
  emailAlerts: true,
  pushAlerts: false,
  weeklyDigest: true,
  grievanceAlerts: true,
})

const notificationOptions = [
  { key: 'emailAlerts', label: 'Email alerts', desc: 'Important account and verification updates.' },
  { key: 'pushAlerts', label: 'Push notifications', desc: 'Real-time alerts in your browser.' },
  { key: 'weeklyDigest', label: 'Weekly digest', desc: 'A Monday summary of platform activity.' },
  { key: 'grievanceAlerts', label: 'Grievance alerts', desc: 'Notify me about new student concerns.' },
]

const themeOptions = [
  { label: 'Light (default)', value: 'light' },
]

const densityOptions = [
  { label: 'Comfortable', value: 'comfortable' },
  { label: 'Compact', value: 'compact' },
]

const accentColors = ['#0F766E', '#E0654B', '#0E7490', '#B45309', '#7C3AED', '#0F766E']
const appearance = reactive({
  theme: 'light',
  density: 'comfortable',
  accent: '#0F766E',
})

const security = reactive({
  twoFactor: false,
  loginAlerts: true,
})

const password = reactive({
  current: '',
  next: '',
  confirm: '',
})

function saveAll() {
  saved.value = snapshot()
  try {
    localStorage.setItem('accommo-settings', saved.value)
    $q.notify({ message: 'Settings saved', color: 'positive', position: 'top', icon: 'mdi:check-circle' })
  } catch {
    $q.notify({ message: 'Could not save settings', color: 'negative', position: 'top' })
  }
  password.current = ''
  password.next = ''
  password.confirm = ''
}

function cancel() {
  const snap = saved.value ? JSON.parse(saved.value) : null
  if (!snap) return
  Object.assign(form, snap.form)
  Object.assign(notifications, snap.notifications)
  Object.assign(appearance, snap.appearance)
  Object.assign(security, snap.security)
  password.current = ''
  password.next = ''
  password.confirm = ''
}

function snapshot() {
  return JSON.stringify({
    form: { ...form },
    notifications: { ...notifications },
    appearance: { ...appearance },
    security: { ...security },
  })
}

const saved = ref('')

const dirty = computed(() => {
  if (password.current || password.next || password.confirm) return true
  return snapshot() !== saved.value
})

onMounted(() => {
  const raw = localStorage.getItem('accommo-settings')
  if (raw) {
    try {
      const p = JSON.parse(raw)
      if (p.form) Object.assign(form, p.form)
      if (p.notifications) Object.assign(notifications, p.notifications)
      if (p.appearance) Object.assign(appearance, p.appearance)
      if (p.security) Object.assign(security, p.security)
    } catch { /* ignore corrupt data */ }
  }
  saved.value = snapshot()
})

function savePassword() {
  if (password.next && password.next !== password.confirm) {
    $q.notify({ message: 'New passwords do not match', color: 'negative', position: 'top' })
    return
  }
  if (password.next && password.next.length < 8) {
    $q.notify({ message: 'Password must be at least 8 characters', color: 'negative', position: 'top' })
    return
  }
  $q.notify({ message: 'Password updated', color: 'positive', position: 'top', icon: 'mdi:check-circle' })
  password.current = ''
  password.next = ''
  password.confirm = ''
}

function confirmDelete() {
  $q.dialog({
    title: 'Delete account?',
    message: 'This action is permanent and cannot be undone.',
    cancel: true,
    persistent: true,
    ok: { color: 'negative', label: 'Delete' },
  }).onOk(() => {
    $q.notify({ message: 'Account deletion requested', color: 'negative', position: 'top' })
  })
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

.card-head {
  margin-bottom: 20px;
}

.card-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  color: var(--c-ink);
}

.card-sub {
  font-size: 13px;
  color: var(--c-muted);
  margin-top: 2px;
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
