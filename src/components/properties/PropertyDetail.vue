<template>
  <div class="column no-wrap full-height bg-surface" style="border-radius: 12px; overflow: hidden;">

    <div class="q-pa-md border-bottom shrink-0">
      <q-btn flat dense color="grey-7" label="All Properties" no-caps class="q-mb-md q-ml-none text-weight-medium q-pl-none" @click="$emit('back')">
        <Icon icon="mdi:chevron-left" class="on-left" width="18" height="18" />All Properties
      </q-btn>

      <div class="row justify-between items-start q-mb-md">
        <div>
          <div class="text-h6 text-weight-bold text-dark" style="line-height: 1.2">{{ property?.name }}</div>
          <div class="text-caption text-grey-6">{{ property?.type }} · {{ property?.id }}</div>
        </div>
        <q-btn unelevated dense outline color="teal-2" text-color="teal-7" no-caps class="q-px-sm text-weight-bold bg-teal-1" style="border-radius: 12px;" size="12px">
          <Icon icon="mdi:verified" class="on-left" width="14" height="14" />Verified
        </q-btn>
      </div>

      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-3" v-for="stat in quickStats" :key="stat.label">
          <div class="stat-box column flex-center q-pa-sm text-center" :class="stat.bg" style="border-radius: 12px;">
            <span class="text-weight-bold" :class="stat.textColor" style="font-size: 16px">{{ stat.value }}</span>
            <span class="text-grey-6" style="font-size: 11px">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <div class="row q-gutter-x-md q-mb-sm">
        <div class="col bg-grey-1 q-pa-sm row items-center no-wrap" style="border-radius: 12px;">
          <Icon icon="mdi:gender-female" color="#e91e63" width="16" height="16" class="q-mr-xs" />
          <span class="text-pink-4 text-weight-bold q-mr-sm" style="font-size: 14px">{{ property?.femaleCount }}</span>
          <q-linear-progress :value="1" color="pink-4" class="col" style="border-radius: 12px;" size="6px" />
          <span class="text-grey-5 q-ml-sm" style="font-size: 11px">Female</span>
        </div>
        <div class="col bg-grey-1 q-pa-sm row items-center no-wrap" style="border-radius: 12px;">
          <Icon icon="mdi:gender-male" color="#42a5f5" width="16" height="16" class="q-mr-xs" />
          <span class="text-blue-4 text-weight-bold q-mr-sm" style="font-size: 14px">{{ property?.maleCount }}</span>
          <q-linear-progress :value="0" color="blue-4" class="col" style="border-radius: 12px;" size="6px" track-color="grey-3" />
          <span class="text-grey-5 q-ml-sm" style="font-size: 11px">Male</span>
        </div>
      </div>
    </div>

    <div class="q-px-md q-pt-md shrink-0">
      <q-tabs
        v-model="activeTab"
        dense
        no-caps
        class="text-grey-6 bg-grey-2"
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
            <div class="text-caption text-grey-5 text-weight-bold text-uppercase q-mb-sm tracking-wide">Landlord</div>
            <q-card flat bordered class="q-pa-md bg-grey-1" style="border-radius: 12px;">
              <q-item class="q-pa-none">
                <q-item-section avatar><q-avatar color="teal-7" text-color="white" class="text-weight-bold shadow-1">{{ property?.landlordInitials }}</q-avatar></q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-dark">{{ property?.landlord }}</q-item-label>
                  <q-item-label caption class="text-grey-6">{{ property?.contact }}</q-item-label>
                </q-item-section>
                <q-item-section side><q-btn unelevated color="teal-7" no-caps class="text-weight-bold" style="border-radius: 12px;"><Icon icon="mdi:phone" class="on-left" width="16" height="16" />Call</q-btn></q-item-section>
              </q-item>
            </q-card>
          </div>

          <div>
            <div class="text-caption text-grey-5 text-weight-bold text-uppercase q-mb-sm tracking-wide">Address</div>
            <q-card flat bordered class="q-pa-md bg-grey-1 row items-center no-wrap text-dark text-weight-medium" style="border-radius: 12px;">
              <Icon icon="mdi:map-marker" color="#00897b" width="20" height="20" class="q-mr-sm" />
              {{ property?.address }}
            </q-card>
          </div>

          <div>
            <div class="text-caption text-grey-5 text-weight-bold text-uppercase q-mb-sm tracking-wide">Details</div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-card flat bordered class="q-pa-md bg-grey-1 row items-center no-wrap" style="border-radius: 12px;">
                  <Icon icon="mdi:currency-usd" color="#26a69a" width="24" height="24" class="q-mr-sm" />
                  <div>
                    <div class="text-weight-bold text-dark" style="font-size: 13px">{{ property?.price }}</div>
                    <div class="text-caption text-grey-5" style="font-size: 11px">Monthly Rent</div>
                  </div>
                </q-card>
              </div>
              <div class="col-6">
                <q-card flat bordered class="q-pa-md bg-grey-1 row items-center no-wrap" style="border-radius: 12px;">
                  <Icon icon="mdi:office-building-outline" color="#5c6bc0" width="24" height="24" class="q-mr-sm" />
                  <div>
                    <div class="text-weight-bold text-dark" style="font-size: 13px">{{ property?.type }}</div>
                    <div class="text-caption text-grey-5" style="font-size: 11px">Room Type</div>
                  </div>
                </q-card>
              </div>
              <div class="col-6">
                <q-card flat bordered class="q-pa-md bg-grey-1 row items-center no-wrap" style="border-radius: 12px;">
                  <Icon icon="mdi:home-outline" color="#42a5f5" width="24" height="24" class="q-mr-sm" />
                  <div>
                    <div class="text-weight-bold text-dark" style="font-size: 13px">{{ property?.floors }} floors</div>
                    <div class="text-caption text-grey-5" style="font-size: 11px">Total Floors</div>
                  </div>
                </q-card>
              </div>
              <div class="col-6">
                <q-card flat bordered class="q-pa-md bg-grey-1 row items-center no-wrap" style="border-radius: 12px;">
                  <Icon icon="mdi:bed-outline" color="#ff9800" width="24" height="24" class="q-mr-sm" />
                  <div>
                    <div class="text-weight-bold text-dark" style="font-size: 13px">{{ (property?.totalRooms || 0) - (property?.occupiedRooms || 0) }} available</div>
                    <div class="text-caption text-grey-5" style="font-size: 11px">Vacant Rooms</div>
                  </div>
                </q-card>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="rooms" class="q-pa-md">
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-4">
              <div class="stat-box bg-purple-1 column flex-center q-pa-sm text-center" style="border-radius: 12px;">
                <span class="text-weight-bold text-purple-7" style="font-size: 18px">{{ property?.totalRooms }}</span>
                <span class="text-grey-6" style="font-size: 11px">Total</span>
              </div>
            </div>
            <div class="col-4">
              <div class="stat-box bg-teal-1 column flex-center q-pa-sm text-center" style="border-radius: 12px;">
                <span class="text-weight-bold text-teal-7" style="font-size: 18px">{{ property?.occupiedRooms }}</span>
                <span class="text-grey-6" style="font-size: 11px">Occupied</span>
              </div>
            </div>
            <div class="col-4">
              <div class="stat-box bg-orange-1 column flex-center q-pa-sm text-center" style="border-radius: 12px;">
                <span class="text-weight-bold text-orange-7" style="font-size: 18px">{{ (property?.totalRooms || 0) - (property?.occupiedRooms || 0) }}</span>
                <span class="text-grey-6" style="font-size: 11px">Vacant</span>
              </div>
            </div>
          </div>

          <q-list class="q-gutter-y-sm">
            <q-expansion-item
              v-for="room in property?.rooms"
              :key="room.name"
              group="rooms"
              header-class="bg-surface border-all"
              style="border-radius: 12px; overflow: hidden;"
              expand-icon-class="text-grey-6"
            >
              <template v-slot:header>
                <q-item-section avatar>
                  <Icon icon="mdi:bed-single" color="#00897b" width="24" height="24" class="bg-teal-1 q-pa-sm" style="border-radius: 12px; padding: 4px;" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-dark">{{ room.name }}</q-item-label>
                  <q-item-label caption class="text-grey-6" style="font-size: 11px">Floor {{ room.floor }} · <span class="text-teal-7 text-weight-bold">{{ room.occupants.length }}/{{ room.capacity }} occupied</span></q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-linear-progress :value="room.occupants.length / room.capacity" color="teal-6" style="width: 30px; border-radius: 4px" size="6px" />
                </q-item-section>
              </template>

              <q-card class="bg-transparent" flat>
                <q-card-section class="q-pt-sm q-pb-md q-px-sm border-all border-top-none" style="border-radius: 0 0 12px 12px;">
                  <div v-if="room.occupants.length === 0" class="text-caption text-grey-5 text-center">Room is currently vacant.</div>
                  <q-list separator v-else>
                    <q-item v-for="student in room.occupants" :key="student.name" class="q-px-sm q-py-sm">
                      <q-item-section avatar>
                        <q-avatar size="40px" color="teal-6" text-color="white" class="text-weight-bold relative-position">
                          {{ student.initials }}
                          <q-badge floating color="pink-4" rounded class="q-pa-xs border-white" style="right: -2px; top: -2px" v-if="student.gender === 'female'"><Icon icon="mdi:gender-female" width="10" height="10" /></q-badge>
                          <q-badge floating color="blue-4" rounded class="q-pa-xs border-white" style="right: -2px; top: -2px" v-else><Icon icon="mdi:gender-male" width="10" height="10" /></q-badge>
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-bold text-dark" style="font-size: 13px">{{ student.name }}</q-item-label>
                        <q-item-label caption class="text-grey-6" style="font-size: 11px">{{ student.course }}</q-item-label>
                      </q-item-section>
                      <q-item-section side class="column items-end">
                        <div class="text-orange-6 bg-orange-1 q-px-sm text-weight-bold q-mb-xs" style="font-size: 10px; border-radius: 6px;">{{ student.year }}</div>
                        <div class="text-grey-5" style="font-size: 10px">Since {{ student.since }}</div>
                      </q-item-section>
                    </q-item>
                  </q-list>
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

const quickStats = computed(() => [
  { label: 'Rooms', value: props.property?.totalRooms || 0, bg: 'bg-purple-1', textColor: 'text-purple-7' },
  { label: 'Students', value: props.property?.totalStudents || 0, bg: 'bg-teal-1', textColor: 'text-teal-7' },
  { label: 'Occupancy', value: `${props.property?.occupancyRate || 0}%`, bg: 'bg-blue-1', textColor: 'text-blue-7' },
  { label: 'Rating', value: `${props.property?.rating || 0}`, bg: 'bg-orange-1', textColor: 'text-orange-7' }
])
</script>

<style scoped>
.shrink-0 { flex-shrink: 0; }
.border-bottom { border-bottom: 1px solid #f0f0f0; }
.border-all { border: 1px solid var(--c-border-strong); }
.border-top-none { border-top: none; }
.border-white { border: 2px solid white; }

.stat-box { min-height: 64px; }
.tracking-wide { letter-spacing: 0.5px; }

:deep(.q-tab--inactive) { background-color: transparent; }
</style>
