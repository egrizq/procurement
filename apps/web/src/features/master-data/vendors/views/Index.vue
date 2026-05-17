<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Vendors</h1>
        <p class="text-gray-600 mt-1">Manage your vendor partners</p>
      </div>
      <!-- todo: implement add vendor -->
      <button
        @click="openAddDialog"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus :size="20" />
        <span>Add Vendor</span>
      </button>
    </div>

    <!-- Filters and Search -->
    <SearchFilter v-model="searchQuery" placeholder="Search vendors..."></SearchFilter>

    <!-- Table -->
    <DataTable
      :columns="columns"
      :data="mstVendors"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :pagination="pagination"
      @update:current-page="currentPage = $event"
      @row-click="handleRowClick"
    >
      <template #cell-category="{ value }">
        <span class="px-2 py-1 text-xs font-medium rounded-full" :class="getCategoryColor(value)">
          {{ value }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center gap-2">
          <button
            @click.stop="editVendor(row)"
            class="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
            title="Edit"
          >
            <Edit :size="16" />
          </button>
          <button
            @click.stop="viewVendor(row)"
            class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="View"
          >
            <Eye :size="16" />
          </button>
          <button
            @click.stop="deleteVendor(row)"
            class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Form Dialog -->
    <FormVendor
      :is-open="isFormOpen"
      :vendor="selectedVendor"
      :mode="formMode"
      @close="closeForm"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Edit, Eye, Trash2 } from 'lucide-vue-next'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import FormVendor from '../component/FormVendor.vue'
import { useVendorStore } from '../store.js'
import { showInfo } from '@/services/notification.js'

const vendorStore = useVendorStore()
const mstVendors = ref([])
const pagination = ref(null)
const isLoading = ref(false)

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const isFormOpen = ref(false)
const selectedVendor = ref(null)
const formMode = ref('add')

// Fetch vendors function
const fetchVendors = async () => {
  isLoading.value = true
  try {
    await vendorStore.fetchVendors(currentPage.value, itemsPerPage, searchQuery.value)
    mstVendors.value = vendorStore.vendors
    pagination.value = vendorStore.pagination

    if (vendorStore.error) {
      showInfo(`No vendors found for "${searchQuery.value}"`, 'No Results')
      vendorStore.clearError()
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchVendors()
})

// Debounced search
let searchTimeout = null
watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchVendors()
  }, 500)
})

// Watch for page changes
watch(currentPage, () => {
  fetchVendors()
})

const columns = [
  { key: 'name', label: 'Company Name', cellClass: 'font-medium text-gray-900' },
  { key: 'category', label: 'Category' },
  { key: 'city', label: 'City', cellClass: 'text-gray-900' },
  { key: 'phone', label: 'Phone', cellClass: 'text-gray-600' },
  { key: 'email', label: 'Email', cellClass: 'text-gray-600' },
  { key: 'actions', label: 'Actions' },
]

const getCategoryColor = (category) => {
  const colors = {
    Jasa: 'bg-blue-100 text-blue-800',
    Sparepart: 'bg-yellow-100 text-yellow-800',
    Fuel: 'bg-red-100 text-red-800',
    Engine: 'bg-purple-100 text-purple-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

const openAddDialog = () => {
  selectedVendor.value = null
  formMode.value = 'add'
  isFormOpen.value = true
}

const editVendor = (vendor) => {
  selectedVendor.value = { ...vendor }
  formMode.value = 'edit'
  isFormOpen.value = true
}

const closeForm = () => {
  isFormOpen.value = false
  selectedVendor.value = null
}

const handleFormSubmit = async (formData) => {
  try {
    if (formMode.value === 'add') {
      await vendorStore.addVendor(formData)
      showInfo('Vendor added successfully', 'Success')
    } else if (formMode.value === 'edit') {
      await vendorStore.updateVendor(selectedVendor.value.id, formData)
      showInfo('Vendor updated successfully', 'Success')
    }
    closeForm()
    fetchVendors()
  } catch (error) {
    showInfo(error.error || 'An error occurred', 'Error')
  }
}

const viewVendor = (vendor) => {
  selectedVendor.value = { ...vendor }
  formMode.value = 'view'
  isFormOpen.value = true
}

const handleRowClick = (row) => {
  if (!row) return
  viewVendor(row)
}

const deleteVendor = async (vendor) => {
  if (confirm(`Are you sure you want to delete ${vendor.name}?`)) {
    try {
      await vendorStore.deleteVendor(vendor.id)
      showInfo('Vendor deleted successfully', 'Success')
      fetchVendors()
    } catch (error) {
      showInfo(error.error || 'An error occurred', 'Error')
    } 
  }
}
</script>
