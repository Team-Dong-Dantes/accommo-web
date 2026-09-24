<template>
  <!-- A room's boarders, in the accommodation record's row-list look; View
       slides their profile in over the tabs. -->
  <div v-if="occupants.length" class="rl">
    <div class="rl-list op-list">
      <div v-for="p in occupants" :key="p.id" class="rl-person op-row">
        <span class="rl-av" :class="p.gender === 'female' ? 'rl-av--f' : 'rl-av--m'">
          <img v-if="p.avatarUrl" :src="p.avatarUrl" :alt="p.name" />
          <template v-else>{{ p.initials }}</template>
        </span>
        <span class="rl-main">
          <span class="rl-pname">{{ p.name }}</span>
          <span class="rl-sub">{{ [cap(p.gender ?? ''), cap(p.status ?? '')].filter(Boolean).join(' · ') || 'Boarder' }}</span>
        </span>
        <span v-if="p.since" class="rl-since">Since {{ fmtDate(p.since) }}</span>
        <button type="button" class="rl-view" @click="$emit('view-person', p)">View</button>
      </div>
    </div>
  </div>
  <TabEmptyState v-else icon="lucide:users" title="No boarders" message="Nobody is boarding in this room right now." />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cap, fmtDate } from '@/utils/format'
import TabEmptyState from '../TabEmptyState.vue'
import type { DrawerPreview, PreviewOccupant } from '../preview'

const props = defineProps<{ preview: DrawerPreview }>()
defineEmits<{ (e: 'view-person', p: PreviewOccupant): void }>()

const occupants = computed(() => props.preview.occupants ?? [])
</script>

<style scoped src="../accommodation/rowList.css"></style>
<style scoped>
.op-list { gap: 0; padding: 6px; background: var(--ar-surface); }
.op-row + .op-row { margin-top: 6px; }
</style>
