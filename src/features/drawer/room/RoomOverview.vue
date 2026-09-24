<template>
  <!-- A room's record, left panel: its photo, where it is, one tile per bed,
       its terms and private facilities, and who runs it. -->
  <div class="rc-band ro-band">
    <img v-if="o?.coverUrl && !coverBroken" :src="o.coverUrl" alt="" class="rc-band-img" @error="coverBroken = true" />
    <div class="rc-fade"></div>
    <div class="rc-head">
      <span v-if="o" class="rc-pill"><Icon icon="lucide:bed-double" width="12" height="12" />{{ o.typeLabel }}</span>
      <h2 class="rc-name">{{ o?.title ?? preview.name }}</h2>
      <span v-if="o" class="rc-sub">
        <Icon icon="lucide:building-2" width="13" height="13" />{{ o.accommodation.name }}<template v-if="o.floor != null"> · Floor {{ o.floor }}</template>
      </span>
    </div>
  </div>

  <div v-if="o" class="rc-body">
    <template v-if="loading">
      <q-skeleton type="rect" height="34px" class="ro-skel-standing" />
      <section class="rc-sec">
        <div class="rc-sec-head"><q-skeleton type="text" width="50px" height="14px" /><q-skeleton type="text" width="80px" height="12px" /></div>
        <div class="ro-beds"><q-skeleton v-for="n in Math.max(o.capacity, 2)" :key="n" type="rect" height="40px" class="ro-skel-bed" /></div>
      </section>
      <section v-for="n in 2" :key="`s${n}`" class="rc-sec">
        <div class="rc-sec-head"><q-skeleton type="text" width="90px" height="14px" /></div>
        <q-skeleton type="rect" height="30px" class="ro-skel-bed" />
      </section>
    </template>

    <template v-else>
      <div class="rc-standing" :class="`rc-standing--${standing.tone}`">
        <Icon :icon="standing.tone === 'ok' ? 'lucide:badge-check' : 'lucide:triangle-alert'" width="16" height="16" />
        <span class="rc-standing-title">{{ standing.title }}</span>
        <span class="rc-standing-sub">{{ standing.sub }}</span>
      </div>

      <section class="rc-sec">
        <div class="rc-sec-head">
          <span class="rc-title">Beds</span>
          <span class="rc-meta">{{ occupants.length }} of {{ o.capacity }} taken</span>
        </div>
        <div class="ro-beds">
          <button
            v-for="p in occupants"
            :key="p.id"
            type="button"
            class="ro-bed"
            :title="`View ${p.name}`"
            @click="$emit('view-person', p)"
          >
            <span class="ro-av" :class="p.gender === 'female' ? 'ro-av--f' : 'ro-av--m'">
              <img v-if="p.avatarUrl" :src="p.avatarUrl" :alt="p.name" />
              <template v-else>{{ p.initials }}</template>
            </span>
            <span class="ro-bed-name">{{ p.name.split(' ')[0] }}</span>
          </button>
          <span v-for="n in vacant" :key="`v${n}`" class="ro-bed ro-bed--vacant">
            <span class="ro-av ro-av--v"></span>
            <span class="ro-bed-name">Vacant</span>
          </span>
        </div>
      </section>

      <section class="rc-sec">
        <div class="rc-sec-head"><span class="rc-title">Terms</span></div>
        <dl class="rc-facts">
          <div><dt>Monthly rent</dt><dd>{{ o.rent != null ? peso(o.rent) : '—' }}<span class="ro-basis">{{ o.rentBasis === 'person' ? ' per boarder' : ' whole room' }}</span></dd></div>
          <div><dt>Status</dt><dd>{{ o.statusLabel }}</dd></div>
          <div><dt>Advance</dt><dd>{{ months(o.advanceMonths) }}</dd></div>
          <div><dt>Deposit</dt><dd>{{ months(o.depositMonths) }}</dd></div>
        </dl>
      </section>

      <section class="rc-sec">
        <div class="rc-sec-head"><span class="rc-title">Private facilities</span></div>
        <div v-if="facilities.length" class="ro-chips">
          <span v-for="f in facilities" :key="f.id" class="ro-chip"><Icon :icon="f.icon" width="13" height="13" />{{ f.label }}</span>
        </div>
        <p v-else class="rc-note">None — its boarders use the shared facilities.</p>
      </section>
    </template>
  </div>

  <footer v-if="o" class="rc-foot">
    <template v-if="o.landlord">
      <span class="ro-foot-av">
        <img v-if="o.landlord.avatarUrl" :src="o.landlord.avatarUrl" :alt="o.landlord.name" />
        <template v-else>{{ o.landlord.initials }}</template>
      </span>
      <span class="ro-foot-who">
        <span class="ro-foot-name">{{ o.landlord.name }}</span>
        <span class="rc-meta">{{ o.landlord.title }}<template v-if="o.landlord.contact"> · {{ formatPhone(o.landlord.contact) }}</template></span>
      </span>
    </template>
    <button v-if="o.accommodation.id" type="button" class="rc-btn" @click="$emit('go-hub', 'accommodation', o.accommodation.id)">
      Open accommodation<Icon icon="lucide:arrow-right" width="14" height="14" />
    </button>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { formatPhone } from '@/utils/format'
import type { DrawerPreview, HubKind, PreviewOccupant } from '../preview'
import type { Tone } from '../accommodation/standing'

const props = defineProps<{ preview: DrawerPreview; loading?: boolean }>()
defineEmits<{ (e: 'view-person', p: PreviewOccupant): void; (e: 'go-hub', kind: HubKind, id?: string): void }>()

const o = computed(() => props.preview.roomOverview)
const coverBroken = ref(false)
watch(() => o.value?.coverUrl, () => { coverBroken.value = false })

const occupants = computed(() => props.preview.occupants ?? [])
const vacant = computed(() => Math.max((o.value?.capacity ?? 0) - occupants.value.length, 0))
const facilities = computed(() => props.preview.facilities ?? [])

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const months = (n: number | null) => (n == null ? '—' : `${n} month${n === 1 ? '' : 's'}`)

const standing = computed<{ tone: Tone; title: string; sub: string }>(() => {
  const status = o.value?.status.toLowerCase() ?? ''
  if (status === 'maintenance') return { tone: 'warn', title: 'Under maintenance', sub: 'Not taking boarders until it is fixed' }
  if (!vacant.value) return { tone: 'ok', title: 'Full', sub: `All ${o.value?.capacity ?? 0} beds taken` }
  return { tone: 'ok', title: 'Accepting boarders', sub: `${vacant.value} bed${vacant.value === 1 ? '' : 's'} open` }
})
</script>

<style scoped src="../record/sections.css"></style>
<style scoped>
.ro-band { background: linear-gradient(135deg, var(--ar-soft) 0%, var(--ar-border) 100%); }
.ro-skel-standing { margin-top: 6px; border-radius: 9px; }
.ro-skel-bed { border-radius: 8px; }

/* One tile per bed: the boarder in it, or a dashed empty bed. */
.ro-beds { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 6px; }
.ro-bed {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid var(--ar-border);
  border-radius: 8px;
  background: var(--ar-surface);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
button.ro-bed:hover { border-color: var(--ar-accent-line); }
button.ro-bed:focus-visible { outline: 2px solid var(--ar-accent); outline-offset: 2px; }
.ro-bed--vacant { border-style: dashed; background: transparent; cursor: default; }
.ro-av {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  overflow: hidden;
  border-radius: 50%;
  font-size: 9.5px;
  font-weight: 700;
}
.ro-av img { width: 100%; height: 100%; object-fit: cover; }
.ro-av--m { background: color-mix(in srgb, var(--ar-male) 16%, var(--ar-surface)); color: color-mix(in srgb, var(--ar-male) 70%, #000); }
.ro-av--f { background: color-mix(in srgb, var(--ar-female) 14%, var(--ar-surface)); color: color-mix(in srgb, var(--ar-female) 75%, #000); }
.ro-av--v { border: 1.5px dashed color-mix(in srgb, var(--ar-muted) 45%, var(--ar-border)); box-sizing: border-box; }
.ro-bed-name { overflow: hidden; color: var(--ar-ink); font-size: 11.5px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.ro-bed--vacant .ro-bed-name { color: var(--ar-muted); font-weight: 500; }

.ro-basis { color: var(--ar-muted); font-size: 11px; font-weight: 500; }
.ro-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.ro-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: var(--ar-soft); color: var(--ar-ink); font-size: 11.5px; font-weight: 500; }
.ro-chip :deep(svg) { color: var(--ar-accent); }

.ro-foot-av {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--ar-accent-soft);
  color: var(--ar-accent);
  font-size: 12px;
  font-weight: 700;
}
.ro-foot-av img { width: 100%; height: 100%; object-fit: cover; }
.ro-foot-who { display: flex; flex-direction: column; gap: 1px; min-width: 0; margin-left: -8px; }
.ro-foot-name { overflow: hidden; color: var(--ar-ink); font-size: 13px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
</style>
