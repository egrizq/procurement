<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Matrix of Comparison (MOC)</h1>
        <p class="text-gray-600 mt-1">Select an approved request to create MOC</p>
      </div>
    </div>

    <!-- Filters and Search -->
    <SearchFilter v-model="searchQuery" placeholder="Search approved requests..."></SearchFilter>

    <!-- Table -->
    <DataTable
      :columns="columns"
      :data="requests"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :pagination="pagination"
      @update:current-page="currentPage = $event"
      @row-click="handleRowClick"
    >
      <template #cell-status="{ value }">
        <span class="px-2 py-1 text-xs font-medium rounded-full" :class="getStatusColor(value)">
          {{ formatStatus(value) }}
        </span>
      </template>

      <template #cell-priority="{ value }">
        <span class="px-2 py-1 text-xs font-medium rounded-full" :class="getPriorityColor(value)">
          {{ value }}
        </span>
      </template>

      <template #cell-requestDate="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #cell-_count.vesselRequestItems="{ value }">
        <span class="text-gray-700">{{ value }} items</span>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import { useMocStore } from '../store.js'
import { showInfo } from '@/services/notification.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const mocStore = useMocStore()
const requests = ref([])
const pagination = ref(null)
const isLoading = ref(false)

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const fetchRequests = async () => {
  isLoading.value = true
  try {
    await mocStore.fetchApprovedRequests(currentPage.value, itemsPerPage, searchQuery.value)
    requests.value = mocStore.requests
    pagination.value = mocStore.pagination

    if (mocStore.error) {
      showInfo(`No approved requests found for "${searchQuery.value}"`, 'No Results')
      mocStore.clearError()
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRequests()
})

let searchTimeout = null
watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchRequests()
  }, 500)
})

watch(currentPage, () => {
  fetchRequests()
})

const columns = [
  { key: 'requestCode', label: 'Request Code', cellClass: 'font-medium text-gray-900' },
  { key: 'vessel.name', label: 'Vessel', cellClass: 'text-gray-900' },
  { key: 'user.fullName', label: 'Requested By', cellClass: 'text-gray-700' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'requestDate', label: 'Request Date', cellClass: 'text-gray-700' },
  { key: '_count.vesselRequestItems', label: 'Items' },
]

const getStatusColor = (status) => {
  const colors = {
    Ok: 'bg-emerald-100 text-emerald-800',
    Waiting: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    Pending: 'bg-blue-100 text-blue-800',
    Completed: 'bg-purple-100 text-purple-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const formatStatus = (status) => {
  return status === 'Ok' ? 'OK' : status
}

const getPriorityColor = (priority) => {
  const colors = {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-green-100 text-green-800',
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const handleRowClick = (request) => {
  // Navigation to create MOC will be handled here
  console.log('Selected request for MOC:', request)
}
</script>
