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
            />
          </div>
        </div>
        <select
          v-model="filterStatus"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
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
                {{ vessel.code }}
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
                    @click="deleteVessel(vessel)"
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
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to
          {{ Math.min(currentPage * itemsPerPage, filteredVessels.length) }} of
          {{ filteredVessels.length }} results
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
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Search, Edit, Eye, Trash2 } from 'lucide-vue-next'

const searchQuery = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Mock data
const vessels = ref([
  {
    id: 1,
    code: 'VSL-001',
    name: 'MV Ocean Explorer',
    type: 'Cargo Ship',
    imoNumber: 'IMO 9876543',
    flag: 'Panama',
    status: 'Active',
  },
  {
    id: 2,
    code: 'VSL-002',
    name: 'MV Pacific Star',
    type: 'Container Ship',
    imoNumber: 'IMO 9876544',
    flag: 'Liberia',
    status: 'Active',
  },
  {
    id: 3,
    code: 'VSL-003',
    name: 'MV Atlantic Wave',
    type: 'Tanker',
    imoNumber: 'IMO 9876545',
    flag: 'Marshall Islands',
    status: 'Maintenance',
  },
  {
    id: 4,
    code: 'VSL-004',
    name: 'MV Nordic Spirit',
    type: 'Bulk Carrier',
    imoNumber: 'IMO 9876546',
    flag: 'Norway',
    status: 'Active',
  },
  {
    id: 5,
    code: 'VSL-005',
    name: 'MV Southern Cross',
    type: 'General Cargo',
    imoNumber: 'IMO 9876547',
    flag: 'Singapore',
    status: 'Inactive',
  },
])

const filteredVessels = computed(() => {
  let result = vessels.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (vessel) =>
        vessel.code.toLowerCase().includes(query) ||
        vessel.name.toLowerCase().includes(query) ||
        vessel.type.toLowerCase().includes(query) ||
        vessel.imoNumber.toLowerCase().includes(query),
    )
  }

  if (filterStatus.value) {
    result = result.filter(
      (vessel) => vessel.status.toLowerCase() === filterStatus.value.toLowerCase(),
    )
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredVessels.value.length / itemsPerPage))

const getStatusColor = (status) => {
  const colors = {
    Active: 'bg-green-100 text-green-800',
    Maintenance: 'bg-yellow-100 text-yellow-800',
    Inactive: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const openAddDialog = () => {
  console.log('Open add vessel dialog')
}

const editVessel = (vessel) => {
  console.log('Edit vessel:', vessel)
}

const viewVessel = (vessel) => {
  console.log('View vessel:', vessel)
}

const deleteVessel = (vessel) => {
  console.log('Delete vessel:', vessel)
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}
</script>
