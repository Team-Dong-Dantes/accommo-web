<template>
  <div class="pd-root column no-wrap full-height bg-surface">

    <!-- HERO -->
    <div class="hero">
      <img v-if="accommodation?.image" :src="accommodation.image" class="hero-img" alt="" />
      <div v-else class="hero-fallback column flex-center text-muted">
        <Icon icon="mdi:home-city-outline" width="40" height="40" />
      </div>
      <div class="hero-scrim"></div>

      <button class="hero-back" type="button" @click="$emit('back')" aria-label="Back">
        <Icon icon="mdi:arrow-left" width="18" height="18" />
      </button>

       <div v-if="accommodation?.rating && accommodation.rating !== '—'" class="hero-rating">
         <Icon icon="mdi:star" width="13" height="13" />{{ accommodation.rating }}
      </div>

      <div class="hero-foot">
        <span class="hero-type">{{ accommodation?.type }}</span>
      </div>
    </div>

    <q-scroll-area class="col">
      <div class="pd-body q-pa-md column">

        <!-- IDENTITY -->
        <div>
          <div class="accommodation-name text-ink">{{ accommodation?.name }}</div>
          <div class="row items-center no-wrap q-mt-xs">
            <Icon icon="mdi:map-marker" color="var(--c-primary)" width="16" height="16" class="q-mr-xs" />
            <span class="accommodation-address text-muted ellipsis">{{ accommodation?.address }}</span>
          </div>
          <div class="badge-row q-mt-sm">
            <BadgePill
                :status="accommodation?.verified ? 'verified' : 'rejected'"
                :label="accommodation?.verified ? 'Verified' : 'Flagged'"
            />
          </div>
        </div>

        <!-- METRICS -->
        <div class="metrics-card">
          <div class="metrics-left">
            <div class="feature-row">
              <div v-for="m in featureStats" :key="m.label" class="feature-tile">
                <span class="feature-ic"><Icon :icon="m.icon" width="18" height="18" /></span>
                <div class="feature-text">
                  <span class="feature-val" :class="m.accent">{{ m.value }}</span>
                  <span class="feature-lbl text-muted">{{ m.label }}</span>
                </div>
              </div>
            </div>
            <div class="mini-row">
              <div v-for="m in miniStats" :key="m.label" class="mini-tile">
                <span class="mini-val text-weight-bold text-ink">{{ m.value }}</span>
                <span class="mini-lbl text-muted">{{ m.label }}</span>
              </div>
            </div>
          </div>

          <div class="donut-col">
            <div class="donut" :style="{ '--p': occupancyPct }">
              <div class="donut-hole">
                <span class="donut-pct text-weight-bold text-ink">{{ occupancyPct }}%</span>
                <span class="text-muted" style="font-size:10px">Occupied</span>
              </div>
            </div>
            <div class="donut-cap text-muted">{{ occupiedCount }}/{{ capacity }} beds</div>
          </div>
        </div>

        <!-- GENDER SPLIT -->
        <div class="gender-card">
          <div class="row q-gutter-md">
            <div class="col gender-row bar-female">
              <div class="row items-center no-wrap q-mb-xs">
                <Icon icon="mdi:gender-female" color="#e91e63" width="15" height="15" class="q-mr-xs" />
                <span class="text-weight-bold" style="font-size:13px; color:#e91e63;">{{ accommodation?.femaleCount }}</span>
                <span class="text-muted q-ml-auto" style="font-size:11px">Female</span>
              </div>
              <q-linear-progress :value="femaleRatio" rounded size="6px" track-color="grey-4" />
            </div>
            <div class="col gender-row bar-male">
              <div class="row items-center no-wrap q-mb-xs">
                <Icon icon="mdi:gender-male" color="#42a5f5" width="15" height="15" class="q-mr-xs" />
                <span class="text-weight-bold" style="font-size:13px; color:#42a5f5;">{{ accommodation?.maleCount }}</span>
                <span class="text-muted q-ml-auto" style="font-size:11px">Male</span>
              </div>
              <q-linear-progress :value="maleRatio" rounded size="6px" track-color="grey-4" />
            </div>
          </div>
        </div>

        <!-- ACCOMMODATION MANAGER -->
        <div class="manager-card row items-center no-wrap">
          <q-avatar color="primary" text-color="white" size="44px" class="text-weight-bold">{{ accommodation?.accommodationManagerInitials }}</q-avatar>
          <div class="col min-width-0 q-mx-md">
            <div class="text-weight-bold text-ink" style="font-size:14px">{{ accommodation?.accommodationManager }}</div>
            <div class="text-muted ellipsis" style="font-size:12px">{{ accommodation?.contact }}</div>
          </div>
          <div v-if="accommodation?.responseRate != null" class="manager-response column items-center">
            <span class="text-weight-bold text-ink" style="font-size:14px">{{ accommodation.responseRate }}%</span>
            <span class="text-muted" style="font-size:9px; letter-spacing:.3px">RESPONSE</span>
          </div>
        </div>

        <!-- TABS -->
        <div class="tab-pill-wrap">
          <q-tabs
            v-model="activeTab"
            dense
            no-caps
            class="text-muted tab-pill"
            active-color="white"
            active-bg-color="primary"
            indicator-color="transparent"
            align="justify"
            style="border-radius: 999px; padding: 4px;"
          >
            <q-tab name="overview" label="Overview" class="text-weight-bold tab-label" style="border-radius: 999px; min-height: 36px;" />
            <q-tab name="rooms" label="Rooms & Occupants" class="text-weight-bold tab-label" style="border-radius: 999px; min-height: 36px;" />
          </q-tabs>
        </div>

        <q-tab-panels v-model="activeTab" animated style="background: transparent;">
          <q-tab-panel name="overview" class="q-pa-none column stack">

            <div v-if="accommodation?.description">
              <div class="section-title q-mb-xs">About</div>
              <p class="about-text">{{ accommodation.description }}</p>
            </div>

            <div>
              <div class="section-title q-mb-xs">Quick Facts</div>
              <div class="facts">
                <div v-for="f in overviewFacts" :key="f.label" class="fact-row">
                  <Icon :icon="f.icon" :color="f.color" width="18" height="18" />
                  <span class="fact-lbl text-muted">{{ f.label }}</span>
                  <span class="fact-val text-weight-bold text-ink q-ml-auto">{{ f.value }}</span>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="rooms" class="q-pa-none">
            <div class="stack">
              <div v-for="[floor, floorRooms] in roomsByFloor" :key="floor" class="floor-group">
                <div class="floor-label">
                  <Icon icon="mdi:stairs" width="14" height="14" class="q-mr-xs" color="var(--c-muted)" />
                  <span>Floor {{ floor }}</span>
                  <span class="floor-count">{{ floorRooms.length }}</span>
                </div>

                <div class="stack-sm">
                  <div
                    v-for="room in floorRooms"
                    :key="room.id ?? room.name"
                    class="room-card"
                    :class="{ 'room-open': expandedRooms.has(room.id ?? room.name) }"
                  >
                    <div class="room-head" @click="toggleRoom(room.id ?? room.name)">
                      <div class="room-ic">
                        <Icon icon="mdi:bed" color="var(--c-primary)" width="20" height="20" />
                      </div>
                      <div class="room-main min-width-0">
                        <div class="text-weight-bold text-ink ellipsis" style="font-size:14px">{{ room.name }}</div>
                        <div class="row items-center no-wrap" style="gap:6px; font-size:11px;">
                          <span class="text-muted">Floor {{ room.floor ?? '—' }}</span>
                          <q-badge outline color="primary" :label="roomTypeLabel(room.capacity)" class="text-weight-bold" style="border-radius:6px; font-size:9px;" />
                        </div>
                      </div>
                      <div class="room-right">
                        <div class="text-right">
                          <span class="text-weight-bold" :class="roomPax(room) >= (room.capacity || 0) ? 'text-warning' : 'text-primary'" style="font-size:14px; line-height:1;">{{ roomPax(room) }}</span>
                          <span class="text-muted" style="font-size:12px;">/{{ room.capacity ?? 0 }}</span>
                        </div>
                        <q-linear-progress
                          :value="room.capacity ? roomPax(room) / room.capacity : 0"
                          :color="roomPax(room) >= (room.capacity || 0) ? 'warning' : roomPax(room) > 0 ? 'primary' : 'grey-4'"
                          rounded
                          class="q-mt-xs"
                          size="4px"
                        />
                      </div>
                      <Icon :icon="expandedRooms.has(room.id ?? room.name) ? 'mdi:chevron-up' : 'mdi:chevron-down'" width="20" height="20" color="var(--c-muted)" class="room-chevron" />
                    </div>

                    <div v-if="expandedRooms.has(room.id ?? room.name)" class="room-body">
                      <div class="row items-center no-wrap q-mb-sm" style="gap:8px;">
                        <q-badge v-if="room.status" :label="roomStatus(room.status).label" :style="{ color: roomStatus(room.status).color, background: roomStatus(room.status).color + '1a' }" class="text-weight-bold" style="border-radius:6px; font-size:10px;" />
                        <span v-if="room.monthlyRent != null" class="row items-center no-wrap text-muted" style="font-size:12px;">
                          <Icon icon="mdi:currency-php" width="14" height="14" class="q-mr-xs" />{{ room.monthlyRent }}/mo
                        </span>
                      </div>
                      <q-linear-progress
                        :value="room.capacity ? roomPax(room) / room.capacity : 0"
                        :color="roomPax(room) >= (room.capacity || 0) ? 'warning' : roomPax(room) > 0 ? 'primary' : 'grey-4'"
                        class="q-mb-sm"
                        rounded
                        size="6px"
                      />

                      <q-list v-if="room.occupants.length" separator class="occupant-list">
                        <q-item v-for="student in room.occupants" :key="student.name" class="q-pl-none q-pr-none q-py-md">
                          <q-item-section avatar class="q-pr-sm">
                            <q-avatar size="40px" color="primary" text-color="white" class="text-weight-bold relative-position">
                              {{ student.initials }}
                              <q-badge floating color="pink-4" rounded class="q-pa-xs border-white" style="right:-2px; top:-2px" v-if="student.gender === 'female'"><Icon icon="mdi:gender-female" width="10" height="10" /></q-badge>
                              <q-badge floating color="blue-4" rounded class="q-pa-xs border-white" style="right:-2px; top:-2px" v-else><Icon icon="mdi:gender-male" width="10" height="10" /></q-badge>
                            </q-avatar>
                          </q-item-section>
                          <q-item-section>
                            <q-item-label class="text-weight-bold text-ink" style="font-size:13px">{{ student.name }}</q-item-label>
                            <q-item-label caption class="text-muted" style="font-size:11px">{{ student.course }}</q-item-label>
                          </q-item-section>
                          <q-item-section side class="column items-end q-pl-lg">
                            <div class="q-px-sm text-weight-bold q-mb-xs year-chip">{{ student.year }}</div>
                            <div class="text-muted" style="font-size:10px">Since {{ student.since }}</div>
                          </q-item-section>
                        </q-item>
                      </q-list>

                      <div v-else-if="roomPax(room) > 0" class="row items-center justify-between q-px-sm q-py-sm in-use-row">
                        <div class="row items-center no-wrap">
                          <Icon icon="mdi:account-group-outline" color="var(--c-primary)" width="18" height="18" class="q-mr-xs" />
                          <span class="text-primary text-weight-bold" style="font-size:12px;">{{ roomPax(room) }} of {{ room.capacity ?? 0 }} beds occupied</span>
                        </div>
                        <q-badge label="In use" class="text-weight-bold in-use-chip" style="font-size:10px; border-radius:6px;" />
                      </div>

                      <div v-else class="q-px-sm q-py-sm text-center">
                        <q-badge color="grey-3" text-color="grey-7" label="Vacant" class="text-weight-bold" style="font-size:10px; border-radius:6px;" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>

      </div>
    </q-scroll-area>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BadgePill from '@/components/user/BadgePill.vue'

const props = defineProps({
  accommodation: { type: Object, required: true }
})

defineEmits(['back'])

const activeTab = ref('overview')

// Rooms tab: custom expand/collapse keyed by room id (names may repeat).
const expandedRooms = ref<Set<string>>(new Set())
function toggleRoom(key: string | number) {
  const k = String(key)
  const next = new Set(expandedRooms.value)
  if (next.has(k)) next.delete(k)
  else next.add(k)
  expandedRooms.value = next
}

// Group rooms by floor for a clearer hierarchy (numeric floors first, "—" last).
const roomsByFloor = computed(() => {
  const rooms = (props.accommodation?.rooms ?? []) as any[]
  const map = new Map<string | number, any[]>()
  for (const r of rooms) {
    const f = r.floor ?? '—'
    if (!map.has(f)) map.set(f, [])
    map.get(f)!.push(r)
  }
  return [...map.entries()].sort((a, b) => {
    const an = typeof a[0] === 'number' ? a[0] : Infinity
    const bn = typeof b[0] === 'number' ? b[0] : Infinity
    return an - bn
  })
})

// Occupancy helper: prefer explicit currentPax, else count occupants.
function roomPax(room: any): number {
  if (room && typeof room.currentPax === 'number' && room.currentPax >= 0) return room.currentPax
  return room?.occupants?.length ?? 0
}

// Capacity → friendly room-type label.
function roomTypeLabel(capacity: number | null | undefined): string {
  const c = capacity ?? 0
  if (c <= 1) return 'Solo'
  if (c === 2) return 'Duo'
  if (c === 3) return 'Triple'
  if (c === 4) return 'Quad'
  return 'Shared'
}

// Room status → token-aligned color (hex so we can derive a soft alpha bg).
const ROOM_STATUS: Record<string, { label: string; color: string }> = {
  occupied: { label: 'Occupied', color: '#15803D' },
  available: { label: 'Available', color: '#0E7490' },
  maintenance: { label: 'Maintenance', color: '#B45309' },
  reserved: { label: 'Reserved', color: '#0E7490' },
}
function roomStatus(status: string | null | undefined): { label: string; color: string } {
  if (!status) return { label: '—', color: '#6B7770' }
  return ROOM_STATUS[status] ?? { label: status.replace(/_/g, ' '), color: '#6B7770' }
}

// Left side: keep Rooms + Rating as feature tiles.
const featureStats = computed(() => [
  { label: 'Rooms', value: props.accommodation?.totalRooms || 0, accent: 'accent-primary', icon: 'mdi:door' },
  { label: 'Rating', value: `${props.accommodation?.rating || 0}`, accent: 'accent-warning', icon: 'mdi:star' },
])

// Left side: supporting stats.
const miniStats = computed(() => {
  const totalCapacity = props.accommodation?.totalCapacity || 0
  const totalPax = props.accommodation?.totalStudents || 0
  const occupied = Math.min(totalPax, totalCapacity)
  return [
    { label: 'Occupants', value: totalPax || 0 },
    { label: 'Capacity', value: totalCapacity || 0 },
    { label: 'Vacancy', value: Math.max(0, totalCapacity - occupied) },
  ]
})

// Right side: donut visualizing occupancy.
const capacity = computed(() => props.accommodation?.totalCapacity || 0)
const occupiedCount = computed(() => Math.min(props.accommodation?.totalStudents || 0, capacity.value))
const occupancyPct = computed(() => {
  const c = capacity.value
  return c > 0 ? Math.round((occupiedCount.value / c) * 100) : 0
})

const overviewFacts = computed(() => {
  const p = props.accommodation
  return [
    { label: 'Accommodation Type', value: p?.accommodationType || '—', icon: 'mdi:office-building-outline', color: 'var(--c-info)' },
    { label: 'Total Floors', value: `${p?.floors ?? 0}`, icon: 'mdi:home-outline', color: 'var(--c-success)' },
    { label: 'Total Capacity', value: `${p?.totalCapacity ?? 0}`, icon: 'mdi:account-group-outline', color: 'var(--c-primary)' },
    { label: 'Response Rate', value: p?.responseRate != null ? `${p.responseRate}%` : '—', icon: 'mdi:lightning-bolt', color: 'var(--c-warning)' },
  ]
})

// Gender split for the overview bars.
const genderTotal = computed(() => (props.accommodation?.femaleCount || 0) + (props.accommodation?.maleCount || 0))
const femaleRatio = computed(() => {
  const t = genderTotal.value
  return t > 0 ? (props.accommodation?.femaleCount || 0) / t : 0
})
const maleRatio = computed(() => {
  const t = genderTotal.value
  return t > 0 ? (props.accommodation?.maleCount || 0) / t : 0
})
</script>

<style scoped>
.pd-root { background: var(--c-surface); }

/* HERO */
.hero {
  position: relative;
  flex: 0 0 auto;
  height: 172px;
  overflow: hidden;
  background: var(--c-surface-2);
}
.hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero-fallback { position: absolute; inset: 0; }
.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(11,34,32,0.74), rgba(11,34,32,0.12) 45%, rgba(11,34,32,0.28));
}
.hero-back {
  position: absolute;
  top: 10px; left: 10px;
  z-index: 3;
  width: 34px; height: 34px;
  border: none;
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.88);
  color: var(--c-ink);
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background var(--t-fast);
}
.hero-back:hover { background: #fff; }
.hero-rating {
  position: absolute;
  top: 10px; right: 10px;
  z-index: 3;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(11,34,32,0.55);
  color: #fff;
  font-size: 12px; font-weight: 700;
}
.hero-foot { position: absolute; left: 12px; bottom: 12px; z-index: 3; }
.hero-type {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--c-primary);
  color: #fff;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
}

.pd-body { min-height: 100%; gap: 16px; }
.stack { display: flex; flex-direction: column; gap: 16px; }
.stack-sm { display: flex; flex-direction: column; gap: 8px; }

/* IDENTITY */
.accommodation-name { font-size: 19px; font-family: var(--font-display); line-height: 1.2; }
.accommodation-address { font-size: 13px; }
.badge-row { display: flex; gap: 8px; flex-wrap: wrap; }

/* METRICS */
.metrics-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 14px;
}
.metrics-left { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.feature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.feature-tile {
  display: flex; align-items: center; gap: 10px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
}
.feature-ic {
  width: 36px; height: 36px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  flex: 0 0 auto;
}
.feature-text { display: flex; flex-direction: column; min-width: 0; }
.feature-val { font-size: 18px; line-height: 1.1; }
.feature-lbl { font-size: 10px; }
.mini-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.mini-tile {
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px;
  padding: 8px 4px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
}
.mini-val { font-size: 15px; }
.mini-lbl { font-size: 10px; }

/* Donut — occupancy visualization */
.donut-col { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.donut {
  width: 116px; height: 116px;
  border-radius: 999px;
  background: conic-gradient(var(--c-primary) calc(var(--p, 0) * 1%), var(--c-border-strong) 0);
  display: flex; align-items: center; justify-content: center;
}
.donut-hole {
  width: 82px; height: 82px;
  border-radius: 999px;
  background: var(--c-surface-2);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.donut-pct { font-size: 20px; line-height: 1; }
.donut-cap { font-size: 11px; }
.accent-primary { color: var(--c-primary); }
.accent-success { color: var(--c-success); }
.accent-info { color: var(--c-info); }
.accent-warning { color: var(--c-warning); }

/* GENDER */
.gender-card {
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 12px;
}
.bar-female :deep(.q-linear-progress__model) { background: #e91e63; }
.bar-male :deep(.q-linear-progress__model) { background: #42a5f5; }

/* LANDLORD */
.manager-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 12px;
}
.manager-response {
  background: var(--c-primary-soft);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
}

/* TABS */
.tab-pill-wrap { margin-top: 2px; }
.tab-pill { border: 1px solid var(--c-border); }
.tab-label { color: var(--c-muted); }
:deep(.q-tab-panel) { padding-left: 0; padding-right: 0; }

/* SECTIONS */
.section-title {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  color: var(--c-muted);
}
.about-text { margin: 0; font-size: 13px; line-height: 1.5; color: var(--c-text); }

.facts { display: flex; flex-direction: column; }
.fact-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--c-border);
}
.fact-row:last-child { border-bottom: none; }
.fact-lbl { font-size: 13px; }
.fact-val { font-size: 13px; }

/* ROOMS — floor groups + custom expandable cards */
.floor-label {
  display: flex; align-items: center;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  color: var(--c-muted);
  margin: 2px 2px 8px;
}
.floor-count {
  margin-left: 6px;
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 6px;
  border-radius: 999px;
  background: var(--c-surface-2);
  color: var(--c-muted);
  font-size: 10px;
}

.room-card {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface);
  overflow: hidden;
  transition: border-color var(--t-fast);
}
.room-card:hover { border-color: var(--c-border-strong); }
.room-card.room-open { border-color: var(--c-primary); }

.room-head {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; cursor: pointer; user-select: none;
}
.room-ic {
  flex: 0 0 auto;
  width: 36px; height: 36px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  background: var(--c-primary-soft);
}
.room-main { flex: 1 1 auto; min-width: 0; }
.room-right { flex: 0 0 auto; width: 64px; }
.room-chevron { flex: 0 0 auto; transition: transform var(--t-fast); }

.room-body {
  padding: 12px;
  border-top: 1px solid var(--c-border);
  background: var(--c-surface-2);
}
.occupant-list { background: transparent; }
.occupant-list :deep(.q-item) { padding-left: 0; padding-right: 0; }

.in-use-row { background: var(--c-primary-soft); border-radius: var(--radius-sm); }
.year-chip {
  background: var(--c-warning-soft);
  color: var(--c-warning);
  border-radius: var(--radius-sm);
  font-size: 10px;
}
.in-use-chip { background: var(--c-primary-soft); color: var(--c-primary); }

.min-width-0 { min-width: 0; }
.border-white { border: 2px solid white; }
</style>
