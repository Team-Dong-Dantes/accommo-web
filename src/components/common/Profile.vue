<template>
  <div class="row items-center no-wrap cursor-pointer q-pa-xs rounded-borders hover-bg">

    <q-avatar size="48px" color="teal-7" text-color="white" class="text-weight-bold" style="font-size: 30px;">
      MA
    </q-avatar>

    <div class="column q-ml-sm q-mr-xs">
      <div class="text-weight-bold text-dark" style="font-size: 15px; line-height: 1.1;">Maria Admin</div>
      <div class="text-grey-6" style="font-size: 12px; font-weight: 600;">Administrator</div>
    </div>

    <q-menu anchor="bottom right" self="top right" :offset="[0, 10]"
      style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
      <q-list style="min-width: 200px" class="q-py-sm">

        <q-item clickable v-ripple to="/profile" class="q-py-md">
          <q-item-section avatar style="min-width: 0; padding-right: 14px;">
            <Icon icon="mdi:account-outline" width="22" height="22" color="#424242" />
          </q-item-section>
          <q-item-section class="text-weight-bold text-grey-8" style="font-size: 13px;">My Profile</q-item-section>
        </q-item>

        <q-separator class="q-my-xs" inset />

        <q-item clickable v-ripple @click="handleLogout" class="q-py-md">
          <q-item-section avatar style="min-width: 0; padding-right: 14px;">
            <Icon icon="mdi:logout" width="22" height="22" color="#ef5350" />
          </q-item-section>
          <q-item-section class="text-red-5 text-weight-bold" style="font-size: 13px;">Sign Out</q-item-section>
        </q-item>

      </q-list>
    </q-menu>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useQuasar } from 'quasar';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

async function handleLogout() {
  try {
    await authStore.logout();
    void router.push('/login');
  } catch (error) {
    $q.notify({ message: 'Error signing out', color: 'red', position: 'top' });
  }
}
</script>

<style scoped>
.hover-bg {
  transition: background 0.2s ease;
  padding-right: 8px;
}

.hover-bg:hover {
  background: rgba(0, 0, 0, 0.04);
}
</style>
