<template>
  <div class="column no-wrap full-height bg-white" style="border-radius: 12px; overflow: hidden;">

    <div class="q-pa-md border-bottom bg-white shrink-0">

      <div class="row items-center q-mb-md">
        <q-avatar color="teal-1" text-color="teal-7" size="40px" class="q-mr-sm" style="border-radius: 12px;">
          <Icon icon="mdi:home-city-outline" width="24" height="24" />
        </q-avatar>
        <div>
          <div class="text-weight-bold text-dark" style="font-size: 18px; line-height: 1.2;">All Properties</div>
          <div class="text-caption text-grey-6" style="margin-top: -2px;">{{ properties.length }} listings</div>
        </div>
      </div>

      <div class="row q-gutter-x-sm no-wrap items-center">
        <SearchInput
          v-model="search"
          placeholder="Search name, landlord..."
          class="col custom-radius"
        />

        <FilterDropdown
          class="custom-radius-filter"
          style="min-width: 85px;"
        />
      </div>
    </div>

    <q-scroll-area class="col">
      <q-list separator>

        <q-item
          v-for="prop in properties"
          :key="prop.id"
          clickable
          v-ripple
          class="q-py-md q-px-sm property-item"
          @click="$emit('select', prop)"
        >
          <q-item-section avatar class="q-pr-sm" style="min-width: 50px;">
            <q-avatar size="48px" class="shadow-1" style="border-radius: 12px;">
              <img :src="prop.image" />
            </q-avatar>
          </q-item-section>

          <q-item-section style="min-width: 0;">
            <div class="text-weight-bold text-dark ellipsis" style="font-size: 14px; line-height: 1.2;">{{ prop.name }}</div>
            <div class="text-grey-6 q-mt-xs ellipsis" style="font-size: 11px;">{{ prop.type }} · {{ prop.landlord }}</div>

            <div class="row items-center q-mt-sm no-wrap" style="gap: 6px;">
              <q-badge v-if="prop.verified" color="teal-1" text-color="teal-7" class="text-weight-bold" style="border-radius: 6px; padding: 2px 4px; font-size: 10px;">
                <Icon icon="mdi:circle" width="4" height="4" class="q-mr-xs" /> Verified
              </q-badge>
              <q-badge v-else color="red-1" text-color="red-5" class="text-weight-bold" style="border-radius: 6px; padding: 2px 4px; font-size: 10px;">
                <Icon icon="mdi:circle" width="4" height="4" class="q-mr-xs" /> Flagged
              </q-badge>

              <span class="text-teal-7 text-weight-bold ellipsis" style="font-size: 12px;">{{ prop.price }}</span>

              <span class="text-orange-5 text-weight-bold row items-center no-wrap" style="font-size: 12px;">
                <Icon icon="mdi:star" width="12" height="12" class="q-mr-xs" style="margin-top: -1px;" /> {{ prop.rating }}
              </span>
            </div>
          </q-item-section>

          <q-item-section side class="row items-center no-wrap q-pl-none" style="width: auto;">
            <div class="column items-center justify-center q-mr-xs" style="width: 45px;">
              <div class="text-dark text-weight-bold" style="font-size: 13px; line-height: 1;">{{ prop.occupiedRooms }}/{{ prop.totalRooms }}</div>
              <div class="text-grey-5 q-mb-xs" style="font-size: 9px;">rooms</div>
              <q-linear-progress :value="prop.occupiedRooms / prop.totalRooms" color="orange-5" class="full-width" style="border-radius: 4px;" size="4px" />
            </div>
            <Icon icon="mdi:chevron-right" color="#bdbdbd" width="18" height="18" />
          </q-item-section>

        </q-item>

      </q-list>
    </q-scroll-area>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'

defineProps({
  properties: { type: Array, required: true }
})

defineEmits(['select'])

const search = ref('')
</script>

<style scoped>
.shrink-0 { flex-shrink: 0; }
.border-bottom { border-bottom: 1px solid #f0f0f0; }

.custom-radius :deep(.q-field__control) { border-radius: 12px !important; }
.custom-radius-filter :deep(.q-btn) { border-radius: 12px !important; }

.property-item { transition: background-color 0.2s ease; }
.property-item:hover { background-color: #fafafa; }
</style>
