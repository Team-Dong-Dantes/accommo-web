<template>
  <!-- The wordmark and the standing line live in AuthLayout now; both auth
       screens were rendering their own copy. -->
  <div class="onboard">
    <!-- While the Google chooser is on its way the form would only flash past,
         so the page says what it is doing instead. -->
    <template v-if="connecting">
      <header class="onboard-head">
        <h1>Connecting your Google account</h1>
        <p>Choose the account you want to use for Accommo.</p>
      </header>
      <div class="onboard-connecting">
        <q-spinner size="22px" />
      </div>
    </template>

    <template v-else>
      <header class="onboard-head">
        <div v-if="photo" class="onboard-photo">
          <img :src="photo" alt="" />
        </div>
        <h1>Complete your profile</h1>
        <p v-if="photo">Your name and photo came from the Google account you just connected. Change the name if it isn't how you want to appear.</p>
        <p v-else>Set your name so the rest of the team knows who acted on a record.</p>
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

        <!-- Same five rules as accommo-mobile's registration, so one password
             policy covers the whole product. -->
        <label class="field">
          <span class="field-label">Password</span>
          <AuthInput v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password"
            :rules="[
              (val: string) => !!val || 'Password is required',
              (val: string) => val.length >= 8 || 'At least 8 characters',
              (val: string) => /[a-z]/.test(val) || 'Must include a lowercase letter',
              (val: string) => /[A-Z]/.test(val) || 'Must include an uppercase letter',
              (val: string) => /\d/.test(val) || 'Must include a number',
              (val: string) => /[!@#$%^&*]/.test(val) || 'Must include a special character (!@#$%^&*)',
            ]">
            <template #prepend><Icon icon="lucide:lock" width="18" height="18" /></template>
            <template #append>
              <button type="button" class="reveal" :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword">
                <Icon :icon="showPassword ? 'lucide:eye-off' : 'lucide:eye'" width="18" height="18" />
              </button>
            </template>
          </AuthInput>
        </label>

        <div class="pw-checks">
          <span v-for="item in passwordChecks" :key="item.short" class="pw-chip" :class="{ ok: item.ok }">
            <Icon :icon="item.ok ? 'lucide:check' : 'lucide:minus'" width="12" height="12" />
            {{ item.short }}
          </span>
        </div>

        <label class="field">
          <span class="field-label">Confirm password</span>
          <AuthInput v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" autocomplete="new-password"
            :rules="[
              (val: string) => !!val || 'Please confirm your password',
              (val: string) => val === password || 'Passwords do not match',
            ]">
            <template #prepend><Icon icon="lucide:lock" width="18" height="18" /></template>
            <template #append>
              <button type="button" class="reveal" :aria-label="showConfirm ? 'Hide password' : 'Show password'"
                @click="showConfirm = !showConfirm">
                <Icon :icon="showConfirm ? 'lucide:eye-off' : 'lucide:eye'" width="18" height="18" />
              </button>
            </template>
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirm = ref(false);
const saving = ref(false);
const connecting = ref(false);
const photo = ref('');
const formRef = ref<QForm | null>(null);

// Mirrors accommo-mobile's RegisterPage chips: the same five rules shown as a
// row of short chips rather than a list of error messages that only appear
// once you have already got it wrong.
const passwordChecks = computed(() => {
  const pwd = password.value;
  return [
    { short: '8+ characters', ok: pwd.length >= 8 },
    { short: 'a–z', ok: /[a-z]/.test(pwd) },
    { short: 'A–Z', ok: /[A-Z]/.test(pwd) },
    { short: '0–9', ok: /\d/.test(pwd) },
    { short: '!@#$%^&*', ok: /[!@#$%^&*]/.test(pwd) },
  ];
});

// Survives the full page load that linkIdentity's redirect causes, which a
// module-scoped ref would not. Per tab, so it clears itself.
const LINK_TRIED_KEY = 'accommo.googleLinkTried';

/**
 * Accepting the invite is meant to connect the admin's Google account, so the
 * chooser opens on arrival rather than waiting behind a button. Google still
 * requires them to pick an account and consent — that part cannot be silent —
 * but they never have to find or click anything here.
 *
 * Runs at most once per tab: dismissing the chooser returns them to this same
 * page, and re-triggering would trap them in a redirect loop. The typed-name
 * form is the fallback for that case, and for any failure — a profile photo is
 * never worth blocking someone out of their own account over.
 */
onMounted(async () => {
  try {
    const googleName = await authStore.syncGoogleProfile();
    if (googleName || authStore.user?.avatar_url) {
      // Only ever prefill a real name. `full_name` still holds the email
      // address invite-admin parked there to satisfy the NOT NULL column, and
      // offering that as their display name is worse than an empty field.
      fullName.value = googleName ?? '';
      photo.value = authStore.user?.avatar_url ?? '';
      return;
    }
  } catch {
    // Nothing linked, or the identity lookup failed. Fall through.
  }

  if (sessionStorage.getItem(LINK_TRIED_KEY)) return;

  // No address to hint with means Google would just show its chooser, which is
  // the thing this flow exists to avoid. Let them type their name instead.
  const invitedEmail = authStore.user?.email;
  if (!invitedEmail) return;

  connecting.value = true;
  try {
    sessionStorage.setItem(LINK_TRIED_KEY, '1');
    await authStore.connectGoogle(invitedEmail);
  } catch (e) {
    connecting.value = false;
    $q.notify({ message: e instanceof Error ? e.message : 'Could not connect Google. Fill in your name instead.', position: 'top', color: 'grey-9', textColor: 'white', icon: 'mdi-alert-circle', iconColor: 'amber-4', classes: 'custom-notify' });
  }
});

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
    // Password first. If it fails the row keeps onboarding_complete = false, so
    // the guard sends them back here rather than leaving an admin who looks set
    // up but can only ever get in by magic link.
    const { error: passwordError } = await supabase.auth.updateUser({
      password: password.value,
    });
    if (passwordError) throw passwordError;

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

.onboard-photo {
  width: 64px;
  height: 64px;
  margin-bottom: 14px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 50%;
  overflow: hidden;
}
.onboard-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.onboard-connecting {
  margin-top: 28px;
  color: rgba(255, 255, 255, 0.76);
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

/* A row of chips attached to the field they describe — same treatment as
   accommo-mobile's registration, a fifth of the height of a bullet list. */
.pw-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: -6px;
}
.pw-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.72rem;
  font-weight: 600;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}
.pw-chip.ok {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.5);
  color: #ffffff;
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
.reveal:hover { color: rgba(255, 255, 255, 0.9); }

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
