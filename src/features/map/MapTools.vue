<template>
  <!-- The map's top-right toolbar: undo (only while an area is drawn or
       edited), drawing an area, and the base map, picked from previews of
       the campus in each style. -->
  <div class="tools">
    <button v-if="showUndo" type="button" class="tool" :disabled="!canUndo" title="Undo (Ctrl+Z)" aria-keyshortcuts="Control+Z" @click="$emit('undo')">
      <Icon icon="lucide:undo-2" width="15" height="15" aria-hidden="true" />Undo
    </button>
    <button type="button" class="tool" :aria-pressed="drawing" @click="$emit('draw')">
      <Icon :icon="drawing ? 'lucide:x' : 'lucide:pen-line'" width="15" height="15" aria-hidden="true" />{{ drawing ? 'Cancel' : 'Draw area' }}
    </button>
    <!-- The menu opens from its parent, so the button and the menu sit side by side. -->
    <div class="pick">
      <button type="button" class="tool" aria-haspopup="true" :aria-label="`Map style: ${current.label}`">
        <Icon icon="lucide:layers" width="15" height="15" aria-hidden="true" />{{ current.label }}
        <Icon icon="lucide:chevron-down" width="14" height="14" class="chev" aria-hidden="true" />
      </button>
      <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" max-height="90vh" class="style-menu">
        <div class="sm-body">
        <div class="sm-head">Map style</div>
        <div class="sm-grid" role="radiogroup" aria-label="Map style">
          <button
            v-for="p in MAP_STYLES"
            :key="p.id"
            v-close-popup
            type="button"
            role="radio"
            class="sm-tile"
            :aria-checked="p.id === mapStyle"
            :title="p.hint"
            @click="$emit('update:mapStyle', p.id)"
          >
            <span class="sm-thumb">
              <img :src="stylePreview(p, $q.dark.isActive, token)" alt="" loading="lazy" width="104" height="68" />
              <Icon v-if="p.id === mapStyle" icon="lucide:check" width="13" height="13" class="sm-check" aria-hidden="true" />
            </span>
            <span class="sm-label">{{ p.label }}</span>
          </button>
        </div>
        <p class="sm-hint">{{ current.hint }}</p>
        </div>
      </q-menu>
    </div>
    <p v-if="drawing" class="hint">Click to place corners. Click the first corner or double-click to finish. Ctrl+Z or Backspace undoes, Esc cancels.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { MAP_STYLES, presetOf, stylePreview } from './mapStyles'

const props = defineProps<{ mapStyle: string; drawing: boolean; canUndo: boolean; showUndo: boolean }>()
defineEmits<{ 'update:mapStyle': [string]; draw: []; undo: [] }>()

const token = import.meta.env.VITE_MAPBOX_TOKEN || ''
const current = computed(() => presetOf(props.mapStyle))
</script>

<style scoped>
.tools { position: absolute; top: 14px; right: 14px; z-index: 2; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; max-width: 420px; }
.tool { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 14px; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-surface); box-shadow: var(--shadow); color: var(--c-text); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.tool:hover:not(:disabled) { border-color: var(--c-primary); }
.tool[aria-pressed='true'] { border-color: var(--c-primary); background: var(--c-primary-soft); color: var(--c-primary); }
.tool:disabled { color: var(--c-muted); cursor: default; opacity: 0.6; }
.tool:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.chev { margin-left: 2px; color: var(--c-muted); }
.hint { flex-basis: 100%; margin: 0; padding: 8px 12px; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-surface); box-shadow: var(--shadow); color: var(--c-text); font-size: 12px; line-height: 1.4; }

/* The menu is teleported out of this component (and out of the console zoom,
   so it is sized in plain px); its shell is styled globally, its inside here. */
:global(.style-menu) { border: 1px solid var(--c-border); border-radius: 14px; background: var(--c-surface); box-shadow: var(--shadow-lg); }
/* Not ".sm": Quasar keeps that class for "only on small screens" and hides it elsewhere. */
.sm-body { padding: 14px; }
.sm-head { margin: 0 2px 10px; color: var(--c-ink); font-family: var(--font-display); font-size: 14px; font-weight: 700; }
.sm-grid { display: grid; grid-template-columns: repeat(3, 104px); gap: 10px; }
.sm-tile { display: flex; flex-direction: column; gap: 5px; padding: 0; border: 0; background: none; color: var(--c-text); font: inherit; text-align: left; cursor: pointer; }
.sm-thumb { position: relative; display: block; width: 104px; height: 68px; overflow: hidden; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-surface-2); }
.sm-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sm-tile:hover .sm-thumb { border-color: var(--c-primary); }
.sm-tile[aria-checked='true'] .sm-thumb { border-color: var(--c-primary); box-shadow: 0 0 0 2px var(--c-primary); }
.sm-check { position: absolute; top: 5px; right: 5px; padding: 2px; border-radius: 50%; background: var(--c-primary); color: #fff; }
.sm-label { overflow: hidden; font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.sm-tile[aria-checked='true'] .sm-label { color: var(--c-primary); font-weight: 700; }
.sm-tile:focus-visible { outline: none; }
.sm-tile:focus-visible .sm-thumb { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.sm-hint { margin: 10px 2px 0; color: var(--c-muted); font-size: 12px; }
</style>
