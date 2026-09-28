<template>
  <div class="signin">
    <header class="signin-head">
      <h1>{{ isMfa ? 'Enter your code' : 'Set a new password' }}</h1>
      <p v-if="isMfa">Open your authenticator app and enter the 6-digit code for Accommo OSAS.</p>
      <p v-else>Choose a new password for your OSAS account.</p>
    </header>

    <q-form class="signin-form" @submit.prevent="submit">
      <label v-if="isMfa" class="field">
        <span class="field-label">Verification code</span>
        <AuthInput v-model="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" autofocus>
          <template #prepend><Icon icon="lucide:shield-check" width="18" height="18" /></template>
        </AuthInput>
      </label>

      <template v-else>
        <label class="field">
          <span class="field-label">New password</span>
          <AuthInput v-model="password" type="password" autocomplete="new-password">
            <template #prepend><Icon icon="lucide:lock" width="18" height="18" /></template>
          </AuthInput>
        </label>
        <label class="field">
          <span class="field-label">Confirm new password</span>
          <AuthInput v-model="confirm" type="password" autocomplete="new-password">
            <template #prepend><Icon icon="lucide:lock" width="18" height="18" /></template>
          </AuthInput>
        </label>
      </template>

      <div class="signin-actions">
        <AuthButton type="submit" :loading="loading">{{ isMfa ? 'Verify' : 'Save password' }}</AuthButton>
      </div>
    </q-form>

    <p class="signin-foot">
      <button type="button" class="link" @click="signOut">Use a different account</button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { useAuthStore } from '@/stores/auth'
import AuthInput from '@/components/auth/AuthInput.vue'
import AuthButton from '@/components/auth/AuthButton.vue'

const route = useRoute()
const router = useRouter()
const notify = useNotify()
const authStore = useAuthStore()

const isMfa = computed(() => route.path === '/auth/mfa')
const code = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    if (isMfa.value) {
      if (!/^\d{6}$/.test(code.value)) throw new Error('Enter the 6-digit code from your app.')
      const { data } = await supabase.auth.mfa.listFactors()
      const factor = data?.totp.find((f) => f.status === 'verified')
      if (!factor) throw new Error('No authenticator is set up for this account.')
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.value })
      if (error) throw error
    } else {
      if (password.value.length < 8) throw new Error('Password must be at least 8 characters.')
      if (password.value !== confirm.value) throw new Error('The passwords do not match.')
      const { error } = await supabase.auth.updateUser({ password: password.value })
      if (error) throw error
      notify.success('Password updated')
    }
    await router.replace(authStore.needsOnboarding ? '/onboarding' : '/dashboard')
  } catch (e) {
    notify.error(e instanceof Error ? e.message : 'Something went wrong')
  } finally {
    loading.value = false
  }
}

async function signOut() {
  await authStore.logout()
  await router.replace('/auth/login')
}
</script>

<style scoped>
.signin-head h1 {
  margin: 0;
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 1.95rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-shadow: 0 2px 14px rgba(0, 22, 19, 0.45);
}
.signin-head p {
  max-width: 34ch;
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.9rem;
  line-height: 1.5;
  text-shadow: 0 1px 8px rgba(0, 22, 19, 0.5);
}
.signin-form { margin-top: 28px; display: flex; flex-direction: column; gap: 16px; }
.field { display: block; }
.field-label { display: block; margin-bottom: 7px; color: rgba(255, 255, 255, 0.86); font-size: 0.82rem; font-weight: 600; }
.signin-actions { margin-top: 10px; }
.signin-foot { margin: 26px 0 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.18); }
.link { padding: 0; border: 0; background: none; color: rgba(255, 255, 255, 0.86); font-size: 0.82rem; text-decoration: underline; cursor: pointer; }
.link:hover { color: #ffffff; }
</style>
