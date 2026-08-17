<template>
  <q-drawer :model-value="true" :mini="miniState" @mouseenter="miniState = false" @mouseleave="miniState = true"
    :width="248" :mini-width="68" :breakpoint="0" mini-to-overlay class="sidebar-bg">
    <div class="column full-height no-wrap">

      <!-- Brand header -->
      <div class="sb-header row items-center no-wrap">
        <img class="sb-logo" src="/accommo-logo.svg" alt="Accommo">
        <div class="sb-brand hide-on-mini">
          <div class="sb-brand-name">accommo</div>
          <div class="sb-brand-sub">OSAS Admin</div>
        </div>
      </div>

      <!-- Search / command trigger -->
      <div class="sb-search-wrap q-px-sm">
        <button class="sb-search hide-on-mini" type="button" @click="paletteOpen = true">
          <Icon icon="mdi:magnify" width="18" height="18" class="sb-search-magnify" />
          <span class="sb-search-text">Search…</span>
          <kbd class="sb-kbd">{{ kbdHint }}</kbd>
        </button>
        <button class="sb-search-fab show-on-mini" type="button" title="Search (⌘K)" @click="paletteOpen = true">
          <Icon icon="mdi:magnify" width="20" height="20" />
        </button>
      </div>

      <q-scroll-area class="col">
        <div class="column justify-center" style="min-height: 100%;">
          <q-list class="menu-list q-py-md">

            <!-- Standalone: Dashboard -->
            <q-item clickable v-ripple exact to="/dashboard" active-class="active-menu" class="nav-item">
              <q-item-section avatar class="item-icon">
                <Icon icon="mdi:view-dashboard-outline" width="22" height="22" />
              </q-item-section>
              <q-item-section class="nav-text text-weight-bold hide-on-mini">Dashboard</q-item-section>
            </q-item>

            <!-- Expandable groups -->
            <template v-for="group in navGroups" :key="group.id">
              <q-item clickable v-ripple class="nav-item q-mt-sm"
                :class="{ 'active-menu': (miniState || !expanded[group.id]) && isParentActive(group.children.map(c => c.to)) }"
                @click="toggle(group.id)">
                <q-item-section avatar class="item-icon">
                  <Icon :icon="group.icon" width="22" height="22" />
                </q-item-section>
                <q-item-section class="nav-text text-weight-bold hide-on-mini">{{ group.label }}</q-item-section>
                <q-item-section side class="hide-on-mini q-pr-sm">
                  <Icon :icon="expanded[group.id] ? 'mdi:chevron-up' : 'mdi:chevron-down'" color="white" width="18"
                    height="18" />
                </q-item-section>
              </q-item>

              <div class="hide-on-mini">
                <q-slide-transition>
                  <div v-show="expanded[group.id]">
                    <q-item v-for="child in group.children" :key="child.id" clickable v-ripple exact :to="child.to"
                      active-class="active-menu" class="nav-item child-item">
                      <q-item-section avatar class="item-icon">
                        <Icon :icon="child.icon" width="20" height="20" />
                      </q-item-section>
                      <q-item-section class="nav-text text-weight-bold">{{ child.label }}</q-item-section>
                    </q-item>
                  </div>
                </q-slide-transition>
              </div>
            </template>

          </q-list>
        </div>
      </q-scroll-area>
    </div>

    <CommandPalette v-model="paletteOpen" />
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { navGroups } from './nav-config';
import CommandPalette from '@/components/ui/CommandPalette.vue';

const miniState = ref(true);
const route = useRoute();
const paletteOpen = ref(false);

const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const kbdHint = isMac ? '⌘K' : 'Ctrl K';

const expanded = reactive<Record<string, boolean>>(
  Object.fromEntries(navGroups.map(g => [g.id, false]))
);

function toggle(section: string) {
  const wasOpen = expanded[section];
  for (const g of navGroups) expanded[g.id] = false;
  if (!wasOpen) expanded[section] = true;
}

function isParentActive(paths: string[]) {
  return paths.includes(route.path);
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    paletteOpen.value = true;
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<style>
.sidebar-bg {
  background: linear-gradient(180deg, var(--c-sidebar-bg) 0%, var(--c-sidebar-bg-2) 100%) !important;
  color: var(--c-sidebar-text) !important;
  overflow-x: hidden;
  box-shadow: none !important;
}

/* Quasar renders its own drawer shadow inside the drawer (.q-layout__shadow);
   hide it so we control the shadow ourselves below */
.q-drawer .q-layout__shadow {
  display: none !important;
}

/* Custom shadow only when the drawer ROOT is expanded (not in mini state).
   NOTE: `sidebar-bg` lands on the inner content div, while `q-drawer--mini`
   is on the root <aside>, so we must key off the root element. */
.q-drawer:not(.q-drawer--mini) .sidebar-bg {
  box-shadow: var(--c-sidebar-shadow) !important;
}

.sb-header {
  padding: 22px 0 14px 18px;
  gap: 12px;
}

.sb-logo {
  height: 30px;
  width: auto;
  color: #ffffff;
}

.sb-brand {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.15;
}

.sb-brand-name {
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  font-family: var(--font-display);
}

.sb-brand-sub {
  color: var(--c-sidebar-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* ----- Search trigger ----- */
.sb-search-wrap {
  padding-bottom: 10px;
}

.sb-search {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 12px;
  background: var(--c-sidebar-search-bg);
  border: 1px solid var(--c-sidebar-search-border);
  color: var(--c-sidebar-muted);
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;
  font-family: var(--font-body);
}

.sb-search:hover {
  background: var(--c-sidebar-hover);
  border-color: rgba(255, 255, 255, 0.18);
}

.sb-search-magnify {
  flex-shrink: 0;
}

.sb-search-text {
  flex: 1;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
}

.sb-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 18px;
  padding: 0 6px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--c-sidebar-muted);
  line-height: 1;
}

/* In mini mode, show only the icon button */
.show-on-mini {
  display: none;
}

.q-drawer--mini .hide-on-mini {
  display: none !important;
}

.q-drawer--mini .show-on-mini {
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.q-drawer--mini .sb-search-wrap {
  display: flex;
  justify-content: center;
  padding: 0 0 10px;
}

.q-drawer--mini .sb-search-fab {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--c-sidebar-search-bg);
  border: 1px solid var(--c-sidebar-search-border);
  color: var(--c-sidebar-text);
  align-items: center;
  justify-content: center;
}

.q-drawer--mini .sb-search-fab:hover {
  background: var(--c-sidebar-hover);
}

/* ----- Nav items ----- */
.menu-list {
  padding: 0;
}

.nav-item {
  border-radius: 14px !important;
  margin: 4px 10px !important;
  padding: 0 0 0 8px !important;
  height: 46px !important;
  min-height: 46px !important;
  color: var(--c-sidebar-text);
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  transition: background 0.18s ease, color 0.18s ease;
}

.nav-item:not(.active-menu):hover {
  background: var(--c-sidebar-hover);
}

.item-icon {
  min-width: 24px !important;
  width: 24px !important;
  padding: 0 !important;
  margin-right: 12px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.item-icon .q-icon {
  font-size: 22px !important;
}

.nav-text {
  font-size: 13px;
  white-space: nowrap;
  padding-left: 0;
  opacity: 1;
  transition: opacity 0.2s ease;
}

/* ----- Active state: pill + left accent bar ----- */
.active-menu {
  position: relative;
  background-color: var(--c-sidebar-active-bg) !important;
  color: var(--c-sidebar-active-text) !important;
  border-radius: 14px !important;
  margin-right: 10px !important;
  font-weight: 700;
}

.q-drawer--mini .active-menu {
  border-radius: 14px 0 0 14px !important;
  margin-right: 0 !important;
}

/* ----- Child items ----- */
.child-item {
  margin-left: 28px !important;
  height: 40px !important;
  min-height: 40px !important;
}

.child-item .item-icon .q-icon {
  font-size: 18px !important;
}

.child-item .nav-text {
  font-size: 12px;
  font-weight: 600;
}

.q-drawer--mini .nav-item {
  justify-content: flex-start !important;
}
</style>
