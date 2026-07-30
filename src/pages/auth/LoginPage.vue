<template>
  <div class="full-width flex column items-center">

    <div class="row items-center justify-center q-mb-lg">
      <div class="text-h6 text-white text-weight-bolder" style="letter-spacing: -0.5px;">accommo</div>
      <div class="admin-badge q-ml-sm text-weight-bold">ADMIN</div>
    </div>

    <q-card class="login-card full-width shadow-15" flat bordered>
      <q-card-section class="q-pa-md q-pt-lg">
        <h4 class="text-white text-h6 text-weight-bold q-mt-none q-mb-xs">Sign in</h4>
        <p class="text-caption q-mb-lg" style="color: #7b8390;">OSAS Staff Portal · ISU Echague</p>

        <q-form @submit.prevent="handleLogin" ref="loginFormRef">
          <AuthInput v-model="email" label="Email" :rules="[(val: string) => !!val || 'Email is required', (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Enter a valid email address']">
            <template #prepend><Icon icon="mdi:email-outline" width="18" height="18" color="#9e9e9e" /></template>
          </AuthInput>

          <AuthInput v-model="password" :type="showPassword ? 'text' : 'password'" label="Password" class="q-mt-sm"
            :rules="[(val: string) => !!val || 'Password is required']">
            <template #prepend><Icon icon="mdi:lock-outline" width="18" height="18" color="#9e9e9e" /></template>
            <template #append>
              <Icon :icon="showPassword ? 'mdi:eye' : 'mdi:eye-off'" class="cursor-pointer" color="#9e9e9e"
                width="18" height="18" @click="showPassword = !showPassword" />
            </template>
          </AuthInput>

          <AuthButton type="submit" :loading="loading" class="q-mt-lg">
            Sign In
            <Icon icon="mdi:arrow-right" width="16" height="16" class="q-ml-sm" />
          </AuthButton>
        </q-form>
      </q-card-section>
    </q-card>

    <div class="footer-text q-mt-lg text-center">
      © 2026 Accommo · Restricted access
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QForm } from 'quasar';
import { useAuthStore } from '@/stores/auth';

import AuthInput from '@/components/auth/AuthInput.vue';
import AuthButton from '@/components/auth/AuthButton.vue';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const loginFormRef = ref<QForm | null>(null);

async function handleLogin() {
  if (!loginFormRef.value) return;
  const success = await loginFormRef.value.validate();
  if (!success) {
    $q.notify({ message: 'Please enter your email and password.', position: 'top', color: 'grey-9', textColor: 'white',     icon: 'alert', iconColor: 'amber-4', classes: 'custom-notify' });
    return;
  }

  try {
    loading.value = true;
    await authStore.login(email.value, password.value);

    $q.notify({ message: 'Welcome back!', position: 'top', color: 'grey-9', textColor: 'white',     icon: 'check-circle', iconColor: 'teal-4', classes: 'custom-notify' });
    void router.push('/dashboard');
  } catch (error: unknown) {
    $q.notify({ message: error instanceof Error ? error.message : 'An unexpected error occurred', position: 'top', color: 'grey-9', textColor: 'white',     icon: 'alert-outline', iconColor: 'red-4', classes: 'custom-notify' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.admin-badge {
  background-color: #06393b;
  color: #12c299;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 8px;
  letter-spacing: 0.5px;
}

.login-card {
  background-color: #1e232b;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 360px;
  /* Made the card narrower */
  width: 100%;
}

.footer-text {
  color: #4b5563;
  font-size: 11px;
}
</style>
<style>
.custom-notify {
  border-radius: 20px !important;
  padding: 10px 20px !important;
  font-weight: 500;
}
</style>
