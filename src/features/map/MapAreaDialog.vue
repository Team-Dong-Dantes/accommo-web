<template>
  <!-- Naming a shape just drawn, renaming an area, or deleting one, in the
       console's dialog design (as AccountActionDialog). Naming cannot be
       dismissed by a stray click outside: that would throw the drawing away. -->
  <q-dialog :model-value="!!mode" :persistent="mode === 'name'" @update:model-value="(v) => { if (!v) $emit('close') }">
    <form v-if="mode && spec" class="ad" @submit.prevent="submit">
      <header class="ad-head">
        <span class="ad-icon" :class="{ 'ad-icon--danger': mode === 'delete' }"><Icon :icon="spec.icon" width="18" height="18" /></span>
        <div class="ad-titles">
          <h2 class="ad-title">{{ spec.title }}</h2>
          <span class="ad-sub">{{ spec.sub }}</span>
        </div>
        <button type="button" class="ad-x" aria-label="Close" @click="$emit('close')"><Icon icon="lucide:x" width="16" height="16" /></button>
      </header>

      <p v-if="spec.blurb" class="ad-blurb">{{ spec.blurb }}</p>

      <label v-if="mode !== 'delete'" class="ad-field">
        <span class="ad-label">Area name</span>
        <q-input v-model="name" dense outlined autofocus maxlength="60" placeholder="e.g. Behind the main gate" />
      </label>

      <footer class="ad-foot">
        <q-btn flat no-caps :label="mode === 'name' ? 'Discard' : 'Cancel'" :disable="busy" @click="$emit('close')" />
        <q-btn
          unelevated
          no-caps
          type="submit"
          :color="mode === 'delete' ? 'negative' : 'primary'"
          :label="spec.confirm"
          :loading="busy"
          :disable="mode !== 'delete' && !name.trim()"
        />
      </footer>
    </form>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import type { MapArea } from './mapAreas'

export type AreaDialogMode = 'name' | 'rename' | 'delete'

const props = defineProps<{ mode: AreaDialogMode | null; area: MapArea | null; busy: boolean }>()
const emit = defineEmits<{ save: [string]; delete: []; close: [] }>()

const spec = computed(() => {
  const who = props.area?.name ?? ''
  if (props.mode === 'name') return { icon: 'lucide:map-pinned', title: 'Name this area', sub: 'Shared with everyone in OSAS', confirm: 'Save area', blurb: '' }
  if (props.mode === 'rename') return { icon: 'lucide:pencil', title: 'Rename area', sub: who, confirm: 'Save', blurb: '' }
  if (props.mode === 'delete') {
    return {
      icon: 'lucide:trash-2', title: 'Delete area', sub: who, confirm: 'Delete area',
      blurb: 'It is removed from the map for everyone in OSAS. The accommodations inside it are not affected.',
    }
  }
  return null
})

const name = ref('')
watch(() => props.mode, (m) => { name.value = m === 'rename' ? props.area?.name ?? '' : '' })

function submit() {
  if (props.mode === 'delete') return emit('delete')
  if (name.value.trim()) emit('save', name.value.trim())
}
</script>

<style scoped>
.ad {
  /* Quasar lets clicks through only to a div directly in the dialog; a form
     gets none unless it asks, or every click falls to the backdrop. */
  pointer-events: all;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 420px;
  max-width: calc(100vw - 32px);
  padding: 20px;
  border-radius: var(--radius);
  background: var(--c-surface);
  color: var(--c-text);
  font-family: var(--font-body);
  box-shadow: var(--shadow-lg);
  box-sizing: border-box;
}
.ad-head { display: flex; align-items: center; gap: 12px; }
.ad-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c-primary) 12%, var(--c-surface));
  color: var(--c-primary);
}
.ad-icon--danger { background: color-mix(in srgb, var(--c-danger) 12%, var(--c-surface)); color: var(--c-danger); }
.ad-titles { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.ad-title { margin: 0; color: var(--c-ink); font-family: var(--font-display); font-size: 17px; font-weight: 700; line-height: 1.25; }
.ad-sub { overflow: hidden; color: var(--c-muted); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
.ad-x { display: flex; align-self: flex-start; padding: 4px; border: none; border-radius: 6px; background: none; color: var(--c-muted); cursor: pointer; }
.ad-x:hover { color: var(--c-ink); background: var(--c-surface-2); }
.ad-blurb { margin: 0; color: var(--c-text); font-size: 13px; line-height: 1.5; }
.ad-field { display: flex; flex-direction: column; gap: 6px; }
.ad-label { color: var(--c-ink); font-size: 12.5px; font-weight: 600; }
.ad-foot { display: flex; justify-content: flex-end; gap: 8px; }
</style>
