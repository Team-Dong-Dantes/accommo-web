<template>
  <!-- The wordmark and the standing line live in AuthLayout now; both auth
       screens were rendering their own copy. -->
  <div class="onboard">
    <header class="onboard-head">
      <h1>Complete your profile</h1>
      <p>Set your name so the rest of the team knows who acted on a record.</p>
    </header>

    <q-form @submit.prevent="submit" ref="formRef" class="onboard-form">
      <label class="field">
        <span class="field-label">Full name</span>
        <AuthInput v-model="fullName" autocomplete="name"
          :rules="[(val: string) => !!val.trim() || 'Please enter your full name']">
          <template #prepend><Icon icon="lucide:user" width="18" height="18" /></template>
        </AuthInput>
      </label>

      <label class="field">
        <span class="field-label">Phone number <span class="field-optional">optional</span></span>
        <AuthInput v-model="phone" autocomplete="tel">
          <template #prepend><Icon icon="lucide:phone" width="18" height="18" /></template>
        </AuthInput>
      </label>

      <div class="onboard-actions">
        <AuthButton type="submit" :loading="saving">Finish setup</AuthButton>
      </div>
    </q-form>

    <p class="onboard-foot">
      Signed in as the wrong account?
      <button type="button" class="onboard-signout" @click="logout">Sign out</button>
    </p>
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
/* Light type — this screen shares AuthLayout's glass panel with the sign-in. */
.onboard-head h1 {
  margin: 0;
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 1.95rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.onboard-head p {
  max-width: 34ch;
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.9rem;
  line-height: 1.5;
}

.onboard-form {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field { display: block; }
.field-label {
  display: block;
  margin-bottom: 7px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.82rem;
  font-weight: 600;
}
.field-optional {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 400;
}

.onboard-actions { margin-top: 10px; }

.onboard-foot {
  margin: 26px 0 0;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.78rem;
}
.onboard-signout {
  padding: 2px 4px;
  border: 0;
  border-radius: 5px;
  background: none;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.onboard-signout:hover { color: rgba(255, 255, 255, 0.8); }
.onboard-signout:focus-visible { outline: 2px solid rgba(255, 255, 255, 0.85); outline-offset: 1px; }
</style>
