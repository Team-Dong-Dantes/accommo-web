<template>
  <q-layout view="lHh Lpr lFf" class="app-shell">

    <Sidebar />

    <q-header class="bg-transparent text-ink app-header" :class="{ 'is-scrolled': scrolled }">
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/layout/AppSidebar.vue'
import HeaderNotification from '@/components/ui/Notification.vue'
import HeaderProfile from '@/components/layout/UserMenu.vue'

const route = useRoute()

const scrolled = ref(false)
function onScroll() {
  const container = document.querySelector('.q-page-container') as HTMLElement | null
  const top = Math.max(window.scrollY || 0, container?.scrollTop || 0)
  scrolled.value = top > 8
}
onMounted(() => {
  window.addEventListener('scroll', onScroll, true)
  document.querySelector('.q-page-container')?.addEventListener('scroll', onScroll)
  onScroll()
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll, true)
  document.querySelector('.q-page-container')?.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.app-shell {
  background-color: var(--c-bg);
}
.app-header {
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background-color .25s ease, backdrop-filter .25s ease,
    -webkit-backdrop-filter .25s ease, box-shadow .25s ease, border-color .25s ease;
}
.app-header.is-scrolled {
  background: color-mix(in srgb, var(--c-bg) 72%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  backdrop-filter: blur(14px) saturate(140%);
  border-bottom-color: var(--c-border);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}
</style>
