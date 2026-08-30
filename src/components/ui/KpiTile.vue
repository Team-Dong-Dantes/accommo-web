<template>
  <q-card
    flat
    class="kpi-card"
    :class="[`accent-${accent}`, { 'is-link': !!to, 'kpi-feature': variant === 'feature' }]"
    :role="to ? 'link' : undefined"
    :tabindex="to ? 0 : undefined"
    :aria-label="to ? `Open ${label}` : undefined"
    @click="navigate"
    @keydown.enter.prevent="navigate"
    @keydown.space.prevent="navigate"
  >
    <div class="kpi-top">
      <div class="kpi-heading">
        <span class="kpi-index" aria-hidden="true">{{ index }}</span>
        <span class="kpi-label" :title="label">{{ label }}</span>
      </div>
      <span class="kpi-ico" aria-hidden="true">
        <Icon :icon="icon" :width="17" :height="17" />
      </span>
    </div>
    <div class="kpi-val text-display">{{ displayValue }}</div>
    <div class="kpi-foot">
      <span v-if="trend && trend !== 'flat' && delta" class="trend" :class="trend">
        {{ delta }}
      </span>
      <span v-if="deltaLabel" class="kpi-foot-label" :title="deltaLabel">{{ deltaLabel }}</span>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  label: string
  value: string
  icon: string
  variant?: 'default' | 'feature'
  accent?: 'primary' | 'warning' | 'success' | 'info' | 'danger'
  trend?: 'up' | 'down' | 'flat'
  delta?: string
  deltaLabel?: string
  countTo?: number | null
  to?: string
}>(), {
  variant: 'default',
  accent: 'primary',
  trend: 'flat',
  delta: '',
  deltaLabel: '',
  countTo: null,
})

const displayValue = ref(props.value)
const index = props.label.replace(/\s+/g, '').slice(0, 2).toUpperCase()
const router = useRouter()

function navigate() {
  if (props.to) void router.push(props.to)
}

function animateCount(target: number) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayValue.value = target.toLocaleString()
    return
  }

  const start = performance.now()
  const duration = 700
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - p, 3)
    displayValue.value = Math.round(target * eased).toLocaleString()
    if (p < 1) requestAnimationFrame(step)
    else displayValue.value = target.toLocaleString()
  }
  requestAnimationFrame(step)
}

onMounted(() => {
  if (props.countTo != null) animateCount(props.countTo)
})
watch(
  () => props.countTo,
  (v) => {
    if (v != null) animateCount(v)
  },
)
</script>

<style scoped>
.kpi-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 124px;
  padding: var(--sp-4) var(--sp-5);
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.kpi-card.is-link { cursor: pointer; }
.kpi-card.is-link:hover { background: var(--c-surface-2); }
.kpi-card.is-link:focus-visible { outline: 2px solid var(--c-primary); outline-offset: -2px; }
.kpi-feature {
  background: transparent;
  color: inherit;
}
.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  min-height: 20px;
}
.kpi-heading { display: flex; align-items: center; gap: var(--sp-2); min-width: 0; }
.kpi-index {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--c-primary);
}
.accent-warning .kpi-index { color: var(--c-warning); }
.accent-success .kpi-index { color: var(--c-success); }
.accent-info .kpi-index { color: var(--c-info); }
.accent-danger .kpi-index { color: var(--c-danger); }
.kpi-ico {
  color: var(--c-primary);
  opacity: 0.75;
  flex: 0 0 auto;
}
.accent-warning .kpi-ico { color: var(--c-warning); }
.accent-success .kpi-ico { color: var(--c-success); }
.accent-info .kpi-ico { color: var(--c-info); }
.accent-danger .kpi-ico { color: var(--c-danger); }
.kpi-label {
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--c-muted);
}
.kpi-val {
  margin-top: var(--sp-4);
  font-family: var(--font-display);
  font-size: clamp(2.15rem, 1.7rem + 1.25vw, 2.8rem);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--c-ink);
}
.kpi-foot {
  min-height: 20px;
  margin-top: auto;
  padding-top: var(--sp-3);
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.trend {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
}
.trend.up { color: var(--c-success); background: var(--c-success-soft); }
.trend.down { color: var(--c-danger); background: var(--c-danger-soft); }
.kpi-foot-label {
  overflow: hidden;
  min-width: 0;
  font-size: 12px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--c-muted);
}
</style>
