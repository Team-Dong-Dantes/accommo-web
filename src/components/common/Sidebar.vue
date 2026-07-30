<template>
  <q-drawer :model-value="true" :mini="miniState" @mouseenter="miniState = false" @mouseleave="miniState = true"
    :width="200" :mini-width="60" :breakpoint="0" mini-to-overlay class="sidebar-bg">
    <div class="column full-height no-wrap">

      <div class="header-container row items-center no-wrap">
        <div class="logo-circle flex flex-center shrink-0">
          <Icon icon="mdi:domain" width="18" height="18" class="text-teal-9" />
        </div>
        <div class="q-ml-sm column justify-center hide-on-mini" style="transition: opacity 0.2s;">
          <div class="text-white text-weight-bold" style="font-size: 15px; line-height: 1.1">accommo</div>
          <div class="text-light-teal" style="font-size: 11px;">OSAS Admin</div>
        </div>
      </div>

      <q-scroll-area class="col">
        <div class="column justify-center" style="min-height: 100%;">
          <q-list class="menu-list q-py-md">

            <q-item clickable v-ripple exact to="/dashboard" active-class="active-menu" class="nav-item">
              <q-item-section avatar class="item-icon"><Icon icon="mdi:view-dashboard-outline" width="22" height="22" /></q-item-section>
              <q-item-section class="nav-text text-weight-bold hide-on-mini">Dashboard</q-item-section>
            </q-item>

            <q-item clickable v-ripple class="nav-item q-mt-sm"
              :class="{ 'active-menu': (miniState || !expanded.users) && isParentActive(['/users', '/verifications']) }"
              @click="toggle('users')">
              <q-item-section avatar class="item-icon"><Icon icon="mdi:account-supervisor-outline" width="22" height="22" /></q-item-section>
              <q-item-section class="nav-text text-weight-bold hide-on-mini">Users</q-item-section>
              <q-item-section side class="hide-on-mini q-pr-sm">
                <Icon :icon="expanded.users ? 'mdi:chevron-up' : 'mdi:chevron-down'" color="white" width="18" height="18" />
              </q-item-section>
            </q-item>

            <div class="hide-on-mini">
              <q-slide-transition>
                <div v-show="expanded.users">
                  <q-item clickable v-ripple exact to="/users" active-class="active-menu" class="nav-item child-item">
                    <q-item-section avatar class="item-icon"><Icon icon="mdi:account-outline" width="22" height="22" /></q-item-section>
                    <q-item-section class="nav-text text-weight-bold">Users List</q-item-section>
                  </q-item>
                  <q-item clickable v-ripple exact to="/verifications" active-class="active-menu"
                    class="nav-item child-item">
                    <q-item-section avatar class="item-icon"><Icon icon="mdi:how-to-reg" width="22" height="22" /></q-item-section>
                    <q-item-section class="nav-text text-weight-bold">Verification</q-item-section>
                  </q-item>
                </div>
              </q-slide-transition>
            </div>

            <q-item clickable v-ripple class="nav-item q-mt-sm"
              :class="{ 'active-menu': (miniState || !expanded.properties) && isParentActive(['/map-view', '/property-hub']) }"
              @click="toggle('properties')">
              <q-item-section avatar class="item-icon"><Icon icon="mdi:home-city-outline" width="22" height="22" /></q-item-section>
              <q-item-section class="nav-text text-weight-bold hide-on-mini">Properties</q-item-section>
              <q-item-section side class="hide-on-mini q-pr-sm">
                <Icon :icon="expanded.properties ? 'mdi:chevron-up' : 'mdi:chevron-down'" color="white" width="18" height="18" />
              </q-item-section>
            </q-item>

            <div class="hide-on-mini">
              <q-slide-transition>
                <div v-show="expanded.properties">
                  <q-item clickable v-ripple exact to="/map-view" active-class="active-menu"
                    class="nav-item child-item">
                    <q-item-section avatar class="item-icon"><Icon icon="mdi:map-outline" width="22" height="22" /></q-item-section>
                    <q-item-section class="nav-text text-weight-bold">Map View</q-item-section>
                  </q-item>
                  <q-item clickable v-ripple exact to="/property-hub" active-class="active-menu"
                    class="nav-item child-item">
                    <q-item-section avatar class="item-icon"><Icon icon="mdi:home-city-outline" width="22" height="22" /></q-item-section>
                    <q-item-section class="nav-text text-weight-bold">Property Hub</q-item-section>
                  </q-item>
                </div>
              </q-slide-transition>
            </div>

            <q-item clickable v-ripple class="nav-item q-mt-sm"
              :class="{ 'active-menu': (miniState || !expanded.operations) && isParentActive(['/concerns', '/announcements']) }"
              @click="toggle('operations')">
              <q-item-section avatar class="item-icon"><Icon icon="mdi:briefcase-outline" width="22" height="22" /></q-item-section>
              <q-item-section class="nav-text text-weight-bold hide-on-mini">Operations</q-item-section>
              <q-item-section side class="hide-on-mini q-pr-sm">
                <Icon :icon="expanded.operations ? 'mdi:chevron-up' : 'mdi:chevron-down'" color="white" width="18" height="18" />
              </q-item-section>
            </q-item>

            <div class="hide-on-mini">
              <q-slide-transition>
                <div v-show="expanded.operations">
                  <q-item clickable v-ripple exact to="/concerns" active-class="active-menu"
                    class="nav-item child-item">
                    <q-item-section avatar class="item-icon"><Icon icon="mdi:forum-outline" width="22" height="22" /></q-item-section>
                    <q-item-section class="nav-text text-weight-bold">Concerns</q-item-section>
                  </q-item>
                  <q-item clickable v-ripple exact to="/announcements" active-class="active-menu"
                    class="nav-item child-item">
                    <q-item-section avatar class="item-icon"><Icon icon="mdi:bullhorn-outline" width="22" height="22" /></q-item-section>
                    <q-item-section class="nav-text text-weight-bold">Announcements</q-item-section>
                  </q-item>
                </div>
              </q-slide-transition>
            </div>

            <q-item clickable v-ripple class="nav-item q-mt-sm"
              :class="{ 'active-menu': (miniState || !expanded.system) && isParentActive(['/audit-logs', '/settings']) }"
              @click="toggle('system')">
              <q-item-section avatar class="item-icon"><Icon icon="mdi:monitor-cog" width="22" height="22" /></q-item-section>
              <q-item-section class="nav-text text-weight-bold hide-on-mini">System</q-item-section>
              <q-item-section side class="hide-on-mini q-pr-sm">
                <Icon :icon="expanded.system ? 'mdi:chevron-up' : 'mdi:chevron-down'" color="white" width="18" height="18" />
              </q-item-section>
            </q-item>

            <div class="hide-on-mini">
              <q-slide-transition>
                <div v-show="expanded.system">
                  <q-item clickable v-ripple exact to="/audit-logs" active-class="active-menu"
                    class="nav-item child-item">
                    <q-item-section avatar class="item-icon"><Icon icon="mdi:clipboard-list-outline" width="22" height="22" /></q-item-section>
                    <q-item-section class="nav-text text-weight-bold">Audit Logs</q-item-section>
                  </q-item>
                  <q-item clickable v-ripple exact to="/settings" active-class="active-menu"
                    class="nav-item child-item">
                    <q-item-section avatar class="item-icon"><Icon icon="mdi:cog-outline" width="22" height="22" /></q-item-section>
                    <q-item-section class="nav-text text-weight-bold">Settings</q-item-section>
                  </q-item>
                </div>
              </q-slide-transition>
            </div>

          </q-list>
        </div>
      </q-scroll-area>
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRoute } from 'vue-router';

const miniState = ref(true);
const route = useRoute();

const expanded = reactive({
  users: false,
  properties: false,
  operations: false,
  system: false
});

function toggle(section: keyof typeof expanded) {
  const wasOpen = expanded[section];

  expanded.users = false;
  expanded.properties = false;
  expanded.operations = false;
  expanded.system = false;

  if (!wasOpen) {
    expanded[section] = true;
  }
}

function isParentActive(paths: string[]) {
  return paths.includes(route.path);
}
</script>

<style>
.sidebar-bg {
  background-color: #0f8b7d !important;
  color: white !important;
  overflow-x: hidden;
}

.text-light-teal {
  color: #6de0d1;
}

.shrink-0 {
  flex-shrink: 0;
}

.header-container {
  padding: 24px 0 16px 14px;
}

.logo-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: white;
}

.menu-list {
  padding: 0;
}

.nav-item {
  border-radius: 16px !important;
  margin: 4px 10px !important;
  padding: 0 0 0 8px !important;
  height: 48px !important;
  min-height: 48px !important;
  color: white;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  transition: all 0.2s ease;
}

.nav-item:not(.active-menu):hover {
  background: rgba(255, 255, 255, 0.1);
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

.active-menu {
  background-color: #fafafa !important;
  color: #0f8b7d !important;
  border-radius: 16px !important;
  margin-right: 10px !important;
}

.q-drawer--mini .active-menu {
  border-radius: 16px 0 0 16px !important;
  margin-right: 0 !important;
}

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
}

.q-drawer--mini .hide-on-mini {
  display: none !important;
}

.show-on-mini {
  display: none;
}

.q-drawer--mini .show-on-mini {
  display: flex !important;
}

.q-drawer--mini .nav-item {
  justify-content: flex-start !important;
}
</style>
