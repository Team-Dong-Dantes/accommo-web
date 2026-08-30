<template>
  <div v-if="preview.occupants?.length" class="dd-occupants">
    <div
      v-for="(o, i) in preview.occupants"
      :key="i"
      class="dd-occupant"
    >
      <q-avatar size="40px" :style="{ background: o.gender === 'female' ? 'var(--c-danger)' : o.gender === 'male' ? 'var(--c-info, var(--c-primary))' : 'var(--c-muted)', color: '#fff' }" class="text-caption text-weight-bold">{{ o.initials }}</q-avatar>
      <span class="col min-width-0 text-left">
        <span class="dd-occupant-name">{{ o.name }}</span>
        <span class="dd-occupant-meta">
          <template v-if="o.gender">{{ capGender(o.gender) }}</template>
          <template v-if="o.gender && o.since"> · </template>
          <template v-if="o.since">Since {{ fmtMonthYear(o.since) }}</template>
        </span>
      </span>
      <BadgePill v-if="o.status" :tone="o.statusTone || 'neutral'" :label="o.status" />
    </div>
  </div>
  <div v-else class="dd-empty">No occupants assigned to this room.</div>
</template>

<script setup lang="ts">
import BadgePill from '@/components/user/BadgePill.vue'
import type { DrawerPreview } from './preview'
import { capGender, fmtMonthYear } from './preview'

defineProps<{ preview: DrawerPreview }>()
</script>

<style scoped>
.dd-occupants {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dd-occupant {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
}
.dd-occupant-name {
  display: block;
  font-weight: 700;
  font-size: 14px;
  color: var(--c-ink);
  line-height: 1.2;
}
.dd-occupant-meta {
  display: block;
  font-size: 12px;
  color: var(--c-muted);
  margin-top: 2px;
}
.dd-empty {
  font-size: 13px;
  color: var(--c-muted);
  padding: 10px 12px;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
}
</style>
