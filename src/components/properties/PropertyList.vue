<template>
  <div class="column no-wrap full-height bg-surface" style="border-radius: 12px; overflow: hidden;">

    <div class="list-head q-px-md q-py-sm border-bottom bg-surface shrink-0">
      <div class="text-weight-bold text-ink" style="font-size: 15px;">Properties</div>
      <div class="text-caption text-muted" style="line-height: 1.2;">{{ properties.length }} listings</div>
    </div>

    <q-scroll-area class="col">
      <q-list separator class="map-list" v-if="properties.length">

        <q-item
          v-for="prop in properties"
          :key="prop.id"
          clickable
          v-ripple
          class="q-py-md q-px-sm property-item"
          @click="$emit('select', prop)"
        >
          <q-item-section avatar class="q-pr-sm" style="min-width: 50px;">
            <q-avatar size="46px" class="shadow-1" style="border-radius: 12px;">
              <img :src="prop.image" />
            </q-avatar>
          </q-item-section>

          <q-item-section style="min-width: 0;">
            <div class="text-weight-bold text-ink ellipsis" style="font-size: 14px; line-height: 1.2;">{{ prop.name }}</div>
            <div class="text-muted q-mt-xs ellipsis" style="font-size: 11px;">
              <span class="text-weight-bold text-muted">{{ prop.type }}</span>
              <template v-if="prop.landlord"> · {{ prop.landlord }}</template>
            </div>

            <div class="row items-center q-mt-sm no-wrap" style="gap: 6px;">
              <BadgePill v-if="prop.verified" status="verified" label="Verified" />
              <BadgePill v-else status="rejected" label="Flagged" />

              <span v-if="prop.rating != null && prop.rating !== '—'" class="text-warning text-weight-bold row items-center no-wrap" style="font-size: 12px;">
                <Icon icon="mdi:star" width="12" height="12" class="q-mr-xs" style="margin-top: -1px;" /> {{ prop.rating }}
              </span>
            </div>
          </q-item-section>

          <q-item-section side class="row items-center no-wrap q-pl-none" style="width: auto;">
            <div class="column items-center justify-center q-mr-xs" style="width: 48px;">
              <div class="text-ink text-weight-bold" style="font-size: 13px; line-height: 1;">{{ prop.totalStudents || 0 }}/{{ prop.totalCapacity || 0 }}</div>
              <div class="text-muted q-mb-xs" style="font-size: 9px;">occupied</div>
              <q-linear-progress :value="prop.totalCapacity ? (prop.totalStudents || 0) / prop.totalCapacity : 0" color="primary" class="full-width" style="border-radius: var(--radius-sm);" size="4px" />
            </div>
            <Icon icon="mdi:chevron-right" color="var(--c-border-strong)" width="18" height="18" />
          </q-item-section>

        </q-item>

      </q-list>

      <div v-else class="q-pa-lg text-center text-muted text-caption">
        <Icon icon="mdi:map-search-outline" width="34" height="34" color="var(--c-muted)" class="q-mb-sm" />
        <div>No properties match.</div>
      </div>
    </q-scroll-area>
  </div>
</template>

<script setup lang="ts">
import BadgePill from '@/components/user/BadgePill.vue'

defineProps({
  properties: { type: Array, required: true }
})

defineEmits(['select'])
</script>

<style scoped>
.shrink-0 { flex-shrink: 0; }
.border-bottom { border-bottom: 1px solid var(--c-border); }

.list-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.property-item { transition: background-color 0.2s ease, padding-left 0.15s ease; }
.property-item:hover {
  background-color: var(--c-surface-2);
}
.property-item:active { background-color: var(--c-primary-soft, #e6f4f3); }

.map-list { padding-bottom: 4px; }
</style>
