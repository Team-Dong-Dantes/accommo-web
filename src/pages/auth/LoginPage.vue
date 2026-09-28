<template>
  <div class="signin">
    <header class="signin-head">
      <h1>Sign in</h1>
      <p>Office of Student Affairs and Services. Staff accounts only.</p>
    </header>

    <q-form @submit.prevent="handleLogin" ref="loginFormRef" class="signin-form">
      <label class="field">
        <span class="field-label">Email address</span>
        <AuthInput v-model="email" autocomplete="username" :rules="[(val: string) => !!val || 'Email is required', (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Enter a valid email address']">
          <template #prepend><Icon icon="lucide:mail" width="18" height="18" /></template>
        </AuthInput>
      </label>

      <label class="field">
        <span class="field-label">Password</span>
        <AuthInput v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password"
          :rules="[(val: string) => !!val || 'Password is required']">
          <template #prepend><Icon icon="lucide:lock" width="18" height="18" /></template>
          <template #append>
            <button type="button" class="reveal" :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword">
              <Icon :icon="showPassword ? 'lucide:eye-off' : 'lucide:eye'" width="18" height="18" />
            </button>
          </template>
        </AuthInput>
      </label>

      <div class="signin-actions">
        <button type="button" class="forgot" :disabled="resetting" @click="sendReset">Forgot password?</button>
        <AuthButton type="submit" :loading="loading">Sign in</AuthButton>
      </div>
    </q-form>

    <p class="signin-foot">
      Access is restricted to accounts an administrator has invited.
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar, type QForm } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/utils/supabase';
import { useNotify } from '@/utils/notify';

import AuthInput from '@/components/auth/AuthInput.vue';
import AuthButton from '@/components/auth/AuthButton.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

// The router guard signs a suspended admin out mid-session and lands them here.
// Without this they'd arrive at a blank login screen with no idea why.
onMounted(() => {
  if (route.query.suspended === 'true') {
    $q.notify({ message: 'This account has been suspended.', position: 'top', color: 'grey-9', textColor: 'white', icon: 'mdi-close-circle', iconColor: 'red-4', classes: 'custom-notify' });
  }
  if (route.query.reset === 'expired') {
    notify.error('That reset link has expired or was already used. Request a new one.');
  }
});

const notify = useNotify();
const resetting = ref(false);

// Uses whatever is in the e-mail field, like the mobile app. Supabase only
// sends if the address has an account, but the reply is the same either way so
// the form can't be used to find out who has one.
async function sendReset() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    notify.error('Enter your e-mail address first, then choose Forgot password.');
    return;
  }
  resetting.value = true;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
    notify.success('If that address has an account, a reset link is on its way.');
  } catch (e) {
    notify.error(e instanceof Error ? e.message : 'Could not send the reset e-mail.');
  } finally {
    resetting.value = false;
  }
}

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const loginFormRef = ref<QForm | null>(null);

async function handleLogin() {
  if (!loginFormRef.value) return;
  const success = await loginFormRef.value.validate();
  if (!success) {
    $q.notify({ message: 'Please enter your email and password.', position: 'top', color: 'grey-9', textColor: 'white', icon: 'mdi-alert-circle', iconColor: 'amber-4', classes: 'custom-notify' });
    return;
  }

  try {
    loading.value = true;
    await authStore.login(email.value, password.value);

    $q.notify({ message: 'Welcome back!', position: 'top', color: 'grey-9', textColor: 'white', icon: 'mdi-check-circle', iconColor: 'teal-4', classes: 'custom-notify' });
    void router.push(authStore.needsOnboarding ? '/onboarding' : '/dashboard');
  } catch (error: unknown) {
    $q.notify({ message: error instanceof Error ? error.message : 'An unexpected error occurred', position: 'top', color: 'grey-9', textColor: 'white', icon: 'mdi-close-circle', iconColor: 'red-4', classes: 'custom-notify' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Light type: the form sits on the photograph behind glass, not on a pale
   surface. The slate-blue hex this page used to carry is gone either way — it
   made the staff door a third design language next to the landing page and the
   console. */
.signin-head h1 {
  margin: 0;
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 1.95rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.signin-head p {
  max-width: 34ch;
  margin: 8px 0 0;
  /* Over a lighter veil the supporting line needs more weight than 0.76. */
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.9rem;
  line-height: 1.5;
  text-shadow: 0 1px 8px rgba(0, 22, 19, 0.5);
}
.signin-head h1 { text-shadow: 0 2px 14px rgba(0, 22, 19, 0.45); }

.signin-form {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* A real label above each field instead of a floating placeholder: on a form
   someone fills in monthly, the labels should still be readable once the
   fields have content in them. */
.field { display: block; }
.field-label {
  display: block;
  margin-bottom: 7px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.82rem;
  font-weight: 600;
}

.reveal {
  display: grid;
  place-items: center;
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}
.reveal:hover { color: #ffffff; }
.reveal:focus-visible { outline: 2px solid rgba(255, 255, 255, 0.85); outline-offset: 1px; }

.signin-actions { margin-top: 10px; display: flex; flex-direction: column; gap: 14px; }
.forgot {
  align-self: flex-end;
  order: -1;
  padding: 0;
  border: 0;
  background: none;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.forgot:hover { color: #ffffff; text-decoration: underline; }
.forgot:disabled { opacity: 0.6; cursor: default; }

.signin-foot {
  margin: 26px 0 0;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.78rem;
  line-height: 1.5;
}
</style>
