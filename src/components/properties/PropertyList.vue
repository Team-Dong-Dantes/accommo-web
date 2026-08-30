<template>
  <div class="column no-wrap full-height bg-surface" style="border-radius: 12px; overflow: hidden;">

    <div class="list-head q-px-md q-py-sm border-bottom bg-surface shrink-0">
      <div class="row items-center no-wrap">
        <Icon icon="mdi:home-city-outline" width="18" height="18" color="var(--c-primary)" class="q-mr-sm" />
        <div class="text-weight-bold text-ink" style="font-size: 15px;">Accommodations</div>
        <span class="count-badge q-ml-xs">{{ accommodations.length }}</span>
      </div>
      <div class="text-caption text-muted" style="line-height: 1.2;">Tap an accommodation to view its details</div>
    </div>

    <q-scroll-area class="col">
      <div class="q-pa-sm column" v-if="accommodations.length">

        <q-item
          v-for="prop in accommodations"
          :key="prop.id"
          clickable
          v-ripple
          class="accommodation-row q-mb-sm q-pa-sm"
          @click="$emit('select', prop)"
        >
          <q-item-section avatar class="q-pr-sm" style="min-width: 52px;">
            <q-avatar size="46px" class="shadow-1 accommodation-avatar" style="border-radius: 12px;">
              <img v-if="prop.image" :src="prop.image" />
              <span v-else class="avatar-fallback text-weight-bold">{{ initials(prop.name) }}</span>
            </q-avatar>
          </q-item-section>

          <q-item-section style="min-width: 0;">
            <div class="text-weight-bold text-ink ellipsis" style="font-size: 14px; line-height: 1.2;">{{ prop.name }}</div>
            <div class="text-muted q-mt-xs ellipsis" style="font-size: 11px;">
              <span class="text-weight-bold text-muted">{{ prop.type }}</span>
              <template v-if="prop.accommodationManager"> · {{ prop.accommodationManager }}</template>
            </div>

            <div class="row items-center q-mt-sm no-wrap" style="gap: 6px;">
              <BadgePill v-if="prop.verified" status="verified" label="Verified" />
              <BadgePill v-else status="rejected" label="Flagged" />

              <span v-if="prop.rating != null && prop.rating !== '—'" class="text-warning text-weight-bold row items-center no-wrap" style="font-size: 12px;">
                <Icon icon="mdi:star" width="12" height="12" class="q-mr-xs" style="margin-top: -1px;" /> {{ prop.rating }}
              </span>
            </div>
          </q-item-section>

          <q-item-section side class="column items-end justify-center q-pl-none q-ml-md" style="width: 66px;">
            <div class="text-ink text-weight-bold" style="font-size: 13px; line-height: 1;">{{ prop.totalStudents || 0 }}/{{ prop.totalCapacity || 0 }}</div>
            <div class="text-muted q-mb-xs" style="font-size: 9px;">occupied</div>
            <q-linear-progress :value="prop.totalCapacity ? (prop.totalStudents || 0) / prop.totalCapacity : 0" color="primary" class="full-width" style="border-radius: var(--radius-sm);" size="4px" />
          </q-item-section>

          <q-item-section side class="q-pl-sm" style="width: auto;">
            <Icon icon="mdi:chevron-right" color="var(--c-border-strong)" width="18" height="18" />
          </q-item-section>
        </q-item>

      </div>

      <div v-else class="q-pa-lg text-center text-muted text-caption">
        <Icon icon="mdi:map-search-outline" width="34" height="34" color="var(--c-muted)" class="q-mb-sm" />
        <div>No accommodations match.</div>
      </div>
    </q-scroll-area>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import BadgePill from '@/components/user/BadgePill.vue'

interface AccommodationItem {
  id: string | number
  name: string
  type?: string
  accommodationManager?: string
  image?: string
  verified?: boolean
  rating?: string | number | null
  totalStudents?: number
  totalCapacity?: number
}

defineProps({
  accommodations: { type: Array as PropType<AccommodationItem[]>, required: true }
})

defineEmits(['select'])

function initials(name?: string): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
</script>

<style scoped>
.shrink-0 { flex-shrink: 0; }
.border-bottom { border-bottom: 1px solid var(--c-border); }

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--c-primary-soft, #e6f4f3);
  color: var(--c-primary);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.list-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

/* Card-style rows — reads like a table but stays a scrollable list. */
.accommodation-row {
  border-radius: 12px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  transition: background-color var(--t-fast, 0.15s) ease, border-color var(--t-fast, 0.15s) ease, transform var(--t-fast, 0.15s) ease;
}
.accommodation-row:hover {
  background: var(--c-surface-2);
  border-color: var(--c-border-strong);
}
.accommodation-row:active {
  background: var(--c-primary-soft, #e6f4f3);
  transform: translateY(1px);
}

.accommodation-avatar { background: var(--c-primary-soft, #e6f4f3); }
.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-primary);
  color: #fff;
  font-size: 15px;
}
</style>
