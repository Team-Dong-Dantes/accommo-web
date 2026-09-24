<template>
  <q-drawer :model-value="true" :mini="miniState" @pointerenter="onPointer($event, false)" @pointerleave="onPointer($event, true)"
    :width="248" :mini-width="68" :breakpoint="0" mini-to-overlay class="sidebar-bg">
    <div class="column full-height no-wrap">

      <!-- Brand header -->
      <div class="sb-header row items-center no-wrap">
        <button class="sb-logo-btn" type="button" :aria-expanded="!miniState" aria-label="Toggle navigation" @click="toggleRail">
          <img class="sb-logo" src="/accommo-logo.svg" alt="Accommo">
        </button>
        <div class="sb-brand hide-on-mini">
          <div class="sb-brand-name">accommo</div>
          <div class="sb-brand-sub">OSAS Admin</div>
        </div>
      </div>

      <!-- Search / command trigger -->
      <div class="sb-search-wrap q-px-sm">
        <button class="sb-search hide-on-mini" type="button" @click="paletteOpen = true">
          <Icon icon="lucide:search" width="18" height="18" class="sb-search-magnify" />
          <span class="sb-search-text">Search…</span>
          <kbd class="sb-kbd">{{ kbdHint }}</kbd>
        </button>
        <button class="sb-search-fab show-on-mini" type="button" title="Search (⌘K)" @click="paletteOpen = true">
          <Icon icon="lucide:search" width="20" height="20" />
        </button>
      </div>

      <q-scroll-area class="col">
        <div class="column justify-center" style="min-height: 100%;">
          <q-list class="menu-list q-py-md">

            <!-- Standalone: Dashboard -->
            <q-item clickable v-ripple exact to="/dashboard" active-class="active-menu" class="nav-item">
              <q-item-section avatar class="item-icon">
                <Icon icon="lucide:layout-dashboard" width="22" height="22" />
              </q-item-section>
              <q-item-section class="nav-text text-weight-bold hide-on-mini">Dashboard</q-item-section>
            </q-item>

            <!-- Expandable groups -->
            <template v-for="group in navGroups" :key="group.id">
              <div class="nav-group">
              <q-item clickable v-ripple class="nav-item q-mt-sm"
                :class="{ 'active-menu': (miniState || !expanded[group.id]) && isParentActive(group.children.map(c => c.to)) }"
                @click="toggle(group.id)">
                <q-item-section avatar class="item-icon">
                  <Icon :icon="group.icon" width="22" height="22" />
                </q-item-section>
                <q-item-section class="nav-text text-weight-bold hide-on-mini">{{ group.label }}</q-item-section>
                <q-item-section side class="nav-group-actions hide-on-mini q-pr-sm">
                  <q-badge
                    v-if="!expanded[group.id] && groupWorkCount(group.children.map(child => child.id))"
                    class="nav-work-badge"
                    :label="formatWorkCount(groupWorkCount(group.children.map(child => child.id)))"
                    :aria-label="workLabel(groupWorkCount(group.children.map(child => child.id)))"
                  />
                  <Icon :icon="expanded[group.id] ? 'lucide:chevron-up' : 'lucide:chevron-down'" color="white" width="18"
                    height="18" />
                </q-item-section>
              </q-item>

              <q-badge
                v-if="miniState && !isGroupWorkActive(group.children.map(child => child.to)) && groupWorkCount(group.children.map(child => child.id))"
                class="nav-work-badge nav-work-badge-mini"
                :label="formatWorkCount(groupWorkCount(group.children.map(child => child.id)))"
                :aria-label="workLabel(groupWorkCount(group.children.map(child => child.id)))"
              />

              <div class="hide-on-mini">
                <q-slide-transition>
                  <div v-show="expanded[group.id]">
                    <q-item v-for="child in group.children" :key="child.id" clickable v-ripple exact :to="child.to"
                      active-class="active-menu" class="nav-item child-item">
                       <q-item-section avatar class="item-icon">
                         <Icon :icon="child.icon" width="20" height="20" />
                       </q-item-section>
                       <q-item-section class="nav-text text-weight-bold">{{ child.label }}</q-item-section>
                       <q-item-section v-if="workCount(child.id) && !isActivePath(child.to)" side class="nav-work-side">
                         <q-badge
                           class="nav-work-badge"
                           :label="formatWorkCount(workCount(child.id))"
                           :aria-label="workLabel(workCount(child.id))"
                         />
                       </q-item-section>
                     </q-item>
                  </div>
                </q-slide-transition>
              </div>
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
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { navGroups } from './nav-config';
import CommandPalette from '@/components/ui/CommandPalette.vue';
import { supabase } from '@/utils/supabase';

const miniState = ref(true);
const route = useRoute();

// The rail expands on hover, which a tablet cannot do, so the logo is also a
// toggle. The two have to be told apart per *event*, not per device: an earlier
// attempt asked `matchMedia('(hover: hover)')` once, and on a tablet that
// answers yes (a paired trackpad, or a desktop browser in device emulation) the
// tap's synthetic pointerenter expanded the rail and the click that followed
// immediately folded it again — so the logo looked dead. Reading
// `pointerType` instead means a finger never triggers the hover path at all.
function onPointer(e: PointerEvent, mini: boolean) {
  if (e.pointerType === 'mouse') {
    miniState.value = mini;
    tapOpened.value = false;
  }
}

/** True while the rail is open because somebody tapped the logo, not hovered. */
const tapOpened = ref(false);
function toggleRail() {
  miniState.value = !miniState.value;
  tapOpened.value = !miniState.value;
}
// Tapping through to a page ends the interaction: fold the rail back so it stops
// covering the page it just opened. A mouse user's rail is left alone — their
// pointer leaving the drawer already closes it.
watch(() => route.fullPath, () => {
  if (tapOpened.value) {
    miniState.value = true;
    tapOpened.value = false;
  }
});
const paletteOpen = ref(false);

const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const kbdHint = isMac ? '⌘K' : 'Ctrl K';

const expanded = reactive<Record<string, boolean>>(
  Object.fromEntries(navGroups.map(g => [g.id, false]))
);
const workCounts = ref<Record<string, number>>({
  verifications: 0,
  'support-tickets': 0,
});

function workCount(id: string) {
  return workCounts.value[id] ?? 0;
}

function groupWorkCount(childIds: string[]) {
  return childIds.reduce((total, id) => total + workCount(id), 0);
}

function formatWorkCount(count: number) {
  return count > 99 ? '99+' : String(count);
}

function workLabel(count: number) {
  return `${count} outstanding ${count === 1 ? 'item' : 'items'}`;
}

function isActivePath(path: string) {
  return route.path === path;
}

function isGroupWorkActive(paths: string[]) {
  return paths.some(isActivePath);
}

async function loadWorkCounts() {
  const [usersResult, propertiesResult, ticketsResult] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    supabase.from('accommodations').select('*', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
  ]);

  if (!usersResult.error || !propertiesResult.error) {
    workCounts.value.verifications = (usersResult.error ? 0 : usersResult.count ?? 0)
      + (propertiesResult.error ? 0 : propertiesResult.count ?? 0);
  }
  if (!ticketsResult.error) workCounts.value['support-tickets'] = ticketsResult.count ?? 0;
}

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

let workChannel: any = null;

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  void loadWorkCounts();
  workChannel = supabase
    .channel('sidebar-work-counts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, loadWorkCounts)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'accommodations' }, loadWorkCounts)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, loadWorkCounts)
    .subscribe();
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  if (workChannel) supabase.removeChannel(workChannel);
});
</script>

<style scoped>
/* `:deep()` is required, not stylistic. QDrawer sets `inheritAttrs: false` and
   puts the class we pass onto its inner content div (q-drawer-container >
   aside.q-drawer > div.sidebar-bg), which Quasar renders itself — so it never
   carries this component's scope attribute. Plain `.sidebar-bg` under `scoped`
   matches nothing and the rail loses its background entirely. */
:deep(.sidebar-bg) {
  background: linear-gradient(180deg, var(--c-sidebar-bg) 0%, var(--c-sidebar-bg-2) 100%) !important;
  color: var(--c-sidebar-text) !important;
  overflow-x: hidden;
  box-shadow: none !important;
  /* A defined edge against the pale app background — the rail used to end in a
     soft gradient with nothing to terminate it. */
  border-right: 1px solid rgba(255, 255, 255, 0.07);
}

/* Quasar renders its own drawer shadow inside the drawer (.q-layout__shadow);
   hide it so we control the shadow ourselves below */
/* QDrawer renders this inside its own <aside>, so scoped CSS needs :deep() to
   reach it. Only rendered when the drawer is `elevated`, which this one is not
   — kept as a guard so turning elevation on can't reintroduce Quasar's shadow
   alongside the custom one below. */
:deep(.q-layout__shadow) {
  display: none !important;
}

/* Custom shadow only when the drawer ROOT is expanded (not in mini state).
   NOTE: `sidebar-bg` lands on the inner content div, while `q-drawer--mini`
   is on the root <aside>, so we must key off the root element. */
/* The whole selector goes inside :deep() — both `.q-drawer` and `.sidebar-bg`
   are Quasar-rendered, so neither carries the scope attribute. Only the
   component root (.q-drawer-container) does. */
:deep(.q-drawer:not(.q-drawer--mini) .sidebar-bg) {
  box-shadow: var(--c-sidebar-shadow) !important;
}

.sb-header {
  padding: 20px 14px 16px 18px;
  margin-bottom: 14px;
  gap: 11px;
  /* Separates the identity from the navigation instead of letting the two run
     together down the rail. */
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.sb-logo-btn {
  display: flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.sb-logo {
  height: 26px;
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
  font-size: 17px;
  font-family: var(--font-display);
  letter-spacing: -0.025em;
}

.sb-brand-sub {
  margin-top: 1px;
  color: var(--c-sidebar-muted);
  font-size: 10.5px;
  font-weight: 500;
}

/* ----- Search trigger ----- */
.sb-search-wrap {
  padding-bottom: 10px;
}

.sb-search {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 11px;
  border-radius: 10px;
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
  width: 38px;
  height: 38px;
  border-radius: 10px;
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

/* Tighter than the old 46px/14px chunky pills: a console rail should read as
   precise rather than as a consumer app's tab bar. */
.nav-item {
  position: relative;
  border-radius: 10px !important;
  margin: 1px 10px !important;
  padding: 0 0 0 9px !important;
  height: 40px !important;
  min-height: 40px !important;
  /* Not --c-sidebar-muted (0.55 alpha): that token is for captions, and 13px
     nav labels at that weight sit under AA on this ground. Dimmed enough to let
     the active row lead, legible enough to read at rest. */
  color: rgba(234, 244, 241, 0.78);
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  transition: background 0.16s ease, color 0.16s ease;
}

.nav-item:not(.active-menu):hover {
  background: var(--c-sidebar-hover);
  color: var(--c-sidebar-text);
}

.item-icon {
  min-width: 22px !important;
  width: 22px !important;
  padding: 0 !important;
  margin-right: 12px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.item-icon .q-icon {
  font-size: 20px !important;
}

.nav-text {
  font-size: 13px;
  letter-spacing: -0.005em;
  white-space: nowrap;
  padding-left: 0;
  opacity: 1;
  transition: opacity 0.2s ease;
}

/* Air between groups, so the four sections read as sections rather than one
   uninterrupted column of rows. */
.nav-group + .nav-group { margin-top: 2px; }

.nav-group-actions {
  gap: var(--sp-2);
}

.nav-group {
  position: relative;
}

.nav-work-side {
  min-width: 34px;
  padding-left: var(--sp-2);
}

/* Smaller and unbordered: these are counts, not buttons, and the ring around
   them was making a 21px chip out of a two-digit number. */
.nav-work-badge {
  min-width: 18px;
  height: 18px;
  justify-content: center;
  padding: 0 5px;
  border: 0;
  border-radius: 999px;
  background: var(--c-accent) !important;
  color: #fff;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.nav-work-badge-mini {
  position: absolute;
  top: 1px;
  right: 5px;
  z-index: 1;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  font-size: 9px;
  pointer-events: none;
}

/* ----- Active state: raised surface + left accent bar -----
   Was a solid #F3F6FA pill, which punched a light-on-dark slab into the rail
   and made the current page the loudest thing on screen. A lifted translucent
   surface with a bright accent bar marks it just as clearly and keeps the rail
   whole. The accent bar is what the old comment here promised and never had. */
.active-menu {
  position: relative;
  background-color: rgba(255, 255, 255, 0.11) !important;
  color: #ffffff !important;
  border-radius: 10px !important;
  margin-right: 10px !important;
  font-weight: 700;
}

.active-menu::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 999px;
  background: var(--c-sidebar-accent);
}

.active-menu .nav-text { font-weight: 700; }

.q-drawer--mini .active-menu {
  border-radius: 10px !important;
  margin-right: 10px !important;
}

/* ----- Child items -----
   A guide line runs down the open group and the children hang off it, so the
   nesting is drawn rather than implied by an indent alone. Parent rows stay
   bold; children drop to regular until active, which is the weight contrast
   the old 13px-bold / 12px-semibold pairing never really made. */
.child-item {
  margin-left: 30px !important;
  height: 34px !important;
  min-height: 34px !important;
  border-radius: 8px !important;
}

.child-item::after {
  content: '';
  position: absolute;
  left: -9px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.11);
}

.child-item .item-icon {
  min-width: 18px !important;
  width: 18px !important;
  margin-right: 10px !important;
}

.child-item .item-icon .q-icon {
  font-size: 17px !important;
}

.child-item .nav-text {
  font-size: 12.5px;
  font-weight: 500;
}

.child-item.active-menu .nav-text { font-weight: 700; }
/* No accent bar on children: it landed on the guide line and the two fought
   over the same pixel column. The raised surface and the weight carry it, and
   the guide stays unbroken. The bar remains a top-level marker. */
.child-item.active-menu::before { display: none; }

.q-drawer--mini .nav-item {
  justify-content: flex-start !important;
}
</style>
