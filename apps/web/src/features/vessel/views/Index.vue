<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Vessels</h1>
        <p class="text-gray-600 mt-1">Manage vessel information</p>
      </div>
      <button
        @click="openAddDialog"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus :size="20" />
        <span>Add Vessel</span>
      </button>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              :size="20"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search vessels..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @input="handleSearch"
            />
          </div>
        </div>
        <select
          v-model="filterStatus"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @change="handleFilterChange"
        >
          <option value="">All Status</option>
          <option value="Publish">Published</option>
          <option value="Unpublish">Unpublished</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-lg shadow p-8 text-center">
      <p class="text-gray-500">Loading vessels...</p>
    </div>

    <!-- Error State -->
    <div v-if="vesselStore.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ vesselStore.error }}</p>
      <button
        @click="loadVessels"
        class="mt-2 px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
      >
        Retry
      </button>
    </div>

    <!-- Table -->
    <div
      v-if="!loading && filteredVessels.length > 0"
      class="bg-white rounded-lg shadow overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Vessel Code
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Vessel Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                IMO Number
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Flag
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="vessel in filteredVessels"
              :key="vessel.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ vessel.id }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ vessel.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ vessel.type }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ vessel.imoNumber }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ vessel.flag }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getStatusColor(vessel.status)"
                >
                  {{ vessel.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <button
                    @click="editVessel(vessel)"
                    class="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit :size="16" />
                  </button>
                  <button
                    @click="viewVessel(vessel)"
                    class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    title="View"
                  >
                    <Eye :size="16" />
                  </button>
                  <button
                    @click="deleteVesselConfirm(vessel)"
                    class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-600">
          Showing {{ filteredVessels.length }} of {{ vesselStore.vessels.length }} results
        </div>
        <div class="flex gap-2">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            @click="nextPage"
            :disabled="!hasNextPage"
            class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && filteredVessels.length === 0"
      class="bg-white rounded-lg shadow p-8 text-center"
    >
      <p class="text-gray-500">No vessels found</p>
    </div>

    <!-- Form Dialog -->
    <FormVessel
      :is-open="formDialogOpen"
      :vessel="editingVessel"
      :mode="formMode"
      @close="closeFormDialog"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Edit, Eye, Trash2 } from 'lucide-vue-next'
import { useVesselStore } from '../store.js'
import FormVessel from '../component/FormVessel.vue'

const vesselStore = useVesselStore()

const searchQuery = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

const formDialogOpen = ref(false)
const editingVessel = ref(null)
const formMode = ref('add')

const filteredVessels = computed(() => {
  let result = vesselStore.vessels

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (vessel) =>
        String(vessel.id).toLowerCase().includes(query) ||
        vessel.name.toLowerCase().includes(query) ||
        vessel.type.toLowerCase().includes(query) ||
        vessel.imoNumber.toLowerCase().includes(query) ||
        vessel.flag.toLowerCase().includes(query),
    )
  }

  if (filterStatus.value) {
    result = result.filter((vessel) => vessel.status === filterStatus.value)
  }

  return result
})

const hasNextPage = computed(() => {
  return currentPage.value < Math.ceil(filteredVessels.value.length / itemsPerPage.value)
})

const getStatusColor = (status) => {
  const colors = {
    Publish: 'bg-green-100 text-green-800',
    Unpublish: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const handleSearch = () => {
  currentPage.value = 1
  loadVessels()
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const loadVessels = async () => {
  loading.value = true
  try {
    await vesselStore.fetchVessels(currentPage.value, itemsPerPage.value, searchQuery.value)
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  formMode.value = 'add'
  editingVessel.value = null
  formDialogOpen.value = true
}

const editVessel = (vessel) => {
  formMode.value = 'edit'
  editingVessel.value = { ...vessel }
  formDialogOpen.value = true
}

const viewVessel = (vessel) => {
  formMode.value = 'view'
  editingVessel.value = { ...vessel }
  formDialogOpen.value = true
}

const deleteVesselConfirm = async (vessel) => {
  if (confirm(`Are you sure you want to delete vessel "${vessel.name}"?`)) {
    deleteVessel(vessel)
  }
}

const deleteVessel = async (vessel) => {
  try {
    // Call API to delete
    // await deleteVessel(vessel.id)
    loadVessels()
  } catch (error) {
    console.error('Error deleting vessel:', error)
  }
}

const closeFormDialog = () => {
  formDialogOpen.value = false
  editingVessel.value = null
}

const handleFormSubmit = async (formData) => {
  try {
    if (formMode.value === 'add') {
      // await createVessel(formData)
    } else if (formMode.value === 'edit') {
      // await updateVessel(editingVessel.value.id, formData)
    }
    loadVessels()
    closeFormDialog()
  } catch (error) {
    console.error('Error submitting form:', error)
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadVessels()
  }
}

const nextPage = () => {
  if (hasNextPage.value) {
    currentPage.value++
    loadVessels()
  }
}

onMounted(() => {
  loadVessels()
})
</script>
