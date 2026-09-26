<template>
  <div
    class="row items-center no-wrap cursor-pointer profile-capsule"
    :class="{ 'is-open': menuOpen }"
    tabindex="0"
  >

    <q-avatar size="42px" font-size="18px" color="primary" text-color="white" class="text-weight-bold">
      <img v-if="authStore.user?.avatar_url" :src="authStore.user.avatar_url" :alt="authStore.user.full_name" />
      <template v-else>{{ authStore.user?.initials || 'MA' }}</template>
    </q-avatar>

    <div class="column q-ml-sm q-mr-xs">
      <div class="text-weight-bold ellipsis" style="font-size: 14px; line-height: 1.15; max-width: 150px;">
        {{ authStore.user?.full_name || 'Maria Admin' }}
      </div>
      <div class="ellipsis" style="font-size: 11px; font-weight: 600; max-width: 150px;">
        {{ authStore.roleLabel(authStore.user?.role || 'admin') }}
      </div>
    </div>

    <span class="menu-chevron">
      <Icon icon="lucide:chevron-down" width="18" height="18" />
    </span>

    <q-menu anchor="bottom right" self="top right" :offset="[0, 12]"
      class="profile-menu" transition-show="jump-down" transition-hide="jump-up"
      v-model="menuOpen">
      <q-list class="q-py-xs">
        <q-item clickable v-ripple to="/settings" class="menu-row">
          <q-item-section avatar class="menu-ico">
            <Icon icon="lucide:settings" width="20" height="20" class="text-muted" />
          </q-item-section>
          <q-item-section class="menu-label">Settings</q-item-section>
        </q-item>

        <q-item clickable v-ripple class="menu-row" @click="onToggleDark(!darkMode)">
          <q-item-section avatar class="menu-ico">
            <Icon icon="lucide:moon" width="20" height="20" class="text-muted" />
          </q-item-section>
          <q-item-section class="menu-label">Dark mode</q-item-section>
          <q-item-section side>
            <q-toggle :model-value="darkMode" color="primary" dense @update:model-value="onToggleDark" @click.stop />
          </q-item-section>
        </q-item>

        <q-separator class="q-my-xs" inset />

        <q-item clickable v-ripple @click="handleLogout" class="menu-row">
          <q-item-section avatar class="menu-ico">
            <Icon icon="lucide:log-out" width="20" height="20" color="#ef5350" />
          </q-item-section>
          <q-item-section class="menu-label text-danger text-weight-bold">Sign Out</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotify } from '@/utils/notify';
import { getStoredTheme, setStoredTheme } from '@/utils/theme';

const router = useRouter();
const authStore = useAuthStore();
const { error: notifyError } = useNotify();

const menuOpen = ref(false);

const darkMode = ref(getStoredTheme() === 'dark');
function onToggleDark(value: boolean) {
  darkMode.value = value;
  setStoredTheme(value ? 'dark' : 'light');
}

async function handleLogout() {
  try {
    await authStore.logout();
    void router.push('/login');
  } catch {
    notifyError('Error signing out');
  }
}
</script>

<style scoped>
.profile-capsule {
  border-radius: 999px !important;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  padding: 4px 12px 4px 4px;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  color: var(--c-text);
}

.profile-capsule:hover,
.profile-capsule.is-open,
.profile-capsule:focus-within {
  border-color: var(--c-primary);
  background: var(--c-primary-soft);
}

.profile-capsule:hover .menu-chevron,
.profile-capsule.is-open .menu-chevron,
.profile-capsule:focus-within .menu-chevron {
  color: var(--c-primary);
}

.profile-capsule:focus-visible {
  outline: 3px solid var(--c-primary);
  outline-offset: 2px;
}

.menu-chevron {
  color: var(--c-muted);
  display: inline-flex;
  margin-left: 4px;
}

/* :global — QMenu teleports its content to <body>, outside this component's
   scope. Gray to match the table header and pagination bar. */
:global(.profile-menu) {
  overflow: hidden;
  background: var(--c-surface-2) !important;
}

.menu-row {
  border-radius: 10px !important;
  margin: 2px 8px !important;
  padding: 0 10px !important;
  min-height: 42px !important;
}

/* The menu itself is surface-2 now, so hover steps one shade further. */
.menu-row:hover {
  background: var(--c-border);
}

.menu-ico {
  min-width: 24px !important;
  width: 24px !important;
  padding: 0 !important;
  margin-right: 12px !important;
  display: flex !important;
  justify-content: center !important;
}

.menu-label {
  font-size: 13px;
  font-weight: 600;
}
</style>
