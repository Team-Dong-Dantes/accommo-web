<template>
  <q-page class="q-pa-md bg-grey-1">

    <!-- Title block removed, StatCards moved up to the top -->
    <StatCards class="q-pt-xs"
      :properties="data.properties"
      :rooms="data.rooms"
      :students="data.students"
    />

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-12 col-lg-4 col-xl-4">
        <RegistrationsCard :pending="data.pendingRegistrations" />
      </div>
      <div class="col-12 col-md-4 col-lg-3 col-xl-3">
        <RoomsCard
          :rooms="data.rooms"
          :rooms-by-type="data.roomsByType"
          :top-occupied="data.topOccupied"
        />
      </div>
      <div class="col-12 col-md-4 col-lg-3 col-xl-3">
        <StudentsCard
          :students="data.students"
          :by-college="data.studentsByCollege"
          :by-year="data.studentsByYear"
          :gender="data.gender"
        />
      </div>
      <div class="col-12 col-md-4 col-lg-2 col-xl-2">
        <GrievancesCard :concerns="data.concerns" :by-category="data.concernsByCategory" />
      </div>
    </div>

    <q-inner-loading :showing="loading">
      <q-spinner-dots size="40px" color="teal-7" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboardStats } from '@/composables/useDashboardStats'
import StatCards from '@/components/dashboard/StatCards.vue'
import RegistrationsCard from '@/components/dashboard/RegistrationsCard.vue'
import RoomsCard from '@/components/dashboard/RoomsCard.vue'
import StudentsCard from '@/components/dashboard/StudentsCard.vue'
import GrievancesCard from '@/components/dashboard/ConcernsCard.vue'

const { loading, data, load } = useDashboardStats()

onMounted(load)
</script>
