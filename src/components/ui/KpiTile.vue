<template>
  <q-card flat class="kpi-card" :class="variant === 'feature' ? 'kpi-feature' : 'bg-surface border-token'">
    <div class="kpi-top">
      <span class="kpi-label">{{ label }}</span>
      <div class="kpi-ico" :class="variant === 'feature' ? 'on-feature' : 'on-light'">
        <Icon :icon="icon" :width="17" :height="17" :color="variant === 'feature' ? 'white' : 'var(--c-primary)'" />
      </div>
    </div>
    <div class="kpi-val text-display">{{ value }}</div>
    <div class="kpi-foot" v-if="(trend && trend !== 'flat') || deltaLabel">
      <span v-if="trend && trend !== 'flat'" class="trend" :class="[trend, variant === 'feature' ? 'on-feature' : 'on-light']">
        <Icon :icon="trend === 'up' ? 'mdi:arrow-up-right' : 'mdi:arrow-down-right'" :width="13" :height="13" />
        {{ delta }}
      </span>
      <span v-if="deltaLabel" class="kpi-foot-label" :class="variant === 'feature' ? 'on-feature' : ''">{{ deltaLabel }}</span>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  icon: { type: String, required: true },
  variant: { type: String as () => 'default' | 'feature', default: 'default' },
  trend: { type: String as () => 'up' | 'down' | 'flat', default: 'flat' },
  delta: { type: String, default: '' },
  deltaLabel: { type: String, default: '' },
})
</script>

<style scoped>
.kpi-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--sp-2);
  padding: 14px 16px;
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-sm);
  min-height: 96px;
}
.kpi-feature {
  background: linear-gradient(135deg, var(--c-primary) 0%, #0B5A53 100%);
  color: #fff;
  box-shadow: var(--shadow);
}
.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.kpi-label {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--c-muted);
}
.kpi-feature .kpi-label {
  color: rgba(255, 255, 255, 0.85);
}
.kpi-ico {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.kpi-ico.on-light {
  background: var(--c-primary-soft);
}
.kpi-ico.on-feature {
  background: rgba(255, 255, 255, 0.16);
}
.kpi-val {
  font-size: 1.85rem;
  line-height: 1;
  font-weight: 600;
  color: var(--c-ink);
}
.kpi-feature .kpi-val {
  color: #fff;
}
.kpi-foot {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}
.trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
}
.trend.on-light {
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.trend.neutral.on-light {
  background: var(--c-surface-2);
  color: var(--c-muted);
}
.trend.on-feature {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
.trend.neutral.on-feature {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}
.kpi-foot-label {
  font-size: 11.5px;
  color: var(--c-muted);
}
.kpi-feature .kpi-foot-label {
  color: rgba(255, 255, 255, 0.82);
}
</style>
