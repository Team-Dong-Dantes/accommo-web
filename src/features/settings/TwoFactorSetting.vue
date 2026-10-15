<template>
  <div class="tfa">
    <div class="tfa-row">
      <div>
        <div class="text-weight-medium text-ink" style="font-size: 14px">Two-factor authentication</div>
        <div class="text-muted" style="font-size: 12px">
          {{ factorId ? 'On. A code from your authenticator app is required at login.' : 'Required for admin accounts. Set it up to continue.' }}
        </div>
      </div>
      <q-btn v-if="!factorId && !enrolling" unelevated no-caps color="primary" label="Set up" :loading="busy" @click="start" />
    </div>

    <div v-if="enrolling" class="tfa-setup">
      <img :src="enrolling.qr" alt="QR code to scan with your authenticator app" class="tfa-qr" />
      <div class="tfa-steps">
        <p>Scan this with Google Authenticator, Microsoft Authenticator or a similar app, then enter the 6-digit code it shows.</p>
        <p class="text-muted" style="font-size: 12px">
          Can't scan? Enter this key instead: <code class="tfa-secret">{{ enrolling.secret }}</code>
        </p>
        <div class="row items-center q-gutter-sm">
          <q-input v-model="code" outlined dense label="6-digit code" inputmode="numeric" maxlength="6" autocomplete="one-time-code"
            style="width: 160px" @keyup.enter="verify" />
          <q-btn unelevated no-caps color="primary" label="Verify" :loading="busy" :disable="code.length !== 6" @click="verify" />
          <q-btn flat no-caps color="grey-7" label="Cancel" :disable="busy" @click="cancel" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { errorMessage } from '@/utils/errors'
import { onMounted, ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'

const notify = useNotify()
const emit = defineEmits<{ enrolled: [] }>()

const factorId = ref<string | null>(null)
const enrolling = ref<{ id: string; qr: string; secret: string } | null>(null)
const code = ref('')
const busy = ref(false)

async function load() {
  const { data } = await supabase.auth.mfa.listFactors()
  factorId.value = data?.totp.find((f) => f.status === 'verified')?.id ?? null
}

async function start() {
  busy.value = true
  try {
    // A setup abandoned halfway leaves an unverified factor behind, and Supabase
    // refuses a second one with the same name.
    const { data: list } = await supabase.auth.mfa.listFactors()
    for (const f of list?.all ?? []) {
      if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Accommo OSAS' })
    if (error) throw error
    enrolling.value = { id: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
    code.value = ''
  } catch (e) {
    notify.error(errorMessage(e, 'Could not start two-factor setup'))
  } finally {
    busy.value = false
  }
}

async function verify() {
  if (!enrolling.value || code.value.length !== 6) return
  busy.value = true
  try {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrolling.value.id, code: code.value })
    if (error) throw error
    factorId.value = enrolling.value.id
    enrolling.value = null
    notify.success('Two-factor authentication is on')
    emit('enrolled')
  } catch (e) {
    notify.error(errorMessage(e, 'That code did not work'))
  } finally {
    busy.value = false
  }
}

async function cancel() {
  if (enrolling.value) await supabase.auth.mfa.unenroll({ factorId: enrolling.value.id })
  enrolling.value = null
}

onMounted(load)
</script>

<style scoped>
.tfa { padding: 12px 0; border-bottom: 1px solid var(--line, #e5e7eb); }
.tfa-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.tfa-setup { display: flex; gap: 20px; margin-top: 16px; align-items: flex-start; flex-wrap: wrap; }
.tfa-qr { width: 164px; height: 164px; border: 1px solid var(--line, #e5e7eb); border-radius: 8px; background: #fff; }
.tfa-steps { flex: 1; min-width: 240px; font-size: 13px; }
.tfa-steps p { margin: 0 0 10px; }
.tfa-secret { word-break: break-all; font-size: 12px; }
</style>
