<template>
  <!-- The console's sidebar, ported from accommo-mobile's DesktopRail.vue so the
       two apps share one rail: 68px of icons that opens over the page on hover.
       Flat rather than the old expandable groups — each nav group is a run of
       rows between separators. Settings and Sign out live in the header's
       profile menu, not here. -->
  <nav
    class="desktop-rail"
    :class="{ 'is-open': open }"
    aria-label="Main"
    @pointerenter="onPointer($event, true)"
    @pointerleave="onPointer($event, false)"
  >
    <div class="rail-head">
      <span class="rail-mark" role="img" aria-label="Accommo"></span>
      <span class="rail-brand">accommo</span>
    </div>

    <template v-for="(group, g) in groups" :key="g">
      <div v-if="g > 0" class="rail-sep" />
      <button
        v-for="row in group"
        :key="row.key"
        type="button"
        class="rail-row"
        :class="{ active: row.active }"
        :aria-label="row.label"
        :aria-current="row.active ? 'page' : undefined"
        @click="row.go()"
      >
        <span class="rail-icon">
          <Icon :icon="row.icon" width="20" height="20" />
          <span v-if="row.badge" class="rail-badge">{{ row.badge > 9 ? '9+' : row.badge }}</span>
        </span>
        <span class="rail-label">{{ row.label }}</span>
      </button>
    </template>

    <!-- The search box went with the old sidebar; ⌘K / Ctrl K still opens it. -->
    <CommandPalette v-model="paletteOpen" />
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { dashboardLeaf, navGroups } from './nav-config';
import CommandPalette from '@/components/ui/CommandPalette.vue';
import { supabase } from '@/utils/supabase';

const route = useRoute();
const router = useRouter();

// Hover opens it, and only a mouse's hover: read per event, not per device —
// a tablet with a paired trackpad answers `(hover: hover)` yes, and the tap's
// synthetic pointerenter used to half-open the rail.
const open = ref(false);
function onPointer(e: PointerEvent, entering: boolean) {
  if (e.pointerType === 'mouse') open.value = entering;
}

interface Row {
  key: string;
  icon: string;
  label: string;
  active: boolean;
  go: () => void;
  badge?: number;
}

const workCounts = ref<Record<string, number>>({
  verifications: 0,
  'support-tickets': 0,
});

const leafRow = (leaf: { id: string; icon: string; label: string; to: string }): Row => ({
  key: leaf.id,
  icon: leaf.icon,
  label: leaf.label,
  active: route.path === leaf.to,
  // The count is work waiting elsewhere; on its own page the list says it.
  badge: route.path === leaf.to ? 0 : workCounts.value[leaf.id] ?? 0,
  go: () => void router.push(leaf.to),
});

const groups = computed<Row[][]>(() => [
  [leafRow(dashboardLeaf)],
  ...navGroups.map((g) => g.children.map(leafRow)),
]);

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

const paletteOpen = ref(false);
function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    paletteOpen.value = true;
  }
}

let workChannel: ReturnType<typeof supabase.channel> | null = null;

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
  if (workChannel) void supabase.removeChannel(workChannel);
});
</script>

<style scoped>
.desktop-rail {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  /* Above q-header (2000): opened, the rail passes over the header's left end.
     Below the drawers and ticket window (4000+), which cover everything. */
  z-index: 2001;
  display: flex;
  width: var(--rail-w);
  flex-direction: column;
  gap: 2px;
  padding: 0 10px 14px;
  overflow: hidden;
  border-right: 1px solid var(--c-border);
  background: var(--c-surface);
  font-family: var(--font-body);
  transition: width 0.2s ease, box-shadow 0.2s ease;
}
/* Opens over the page, not beside it: the page keeps its 68px inset, so
   nothing reflows under the pointer. */
.desktop-rail.is-open {
  width: 248px;
  box-shadow: 8px 0 28px rgba(15, 23, 42, 0.12);
}

.rail-head {
  display: flex;
  height: 68px;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  /* Bleeds to the rail's edges so the rule runs full width; the 20px inset puts
     the mark's centre on the icons' axis (34px). */
  margin: 0 -10px 8px;
  padding-inline: 20px;
  border-bottom: 1px solid var(--c-border);
}
/* public/accommo-logo.svg as a mask — the artwork is solid white and would
   vanish as an <img> on this surface. Gray: teal is kept for the active row. */
.rail-mark {
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  background-color: var(--c-muted);
  -webkit-mask: url(/accommo-logo.svg) no-repeat center / contain;
  mask: url(/accommo-logo.svg) no-repeat center / contain;
}
.rail-brand {
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

/* Icons sit at a fixed left inset, so opening the rail only reveals the labels
   beside them — nothing the eye was tracking moves. */
.rail-row {
  position: relative;
  display: flex;
  height: 40px;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  padding: 0 0 0 13px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
  font: inherit;
  text-align: left;
  white-space: nowrap;
  transition: background-color 0.12s ease, color 0.12s ease;
}
.rail-row:hover:not(.active) {
  background: var(--c-bg);
  color: var(--c-ink);
}
.rail-row.active {
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.rail-row:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: -2px;
}

.rail-icon {
  position: relative;
  display: inline-flex;
  width: 22px;
  flex: 0 0 auto;
  justify-content: center;
}
.rail-label,
.rail-brand {
  opacity: 0;
  transition: opacity 0.15s ease;
}
.rail-label {
  font-size: 13px;
  font-weight: 600;
}
.is-open .rail-label,
.is-open .rail-brand {
  opacity: 1;
}

.rail-sep {
  height: 1px;
  flex: 0 0 auto;
  margin: 8px 4px;
  background: var(--c-border);
}

.rail-badge {
  position: absolute;
  top: -6px;
  right: -9px;
  display: grid;
  min-width: 15px;
  height: 15px;
  place-items: center;
  padding: 0 3px;
  border-radius: 999px;
  background: var(--c-danger);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
}

@media (prefers-reduced-motion: reduce) {
  .desktop-rail,
  .rail-label,
  .rail-brand {
    transition: none;
  }
}
</style>
