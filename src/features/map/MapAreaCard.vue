<template>
  <!-- The selected area's card, in the map's corner, styled as the pin card:
       what lies inside it, with its rename and delete (both in MapAreaDialog). -->
  <div class="card" role="dialog" :aria-label="area.name">
    <div class="top">
      <span class="swatch" :style="{ background: area.color }" />
      <h3>{{ area.name }}</h3>
      <button type="button" class="x" aria-label="Clear area filter" @click="$emit('close')">
        <Icon icon="lucide:x" width="15" height="15" />
      </button>
    </div>
    <dl>
      <div><dt>Accommodations</dt><dd>{{ stats.count }}</dd></div>
      <div v-for="(g, key) in STATUS_GROUPS" :key="key">
        <dt><span class="dot" :style="{ background: `var(${g.token})` }" />{{ g.label }}</dt><dd>{{ stats[key] }}</dd>
      </div>
      <div><dt>Beds taken</dt><dd>{{ stats.taken }} of {{ stats.beds }}</dd></div>
    </dl>
    <p class="hint">Drag a corner to move it, or the dot on a border to add one. Right-click a corner to remove it.</p>
    <div class="actions">
      <button type="button" class="ghost danger" @click="$emit('delete')">Delete</button>
      <button type="button" class="ghost" @click="$emit('rename')">Rename</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { STATUS_GROUPS } from './mapPins'
import type { MapArea, areaStats } from './mapAreas'

defineProps<{ area: MapArea; stats: ReturnType<typeof areaStats> }>()
defineEmits<{ rename: []; delete: []; close: [] }>()
</script>

<style scoped>
.card { position: absolute; right: 14px; bottom: 34px; z-index: 6; width: 272px; overflow: hidden; border: 1px solid var(--c-border); border-radius: 14px; background: var(--c-surface); box-shadow: var(--shadow-lg); }
.top { display: flex; align-items: center; gap: 10px; padding: 12px 12px 10px 14px; }
.swatch { width: 14px; height: 14px; flex: none; border-radius: 4px; }
h3 { flex: 1; min-width: 0; margin: 0; overflow: hidden; color: var(--c-ink); font-family: var(--font-display); font-size: 15.5px; letter-spacing: -0.01em; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.x { display: grid; flex: none; place-items: center; width: 26px; height: 26px; border: 0; border-radius: 8px; background: var(--c-surface-2); color: var(--c-muted); cursor: pointer; }
dl { margin: 0; border-top: 1px solid var(--c-border); }
dl div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 14px; border-bottom: 1px solid var(--c-border); font-size: 12.5px; }
dt { display: inline-flex; align-items: center; gap: 7px; color: var(--c-muted); }
dd { margin: 0; color: var(--c-ink); font-variant-numeric: tabular-nums; font-weight: 600; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.hint { margin: 0; padding: 9px 14px 0; color: var(--c-muted); font-size: 11.5px; line-height: 1.4; }
.actions { display: flex; justify-content: flex-end; gap: 6px; padding: 10px 14px 12px; }
.actions button { height: 32px; padding: 0 14px; border-radius: 9px; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; }
.ghost { border: 1px solid var(--c-border-strong); background: var(--c-surface); color: var(--c-text); }
.ghost:hover { border-color: var(--c-primary); }
.ghost.danger { margin-right: auto; color: var(--c-danger); }
.ghost.danger:hover { border-color: var(--c-danger); }
.x:focus-visible, .actions button:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
</style>
