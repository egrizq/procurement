<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Category Items</h1>
        <p class="text-gray-600 mt-1">Manage item categories and classifications</p>
      </div>
      <button
        @click="openAddDialog"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus :size="20" />
        <span>Add Category</span>
      </button>
    </div>

    <!-- Filters and Search -->
    <SearchFilter v-model="searchQuery" placeholder="Search categories..."></SearchFilter>

    <!-- Table -->
    <DataTable
      :columns="columns"
      :data="categoryItems"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :pagination="pagination"
      @update:current-page="currentPage = $event"
      @row-click="handleRowClick"
    >
      <template #cell-status="{ row }">
        <span
          class="px-2 py-1 text-xs font-medium rounded-full"
          :class="getStatusColor(row.status)"
        >
          {{ row.status }}
        </span>
      </template>

      <template #cell-createdAt="{ row }">
        {{ new Date(row.createdAt).toLocaleDateString() }}
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center gap-2">
          <button
            @click.stop="editCategory(row)"
            class="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
            title="Edit"
          >
            <Edit :size="16" />
          </button>
          <button
            @click.stop="viewCategory(row)"
            class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="View"
          >
            <Eye :size="16" />
          </button>
          <button
            @click.stop="deleteCategory(row)"
            class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Form Dialog -->
    <FormCategory
      :is-open="isFormOpen"
      :item="selectedCategory"
      :mode="formMode"
      @close="closeForm"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Plus, Edit, Eye, Trash2 } from 'lucide-vue-next'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import FormCategory from '@/features/master-data/component/FormCategory.vue'
import { useCategoryItemStore } from '../store.js'
import { showInfo } from '@/services/notification.js'

const categoryStore = useCategoryItemStore()
const categoryItems = ref([])
const pagination = ref(null)
const isLoading = ref(false)

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const isFormOpen = ref(false)
const selectedCategory = ref(null)
const formMode = ref('add')

const fetchCategories = async () => {
  isLoading.value = true
  try {
    await categoryStore.fetchCategories(currentPage.value, itemsPerPage, searchQuery.value)
    categoryItems.value = categoryStore.categories
    pagination.value = categoryStore.pagination
    if (categoryStore.error) {
      showInfo(`No categories found for "${searchQuery.value}"`, 'No Results')
      categoryStore.clearError()
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})

let searchTimeout = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchCategories()
  }, 500)
})

watch(currentPage, () => {
  fetchCategories()
})

const columns = [
  { key: 'name', label: 'Name', cellClass: 'font-medium text-gray-900' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'actions', label: 'Actions' },
]

const getStatusColor = (status) => {
  const colors = {
    Publish: 'bg-green-100 text-green-800',
    Unpublish: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const openAddDialog = () => {
  selectedCategory.value = null
  formMode.value = 'add'
  isFormOpen.value = true
}

const editCategory = (category) => {
  selectedCategory.value = { ...category }
  formMode.value = 'edit'
  isFormOpen.value = true
}

const viewCategory = (category) => {
  selectedCategory.value = { ...category }
  formMode.value = 'view'
  isFormOpen.value = true
}

const handleRowClick = (row) => {
  if (!row) return
  viewCategory(row)
}

const closeForm = () => {
  isFormOpen.value = false
  selectedCategory.value = null
}

const handleFormSubmit = async (formData) => {
  try {
    if (selectedCategory.value && formMode.value === 'edit') {
      await categoryStore.updateCategory(selectedCategory.value.id, formData)
      showInfo('Category updated successfully', 'Success')
    } else {
      await categoryStore.addCategory(formData)
      showInfo('Category added successfully', 'Success')
    }
    closeForm()
    fetchCategories()
  } catch (error) {
    showInfo(categoryStore.error || 'Failed to save category', 'Error')
  }
}

const deleteCategory = async (category) => {
  if (confirm(`Are you sure you want to delete ${category.name}?`)) {
    try {
      await categoryStore.deleteCategory(category.id)
      showInfo('Category deleted successfully', 'Success')
      fetchCategories()
    } catch (error) {
      showInfo(categoryStore.error || 'Failed to delete category', 'Error')
    }
  }
}
</script>
