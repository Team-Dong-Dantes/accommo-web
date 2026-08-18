<template>
  <div class="column no-wrap full-height bg-surface" style="border-radius: 12px; overflow: hidden;">

    <div class="q-pa-md border-bottom shrink-0">
      <q-btn flat dense color="grey-7" no-caps class="q-mb-md q-ml-none text-weight-medium q-pl-none" @click="$emit('back')">
        <Icon icon="mdi:chevron-left" class="on-left" width="18" height="18" />All Properties
      </q-btn>

      <div class="row justify-between items-start q-mb-md">
        <div>
          <div class="text-h6 text-weight-bold text-ink" style="line-height: 1.2">{{ property?.name }}</div>
          <div class="text-caption text-muted">{{ property?.type }} · {{ property?.id }}</div>
        </div>
        <q-btn unelevated dense outline color="primary-1" text-color="primary" no-caps class="q-px-sm text-weight-bold bg-primary-1" style="border-radius: 12px;" size="12px">
          <Icon icon="mdi:verified" class="on-left" width="14" height="14" />Verified
        </q-btn>
      </div>

      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-3" v-for="stat in quickStats" :key="stat.label">
          <div class="stat-box column flex-center q-pa-sm text-center" :class="stat.bg" style="border-radius: 12px;">
            <span class="text-weight-bold" :class="stat.textColor" style="font-size: 16px">{{ stat.value }}</span>
            <span class="text-muted" style="font-size: 11px">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <div class="row q-gutter-x-md q-mb-sm">
        <div class="col bg-surface-2 q-pa-sm row items-center no-wrap" style="border-radius: 12px;">
          <Icon icon="mdi:gender-female" color="#e91e63" width="16" height="16" class="q-mr-xs" />
          <span class="text-pink-4 text-weight-bold q-mr-sm" style="font-size: 14px">{{ property?.femaleCount }}</span>
          <q-linear-progress :value="femaleRatio" color="pink-4" class="col" style="border-radius: 12px;" size="6px" track-color="grey-3" />
          <span class="text-muted q-ml-sm" style="font-size: 11px">Female</span>
        </div>
        <div class="col bg-surface-2 q-pa-sm row items-center no-wrap" style="border-radius: 12px;">
          <Icon icon="mdi:gender-male" color="#42a5f5" width="16" height="16" class="q-mr-xs" />
          <span class="text-blue-4 text-weight-bold q-mr-sm" style="font-size: 14px">{{ property?.maleCount }}</span>
          <q-linear-progress :value="maleRatio" color="blue-4" class="col" style="border-radius: 12px;" size="6px" track-color="grey-3" />
          <span class="text-muted q-ml-sm" style="font-size: 11px">Male</span>
        </div>
      </div>
    </div>

    <div class="q-px-md q-pt-md shrink-0">
      <q-tabs
        v-model="activeTab"
        dense
        no-caps
        class="text-muted bg-surface-2"
        active-color="white"
        active-bg-color="dark"
        indicator-color="transparent"
        align="justify"
        style="border-radius: 24px; padding: 4px;"
      >
        <q-tab name="overview" label="Overview" class="text-weight-bold" style="border-radius: 24px; min-height: 36px; transition: all 0.2s;" />
        <q-tab name="rooms" label="Rooms & Occupants" class="text-weight-bold" style="border-radius: 24px; min-height: 36px; transition: all 0.2s;" />
      </q-tabs>
    </div>

    <q-scroll-area class="col q-mt-md">
      <q-tab-panels v-model="activeTab" animated style="background: transparent;">

        <q-tab-panel name="overview" class="q-pa-md column q-gutter-y-md">
          <q-carousel v-model="slide" animated swipeable arrows navigation infinite class="shadow-1" style="border-radius: 12px;" height="200px">
            <q-carousel-slide :name="1" :img-src="property?.image" />
            <q-carousel-slide :name="2" img-src="https://picsum.photos/500/300?random=2" />
          </q-carousel>

          <div>
            <div class="text-caption text-muted text-weight-bold text-uppercase q-mb-sm tracking-wide">Landlord</div>
            <q-card flat bordered class="q-pa-md bg-surface-2" style="border-radius: 12px;">
              <q-item class="q-pa-none">
                <q-item-section avatar><q-avatar color="primary" text-color="white" class="text-weight-bold shadow-1">{{ property?.landlordInitials }}</q-avatar></q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-ink">{{ property?.landlord }}</q-item-label>
                  <q-item-label caption class="text-muted">{{ property?.contact }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-card>
          </div>

          <div>
            <div class="text-caption text-muted text-weight-bold text-uppercase q-mb-sm tracking-wide">Address</div>
            <q-card flat bordered class="q-pa-md bg-surface-2 row items-center no-wrap text-ink text-weight-medium" style="border-radius: 12px;">
              <Icon icon="mdi:map-marker" color="#00897b" width="20" height="20" class="q-mr-sm" />
              {{ property?.address }}
            </q-card>
          </div>

          <div>
            <div class="text-caption text-muted text-weight-bold text-uppercase q-mb-sm tracking-wide">Details</div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-card flat bordered class="q-pa-md bg-surface-2 row items-center no-wrap" style="border-radius: 12px;">
                  <Icon icon="mdi:bed" color="#26a69a" width="24" height="24" class="q-mr-sm" />
                  <div>
                    <div class="text-weight-bold text-ink" style="font-size: 13px">{{ property?.totalRooms }}</div>
                    <div class="text-caption text-muted" style="font-size: 11px">Total Rooms</div>
                  </div>
                </q-card>
              </div>
              <div class="col-6">
                <q-card flat bordered class="q-pa-md bg-surface-2 row items-center no-wrap" style="border-radius: 12px;">
                  <Icon icon="mdi:office-building-outline" color="#5c6bc0" width="24" height="24" class="q-mr-sm" />
                  <div>
                    <div class="text-weight-bold text-ink" style="font-size: 13px">{{ property?.propertyType }}</div>
                    <div class="text-caption text-muted" style="font-size: 11px">Property Type</div>
                  </div>
                </q-card>
              </div>
              <div class="col-6">
                <q-card flat bordered class="q-pa-md bg-surface-2 row items-center no-wrap" style="border-radius: 12px;">
                  <Icon icon="mdi:home-outline" color="#42a5f5" width="24" height="24" class="q-mr-sm" />
                  <div>
                    <div class="text-weight-bold text-ink" style="font-size: 13px">{{ property?.floors }} floors</div>
                    <div class="text-caption text-muted" style="font-size: 11px">Total Floors</div>
                  </div>
                </q-card>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="rooms" class="q-pa-md">
          <q-list class="q-gutter-y-sm">
            <q-expansion-item
              v-for="room in property?.rooms"
              :key="room.name"
              group="rooms"
              header-class="room-header border-all"
              style="border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);"
              expand-icon-class="text-muted"
            >
              <template v-slot:header>
                <q-item-section avatar>
                  <Icon icon="mdi:bed-single" color="#00897b" width="24" height="24" class="bg-primary-1 q-pa-sm" style="border-radius: 12px; padding: 4px;" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-ink">{{ room.name }}</q-item-label>
                  <q-item-label caption class="row items-center no-wrap" style="font-size: 11px; gap: 6px;">
                    <span class="text-muted">Floor {{ room.floor ?? '—' }}</span>
                    <q-badge outline color="primary" :label="roomTypeLabel(room.capacity)" class="text-weight-bold" style="border-radius: 6px; font-size: 9px;" />
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="text-right">
                    <div class="text-weight-bold" :class="roomPax(room) >= room.capacity ? 'text-warning' : 'text-primary'" style="font-size: 14px; line-height: 1;">
                      {{ roomPax(room) }}/{{ room.capacity ?? 0 }}
                    </div>
                    <div class="text-muted" style="font-size: 10px;">occupied</div>
                  </div>
                </q-item-section>
              </template>

              <q-card flat style="background: transparent;">
                <q-card-section class="q-pt-sm q-pb-md q-px-sm border-all border-top-none occupy-panel" style="border-radius: 0 0 12px 12px;">
                  <q-linear-progress
                    :value="room.capacity ? roomPax(room) / room.capacity : 0"
                    :color="roomPax(room) >= room.capacity ? 'warning' : roomPax(room) > 0 ? 'primary' : 'grey-4'"
                    class="q-mb-sm"
                    style="border-radius: var(--radius-sm);"
                    size="6px"
                  />

                  <!-- Occupied rooms with named occupants -->
                  <q-list v-if="room.occupants.length" separator class="q-mt-xs">
                    <q-item v-for="student in room.occupants" :key="student.name" class="q-pl-xl q-pr-sm q-py-md">
                      <q-item-section avatar class="q-pr-sm">
                        <q-avatar size="40px" color="primary" text-color="white" class="text-weight-bold relative-position">
                          {{ student.initials }}
                          <q-badge floating color="pink-4" rounded class="q-pa-xs border-white" style="right: -2px; top: -2px" v-if="student.gender === 'female'"><Icon icon="mdi:gender-female" width="10" height="10" /></q-badge>
                          <q-badge floating color="blue-4" rounded class="q-pa-xs border-white" style="right: -2px; top: -2px" v-else><Icon icon="mdi:gender-male" width="10" height="10" /></q-badge>
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-bold text-ink" style="font-size: 13px">{{ student.name }}</q-item-label>
                        <q-item-label caption class="text-muted" style="font-size: 11px">{{ student.course }}</q-item-label>
                      </q-item-section>
                      <q-item-section side class="column items-end q-pl-lg">
                        <div class="text-orange-6 bg-orange-1 q-px-sm text-weight-bold q-mb-xs" style="font-size: 10px; border-radius: var(--radius-sm);">{{ student.year }}</div>
                        <div class="text-muted" style="font-size: 10px">Since {{ student.since }}</div>
                      </q-item-section>
                    </q-item>
                  </q-list>

                  <!-- Occupied but no named occupants yet -->
                  <div v-else-if="roomPax(room) > 0" class="row items-center justify-between q-px-sm q-py-sm" style="background: var(--c-primary-soft, #e6f4f3); border-radius: 8px;">
                    <div class="row items-center no-wrap">
                      <Icon icon="mdi:account-group-outline" color="#0d9488" width="18" height="18" class="q-mr-xs" />
                      <span class="text-primary text-weight-bold" style="font-size: 12px;">{{ roomPax(room) }} of {{ room.capacity ?? 0 }} beds occupied</span>
                    </div>
                    <q-badge color="primary-1" text-color="primary" label="In use" class="text-weight-bold" style="font-size: 10px; border-radius: 6px;" />
                  </div>

                  <!-- Vacant -->
                  <div v-else class="q-px-sm q-py-sm text-center">
                    <q-badge color="grey-3" text-color="grey-7" label="Vacant" class="text-weight-bold" style="font-size: 10px; border-radius: 6px;" />
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-list>
        </q-tab-panel>

      </q-tab-panels>
    </q-scroll-area>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  property: { type: Object, required: true }
})

defineEmits(['back'])

const activeTab = ref('overview')
const slide = ref(1)

// Effective number of occupants in a room: prefer the room's own current_pax
// (source of truth for capacity/occupancy), falling back to the named-occupants
// list when current_pax isn't set.
function roomPax(room: any): number {
  if (room && typeof room.currentPax === 'number' && room.currentPax >= 0) {
    return room.currentPax
  }
  return room?.occupants?.length ?? 0
}

// Gender split as proportions of total occupants so the pink/blue bars fill
// according to the actual male/female counts (previously hardcoded 1/0).
const genderTotal = computed(() =>
  (props.property?.femaleCount || 0) + (props.property?.maleCount || 0),
)
const femaleRatio = computed(() => {
  const t = genderTotal.value
  return t > 0 ? (props.property?.femaleCount || 0) / t : 0
})
const maleRatio = computed(() => {
  const t = genderTotal.value
  return t > 0 ? (props.property?.maleCount || 0) / t : 0
})

// Classify a room by its bed capacity (rooms don't store a type column).
function roomTypeLabel(capacity: number | null | undefined): string {
  const c = capacity ?? 0
  if (c <= 1) return 'Solo'
  if (c === 2) return 'Duo'
  if (c === 3) return 'Triple'
  if (c === 4) return 'Quad'
  return 'Shared'
}

const quickStats = computed(() => {
  const totalCapacity = props.property?.totalCapacity || 0
  const totalPax = props.property?.totalStudents || 0
  const occupied = Math.min(totalPax, totalCapacity)
  return [
    { label: 'Rooms', value: props.property?.totalRooms || 0, bg: 'bg-purple-1', textColor: 'text-purple-7' },
    { label: 'Vacancy', value: Math.max(0, totalCapacity - occupied), bg: 'bg-teal-1', textColor: 'text-teal-7' },
    { label: 'Occupancy', value: `${occupied}/${totalCapacity}`, bg: 'bg-blue-1', textColor: 'text-blue-7' },
    { label: 'Rating', value: `${props.property?.rating || 0}`, bg: 'bg-orange-1', textColor: 'text-orange-7' },
  ]
})
</script>

<style scoped>
.shrink-0 { flex-shrink: 0; }
.border-bottom { border-bottom: 1px solid var(--c-border); }
.border-all { border: 1px solid var(--c-border-strong); }
.border-top-none { border-top: none; }
.border-white { border: 2px solid white; }

.stat-box { min-height: 64px; }
.tracking-wide { letter-spacing: 0.5px; }

/* Room header — gray background so it stands apart from the white card body. */
.room-header {
  background: var(--c-surface-2, #eef0f2);
}

/* Expanded occupant panel — keep it light/surface so the students below appear
   to "float" on the card's subtle shadow rather than on a filled gray block. */
.occupy-panel {
  background: #ffffff;
}

:deep(.q-tab--inactive) { background-color: transparent; }
</style>
