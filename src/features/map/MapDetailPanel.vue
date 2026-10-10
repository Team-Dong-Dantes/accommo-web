<template>
  <!-- The Map View's detail panel: one page, the accommodation at a glance,
       sliding over the map's right side while the map stays where it is. Each
       fact is told once; rooms, facilities, permits, activity and ratings live
       in the full record, which the footer opens. -->
  <section class="detail" :aria-label="`${item.name} details`">
    <div class="d-cover">
      <img v-if="cover && !coverBroken" :src="cover" alt="" class="d-img" @error="coverBroken = true" />
      <svg v-else class="d-hills" viewBox="0 0 480 132" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 100 L80 60 L140 84 L230 30 L320 70 L400 40 L480 66 V132 H0Z" fill="#fff" />
      </svg>
      <div class="d-fade" />
      <div class="d-chips">
        <span class="d-type">{{ item.type }}</span>
        <span class="pill" :class="STATUS_GROUPS[item.group].pill">{{ item.statusLabel }}</span>
      </div>
      <button type="button" class="d-close" aria-label="Close details" @click="$emit('close')">
        <Icon icon="lucide:x" width="16" height="16" />
      </button>
      <h2>{{ item.name }}</h2>
      <span class="d-addr">{{ item.address ? `${item.address}, ` : '' }}{{ item.km.toFixed(1) }} km from campus</span>
    </div>

    <div class="d-stats" :class="{ 'is-loading': loading && !overview }">
      <div><b>{{ item.taken }}/{{ item.beds }}</b><span>Beds taken</span></div>
      <div><b>{{ overview?.roomCount ?? '—' }}</b><span>Rooms</span></div>
      <div><b>{{ overview?.ratingLabel ?? '—' }}</b><span>Rating</span></div>
    </div>

    <dl class="d-facts" :class="{ 'is-loading': loading && !overview }">
      <div>
        <dt>{{ landlordTitle(item.landlordSex) }}</dt>
        <dd>{{ item.landlord || '—' }}<small v-if="contact">{{ contact }}</small></dd>
      </div>
      <div>
        <dt>Boarders</dt>
        <dd v-if="item.taken">
          <span :style="{ color: SEX_COLORS.female }">{{ item.female }} female</span> ·
          <span :style="{ color: SEX_COLORS.male }">{{ item.male }} male</span><template v-if="unrecorded"> · {{ unrecorded }} not recorded</template>
        </dd>
        <dd v-else class="muted">None yet</dd>
      </div>
      <div><dt>Accepts</dt><dd>{{ overview?.genderPolicyLabel ?? '—' }}</dd></div>
      <div v-if="item.group === 'accredited'"><dt>Accreditation</dt><dd>{{ overview?.expiryLabel ?? '—' }}</dd></div>
      <div v-if="amenities.length" class="d-amen">
        <dt>Amenities</dt>
        <dd>
          <span v-for="a in amenities" :key="a.label" class="chip"><Icon :icon="a.icon" width="13" height="13" aria-hidden="true" />{{ a.label }}</span>
        </dd>
      </div>
    </dl>

    <footer class="d-foot">
      <button type="button" class="viewall" @click="$emit('view-all', 'rooms')">
        View full record
        <Icon icon="lucide:chevron-right" width="14" height="14" aria-hidden="true" />
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { landlordTitle } from '@/utils/format'
import { amenityMeta } from '@/utils/facilities'
import type { DrawerPreview } from '@/components/ui/DetailDrawer.vue'
import { SEX_COLORS, STATUS_GROUPS, type MapItem } from './mapPins'

const props = defineProps<{ item: MapItem; preview: DrawerPreview; loading: boolean }>()
defineEmits<{ close: []; 'view-all': [tab: string] }>()

const overview = computed(() => props.preview.overview)
// The map already has the photos; the record's own cover only stands in.
const cover = computed(() => props.item.photos[0] || overview.value?.coverUrl || '')
const coverBroken = ref(false)
watch(() => props.item.id, () => { coverBroken.value = false })

// The record writes "—" for a number not on file; here that is simply no second line.
const contact = computed(() => { const c = overview.value?.landlord.contact?.trim(); return c && c !== '—' ? c : '' })
const unrecorded = computed(() => Math.max(0, props.item.taken - props.item.female - props.item.male))
const amenities = computed(() => (overview.value?.amenities ?? []).map(amenityMeta))
</script>

<style scoped>
.detail { position: absolute; top: 0; right: 0; bottom: 0; z-index: 7; display: flex; flex-direction: column; width: min(400px, 100%); border-left: 1px solid var(--c-border); background: var(--c-surface); box-shadow: -12px 0 32px rgba(16, 32, 28, 0.12); animation: slide-in 0.22s ease-out; }
@keyframes slide-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }

.d-cover { position: relative; flex: none; height: 168px; overflow: hidden; background: linear-gradient(160deg, color-mix(in srgb, var(--c-primary) 55%, #1b2a26), color-mix(in srgb, var(--c-primary) 20%, #0e1a17)); }
.d-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.d-hills { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.22; }
.d-fade { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6)); }
.d-chips { position: absolute; top: 16px; left: 18px; display: flex; gap: 6px; }
.d-type { padding: 3px 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.18); color: #fff; font-size: 11.5px; font-weight: 700; }
.d-close { position: absolute; top: 14px; right: 14px; display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 9px; background: rgba(0, 0, 0, 0.28); color: #fff; cursor: pointer; }
.d-close:focus-visible, .viewall:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.d-cover h2 { position: absolute; right: 18px; bottom: 30px; left: 18px; margin: 0; color: #fff; font-family: var(--font-display); font-size: 21px; letter-spacing: -0.02em; line-height: 1.15; text-wrap: balance; }
.d-addr { position: absolute; right: 18px; bottom: 11px; left: 18px; overflow: hidden; color: rgba(255, 255, 255, 0.85); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
.pill { display: inline-flex; padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; }
.pill.is-acc { background: var(--c-primary-soft); color: var(--c-primary); }
.pill.is-pen { background: var(--c-warning-soft); color: var(--c-warning); }
.pill.is-del { background: var(--c-surface-2); color: var(--c-muted); }

.d-stats { display: grid; flex: none; grid-template-columns: repeat(3, minmax(0, 1fr)); border-bottom: 1px solid var(--c-border); }
.d-stats > div { min-width: 0; padding: 12px 18px; }
.d-stats > div + div { border-left: 1px solid var(--c-border); }
.d-stats b { display: block; color: var(--c-ink); font-family: var(--font-display); font-size: 18px; font-variant-numeric: tabular-nums; }
.d-stats span { color: var(--c-muted); font-size: 11.5px; }

.d-facts { flex: 1; min-height: 0; margin: 0; padding: 4px 18px; overflow-y: auto; }
.d-facts > div { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid var(--c-border); font-size: 13px; }
.d-facts > div:last-child { border-bottom: 0; }
.d-facts dt { flex: none; color: var(--c-muted); }
.d-facts dd { min-width: 0; margin: 0; color: var(--c-ink); font-weight: 600; text-align: right; }
.d-facts dd small { display: block; color: var(--c-muted); font-size: 12px; font-weight: 500; }
.d-facts dd.muted { color: var(--c-muted); font-weight: 500; }
.d-amen { flex-direction: column; gap: 8px !important; }
.d-amen dd { display: flex; flex-wrap: wrap; gap: 6px; text-align: left; }
.chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border: 1px solid var(--c-border); border-radius: 999px; background: var(--c-surface-2); color: var(--c-text); font-size: 12px; font-weight: 600; }
.is-loading { opacity: 0.6; transition: opacity 0.2s; }

.d-foot { flex: none; padding: 12px 18px 16px; border-top: 1px solid var(--c-border); }
.viewall { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; height: 40px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); color: var(--c-primary); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.viewall:hover { border-color: var(--c-primary); background: var(--c-primary-soft); }

@media (prefers-reduced-motion: reduce) { .detail { animation: none; } .is-loading { transition: none; } }
</style>
