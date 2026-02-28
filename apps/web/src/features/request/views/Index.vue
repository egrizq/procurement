<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Requests</h1>
        <p class="text-gray-600 mt-1">Manage vessel requests</p>
      </div>
      <button
        @click="openAddDialog"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus :size="20" />
        <span>New Request</span>
      </button>
    </div>

    <!-- Filters and Search -->
    <SearchFilter v-model="searchQuery" placeholder="Search requests..."></SearchFilter>

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
          {{ value }}
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

    <!-- View Dialog -->
    <ViewRequest :is-open="isViewOpen" :request="selectedRequest" @close="closeView" />

    <!-- Form Dialog -->
    <FormRequest
      :is-open="isFormOpen"
      :request="selectedRequest"
      @close="closeForm"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import ViewRequest from '../component/ViewRequest.vue'
import FormRequest from '../component/FormRequest.vue'
import { useRequestStore } from '../store.js'
import { showInfo, showSuccess, showError } from '@/services/notification.js'

const requestStore = useRequestStore()
const requests = ref([])
const pagination = ref(null)
const isLoading = ref(false)

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Form state
const isFormOpen = ref(false)
const selectedRequest = ref(null)

// View state
const isViewOpen = ref(false)

// Fetch requests function
const fetchRequests = async () => {
  isLoading.value = true
  try {
    await requestStore.fetchRequests(currentPage.value, itemsPerPage, searchQuery.value)
    requests.value = requestStore.requests
    pagination.value = requestStore.pagination

    if (requestStore.error) {
      showInfo(`No requests found for "${searchQuery.value}"`, 'No Results')
      requestStore.clearError()
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

// Watch for page changes
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
    Waiting: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    Pending: 'bg-blue-100 text-blue-800',
    Completed: 'bg-purple-100 text-purple-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
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

const openAddDialog = () => {
  selectedRequest.value = null
  isFormOpen.value = true
}

const handleRowClick = async (request) => {
  try {
    // Fetch full request details including items
    const fullRequest = await requestStore.fetchRequestById(request.id)
    if (fullRequest) {
      selectedRequest.value = fullRequest
      isViewOpen.value = true
    }
  } catch (error) {
    showError('Failed to load request details')
  }
}

const closeView = () => {
  isViewOpen.value = false
  selectedRequest.value = null
}

const closeForm = () => {
  isFormOpen.value = false
  selectedRequest.value = null
}

const handleFormSubmit = async (formData) => {
  try {
    // Create new request
    await requestStore.createRequest(formData)
    showSuccess('Request created successfully')
    closeForm()
    await fetchRequests()
  } catch (error) {
    showError('Failed to create request')
  }
}
</script>
