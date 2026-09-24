<template>
  <div ref="root" class="lb" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1" @keydown.left.prevent="go(-1)" @keydown.right.prevent="go(1)" @keydown.esc.stop="$emit('close')">
    <div class="lb-top">
      <div class="lb-title"><span class="lb-name">{{ title }}</span><span class="lb-pos">{{ index + 1 }} / {{ photos.length }}</span></div>
      <button type="button" class="lb-round lb-close" aria-label="Close photos" @click="$emit('close')">
        <Icon icon="lucide:x" width="18" height="18" />
      </button>
    </div>
    <div class="lb-stage">
      <button type="button" class="lb-round lb-nav" aria-label="Previous photo" :disabled="photos.length < 2" @click="go(-1)">
        <Icon icon="lucide:chevron-left" width="20" height="20" />
      </button>
      <div class="lb-photo"><img :src="photos[index]" :alt="`${title}, photo ${index + 1}`" /></div>
      <button type="button" class="lb-round lb-nav" aria-label="Next photo" :disabled="photos.length < 2" @click="go(1)">
        <Icon icon="lucide:chevron-right" width="20" height="20" />
      </button>
    </div>
    <div class="lb-thumbs">
      <button
        v-for="(p, i) in photos"
        :key="i"
        type="button"
        class="lb-thumb"
        :class="{ 'lb-thumb--on': i === index }"
        :aria-label="`Photo ${i + 1}`"
        :aria-current="i === index"
        @click="$emit('update:index', i)"
      >
        <img :src="p" alt="" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{ title: string; photos: string[]; index: number }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'update:index', value: number): void }>()

function go(step: number) {
  const n = props.photos.length
  if (n > 1) emit('update:index', (props.index + step + n) % n)
}

// Focus the dialog so the arrow keys and Escape work without a click first.
const root = ref<HTMLElement | null>(null)
onMounted(() => root.value?.focus())
</script>

<style scoped>
.lb {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border-radius: 12px;
  background: rgba(20, 20, 19, 0.9);
  outline: none;
}
.lb-top { position: absolute; top: 20px; left: 28px; right: 28px; display: flex; align-items: center; justify-content: space-between; }
.lb-title { display: flex; align-items: baseline; gap: 10px; }
.lb-name { color: #fff; font-size: 15px; font-weight: 600; }
.lb-pos { color: rgba(255, 255, 255, 0.6); font-size: 12.5px; }
.lb-round {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
}
.lb-round:hover:not(:disabled) { background: rgba(255, 255, 255, 0.2); }
.lb-round:disabled { opacity: 0.35; cursor: default; }
.lb-close { width: 38px; height: 38px; }
.lb-nav { flex-shrink: 0; width: 44px; height: 44px; }
.lb-stage { display: flex; align-items: center; gap: 18px; max-width: 100%; }
.lb-photo {
  width: 720px;
  max-width: calc(100vw - 200px);
  height: 430px;
  overflow: hidden;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
}
.lb-photo img { width: 100%; height: 100%; object-fit: contain; }
.lb-thumbs { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.lb-thumb {
  position: relative;
  width: 64px;
  height: 46px;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  opacity: 0.55;
  cursor: pointer;
}
.lb-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.lb-thumb--on { border-color: #fff; opacity: 1; }
</style>
