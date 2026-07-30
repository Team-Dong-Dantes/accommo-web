<template>
  <q-layout view="hHh lpr fFf">
    <q-header class="head" :class="{ scrolled }">
      <div class="container head-inner">
        <div class="brand text-weight-bold text-teal-8 row items-center">
          <span class="brand-mark"><Icon icon="mdi:domain" width="18" height="18" /></span>
          Accommo
        </div>

        <nav class="gt-sm nav">
          <a href="#how">How it works</a>
          <a href="#faq">Questions</a>
        </nav>

        <div class="head-actions">
          <q-btn unelevated class="get-app gt-xs" href="/accommo.apk" download>Get the app</q-btn>

          <q-btn
            flat
            round
            dense
            class="menu-btn lt-md"
            @click="menu = true"
            aria-label="Open menu"
          >
            <Icon icon="mdi:menu" width="22" height="22" />
          </q-btn>
          <q-menu v-model="menu" anchor="bottom right" self="top right" class="mobile-menu">
            <q-list style="min-width: 210px">
              <q-item clickable v-close-popup href="#how"><q-item-section>How it works</q-item-section></q-item>
              <q-item clickable v-close-popup href="#faq"><q-item-section>Questions</q-item-section></q-item>
              <q-separator />
              <q-item clickable v-close-popup href="/accommo.apk" download class="menu-cta"><q-item-section>Get the app</q-item-section></q-item>
            </q-list>
          </q-menu>
        </div>
      </div>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const scrolled = ref(false);
const menu = ref(false);
function onScroll() { scrolled.value = window.scrollY > 12; }
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<style scoped>
.head {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid transparent;
  transition: box-shadow 0.25s ease, border-color 0.25s ease, padding 0.25s ease;
}
.head.scrolled {
  box-shadow: 0 6px 24px rgba(22, 32, 29, 0.07);
  border-bottom: 1px solid #eef3f2;
}
.container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 clamp(18px, 4vw, 32px);
  width: 100%;
}
.head-inner {
  display: flex;
  align-items: center;
  gap: clamp(12px, 2vw, 22px);
  padding-top: 14px;
  padding-bottom: 14px;
  transition: padding 0.25s ease;
}
.head.scrolled .head-inner { padding-top: 9px; padding-bottom: 9px; }

.brand { font-size: 1.2rem; display: flex; align-items: center; gap: 9px; }
.brand-mark {
  width: 30px; height: 30px; border-radius: 9px;
  background: linear-gradient(135deg, #0e8b7d, #0a5f55);
  color: #fff; display: grid; place-items: center;
}
.nav { display: flex; gap: clamp(16px, 2vw, 28px); margin-left: clamp(8px, 1.5vw, 18px); }
.nav a {
  color: #4a5a61; font-weight: 500; font-size: 0.94rem;
  text-decoration: none; transition: color 0.15s ease;
}
.nav a:hover { color: #0a5f55; }

.head-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.get-app {
  background: linear-gradient(135deg, #0e8b7d 0%, #0a5f55 100%);
  color: #fff; font-weight: 600; border-radius: 11px; padding: 8px 18px;
  box-shadow: 0 8px 18px rgba(14, 139, 125, 0.25);
}
.get-app:hover { transform: translateY(-1px); }
.menu-btn { color: #0a5f55; }

.mobile-menu .q-item { font-weight: 500; }
.mobile-menu .menu-cta { color: #0a5f55; font-weight: 700; }
</style>
