<template>
  <q-card class="dashboard-card full-height">
    <q-card-section class="q-pa-md">
      <div class="text-body2 text-weight-bold" style="line-height: 1.2;">Students</div>
      <div class="text-caption text-grey-6 q-mb-sm" style="font-size: 11px;">
        {{ students.total }} students · {{ byCollege.length }} colleges</div>

      <q-separator class="q-mb-md" />

      <div class="bg-teal-1 q-pa-sm q-px-md q-mb-md rounded-box row items-center justify-between">
        <div class="row items-center">
          <q-avatar size="32px" color="teal-7" text-color="white" class="q-mr-sm" font-size="16px">
            <Icon icon="mdi:school" width="16" height="16" />
          </q-avatar>
          <div class="column">
            <div class="text-subtitle1 text-weight-bold text-dark" style="line-height: 1;">{{ students.total }}</div>
            <div class="text-teal-9" style="font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">TOTAL STUDENTS</div>
          </div>
        </div>
        <div class="column items-end">
          <div class="text-teal-6 text-weight-bold" style="line-height: 1; font-size: 14px;">{{ byCollege.length }}</div>
          <div class="text-grey-6" style="font-size: 10px;">colleges</div>
        </div>
      </div>

      <div class="text-uppercase text-grey-5 q-mb-xs" style="font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">
        By College</div>
      <div class="column q-gutter-y-sm q-mb-md">
        <div v-for="col in byCollege" :key="col.name">
          <div class="row justify-between q-mb-xs" style="font-size: 11px;">
            <span class="text-grey-8 row items-center">
              <div :class="`circle bg-${col.color} q-mr-sm`"></div>{{ col.name }}
            </span>
            <span class="text-grey-6">{{ col.val }} · {{ col.pct }}</span>
          </div>
          <q-linear-progress rounded size="3px" :value="col.ratio" :color="col.color" track-color="grey-2" />
        </div>
        <div v-if="byCollege.length === 0" class="text-grey-5 text-caption">No student data yet.</div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-6">
          <div class="text-uppercase text-grey-5 q-mb-xs"
            style="font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">By Year Level</div>
          <div class="row items-end justify-between" style="height: 35px;">
            <div v-for="y in byYear" :key="y.year" class="column items-center">
              <div class="bar bg-teal-5" :style="{ height: `${yearHeight(y.val)}px` }"></div>
              <span class="text-grey-6" style="font-size: 8px; margin-top: 4px;">{{ y.year }}</span>
            </div>
          </div>
        </div>
        <div class="col-6">
          <div class="text-uppercase text-grey-5 q-mb-xs"
            style="font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">Gender</div>
          <div class="row q-gutter-x-xs">
            <div class="col bg-pink-1 text-center q-pa-xs q-py-sm rounded-box column justify-center">
              <span class="text-pink-4 text-weight-bold" style="font-size: 12px;">{{ femalePct }}%</span>
              <span class="text-pink-3" style="font-size: 9px;">Female</span>
            </div>
            <div class="col bg-blue-1 text-center q-pa-xs q-py-sm rounded-box column justify-center">
              <span class="text-blue-5 text-weight-bold" style="font-size: 12px;">{{ malePct }}%</span>
              <span class="text-blue-4" style="font-size: 9px;">Male</span>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  students: { total: number }
  byCollege: { name: string; val: number; pct: string; ratio: number; color: string }[]
  byYear: { year: string; val: number }[]
  gender: { female: number; male: number; other: number }
}>()

const maxYear = computed(() => Math.max(1, ...props.byYear.map((y) => y.val)))
function yearHeight(val: number) {
  return Math.max(8, Math.round((val / maxYear.value) * 30))
}

const genderTotal = computed(
  () => props.gender.female + props.gender.male + props.gender.other || 1,
)
const femalePct = computed(() => Math.round((props.gender.female / genderTotal.value) * 100))
const malePct = computed(() => Math.round((props.gender.male / genderTotal.value) * 100))
</script>

<style scoped>
.dashboard-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
}

.rounded-box {
  border-radius: 8px;
}

.circle {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.bar {
  width: 10px;
  border-radius: 3px 3px 0 0;
}
</style>
