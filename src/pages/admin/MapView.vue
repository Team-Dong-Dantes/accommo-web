<template>
  <!-- ADDED: q-pa-md (padding) and q-gutter-x-md (spacing) to manage the layout cleanly -->
  <q-page class="row no-wrap q-pa-md q-gutter-x-md" style="height: calc(100vh - 60px); overflow: hidden; background-color: #f4f6f8;">

    <!-- LEFT SIDEBAR -->
    <!-- REMOVED: 'z-top' which was forcing this panel to sit above your green navigation drawer -->
    <div class="sidebar-container bg-white custom-shadow column no-wrap relative-position">

      <!-- Absolute full ensures the transition doesn't collapse the height -->
      <div class="col absolute-full">
        <transition name="slide-fade" mode="out-in">

          <PropertyList
            v-if="!selectedProperty"
            :properties="mockProperties"
            @select="selectedProperty = $event"
            class="absolute-full"
          />

          <PropertyDetail
            v-else
            :property="selectedProperty"
            @back="selectedProperty = null"
            class="absolute-full"
          />

        </transition>
      </div>
    </div>

    <!-- RIGHT MAP AREA -->
    <div class="col relative-position map-area custom-shadow map-bg bg-white">

      <div class="absolute-top-left q-pa-md" style="z-index: 2;">
        <q-btn-group outline rounded class="bg-white shadow-1 border-all" style="border-radius: 12px;">
          <q-btn flat color="dark" dense class="q-px-sm"><Icon icon="mdi:plus" width="18" height="18" /></q-btn>
          <q-btn flat color="dark" dense class="q-px-sm"><Icon icon="mdi:minus" width="18" height="18" /></q-btn>
        </q-btn-group>
      </div>

      <div class="absolute-top-right q-pa-md" style="z-index: 2;">
        <div class="bg-white shadow-1 border-all q-px-sm q-py-xs row items-center text-grey-7 text-caption text-weight-bold" style="border-radius: 12px;">
          <Icon icon="mdi:school" width="16" height="16" class="q-mr-xs" /> ISU Echague, Isabela
        </div>
      </div>

      <div class="flex flex-center full-height full-width relative-position overflow-hidden">
        <div class="radar-ring ring-1"></div>
        <div class="radar-ring ring-2"></div>

        <div class="absolute shadow-2 bg-white rounded-borders q-px-sm q-py-xs row items-center text-dark text-caption text-weight-bold" style="top: 48%; left: 50%; transform: translate(-50%, -150%); z-index: 3;">
          <Icon icon="mdi:school" width="14" height="14" color="#303f9f" class="q-mr-xs"/> ISU Echague
        </div>

        <q-btn round color="teal-6" size="sm" class="absolute shadow-3 pin" style="top: 45%; left: 48%" />
        <q-btn round color="teal-6" size="md" class="absolute shadow-3 pin" style="top: 52%; left: 51%" />
        <q-btn round color="teal-6" size="sm" class="absolute shadow-3 pin" style="top: 58%; left: 47%" />
        <q-btn round color="orange-5" size="xs" class="absolute shadow-3 pin" style="top: 65%; left: 55%" />
        <q-btn round color="indigo-4" size="sm" class="absolute shadow-3 pin" style="top: 40%; left: 40%" />
        <q-btn round color="red-5" size="sm" class="absolute shadow-3 pin" style="top: 48%; left: 60%" />
      </div>

      <div class="absolute-bottom-left q-pa-md row q-gutter-x-sm" style="z-index: 2;">
        <q-badge color="white" text-color="teal-7" class="shadow-1 border-all q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px;">
          <Icon icon="mdi:circle" width="8" height="8" class="q-mr-xs" /> 13 Verified
        </q-badge>
        <q-badge color="white" text-color="orange-6" class="shadow-1 border-all q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px;">
          <Icon icon="mdi:circle" width="8" height="8" class="q-mr-xs" /> 3 Pending
        </q-badge>
        <q-badge color="white" text-color="red-5" class="shadow-1 border-all q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px;">
          <Icon icon="mdi:circle" width="8" height="8" class="q-mr-xs" /> 1 Flagged
        </q-badge>
        <q-badge color="white" text-color="indigo-4" class="shadow-1 border-all q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px;">
          <Icon icon="mdi:circle" width="8" height="8" class="q-mr-xs" /> 1 Audit
        </q-badge>
      </div>

      <div class="absolute-bottom-right q-pa-xs text-grey-6 text-weight-medium" style="font-size: 10px; z-index: 2; background: rgba(255,255,255,0.7);">
        <span class="text-blue-6">Leaflet</span> | &copy; OpenStreetMap contributors &copy; CARTO
      </div>

    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PropertyList from '@/components/properties/PropertyList.vue'
import PropertyDetail from '@/components/properties/PropertyDetail.vue'

const selectedProperty = ref(null)

const mockProperties = ref([
  {
    id: 'HSE-001',
    name: 'Pinzon Student Hub',
    type: 'Duo',
    landlord: 'Juan Dela Cruz',
    landlordInitials: 'JD',
    contact: '+63 912 345 6789',
    verified: true,
    price: '₱3,500/mo',
    rating: 4.5,
    totalRooms: 24,
    occupiedRooms: 22,
    totalStudents: 22,
    occupancyRate: 46,
    femaleCount: 22,
    maleCount: 0,
    image: 'https://picsum.photos/400/300?random=11',
    address: 'Pinzon Subd., Echague, Isabela',
    floors: 2,
    rooms: [
      {
        name: 'Room 101', floor: 1, capacity: 2,
        occupants: [
          { name: 'Claire Santos', initials: 'CS', gender: 'female', course: 'BS Computer Science', year: '1st', since: 'Jan 2025' },
          { name: 'Hannah Tan', initials: 'HT', gender: 'female', course: 'BS Agriculture', year: '4th', since: 'Aug 2024' }
        ]
      },
      {
        name: 'Room 102', floor: 1, capacity: 2,
        occupants: [
          { name: 'Maria Cruz', initials: 'MC', gender: 'female', course: 'BS Nursing', year: '2nd', since: 'Aug 2025' }
        ]
      },
      { name: 'Room 103', floor: 1, capacity: 2, occupants: [] },
      { name: 'Room 104', floor: 1, capacity: 2, occupants: [] }
    ]
  },
  {
    id: 'HSE-002',
    name: 'ISU Gate Apartment',
    type: 'Triple',
    landlord: 'Rosa Mercado',
    landlordInitials: 'RM',
    contact: '+63 918 111 2222',
    verified: true,
    price: '₱3,200/mo',
    rating: 4.2,
    totalRooms: 18,
    occupiedRooms: 16,
    totalStudents: 45,
    occupancyRate: 88,
    femaleCount: 25,
    maleCount: 20,
    image: 'https://picsum.photos/400/300?random=12',
    address: 'San Fabian, Echague, Isabela',
    floors: 3,
    rooms: []
  },
  {
    id: 'HSE-003',
    name: 'Campus View Dormitory',
    type: 'Bedspace',
    landlord: 'Mario Santos',
    landlordInitials: 'MS',
    contact: '+63 999 888 7777',
    verified: true,
    price: '₱3,000/mo',
    rating: 4.8,
    totalRooms: 30,
    occupiedRooms: 28,
    totalStudents: 110,
    occupancyRate: 93,
    femaleCount: 60,
    maleCount: 50,
    image: 'https://picsum.photos/400/300?random=13',
    address: 'Silawan, Echague, Isabela',
    floors: 4,
    rooms: []
  },
  {
    id: 'HSE-004',
    name: 'Sunrise Boarding House',
    type: 'Duo',
    landlord: 'Lourdes Cruz',
    landlordInitials: 'LC',
    contact: '+63 908 444 5555',
    verified: true,
    price: '₱2,500/mo',
    rating: 4.3,
    totalRooms: 20,
    occupiedRooms: 17,
    totalStudents: 34,
    occupancyRate: 85,
    femaleCount: 10,
    maleCount: 24,
    image: 'https://picsum.photos/400/300?random=14',
    address: 'San Fabian, Echague, Isabela',
    floors: 2,
    rooms: []
  },
  {
    id: 'HSE-005',
    name: 'Camarines View Residence',
    type: 'Duo',
    landlord: 'Pedro Reyes',
    landlordInitials: 'PR',
    contact: '+63 917 222 3333',
    verified: true,
    price: '₱2,800/mo',
    rating: 4.0,
    totalRooms: 15,
    occupiedRooms: 12,
    totalStudents: 24,
    occupancyRate: 80,
    femaleCount: 12,
    maleCount: 12,
    image: 'https://picsum.photos/400/300?random=15',
    address: 'Malitao, Echague, Isabela',
    floors: 2,
    rooms: []
  },
  {
    id: 'HSE-006',
    name: 'Magsaysay Inn & Board',
    type: 'Bedspace',
    landlord: 'Roberto Diaz',
    landlordInitials: 'RD',
    contact: '+63 933 666 9999',
    verified: false,
    price: '₱2,200/mo',
    rating: 3.8,
    totalRooms: 10,
    occupiedRooms: 8,
    totalStudents: 30,
    occupancyRate: 80,
    femaleCount: 0,
    maleCount: 30,
    image: 'https://picsum.photos/400/300?random=16',
    address: 'Magsaysay, Echague, Isabela',
    floors: 1,
    rooms: []
  }
])
</script>

<style scoped>
/* Unified shadows and borders */
.custom-shadow {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
  border-radius: 12px;
}
.border-all {
  border: 1px solid #e0e0e0;
}

.sidebar-container {
  width: 420px;
  min-width: 420px;
  height: 100%; /* Height inherits cleanly from the padded parent */
  border: 1px solid #e0e0e0;
  /* Margins removed because q-page now handles padding */
}

.map-area {
  height: 100%; /* Height inherits cleanly from the padded parent */
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  /* Margins removed because q-page now handles padding */
}

.map-bg {
  background-color: #fafafa;
  background-image: radial-gradient(#d5d5d5 1.5px, transparent 1.5px);
  background-size: 24px 24px;
}

.radar-ring {
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  pointer-events: none;
}
.ring-1 {
  width: 250px;
  height: 250px;
  border: 2px dashed #0f8b7d;
  background-color: rgba(15, 139, 125, 0.03);
}
.ring-2 {
  width: 450px;
  height: 450px;
  border: 1px solid rgba(15, 139, 125, 0.15);
}

.pin {
  border: 2px solid white;
}

.slide-fade-enter-active { transition: all 0.2s ease-out; }
.slide-fade-leave-active { transition: all 0.1s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}
</style>
