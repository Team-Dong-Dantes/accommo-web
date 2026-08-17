<template>
  <div class="usr-hero">
    <Icon icon="mdi:account-circle" class="usr-hero-watermark" />
    <q-avatar
      :size="avatarSize"
      :color="avatarColor"
      text-color="white"
      class="usr-hero-avatar text-weight-bold inline-flex items-center justify-center"
      :style="{ fontSize: avatarFontSize }"
    >
      {{ initials }}
    </q-avatar>
    <div class="usr-hero-name text-weight-bold">{{ name }}</div>
    <div class="row items-center justify-center q-gutter-x-xs q-mt-sm">
      <span class="usr-chip">
        <Icon :icon="roleStyle.icon" width="13" height="13" class="q-mr-xs" />
        {{ roleLabel }}
      </span>
      <span class="usr-chip">
        <Icon :icon="statusStyle.icon" width="13" height="13" class="q-mr-xs" />
        {{ statusLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  name: { type: String, required: true },
  initials: { type: String, default: '' },
  avatarColor: { type: String, default: 'primary' },
  avatarSize: { type: String, default: '200px' },
  avatarFontSize: { type: String, default: '74px' },
  roleLabel: { type: String, default: '' },
  statusLabel: { type: String, default: '' },
  roleStyle: { type: Object as () => { icon: string }, default: () => ({ icon: 'mdi:account' }) },
  statusStyle: { type: Object as () => { icon: string }, default: () => ({ icon: 'mdi:help-circle-outline' }) },
})
</script>

<style scoped>
.usr-hero {
  position: relative;
  padding: 48px 24px 28px;
  text-align: center;
  color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(150deg, #12877D 0%, #0F766E 45%, #0A4F49 100%);
}
.usr-hero::before {
  content: '';
  position: absolute;
  top: -60%;
  left: 50%;
  width: 260px;
  height: 260px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 70%);
  pointer-events: none;
}
.usr-hero::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--c-accent), transparent);
  opacity: 0.85;
}
.usr-hero-watermark {
  position: absolute;
  right: -14px;
  bottom: -18px;
  width: 150px;
  height: 150px;
  color: rgba(255, 255, 255, 0.06);
  pointer-events: none;
}
.usr-hero-avatar {
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
}
.usr-hero-name {
  font-size: 1.3rem;
  line-height: 1.2;
  margin-top: 16px;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.25);
}
.usr-chip {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
</style>
