// The signed-in admin's own settings: profile, notification choices, login
// alerts and password, with the unsaved-changes tracking the page's action row
// reads. One instance per Settings page.
import { ref, reactive, computed, onMounted } from 'vue'
import { useNotify } from '@/utils/notify'
import { errorMessage } from '@/utils/errors'
import { useAuthStore } from '@/stores/auth'
import { type StatusTone } from '@/utils/status.config'
import { passwordProblem } from '@/utils/format'
import { changePassword, fetchLoginAlerts, saveLoginAlerts, saveOwnProfile } from '@/api/settings'

export function useAdminSettings() {
  const notify = useNotify()
  const authStore = useAuthStore()

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

  const roleStyle: { tone: StatusTone; icon: string } = { tone: 'primary', icon: 'lucide:shield-user' }

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

  // Saved on toggle, straight to users.login_alerts — read by the sign-in trigger.
  const loginAlerts = ref<boolean | null>(null)

  async function setLoginAlerts(on: boolean) {
    const id = authStore.user?.id
    if (!id) return
    try {
      await saveLoginAlerts(id, on)
    } catch (error) {
      return notify.error(errorMessage(error, 'Could not save'))
    }
    loginAlerts.value = on
  }

  const password = reactive({
    current: '',
    next: '',
    confirm: '',
  })

  async function saveAll() {
    const u = authStore.user
    if (u) {
      try {
        await saveOwnProfile(u.id, form.name, form.phone)
        u.full_name = form.name
        u.phone = form.phone
      } catch (error) {
        notify.error(errorMessage(error, 'Could not save profile'))
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
    password.current = ''
    password.next = ''
    password.confirm = ''
  }

  function snapshot() {
    return JSON.stringify({
      form: { ...form },
      notifications: { ...notifications },
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
      } catch { /* ignore corrupt data */ }
    }
    saved.value = snapshot()

    if (authStore.user) {
      loginAlerts.value = (await fetchLoginAlerts(authStore.user.id).catch(() => null)) ?? true
    }
  })

  async function savePassword() {
    if (password.next && password.next !== password.confirm) {
      notify.error('New passwords do not match')
      return
    }
    const weak = password.next ? passwordProblem(password.next) : null
    if (weak) {
      notify.error(weak)
      return
    }
    try {
      // Supabase checks current_password itself (Auth → "require current password"),
      // so a session left open on a shared desk can't be used to take the account.
      await changePassword(password.current, password.next)
      notify.success('Password updated')
      password.current = ''
      password.next = ''
      password.confirm = ''
    } catch (error) {
      notify.error(errorMessage(error, 'Could not update password'))
    }
  }

  return { form, initials, roleStyle, notifications, notificationOptions, loginAlerts, setLoginAlerts, password, saveAll, cancel, dirty, savePassword }
}
