<template>
  <q-page class="row no-wrap q-pa-md q-gutter-x-md" style="height: calc(100vh - 60px); overflow: hidden; background-color: var(--c-bg);">

    <!-- LEFT SIDEBAR -->
    <div class="sidebar-container bg-surface custom-shadow column no-wrap relative-position">
      <div class="col absolute-full">
        <transition name="slide-fade" mode="out-in">
          <PropertyList
            v-if="!selectedProperty"
            :properties="mockProperties"
            @select="selectProperty"
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
    <div class="col relative-position map-area custom-shadow">
      <!-- Mapbox canvas -->
      <div ref="mapContainer" class="map-container"></div>

      <div class="absolute-top-left q-pa-md" style="z-index: 2;">
        <q-btn-group outline rounded class="bg-surface shadow-1" style="border-radius: 12px;">
          <q-btn flat color="dark" dense class="q-px-sm" @click="zoomIn"><Icon icon="mdi:plus" width="18" height="18" /></q-btn>
          <q-btn flat color="dark" dense class="q-px-sm" @click="zoomOut"><Icon icon="mdi:minus" width="18" height="18" /></q-btn>
        </q-btn-group>
      </div>

      <div class="absolute-top-right q-pa-md" style="z-index: 2;">
        <div class="bg-surface shadow-1 q-px-sm q-py-xs row items-center text-grey-7 text-caption text-weight-bold" style="border-radius: 12px; border: 1px solid var(--c-border-strong);">
          <Icon icon="mdi:school" width="16" height="16" class="q-mr-xs" /> ISU Echague, Isabela
        </div>
      </div>

      <div class="absolute-bottom-left q-pa-md row q-gutter-x-sm" style="z-index: 2;">
        <q-badge color="grey-2" text-color="teal-7" class="shadow-1 q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px; border: 1px solid var(--c-border-strong);">
          <span class="legend-dot bg-teal-7" /> {{ verifiedCount }} Verified
        </q-badge>
        <q-badge color="grey-2" text-color="orange-6" class="shadow-1 q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px; border: 1px solid var(--c-border-strong);">
          <span class="legend-dot bg-orange-6" /> {{ pendingCount }} Pending
        </q-badge>
      </div>

      <div class="absolute-bottom-right q-pa-xs text-grey-6 text-weight-medium" style="font-size: 10px; z-index: 2; background: rgba(255,255,255,0.7); border-radius: 4px;">
        &copy; Mapbox
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import PropertyList from '@/components/properties/PropertyList.vue'
import PropertyDetail from '@/components/properties/PropertyDetail.vue'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const selectedProperty = ref<any>(null)
const mapContainer = ref<HTMLElement | null>(null)
let map: mapboxgl.Map | null = null
let markers: mapboxgl.Marker[] = []

const verifiedCount = computed(() => mockProperties.value.filter(p => p.verified).length)
const pendingCount = computed(() => mockProperties.value.filter(p => !p.verified).length)

function zoomIn() { map?.zoomIn() }
function zoomOut() { map?.zoomOut() }

function selectProperty(p: any) {
  selectedProperty.value = p
  // Fly to the property's approximate location if we have coords
  if (map) {
    const m = markers.find((_, i) => mockProperties.value[i]?.id === p.id)
    // markers don't store id; just close over by rebuilding is fine
  }
}

function addMarkers() {
  markers.forEach(m => m.remove())
  markers = []
  // ISU Echague approximate center
  const centerLat = 16.710
  const centerLng = 121.720

  mockProperties.value.forEach((p, i) => {
    const angle = (i / mockProperties.value.length) * Math.PI * 2
    const radius = 0.008 + (i % 3) * 0.004
    const lat = centerLat + Math.sin(angle) * radius
    const lng = centerLng + Math.cos(angle) * radius * 1.3

    const el = document.createElement('div')
    el.className = 'map-pin'
    el.style.background = p.verified ? '#0d9488' : '#f59e0b'
    el.title = p.name
    el.addEventListener('click', () => { selectedProperty.value = p })

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(map!)

    markers.push(marker)
  })
}

onMounted(async () => {
  await nextTick()
  if (!mapContainer.value) return

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/light-v11',
    center: [121.720, 16.710],
    zoom: 14,
  })

  map.addControl(new mapboxgl.NavigationControl(), 'top-left')
  map.on('load', addMarkers)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

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
.custom-shadow {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
  border-radius: 12px;
}
.border-all {
  border: 1px solid var(--c-border-strong);
}

.sidebar-container {
  width: 420px;
  min-width: 420px;
  height: 100%;
  border: 1px solid var(--c-border-strong);
}

.map-area {
  height: 100%;
  border: 1px solid var(--c-border-strong);
  border-radius: 12px;
  overflow: hidden;
}

.map-container {
  position: absolute;
  inset: 0;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
}

.slide-fade-enter-active { transition: all 0.2s ease-out; }
.slide-fade-leave-active { transition: all 0.1s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

:deep(.mapboxgl-ctrl-attrib) { font-size: 10px; }
</style>

<style>
.map-pin {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  cursor: pointer;
}
</style>
