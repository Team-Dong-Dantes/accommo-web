<template>
  <!-- An invited admin's access: pick a preset card, then fine-tune the grid
       (sections as in the sidebar, a view and an edit switch per area), then an
       optional end date. Touching the grid makes the preset "Custom". -->
  <div class="ae">
    <div class="ae-head">
      <span class="ae-caption">Start from a preset</span>
      <span v-if="modelValue.preset === 'custom'" class="ae-custom"><Icon icon="lucide:sliders-horizontal" width="12" height="12" />Custom</span>
    </div>
    <div class="ae-presets" role="radiogroup" aria-label="Preset">
      <button
        v-for="p in PRESETS"
        :key="p.key"
        type="button"
        role="radio"
        class="ae-card"
        :class="{ 'is-on': modelValue.preset === p.key }"
        :aria-checked="modelValue.preset === p.key"
        @click="applyPreset(p.key)"
      >
        <span class="ae-card-top">
          <Icon :icon="p.icon" width="16" height="16" />
          <span class="ae-dot" />
        </span>
        <span class="ae-card-title">{{ p.label }}</span>
        <span class="ae-card-sub">{{ p.summary }}</span>
      </button>
    </div>

    <div class="ae-grid" role="table" aria-label="Access per area">
      <div class="ae-row ae-row--head" role="row">
        <span role="columnheader">Area</span>
        <span role="columnheader" class="ae-col">Can view</span>
        <span role="columnheader" class="ae-col">Can edit</span>
      </div>
      <template v-for="g in AREA_GROUPS" :key="g.label">
        <div class="ae-group" role="row"><span role="cell">{{ g.label }}</span></div>
        <div v-for="a in g.areas.map(byKey)" :key="a.key" class="ae-row" role="row">
          <span class="ae-area" role="cell">
            <span class="ae-label">{{ a.label }}</span>
            <span class="ae-hint">{{ a.hint }}</span>
          </span>
          <span class="ae-col" role="cell">
            <q-toggle
              dense
              color="primary"
              :model-value="modelValue.levels[a.key] !== 'none'"
              :aria-label="`${a.label}: ${a.view}`"
              @update:model-value="(on) => setLevel(a.key, on ? 'view' : 'none')"
            />
          </span>
          <span class="ae-col" role="cell">
            <q-toggle
              dense
              color="primary"
              :model-value="modelValue.levels[a.key] === 'edit'"
              :aria-label="`${a.label}: ${a.edit}`"
              @update:model-value="(on) => setLevel(a.key, on ? 'edit' : 'view')"
            />
          </span>
        </div>
      </template>
    </div>

    <div class="ae-expiry">
      <Icon icon="lucide:timer" width="18" height="18" class="ae-expiry-ico" />
      <span class="ae-area">
        <span class="ae-label">Time-limited access</span>
        <span class="ae-hint">On the end date they are signed out until you extend it.</span>
      </span>
      <q-input
        v-if="modelValue.expiresAt !== null"
        :model-value="modelValue.expiresAt"
        type="date"
        outlined
        dense
        :min="tomorrow"
        aria-label="Access ends on"
        @update:model-value="(v) => emit('update:modelValue', { ...modelValue, expiresAt: String(v ?? '') })"
      />
      <q-toggle
        dense
        color="primary"
        :model-value="modelValue.expiresAt !== null"
        aria-label="Time-limited access"
        @update:model-value="(on) => emit('update:modelValue', { ...modelValue, expiresAt: on ? defaultEnd() : null })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { AREAS, AREA_GROUPS, PRESETS, presetOf, type AccessLevels, type Area, type Level } from '@/utils/access'

export interface AccessDraft {
  preset: string
  levels: AccessLevels
  /** yyyy-mm-dd, or null for no end date. */
  expiresAt: string | null
}

const props = defineProps<{ modelValue: AccessDraft }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: AccessDraft): void }>()

const byKey = (k: Area) => AREAS.find((a) => a.key === k)!

const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('en-CA') // yyyy-mm-dd in local time
}
const tomorrow = day(1)
const defaultEnd = () => day(30)

function applyPreset(key: string) {
  const p = PRESETS.find((x) => x.key === key)
  if (p) emit('update:modelValue', { ...props.modelValue, preset: key, levels: { ...p.levels } })
}

// Edit implies view; dropping view drops edit with it.
function setLevel(area: Area, level: Level) {
  const levels = { ...props.modelValue.levels, [area]: level }
  emit('update:modelValue', { ...props.modelValue, levels, preset: presetOf(levels) })
}
</script>

<style scoped>
.ae { display: flex; flex-direction: column; gap: 14px; }

.ae-head { display: flex; align-items: center; justify-content: space-between; }
.ae-caption { font-size: 12px; font-weight: 600; color: var(--c-muted); }
.ae-custom {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--c-primary-ink);
}

.ae-presets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
  gap: 8px;
}
.ae-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.ae-card:hover { border-color: var(--c-border-strong); }
.ae-card:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.ae-card.is-on { border-color: var(--c-primary); background: var(--c-primary-soft); }
.ae-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; color: var(--c-muted); }
.ae-card.is-on .ae-card-top { color: var(--c-primary); }
.ae-dot {
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--c-border-strong);
  border-radius: 50%;
}
.ae-card.is-on .ae-dot { border: 4px solid var(--c-primary); }
.ae-card-title { font-size: 13px; font-weight: 700; line-height: 1.25; }
.ae-card-sub { font-size: 11.5px; color: var(--c-muted); line-height: 1.3; }

.ae-grid { display: flex; flex-direction: column; }
.ae-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 76px 76px;
  align-items: center;
  gap: 8px;
  padding: 10px 4px;
  border-bottom: 1px solid var(--c-border);
}
.ae-row--head {
  padding-top: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--c-muted);
}
.ae-col { display: flex; justify-content: center; text-align: center; }
.ae-group {
  padding: 14px 4px 4px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-primary-ink);
}
.ae-area { display: flex; flex-direction: column; min-width: 0; }
.ae-label { font-size: 13.5px; font-weight: 600; color: var(--c-ink); }
.ae-hint { font-size: 12px; color: var(--c-muted); }

.ae-expiry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  background: var(--c-surface);
}
.ae-expiry .ae-area { flex: 1; }
.ae-expiry-ico { color: var(--c-muted); flex-shrink: 0; }
</style>
