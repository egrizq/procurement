<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Vessel Stock</h1>
        <p class="text-gray-600 mt-1">Monitor stock levels across your vessels</p>
      </div>
      <button
        @click="openAddDialog"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus :size="20" />
        <span>Add Stock</span>
      </button>
    </div>

    <!-- Filters and Search -->
    <SearchFilter v-model="searchQuery" placeholder="Search by vessel or item name..." />

    <!-- Table -->
    <DataTable
      :columns="columns"
      :data="vesselStocks"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :pagination="pagination"
      @update:current-page="currentPage = $event"
      @row-click="handleRowClick"
    >
      <template #cell-vessel.name="{ value }">
        <div class="flex items-center gap-2">
          <Ship :size="16" class="text-indigo-500" />
          <span class="font-medium text-gray-900">{{ value }}</span>
        </div>
      </template>

      <template #cell-item.name="{ row }">
        <div>
          <p class="font-medium text-gray-900">{{ row.item?.name }}</p>
          <p class="text-xs text-gray-500">{{ row.item?.itemCode }}</p>
        </div>
      </template>

      <template #cell-stockOnHand="{ row }">
        <span class="font-semibold" :class="row.stockOnHand < row.minStock ? 'text-red-600' : 'text-gray-900'">
          {{ row.stockOnHand }}
        </span>
        <span class="text-xs text-gray-500 ml-1">{{ row.item?.unit }}</span>
      </template>

      <template #cell-minStock="{ row }">
        <span class="text-gray-700">{{ row.minStock}}</span>
        <span class="text-xs text-gray-500 ml-1">{{ !row.minStock ? 'N/A' : row.item?.unit }}</span>
      </template>

      <template #cell-lastUpdate="{ row }">
        <span class="text-gray-600 text-sm">
          {{ formatDate(row.lastUpdate) }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <span
          class="px-2 py-1 text-xs font-medium rounded-full"
          :class="getStockStatusColor(row)"
        >
          {{ getStockStatusLabel(row) }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center gap-2">
          <button
            @click.stop="editStock(row)"
            class="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
            title="Edit"
          >
            <Edit :size="16" />
          </button>
          <button
            @click.stop="viewStock(row)"
            class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="View"
          >
            <Eye :size="16" />
          </button>
          <button
            @click.stop="confirmDelete(row)"
            class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Form Dialog -->
    <FormVesselStock
      :is-open="isFormOpen"
      :stock="selectedStock"
      :mode="formMode"
      @close="closeForm"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Plus, Ship, Edit, Eye, Trash2 } from 'lucide-vue-next'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import FormVesselStock from '../component/FormVesselStock.vue'
import { useVesselStockStore } from '../store.js'
import { showInfo, showSuccess, showError } from '@/services/notification.js'
import { getErrorMessage } from '@/utils/errorHandler.js'

const vesselStockStore = useVesselStockStore()
const vesselStocks = ref([])
const pagination = ref(null)
const isLoading = ref(false)

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const isFormOpen = ref(false)
const selectedStock = ref(null)
const formMode = ref('add')

// Fetch vessel stocks function
const fetchVesselStocks = async () => {
  isLoading.value = true
  try {
    await vesselStockStore.fetchVesselStocks(currentPage.value, itemsPerPage, searchQuery.value)
    vesselStocks.value = vesselStockStore.items
    pagination.value = vesselStockStore.pagination

    if (vesselStockStore.error) {
      showInfo(`No vessel stocks found for "${searchQuery.value}"`, 'No Results')
      vesselStockStore.clearError()
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchVesselStocks()
})

// Debounced search
let searchTimeout = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchVesselStocks()
  }, 500)
})

// Watch for page changes
watch(currentPage, () => {
  fetchVesselStocks()
})

const columns = [
  { key: 'vessel.name', label: 'Vessel' },
  { key: 'item.name', label: 'Item' },
  { key: 'stockOnHand', label: 'Stock On Hand' },
  { key: 'minStock', label: 'Min. Stock' },
  { key: 'lastUpdate', label: 'Last Update' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const getStockStatusColor = (row) => {
  if (row.minStock == null) return 'bg-gray-100 text-gray-800'
  if (row.stockOnHand < row.minStock) {
    return 'bg-red-100 text-red-800'
  }
  return 'bg-green-100 text-green-800'
}

const getStockStatusLabel = (row) => {
  if (row.minStock == null) return 'No Standard'
  if (row.stockOnHand < row.minStock) return 'Low Stock'
  return 'In Stock'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Row click handler
const handleRowClick = (row) => {
  if (!row) return
  viewStock(row)
}

// CRUD handlers
const openAddDialog = () => {
  selectedStock.value = null
  formMode.value = 'add'
  isFormOpen.value = true
}

const editStock = (stock) => {
  selectedStock.value = { ...stock }
  formMode.value = 'edit'
  isFormOpen.value = true
}

const viewStock = (stock) => {
  selectedStock.value = { ...stock }
  formMode.value = 'view'
  isFormOpen.value = true
}

const closeForm = () => {
  isFormOpen.value = false
  selectedStock.value = null
}

const handleFormSubmit = async (formData) => {
  try {
    if (formMode.value === 'add') {
      await vesselStockStore.createVesselStock(formData)
      showSuccess('Vessel stock created successfully')
    } else if (formMode.value === 'edit') {
      await vesselStockStore.updateVesselStock(selectedStock.value.id, formData)
      showSuccess('Vessel stock updated successfully')
    }
    closeForm()
    await fetchVesselStocks()
  } catch (error) {
    showError(getErrorMessage(error, 'Failed to save vessel stock'))
  }
}

const confirmDelete = async (stock) => {
  const itemName = stock.item?.name || 'this stock'
  const vesselName = stock.vessel?.name || 'unknown vessel'

  if (confirm(`Are you sure you want to delete stock of "${itemName}" for vessel "${vesselName}"?`)) {
    try {
      await vesselStockStore.deleteVesselStock(stock.id)
      showSuccess('Vessel stock deleted successfully')
      await fetchVesselStocks()
    } catch (error) {
      showError(getErrorMessage(error, 'Failed to delete vessel stock'))
    }
  }
}
</script>
