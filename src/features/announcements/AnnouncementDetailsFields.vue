<template>
  <div class="details-grid">
    <q-input v-model="details.eventAt" outlined type="datetime-local" label="Event starts" stack-label clearable hint="Optional. When the thing being announced happens." />
    <q-input v-model="details.eventEnd" outlined type="datetime-local" label="Event ends" stack-label clearable :disable="!details.eventAt" />
    <q-input v-model="details.deadlineAt" outlined type="datetime-local" label="Deadline" stack-label clearable hint="Optional. When readers must act by." />
    <q-input v-model="details.location" outlined label="Location" placeholder="e.g. OSAS Office, Admin Bldg." hint="Optional." />
  </div>

  <div class="poster q-mt-md">
    <div class="poster-label">Poster image <span class="text-muted">(optional)</span></div>
    <div v-if="details.imageUrl" class="poster-preview">
      <img :src="details.imageUrl" alt="" />
      <q-btn round dense unelevated color="dark" size="sm" class="poster-remove" aria-label="Remove poster" @click="details.imageUrl = ''">
        <Icon icon="lucide:x" width="14" height="14" />
      </q-btn>
    </div>
    <q-btn v-else outline no-caps color="primary" :loading="uploading" class="rounded-button" @click="picker?.click()">
      <Icon icon="lucide:image-plus" width="18" height="18" class="on-left" />
      Upload poster
    </q-btn>
    <input ref="picker" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onPick" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { uploadCloudinaryFile } from '@/utils/cloudinary'
import { useNotify } from '@/utils/notify'

export type AnnouncementDetails = {
  eventAt: string | null
  eventEnd: string | null
  deadlineAt: string | null
  location: string
  imageUrl: string
}

const details = defineModel<AnnouncementDetails>({ required: true })
const notify = useNotify()
const picker = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploading.value = true
  try {
    details.value.imageUrl = (await uploadCloudinaryFile(file, 'announcements')).url
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Upload failed')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-3, 12px);
}
.poster-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-ink);
  margin-bottom: 6px;
}
.poster-preview {
  position: relative;
  width: 100%;
  max-width: 360px;
}
.poster-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--c-border);
}
.poster-remove {
  position: absolute;
  top: 8px;
  right: 8px;
}
@media (max-width: 599px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
