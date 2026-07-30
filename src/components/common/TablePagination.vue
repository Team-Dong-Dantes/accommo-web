<template>
  <q-card flat class="pagination-card q-pa-sm q-px-md">
    <div class="row items-center justify-between">

      <div class="text-grey-6 text-caption text-weight-medium">
        Showing {{ startItem }}–{{ endItem }} of {{ totalItems }} {{ itemName }}
      </div>

      <div class="row items-center q-gutter-x-lg">

        <div class="row items-center no-wrap q-gutter-x-sm">
          <span class="text-caption text-grey-6 text-weight-medium">Go to page:</span>
          <q-input
            outlined
            dense
            v-model.number="inputPage"
            type="number"
            min="1"
            :max="totalPages"
            @keyup.enter="jumpToPage"
            @blur="jumpToPage"
            class="page-input bg-white"
          />
        </div>

        <div class="row q-gutter-x-xs items-center">
          <q-btn flat dense color="grey-6" size="sm" class="pagination-btn" :disable="modelValue <= 1" @click="changePage(modelValue - 1)">
            <Icon icon="mdi:chevron-left" width="18" height="18" />
          </q-btn>

          <q-btn
            v-for="page in visiblePages"
            :key="page"
            unelevated
            dense
            :label="page"
            :color="page === modelValue ? 'teal-7' : 'grey-7'"
            :flat="page !== modelValue"
            class="pagination-number"
            :class="{ 'active': page === modelValue }"
            @click="changePage(page)"
          />

          <q-btn flat dense color="grey-6" size="sm" class="pagination-btn" :disable="modelValue >= totalPages" @click="changePage(modelValue + 1)">
            <Icon icon="mdi:chevron-right" width="18" height="18" />
          </q-btn>
        </div>

      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  totalItems: { type: Number, required: true },
  rowsPerPage: { type: Number, default: 10 },
  itemName: { type: String, default: 'items' }
})

const emit = defineEmits(['update:modelValue'])

const inputPage = ref(props.modelValue)

const totalPages = computed(() => Math.ceil(props.totalItems / props.rowsPerPage) || 1)
const startItem = computed(() => props.totalItems === 0 ? 0 : (props.modelValue - 1) * props.rowsPerPage + 1)
const endItem = computed(() => Math.min(props.modelValue * props.rowsPerPage, props.totalItems))

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, props.modelValue - 2)
  const end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

watch(() => props.modelValue, (newVal) => {
  inputPage.value = newVal
})

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:modelValue', page)
  }
}

function jumpToPage() {
  let page = Number(inputPage.value)
  if (page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  inputPage.value = page
  changePage(page)
}
</script>

<style scoped>
.pagination-card {
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
}
.page-input {
  width: 50px;
}
.page-input :deep(.q-field__control) {
  border-radius: 8px;
  height: 32px;
  padding: 0 4px;
}
.page-input :deep(input[type=number]::-webkit-outer-spin-button),
.page-input :deep(input[type=number]::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
.page-input :deep(input[type=number]) {
  -moz-appearance: textfield;
  text-align: center;
}
.pagination-btn {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  width: 32px;
  height: 32px;
}
.pagination-number {
  border-radius: 8px;
  width: 32px;
  height: 32px;
  font-size: 13px;
  font-weight: bold;
}
.active {
  box-shadow: 0 2px 8px rgba(0, 150, 136, 0.3);
}
</style>
