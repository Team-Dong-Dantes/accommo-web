<template>
  <q-layout view="lHh Lpr lFf" class="app-shell">

    <Sidebar />

    <q-header class="bg-transparent text-ink">
      <q-toolbar class="q-py-sm q-px-md">
        <div class="text-h5 text-weight-bold q-ml-sm" style="line-height: 1.2; font-family: var(--font-display);">
          {{ route.meta.title || 'Accommo' }}
        </div>

        <q-space />

        <div class="row items-center q-gutter-x-md q-pr-sm">
          <HeaderNotification />
          <HeaderProfile />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container class="relative-position">
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import Sidebar from '@/components/common/Sidebar.vue'
import HeaderNotification from '@/components/common/Notification.vue'
import HeaderProfile from '@/components/common/Profile.vue'

const route = useRoute()
</script>

<style scoped>
.app-shell {
  background-color: var(--c-bg);
}
</style>
