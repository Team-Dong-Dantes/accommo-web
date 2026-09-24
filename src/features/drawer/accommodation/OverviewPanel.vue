<template>
  <div class="ov-cover">
    <img v-if="o?.coverUrl && !coverBroken" :src="o.coverUrl" alt="" class="ov-cover-img" @error="coverBroken = true" />
    <div class="ov-fade"></div>
    <button type="button" class="ov-dots" aria-label="More options" aria-haspopup="menu" @click="$emit('menu')">
      <Icon icon="lucide:ellipsis-vertical" width="16" height="16" />
    </button>
    <div class="ov-head">
      <span v-if="o?.typeLine" class="ov-type">
        <Icon icon="lucide:building-2" width="12" height="12" />{{ o.typeLine }}
      </span>
      <h2 class="ov-name">{{ preview.name }}</h2>
      <div v-if="o?.address" class="ov-addr">
        <Icon icon="lucide:map-pin" width="13" height="13" />{{ o.address }}
      </div>
    </div>
  </div>

  <div v-if="o" class="ov-body">
    <OverviewSkeleton v-if="loading" />
    <template v-else>
    <OverviewCharts
      :rooms="preview.rooms ?? []"
      :reviews="preview.reviews ?? []"
      :accredited="o.accredited"
      :accredited-at="o.accreditedAt"
      :expires-at="o.expiresAt"
      :hidden="o.hidden"
      :campus="o.campus"
    />

    <dl class="ov-details">
      <div class="ov-detail">
        <dt>Accepts</dt>
        <dd class="ov-accepts"><Icon :icon="policyIcon" width="15" height="15" />{{ o.genderPolicyLabel }}</dd>
      </div>
      <div v-if="o.amenities.length" class="ov-detail ov-detail--wide">
        <dt>Amenities</dt>
        <dd class="ov-amen">
          <span v-for="a in o.amenities" :key="a" class="ov-chip">
            <Icon :icon="amenityMeta(a).icon" width="13" height="13" />{{ amenityMeta(a).label }}
          </span>
        </dd>
      </div>
    </dl>
    </template>
  </div>

  <div v-if="o" class="ov-foot">
    <div class="ov-foot-who">
      <span class="ov-avatar">
        <img v-if="o.landlord.avatarUrl && !avatarBroken" :src="o.landlord.avatarUrl" :alt="o.landlord.name" @error="avatarBroken = true" />
        <template v-else>{{ o.landlord.initials || '?' }}</template>
      </span>
      <div class="ov-foot-text">
        <span class="ov-foot-name">{{ o.landlord.name }}</span>
        <span class="ov-foot-role">
          {{ o.landlord.title }}
          <span v-if="o.responseLabel && o.responseLabel !== '—'" class="ov-foot-rate" title="Response rate">
            <Icon icon="lucide:message-circle-reply" width="11" height="11" />{{ o.responseLabel }} replies
          </span>
        </span>
        <a v-if="o.landlord.contact" class="ov-foot-tel" :href="`tel:${o.landlord.contact.replace(/[^\d+]/g, '')}`">
          <Icon icon="lucide:phone" width="12" height="12" />{{ formatPhone(o.landlord.contact) }}
        </a>
      </div>
    </div>
    <button v-if="o.landlord.id" type="button" class="ov-btn" @click="$emit('view-landlord')">
      View profile<Icon icon="lucide:arrow-right" width="14" height="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { amenityMeta } from '@/utils/facilities'
import { formatPhone } from '@/utils/format'
import OverviewCharts from './OverviewCharts.vue'
import OverviewSkeleton from './OverviewSkeleton.vue'
import type { DrawerPreview } from '../preview'

// While loading, the name, address, type and landlord/landlady are already
// known from the table row; only the charts wait, as skeletons.
const props = defineProps<{ preview: DrawerPreview; loading?: boolean }>()
defineEmits<{ (e: 'menu'): void; (e: 'view-landlord'): void }>()

const o = computed(() => props.preview.overview)
const policyIcon = computed(() =>
  o.value?.genderPolicyLabel === 'Male only' ? 'lucide:mars'
    : o.value?.genderPolicyLabel === 'Female only' ? 'lucide:venus'
    : 'lucide:users',
)
const coverBroken = ref(false)
const avatarBroken = ref(false)
watch(() => o.value?.coverUrl, () => { coverBroken.value = false })
watch(() => o.value?.landlord.avatarUrl, () => { avatarBroken.value = false })

</script>

<style scoped>
.ov-cover {
  position: relative;
  /* The photo takes the panel's spare height, so the charts sit low, above
     the footer; on a short window it gives way down to 140px first. */
  flex: 1 1 auto;
  min-height: 140px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--ar-soft) 0%, var(--ar-border) 100%);
}
.ov-cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ov-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--ar-surface) 0%, transparent) 0%,
    color-mix(in srgb, var(--ar-surface) 35%, transparent) 55%,
    color-mix(in srgb, var(--ar-surface) 96%, transparent) 84%,
    var(--ar-surface) 100%
  );
}
.ov-dots {
  position: absolute;
  top: 12px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: color-mix(in srgb, var(--ar-surface) 80%, transparent);
  backdrop-filter: blur(6px);
  color: var(--ar-ink);
  cursor: pointer;
}
.ov-dots:focus-visible { outline: 2px solid var(--ar-accent); outline-offset: 2px; }
/* Kind of place, then its name, then where it is — in that order of weight. */
.ov-head { position: absolute; left: 20px; right: 20px; bottom: 12px; display: flex; flex-direction: column; align-items: flex-start; gap: 5px; }
.ov-type {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ar-surface) 88%, transparent);
  backdrop-filter: blur(6px);
  color: var(--ar-accent);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.ov-name {
  margin: 0;
  color: var(--ar-ink);
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.ov-addr { display: inline-flex; align-items: center; gap: 5px; color: var(--ar-text); font-size: 12.5px; }
.ov-addr :deep(svg) { flex-shrink: 0; color: var(--ar-muted); }

.ov-body {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  padding: 2px 20px 0;
  /* Never scrolls: sized to its content, and only the building section gives
     way once the cover is already at its minimum. */
  overflow: hidden;
}
/* Accepts | Amenities: two labelled columns, like Rating | Accreditation above. */
.ov-details { display: flex; flex-shrink: 0; gap: 16px; margin: 0; padding: 9px 0 10px; }
.ov-detail { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ov-detail--wide { flex: 1; padding-left: 16px; border-left: 1px solid var(--ar-border); }
.ov-details dt { color: var(--ar-muted); font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.ov-details dd { margin: 0; }
.ov-accepts { display: inline-flex; align-items: center; gap: 6px; color: var(--ar-ink); font-size: 13.5px; font-weight: 700; white-space: nowrap; }
.ov-accepts :deep(svg) { color: var(--ar-accent); }
.ov-amen { display: flex; flex-wrap: wrap; gap: 5px; }
.ov-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--ar-soft);
  color: var(--ar-ink);
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
}
.ov-chip :deep(svg) { color: var(--ar-accent); }

.ov-foot {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding: 12px 20px;
  border-top: 1px solid var(--ar-border);
  background: var(--ar-soft);
}
.ov-foot-who { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ov-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--ar-accent-soft);
  box-shadow: 0 0 0 2px var(--ar-surface), 0 0 0 3px var(--ar-border);
  color: var(--ar-accent);
  font-size: 14px;
  font-weight: 700;
}
.ov-avatar img { width: 100%; height: 100%; object-fit: cover; }
/* The person, then their role, then how to reach them. */
.ov-foot-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ov-foot-role { display: inline-flex; align-items: center; gap: 6px; color: var(--ar-muted); font-size: 12px; font-weight: 500; }
.ov-foot-rate {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--ar-surface);
  box-shadow: inset 0 0 0 1px var(--ar-border);
  color: var(--ar-text);
  font-size: 10.5px;
}
.ov-foot-name { overflow: hidden; color: var(--ar-ink); font-size: 14px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.ov-foot-tel {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--ar-text);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-decoration: none;
}
.ov-foot-tel :deep(svg) { color: var(--ar-muted); }
.ov-foot-tel:hover { color: var(--ar-accent); text-decoration: underline; }
.ov-foot-tel:focus-visible { outline: 2px solid var(--ar-accent); outline-offset: 2px; border-radius: 3px; }
.ov-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border: 1px solid var(--ar-accent-line);
  border-radius: 8px;
  background: var(--ar-surface);
  color: var(--ar-accent);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.ov-btn:hover { background: var(--ar-accent-soft); }
</style>
