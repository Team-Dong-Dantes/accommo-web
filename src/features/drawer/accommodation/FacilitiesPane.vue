<template>
  <div v-if="groups.length" class="rl">
    <section v-for="g in groups" :key="g.key" class="rl-floor">
      <div class="rl-floor-head">
        <span class="rl-floor-name">{{ g.label }}</span>
        <span class="rl-rule"></span>
        <span class="rl-floor-count">{{ g.items.length }} facilit{{ g.items.length === 1 ? 'y' : 'ies' }}</span>
      </div>
      <div class="rl-list">
        <q-expansion-item v-for="f in g.items" :key="f.id" group="facilities" class="rl-item" header-class="rl-row" hide-expand-icon>
          <template #header="{ expanded }">
            <span class="rl-thumb fp-tile" :style="{ '--tint': tint(f.type) }">
              <Icon :icon="f.icon" width="17" height="17" />
            </span>
            <span class="rl-main">
              <span class="rl-name">{{ f.label }}</span>
              <span class="rl-sub">{{ sharedBy(f).length ? `Shared by ${sharedBy(f).length} room${sharedBy(f).length === 1 ? '' : 's'}` : 'No rooms assigned' }}</span>
            </span>
            <span class="rl-col fp-chips">
              <span v-for="rm in sharedBy(f)" :key="rm.id" class="fp-chip">{{ short(rm.name) }}</span>
            </span>
            <span class="rl-status">
              <span v-if="f.status === 'under_repair'" class="rl-pill rl-pill--warn">Under repair</span>
              <span v-else class="rl-pill rl-pill--ok">Available</span>
            </span>
            <Icon :icon="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" width="16" height="16" class="rl-chev" />
          </template>
          <div class="rl-detail">
            <PhotoStrip :photos="f.photos ?? []" :title="f.label" @open="(i) => $emit('photos', f.label, f.photos ?? [], i)" />
            <div v-for="rm in sharedBy(f)" :key="rm.id" class="rl-person">
              <span class="fp-room">
                <img v-if="rm.photos?.length" :src="rm.photos[0]" alt="" />
              </span>
              <span class="rl-main">
                <span class="rl-pname">{{ rm.name }}</span>
                <span class="rl-sub">{{ roomSub(rm) }}</span>
              </span>
              <span class="rl-since">{{ boarders(rm) }}</span>
            </div>
          </div>
        </q-expansion-item>
      </div>
    </section>
  </div>
  <TabEmptyState v-else icon="lucide:sparkles" title="No shared facilities" message="This accommodation has not listed any shared facilities yet." />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import TabEmptyState from '../TabEmptyState.vue'
import PhotoStrip from './PhotoStrip.vue'
import { groupByFloor, type DrawerPreview, type PreviewFacility, type PreviewRoom } from '../preview'

const props = defineProps<{ preview: DrawerPreview }>()
defineEmits<{ (e: 'photos', title: string, photos: string[], index: number): void }>()

const groups = computed(() => groupByFloor(props.preview.facilities ?? []))
const roomsById = computed(() => new Map((props.preview.rooms ?? []).map((r) => [r.id, r])))

/** Linked rooms that still exist, in the record's room order. */
const sharedBy = (f: PreviewFacility): PreviewRoom[] =>
  (f.roomIds ?? []).map((id) => roomsById.value.get(id)).filter((r): r is PreviewRoom => !!r)

const short = (name: string) => name.replace(/^Room\s+/i, 'R')

function roomSub(rm: PreviewRoom): string {
  const beds = `${rm.capacity ?? 0} bed${rm.capacity === 1 ? '' : 's'}`
  return rm.floor != null && rm.floor !== '' ? `Floor ${rm.floor} · ${beds}` : beds
}

function boarders(rm: PreviewRoom): string {
  const n = rm.occupants?.length ?? 0
  return `${n} boarder${n === 1 ? '' : 's'}`
}

// The mock's hues per type; anything else takes the muted ink.
const TINT: Record<string, string> = {
  kitchen: '#8a5a3a',
  bathroom: '#2f5fa8',
  laundry: '#6b6656',
  study_area: '#b4532a',
}
const tint = (type: string) => TINT[type] ?? 'var(--ar-muted)'
</script>

<style scoped src="./rowList.css"></style>
<style scoped>
.fp-tile {
  background: color-mix(in srgb, var(--tint) 13%, var(--ar-surface));
  color: var(--tint);
}
.fp-chips { flex-wrap: wrap; }
.fp-chip {
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--ar-soft);
  color: var(--ar-text);
  font-size: 10.5px;
  font-weight: 600;
}
.fp-room {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  overflow: hidden;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--ar-soft), var(--ar-border));
}
.fp-room img { width: 100%; height: 100%; object-fit: cover; }
</style>
