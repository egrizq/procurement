<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Vessel Item Standards</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage minimum and maximum stock limits for items on specific vessels.
        </p>
      </div>
      <button
        @click="openAddDialog"
        class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <Plus class="mr-2 h-4 w-4" />
        Add Standard
      </button>
    </div>

    <!-- Alert for Empty State -->
    <div
      v-if="!loading && !standards.length && !searchQuery"
      class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
    >
      <Scale class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Standards</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Get started by creating a new vessel item standard limit.
      </p>
      <div class="mt-6">
        <button
          @click="openAddDialog"
          class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus class="mr-2 -ml-1 h-5 w-5" />
          Add Standard
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-4">
      <SearchFilter
        v-model="searchQuery"
        placeholder="Search by vessel or item..."
        @search="handleSearch"
      />

      <DataTable
        :columns="columns"
        :data="standards"
        :current-page="currentPage"
        :items-per-page="10"
        :pagination="pagination"
        @update:current-page="handlePageChange"
        @row-click="handleRowClick"
      >
        <!-- Vessel Name Cell -->
        <template #cell-vessel.name="{ row }">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
              >
                <Ship class="h-4 w-4" />
              </div>
            </div>
            <div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ row.vessel?.name }}
              </div>
            </div>
          </div>
        </template>

        <!-- Item Name Cell -->
        <template #cell-item.name="{ row }">
          <div class="font-medium text-gray-900 dark:text-white">{{ row.item?.name }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ row.item?.itemCode }}</div>
        </template>

        <!-- Min Stock Cell -->
        <template #cell-minStock="{ row }">
          {{ row.minStock }} {{ row.item?.unit }}
        </template>

        <!-- Max Stock Cell -->
        <template #cell-maxStock="{ row }">
          {{ row.maxStock }} {{ row.item?.unit }}
        </template>
        
        <!-- Periode Cell -->
        <template #cell-periode="{ row }">
          <span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {{ row.periode }}
          </span>
        </template>

        <!-- Actions Cell -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <button
              @click.stop="openViewDialog(row)"
              class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="View Standard"
            >
              <Eye class="h-4 w-4" />
            </button>
            <button
              @click.stop="openEditDialog(row)"
              class="rounded-md p-2 text-blue-400 hover:bg-blue-50 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-blue-900/50 dark:hover:text-blue-300"
              title="Edit Standard"
            >
              <Edit class="h-4 w-4" />
            </button>
            <button
              @click.stop="handleDelete(row)"
              class="rounded-md p-2 text-red-400 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-900/50 dark:hover:text-red-300"
              title="Delete Standard"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Form Dialog -->
    <FormVesselItemStandard
      v-if="isDialogOpen"
      :is-open="isDialogOpen"
      :mode="dialogMode"
      :standard="selectedStandard"
      @close="closeDialog"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Plus, Ship, Edit, Eye, Trash2, Scale } from 'lucide-vue-next'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import FormVesselItemStandard from '../component/FormVesselItemStandard.vue'
import { useVesselItemStandardStore } from '../store'
import { getErrorMessage } from '@/utils/errorHandler.js'
import { showInfo, showSuccess, showError } from '@/services/notification.js'

const standardStore = useVesselItemStandardStore()
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)

const isDialogOpen = ref(false)
const dialogMode = ref('add') // 'add', 'edit', 'view'
const selectedStandard = ref(null)

const standards = ref([])
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
})

const columns = [
  { key: 'vessel.name', label: 'Vessel' },
  { key: 'item.name', label: 'Item' },
  { key: 'minStock', label: 'Min. Stock' },
  { key: 'maxStock', label: 'Max. Stock' },
  { key: 'periode', label: 'Periode' },
  { key: 'actions', label: 'Actions' },
]

const loadStandards = async () => {
  loading.value = true
  try {
    await standardStore.fetchVesselItemStandards(currentPage.value, 10, searchQuery.value)
    standards.value = standardStore.items
    pagination.value = standardStore.pagination
  } catch (error) {
    showError(getErrorMessage(error) || 'Failed to load standards')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStandards()
})

// Search debounce
let searchTimeout = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadStandards()
  }, 500)
})

const handlePageChange = (page) => {
  currentPage.value = page
  loadStandards()
}

// Dialog Handlers
const openAddDialog = () => {
  dialogMode.value = 'add'
  selectedStandard.value = null
  isDialogOpen.value = true
}

const openEditDialog = (standard) => {
  console.log('Editing standard:', standard)
  dialogMode.value = 'edit'
  selectedStandard.value = standard
  isDialogOpen.value = true
}

const openViewDialog = (standard) => {
  dialogMode.value = 'view'
  selectedStandard.value = standard
  isDialogOpen.value = true
}

const handleRowClick = (row) => {
  if (!row) return
  openViewDialog(row)
}

const closeDialog = () => {
  isDialogOpen.value = false
  selectedStandard.value = null
}

const handleSubmitConfirm = async (formData) => {
  try {
    if (dialogMode.value === 'edit') {
      await standardStore.updateVesselItemStandard(selectedStandard.value.id, formData)
      showSuccess("Standard updated successfully")
    } else {
      await standardStore.createVesselItemStandard(formData)
      showSuccess("Standard created successfully")
    }
    closeDialog()
    loadStandards()
  } catch (error) {
    showError(getErrorMessage(error) || 'Failed to load standards')
  }
}

const handleFormSubmit = async (formData) => {
  try {
    await handleSubmitConfirm(formData)
    showSuccess("Standard saved successfully")
  } catch (error) {
    showError(getErrorMessage(error) || 'Failed to save standard')
  }
}

const handleDelete = async (standard) => {
  try {
    if (confirm('Are you sure you want to delete this standard?')) {
      await standardStore.deleteVesselItemStandard(standard.id)
      showSuccess("Standard deleted successfully")

      if (standards.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }

      loadStandards()
    }
  } catch (error) {
    showError(getErrorMessage(error) || 'Failed to delete standard')
  }
}

</script>
