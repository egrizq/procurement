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

      <template #cell-actions="{ row }">
        <div class="flex items-center gap-2">
          <button
            @click="viewRequest(row)"
            class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="View"
          >
            <Eye :size="16" />
          </button>
          <button
            @click="editRequest(row)"
            class="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
            title="Edit"
          >
            <Edit :size="16" />
          </button>
          <button
            @click="deleteRequest(row)"
            class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Plus, Edit, Eye, Trash2 } from 'lucide-vue-next'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import { useRequestStore } from '../store.js'
import { showInfo } from '@/services/notification.js'

const requestStore = useRequestStore()
const requests = ref([])
const pagination = ref(null)
const isLoading = ref(false)

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

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
  { key: 'actions', label: 'Actions' },
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
  // TODO: Implement add request dialog
  console.log('Open add dialog')
}

const viewRequest = (request) => {
  // TODO: Implement view request
  console.log('View request:', request)
}

const editRequest = (request) => {
  // TODO: Implement edit request
  console.log('Edit request:', request)
}

const deleteRequest = (request) => {
  if (confirm(`Are you sure you want to delete request ${request.requestCode}?`)) {
    // TODO: Implement delete request
    console.log('Delete request:', request)
  }
}
</script>
