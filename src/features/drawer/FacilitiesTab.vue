<template>
  <!-- One component for both scopes. An accommodation's facilities are the
       shared ones, a room's are its own — the drawer never mixes them, so the
       only thing that differs is the wording. -->
  <div v-if="preview.facilities?.length" class="dd-facs">
    <div v-for="f in preview.facilities" :key="f.id" class="dd-fac">
      <span class="dd-fac-icon"><Icon :icon="f.icon" width="20" height="20" /></span>
      <span class="col min-width-0 text-left">
        <span class="dd-fac-name">{{ f.label }}</span>
        <span class="dd-fac-meta">{{ metaFor(f) }}</span>
      </span>
      <span v-if="f.photoCount" class="dd-fac-photos">
        <Icon icon="lucide:image" width="14" height="14" />
        {{ f.photoCount }}
      </span>
    </div>
  </div>
  <TabEmptyState
    v-else
    icon="lucide:sparkles"
    :title="isRoom ? 'No private facilities' : 'No shared facilities'"
    :message="isRoom
      ? 'This room has nothing listed of its own — its occupants use the shared facilities.'
      : 'This accommodation has not listed any shared facilities yet.'"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import TabEmptyState from './TabEmptyState.vue'
import type { DrawerPreview, PreviewFacility } from './preview'

const props = defineProps<{ preview: DrawerPreview }>()

const isRoom = computed(() => props.preview.kind === 'room')

/**
 * The description if the manager wrote one, otherwise the floor. A private
 * facility's floor is the room's floor, which the drawer already shows above,
 * so it is left out rather than repeated.
 */
function metaFor(f: PreviewFacility): string {
  if (f.description?.trim()) return f.description.trim()
  if (!isRoom.value && f.floor != null) return `Floor ${f.floor}`
  return isRoom.value ? 'Private to this room' : 'Shared'
}
</script>

<style scoped>
.dd-facs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dd-fac {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm, 10px);
  background: var(--c-surface);
}

.dd-fac-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  color: var(--c-primary);
}

.dd-fac-name {
  display: block;
  color: var(--c-ink);
  font-size: 13.5px;
  font-weight: 700;
}
.dd-fac-meta {
  display: block;
  margin-top: 2px;
  color: var(--c-muted);
  font-size: 12.5px;
  line-height: 1.4;
}

.dd-fac-photos {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 600;
}
</style>
