<template>
  <q-layout view="lHh Lpr lFf" style="background-color: #f5f5f5;">

    <Sidebar />

    <q-header class="bg-white text-dark custom-header-shadow">
      <q-toolbar class="q-py-sm q-px-md">

        <div class="column q-ml-sm">
          <div class="text-h6 text-weight-bold" style="line-height: 1.2;">
            {{ route.meta.title || 'Accommo' }}
          </div>
          <div class="text-caption text-grey-6" style="line-height: 1;">
            {{ route.meta.subtitle || 'OSAS Administration Panel' }}
          </div>
        </div>

        <q-space />

        <div class="row items-center q-gutter-x-lg q-pr-md">
          <HeaderNotification />
          <HeaderProfile />
        </div>

      </q-toolbar>
    </q-header>

    <q-page-container>
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
.custom-header-shadow {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04) !important;
}
</style>
