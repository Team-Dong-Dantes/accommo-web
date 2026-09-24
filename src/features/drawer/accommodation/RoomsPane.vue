<template>
  <div v-if="groups.length" class="rl">
    <section v-for="g in groups" :key="g.key" class="rl-floor">
      <div class="rl-floor-head">
        <span class="rl-floor-name">{{ g.label }}</span>
        <span class="rl-rule"></span>
        <span class="rl-floor-count">{{ g.items.length }} room{{ g.items.length === 1 ? '' : 's' }}</span>
      </div>
      <div class="rl-list">
        <q-expansion-item v-for="rm in g.items" :key="rm.id" group="rooms" class="rl-item" header-class="rl-row" hide-expand-icon>
          <template #header="{ expanded }">
            <span class="rl-thumb">
              <img v-if="rm.photos?.length" :src="rm.photos[0]" alt="" />
              <Icon v-else icon="lucide:bed-double" width="17" height="17" />
            </span>
            <span class="rl-main">
              <span class="rl-name">{{ rm.name }}</span>
              <span class="rl-sub">{{ rm.capacity ?? 0 }} bed{{ rm.capacity === 1 ? '' : 's' }}</span>
            </span>
            <span class="rl-col">
              <i v-for="(b, i) in beds(rm)" :key="i" class="rl-bed" :class="`rl-bed--${b}`"></i>
              <span class="rl-count">{{ boarders(rm).length }}/{{ rm.capacity ?? 0 }}</span>
            </span>
            <span class="rl-status">
              <span class="rl-pill" :class="`rl-pill--${state(rm).tone}`">{{ state(rm).label }}</span>
            </span>
            <Icon :icon="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" width="16" height="16" class="rl-chev" />
          </template>

          <div class="rl-detail">
            <PhotoStrip :photos="rm.photos ?? []" :title="rm.name" @open="(i) => $emit('photos', rm.name, rm.photos ?? [], i)" />
            <div v-for="p in boarders(rm)" :key="p.id" class="rl-person">
              <span class="rl-av" :class="p.gender === 'female' ? 'rl-av--f' : 'rl-av--m'">
                <img v-if="p.avatarUrl" :src="p.avatarUrl" :alt="p.name" />
                <template v-else>{{ p.initials }}</template>
              </span>
              <span class="rl-main">
                <span class="rl-pname">{{ p.name }}</span>
                <span class="rl-sub">{{ p.detail || cap(p.gender) }}</span>
              </span>
              <span v-if="p.since" class="rl-since">Since {{ p.since }}</span>
              <button v-if="p.id" type="button" class="rl-view" @click="$emit('view-person', p, rm)">View</button>
            </div>
            <div v-for="n in vacant(rm)" :key="`v${n}`" class="rl-vacant">
              <span class="rl-vacant-dot"></span>Bed vacant
            </div>
          </div>
        </q-expansion-item>
      </div>
    </section>
  </div>
  <TabEmptyState v-else icon="lucide:door-open" title="No rooms" message="This accommodation has not listed any rooms yet." />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import TabEmptyState from '../TabEmptyState.vue'
import PhotoStrip from './PhotoStrip.vue'
import { cap, groupByFloor, type DrawerPreview, type PreviewOccupant, type PreviewRoom } from '../preview'

const props = defineProps<{ preview: DrawerPreview }>()
defineEmits<{
  (e: 'view-person', person: PreviewOccupant, room: PreviewRoom): void
  (e: 'photos', title: string, photos: string[], index: number): void
}>()

const groups = computed(() => groupByFloor(props.preview.rooms ?? []))

const boarders = (rm: PreviewRoom) => rm.occupants ?? []
const vacant = (rm: PreviewRoom) => Math.max((rm.capacity ?? 0) - boarders(rm).length, 0)

/** One square per bed: male boarders, then female, then the empty beds. */
function beds(rm: PreviewRoom): ('m' | 'f' | 'v')[] {
  const f = boarders(rm).filter((p) => p.gender === 'female').length
  const m = boarders(rm).length - f
  return [...Array(m).fill('m'), ...Array(f).fill('f'), ...Array(vacant(rm)).fill('v')]
}

function state(rm: PreviewRoom): { label: string; tone: 'ok' | 'full' | 'warn' } {
  if (String(rm.status ?? '').toLowerCase() === 'maintenance') return { label: 'Maintenance', tone: 'warn' }
  const v = vacant(rm)
  return v > 0 ? { label: `${v} vacant`, tone: 'ok' } : { label: 'Full', tone: 'full' }
}
</script>

<style scoped src="./rowList.css"></style>
