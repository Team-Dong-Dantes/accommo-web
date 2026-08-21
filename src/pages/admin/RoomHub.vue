<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">
    <PageHeader
      :title="property ? property.name : 'Room Hub'"
      :subtitle="property ? propertyAddress : 'All rooms for the selected boarding house'"
      v-bind="property ? { eyebrow: 'Room Hub' } : {}"
    >
      <template #actions>
        <q-btn
          v-if="property"
          unelevated
          color="teal-7"
          no-caps
          class="text-weight-bold rounded-button"
          @click="router.push(`/property-hub?property=${property.id}`)"
        >
          <Icon icon="mdi:home-search-outline" class="on-left" width="18" height="18" />Property Hub
        </q-btn>
      </template>
    </PageHeader>

    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="32px" />
    </div>

    <EmptyState
      v-else-if="!property"
      variant="rich"
      icon="mdi:door-open"
      title="No property selected"
      message="Open a user's detail drawer, hover a property card, and choose 'View on Room Hub' to see its rooms here."
    />

    <template v-else>
      <!-- Property summary -->
      <div class="border-all rounded-borders rh-prop q-mb-md" style="border-radius: var(--radius-sm);">
        <div class="row justify-between items-center q-pa-md">
          <div>
            <div class="text-h6 text-weight-bold" style="color: var(--c-text)">{{ property.name }}</div>
            <div class="text-caption" style="color: var(--c-muted)">{{ propertyAddress }}</div>
          </div>
          <BadgePill
            :tone="verified ? 'success' : 'warning'"
            :icon="verified ? 'mdi:check-circle' : 'mdi:clock-outline'"
            :label="verified ? 'Accredited' : 'Pending'"
          />
        </div>
        <div class="row q-pa-sm rh-stats">
          <div class="col q-pa-sm">
            <div class="dd-muted text-caption q-mb-xs">Type</div>
            <div class="text-weight-medium">{{ cap(property.room_type) }}</div>
          </div>
          <div class="col q-pa-sm border-left">
            <div class="dd-muted text-caption q-mb-xs">Total Rooms</div>
            <div class="text-weight-medium">{{ property.total_rooms ?? '—' }}</div>
          </div>
          <div class="col q-pa-sm border-left">
            <div class="dd-muted text-caption q-mb-xs">Occupancy</div>
            <div class="text-weight-medium">{{ occupiedCount }} / {{ totalCapacity }}</div>
          </div>
          <div class="col q-pa-sm border-left">
            <div class="dd-muted text-caption q-mb-xs">Rating</div>
            <div class="text-weight-medium">{{ property.rating_avg != null ? `${property.rating_avg.toFixed(1)} ★` : 'No rating' }}</div>
          </div>
        </div>
      </div>

      <!-- Rooms -->
      <div class="dd-ink dd-display text-subtitle1 text-weight-bold q-mb-sm">
        Rooms <span class="text-muted">({{ rooms.length }})</span>
      </div>

      <div
        v-if="!rooms.length"
        class="border-all rounded-borders column flex-center text-muted q-pa-xl"
        style="border-radius: var(--radius-sm);"
      >
        <Icon icon="mdi:door-closed" width="40" height="40" class="q-mb-md" />
        <div class="text-h6 text-weight-bold text-ink">No rooms listed</div>
        <div class="text-caption">This property doesn't have any rooms yet.</div>
      </div>

      <div v-else class="rh-grid">
        <div
          v-for="r in rooms"
          :key="r.id"
          class="border-all rounded-borders rh-room"
          style="border-radius: var(--radius-sm);"
        >
          <div class="row justify-between items-center q-pa-md">
            <div>
              <div class="text-body1 text-weight-bold" style="color: var(--c-text)">
                {{ r.label || ('Room ' + (r.room_number || '—')) }}
              </div>
              <div class="text-caption" style="color: var(--c-muted)">
                {{ [r.room_number ? 'Unit ' + r.room_number : null, r.floor != null ? 'Floor ' + r.floor : null].filter(Boolean).join(' · ') || '—' }}
              </div>
            </div>
            <BadgePill :tone="roomTone(r.status)" :label="cap(r.status)" />
          </div>
          <div class="row q-pa-sm border-top rh-room-stats">
            <div class="col q-pa-xs">
              <div class="dd-muted text-caption">Capacity</div>
              <div class="text-weight-medium">{{ r.capacity ?? '—' }}</div>
            </div>
            <div class="col q-pa-xs border-left">
              <div class="dd-muted text-caption">Occupants</div>
              <div class="text-weight-medium">{{ r.current_pax ?? 0 }}</div>
            </div>
            <div class="col q-pa-xs border-left">
              <div class="dd-muted text-caption">Monthly Rent</div>
              <div class="text-weight-medium">{{ r.monthly_rent != null ? '₱' + r.monthly_rent.toLocaleString() : '—' }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { Icon } from '@iconify/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import type { StatusTone } from '@/utils/status.config'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const property = ref<any | null>(null)
const rooms = ref<any[]>([])

const propertyAddress = computed(() => {
  const p = property.value
  if (!p) return ''
  return [p.address, p.barangay, p.city].filter(Boolean).join(', ')
})
const verified = computed(() => {
  const s = (property.value?.status || '').toLowerCase()
  return s.includes('verif') || s.includes('accred')
})
const occupiedCount = computed(() => rooms.value.reduce((s, r) => s + (r.current_pax || 0), 0))
const totalCapacity = computed(() => rooms.value.reduce((s, r) => s + (r.capacity || 0), 0))

function cap(s: string | null | undefined) {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function roomTone(status: string | null | undefined): StatusTone {
  const s = (status || '').toLowerCase()
  if (s.includes('occup')) return 'warning'
  if (s.includes('avail')) return 'success'
  return 'neutral'
}

async function load() {
  loading.value = true
  const id = route.query.property
  if (typeof id !== 'string' || !id) {
    property.value = null
    rooms.value = []
    loading.value = false
    return
  }
  const { data: p } = await supabase
    .from('properties')
    .select('id, name, status, room_type, total_rooms, address, barangay, city, rating_avg, reviews_count')
    .eq('id', id)
    .maybeSingle()
  property.value = p

  const { data: rs } = await supabase
    .from('rooms')
    .select('id, label, room_number, floor, capacity, current_pax, monthly_rent, status')
    .eq('property_id', id)
    .order('room_number', { ascending: true })
  rooms.value = rs || []
  loading.value = false
}

onMounted(load)
watch(() => route.query.property, load)
</script>

<style scoped>
.rh-prop,
.rh-room {
  background: var(--c-surface);
}
.rh-stats,
.rh-room-stats {
  border-top: 1px solid var(--c-border);
}
.rh-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.border-left {
  border-left: 1px solid var(--c-border);
}
</style>
