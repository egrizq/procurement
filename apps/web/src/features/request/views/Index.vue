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
        class="flex items-center gap-2 px-4 py-2 cursor-pointer bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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

    <!-- View Dialog -->
    <ViewRequest :is-open="isViewOpen" :request="selectedRequest" @close="closeView" @reviewed="handleRefresh" />

    <!-- Form Dialog -->
    <FormRequest
      :is-open="isFormOpen"
      :request="selectedRequest"
      @close="closeForm"
      @submit="handleFormSubmit"
    />

    <!-- Validation Warnings Dialog -->
    <FormDialog
      :is-open="isValidationOpen"
      title="Validation Warnings"
      size="lg"
      @close="closeValidation"
    >
      <template #default>
        <div class="space-y-4">
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <AlertTriangle class="h-5 w-5 text-yellow-400" />
              </div>
              <div class="ml-3">
                <p class="text-sm text-yellow-700">
                  Beberapa catatan peringatan ditemukan pada permintaan. Harap perhatikan sebelum mengirimkan:
                </p>
              </div>
            </div>
          </div>
          
          <div v-for="item in validationWarnings" :key="item.itemId" class="border rounded-md p-4">
            <h4 class="font-medium text-gray-900 border-b pb-2 mb-2">{{ item.itemName }}</h4>
            <ul class="list-disc pl-5 space-y-1">
              <li v-for="(warning, idx) in item.warnings" :key="idx" class="text-sm text-gray-600">
                {{ warning }}
              </li>
            </ul>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            @click="closeValidation"
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go Back & Edit
          </button>
          <button
            @click="confirmFormSubmit"
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Tetap Ajukan Request
          </button>
        </div>
      </template>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Plus, AlertTriangle } from 'lucide-vue-next'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import ViewRequest from '../component/ViewRequest.vue'
import FormRequest from '../component/FormRequest.vue'
import FormDialog from '@/components/base/form/Form.vue'
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
    'Approved by system': 'bg-green-100 text-green-800',
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
  if (status === 'Ok') return 'OK'
  return status
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
  if (!request) return
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

const handleRefresh = () => {
  fetchRequests()
}

const closeForm = () => {
  isFormOpen.value = false
  selectedRequest.value = null
}

const isValidationOpen = ref(false)
const validationWarnings = ref([])
const pendingFormData = ref(null)

const handleFormSubmit = async (formData) => {
  try {
    const response = await requestStore.validateRequest(formData)
    
    // Filter items that actually have warnings
    const itemsWithWarnings = response.items.filter(i => i.warnings.length > 0)
    
    if (itemsWithWarnings.length > 0) {
      validationWarnings.value = itemsWithWarnings
      pendingFormData.value = formData
      isValidationOpen.value = true
    } else {
      // Proceed directly if no warnings
      await proceedCreate(formData)
    }
  } catch (error) {
    showError(error.message || 'Gagal memvalidasi request')
  }
}

const confirmFormSubmit = async () => {
  isValidationOpen.value = false
  if (pendingFormData.value) {
    await proceedCreate(pendingFormData.value)
  }
}

const closeValidation = () => {
  isValidationOpen.value = false
  pendingFormData.value = null
}

const proceedCreate = async (formData) => {
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
