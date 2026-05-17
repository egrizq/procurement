<template>
  <div class="bg-white rounded-lg shadow overflow-hidden ">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(row, index) in displayData"
            :key="row[rowKey] || index"
            :class="{ 'cursor-pointer hover:bg-gray-50 transition-colors': clickable }"
            @click="clickable && emit('row-click', row)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap text-sm"
              :class="column.cellClass || 'text-gray-600'"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="getNestedValue(row, column.key)"
              >
                {{ getNestedValue(row, column.key) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="showPagination"
      class="px-6 py-4 border-t border-gray-200 flex items-center justify-between"
    >
      <div class="text-sm text-gray-600">
        <template v-if="pagination">
          Showing {{ pagination.from }} to {{ pagination.to }} of
          {{ pagination.total_items }} results
        </template>
        <template v-else>
          Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ data.length }} results
        </template>
      </div>
      <div class="flex gap-2">
        <button
          @click="goToPreviousPage"
          :disabled="!canGoPrevious"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          @click="goToNextPage"
          :disabled="!canGoNext"
          class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  data: {
    type: Array,
    required: true,
  },
  rowKey: {
    type: String,
    default: 'id',
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  },
  showPagination: {
    type: Boolean,
    default: true,
  },
  clickable: {
    type: Boolean,
    default: true,
  },
  // Server-side pagination object
  pagination: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:currentPage', 'row-click'])

// Helper function to access nested properties using dot notation
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Server-side pagination mode when pagination prop is provided
const isServerSide = computed(() => props.pagination !== null)

// Display data - either full data (server-side) or paginated (client-side)
const displayData = computed(() => {
  if (isServerSide.value) {
    return props.data
  }
  return props.data.slice(startIndex.value, endIndex.value)
})

// Client-side pagination calculations
const totalPages = computed(() => {
  if (isServerSide.value) {
    return props.pagination.total_pages
  }
  return Math.ceil(props.data.length / props.itemsPerPage)
})

const startIndex = computed(() => (props.currentPage - 1) * props.itemsPerPage)

const endIndex = computed(() => Math.min(props.currentPage * props.itemsPerPage, props.data.length))

// Pagination controls
const canGoPrevious = computed(() => {
  if (isServerSide.value) {
    return props.pagination.has_prev
  }
  return props.currentPage > 1
})

const canGoNext = computed(() => {
  if (isServerSide.value) {
    return props.pagination.has_next
  }
  return props.currentPage < totalPages.value
})

const goToPreviousPage = () => {
  if (canGoPrevious.value) {
    const newPage = isServerSide.value ? props.pagination.prev_page : props.currentPage - 1
    emit('update:currentPage', newPage)
  }
}

const goToNextPage = () => {
  if (canGoNext.value) {
    const newPage = isServerSide.value ? props.pagination.next_page : props.currentPage + 1
    emit('update:currentPage', newPage)
  }
}
</script>
