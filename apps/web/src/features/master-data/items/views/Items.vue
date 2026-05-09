<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Items</h1>
        <p class="text-gray-600 mt-1">Manage your inventory items</p>
      </div>
      <!-- todo: implement add item -->
      <button
        @click="openAddDialog"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus :size="20" />
        <span>Add Item</span>
      </button>
    </div>

    <!-- Filters and Search -->
    <SearchFilter v-model="searchQuery" placeholder="Search items...">
      <!-- todo: implement filter category  -->
      <!-- <template #filters>
        <select
          v-model="filterCategory"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="mechanical">Mechanical</option>
          <option value="safety">Safety</option>
          <option value="tools">Tools</option>
        </select>
      </template> -->
    </SearchFilter>

    <!-- Table -->
    <DataTable
      :columns="columns"
      :data="mstItems"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :pagination="pagination"
      @update:current-page="currentPage = $event"
    >
      <template #cell-category.name="{ value }">
        <span class="px-2 py-1 text-xs font-medium rounded-full" :class="getCategoryColor(value)">
          {{ value }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <span
          class="px-2 py-1 text-xs font-medium rounded-full"
          :class="getStatusColor(row.status)"
        >
          {{ row.status }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center gap-2">
          <button
            @click="editItem(row)"
            class="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
            title="Edit"
          >
            <Edit :size="16" />
          </button>
          <button
            @click="viewItem(row)"
            class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="View"
          >
            <Eye :size="16" />
          </button>
          <button
            @click="deleteItem(row)"
            class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Form Dialog -->
    <FormItem
      :is-open="isFormOpen"
      :item="selectedItem"
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
import FormItem from '@/features/master-data/component/FormItem.vue'
import { useItemStore } from '../store.js'
import { showInfo } from '@/services/notification.js'

const itemStore = useItemStore()
const mstItems = ref([])
const pagination = ref(null)
const isLoading = ref(false)

const searchQuery = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const isFormOpen = ref(false)
const selectedItem = ref(null)
const formMode = ref('add')

// Fetch items function
const fetchItems = async () => {
  isLoading.value = true
  try {
    await itemStore.fetchItems(currentPage.value, itemsPerPage, searchQuery.value)
    mstItems.value = itemStore.items
    pagination.value = itemStore.pagination

    // Show notification if no items found during search
    if (itemStore.error) {
      showInfo(`No items found for "${searchQuery.value}"`, 'No Results')
      itemStore.clearError()
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchItems()
})

// Debounced search
let searchTimeout = null
watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1 // Reset to first page on search
    fetchItems()
  }, 500) // 500ms delay
})

// Watch for page changes
watch(currentPage, () => {
  fetchItems()
})

const columns = [
  { key: 'itemCode', label: 'Item Code', cellClass: 'font-medium text-gray-900' },
  { key: 'name', label: 'Name', cellClass: 'text-gray-900' },
  { key: 'category.name', label: 'Category' },
  { key: 'unit', label: 'Unit' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const getCategoryColor = (category) => {
  const colors = {
    Mechanical: 'bg-blue-100 text-blue-800',
    Safety: 'bg-red-100 text-red-800',
    Electronics: 'bg-purple-100 text-purple-800',
    Tools: 'bg-yellow-100 text-yellow-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

const getStatusColor = (status) => {
  const colors = {
    Publish: 'bg-green-100 text-green-800',
    Unpublish: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const openAddDialog = () => {
  selectedItem.value = null
  formMode.value = 'add'
  isFormOpen.value = true
}

const editItem = (item) => {
  selectedItem.value = { ...item }
  formMode.value = 'edit'
  isFormOpen.value = true
}

const closeForm = () => {
  isFormOpen.value = false
  selectedItem.value = null
}

const handleFormSubmit = async (formData) => {
  try {
    if (selectedItem.value) {
      // Update existing item
      await itemStore.updateItem(selectedItem.value.id, formData)
      showInfo('Item updated successfully', 'Success')
    } else {
      // Add new item
      await itemStore.addItem(formData)
      showInfo('Item added successfully', 'Success')
    }
    fetchItems()
  } catch (error) {
    showInfo(itemStore.error || 'Failed to save item', 'Error')
  }
}

const viewItem = (item) => {
  selectedItem.value = { ...item }
  formMode.value = 'view'
  isFormOpen.value = true
}

const deleteItem = async (item) => {
  if (confirm(`Are you sure you want to delete ${item.name}?`)) {
    try {
      await itemStore.deleteItem(item.id)
      showInfo('Item deleted successfully', 'Success')
      fetchItems()
    } catch (error) {
      showInfo(itemStore.error || 'Failed to delete item', 'Error')
    }
  }
}
</script>
