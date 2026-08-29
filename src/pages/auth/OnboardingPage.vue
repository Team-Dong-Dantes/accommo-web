<template>
  <div class="full-width flex column items-center">
    <div class="row items-center justify-center q-mb-lg">
      <div class="text-h6 text-white text-weight-bolder" style="letter-spacing: -0.5px;">accommo</div>
      <div class="admin-badge q-ml-sm text-weight-bold">ADMIN</div>
    </div>

    <q-card class="onboard-card full-width shadow-15" flat bordered>
      <q-card-section class="q-pa-md q-pt-lg">
        <h4 class="text-white text-h6 text-weight-bold q-mt-none q-mb-xs">Complete your profile</h4>
        <p class="text-caption q-mb-lg" style="color: #7b8390;">
          Welcome to Accommo. Set your name so the team knows who you are.
        </p>

        <q-form @submit.prevent="submit" ref="formRef">
          <AuthInput v-model="fullName" label="Full name"
            :rules="[(val: string) => !!val.trim() || 'Please enter your full name']">
            <template #prepend><Icon icon="mdi:account-outline" width="18" height="18" color="#9e9e9e" /></template>
          </AuthInput>

          <AuthInput v-model="phone" label="Phone number (optional)" class="q-mt-sm">
            <template #prepend><Icon icon="mdi:phone-outline" width="18" height="18" color="#9e9e9e" /></template>
          </AuthInput>

          <AuthButton type="submit" :loading="saving" class="q-mt-lg">
            Finish setup
            <Icon icon="mdi:arrow-right" width="16" height="16" class="q-ml-sm" />
          </AuthButton>
        </q-form>

        <div class="text-center q-mt-md">
          <q-btn flat dense no-caps class="text-grey-6 text-caption" @click="logout">
            Sign out
          </q-btn>
        </div>
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
import { supabase } from '@/utils/supabase';
import AuthInput from '@/components/auth/AuthInput.vue';
import AuthButton from '@/components/auth/AuthButton.vue';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

const fullName = ref('');
const phone = ref('');
const saving = ref(false);
const formRef = ref<QForm | null>(null);

function initialsFrom(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

async function submit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate();
  if (!valid) return;

  const user = authStore.user;
  if (!user) {
    $q.notify({ message: 'Your session expired. Please sign in again.', position: 'top', color: 'grey-9', textColor: 'white', icon: 'mdi-alert-circle', iconColor: 'amber-4', classes: 'custom-notify' });
    void router.push('/auth/login');
    return;
  }

  saving.value = true;
  try {
    const { error } = await supabase
      .from('users')
      .update({
        full_name: fullName.value.trim(),
        phone: phone.value.trim(),
        initials: initialsFrom(fullName.value),
        onboarding_complete: true,
      })
      .eq('id', user.id);

    if (error) throw error;

    await authStore.loadProfileById(user.id);
    $q.notify({ message: 'Profile complete. Welcome aboard!', position: 'top', color: 'grey-9', textColor: 'white', icon: 'mdi-check-circle', iconColor: 'teal-4', classes: 'custom-notify' });
    void router.push('/dashboard');
  } catch (e) {
    $q.notify({ message: e instanceof Error ? e.message : 'Could not save your profile.', position: 'top', color: 'grey-9', textColor: 'white', icon: 'mdi-close-circle', iconColor: 'red-4', classes: 'custom-notify' });
  } finally {
    saving.value = false;
  }
}

async function logout() {
  await authStore.logout();
  void router.push('/auth/login');
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

.onboard-card {
  background-color: #1e232b;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 360px;
  width: 100%;
}

.footer-text {
  color: #4b5563;
  font-size: 11px;
}
</style>
