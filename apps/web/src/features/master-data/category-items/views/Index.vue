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
              placeholder="Search categories..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <select
          v-model="filterType"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          <option value="consumable">Consumable</option>
          <option value="spare-part">Spare Part</option>
          <option value="equipment">Equipment</option>
          <option value="safety">Safety</option>
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
                Category Code
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Item Count
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
              v-for="category in filteredCategories"
              :key="category.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ category.code }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: category.color }"
                  ></div>
                  {{ category.name }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getTypeColor(category.type)"
                >
                  {{ category.type }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                {{ category.description }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div class="flex items-center gap-1">
                  <Package :size="14" class="text-gray-400" />
                  {{ category.itemCount }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getStatusColor(category.status)"
                >
                  {{ category.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <button
                    @click="editCategory(category)"
                    class="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit :size="16" />
                  </button>
                  <button
                    @click="viewCategory(category)"
                    class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    title="View"
                  >
                    <Eye :size="16" />
                  </button>
                  <button
                    @click="deleteCategory(category)"
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
          {{ Math.min(currentPage * itemsPerPage, filteredCategories.length) }} of
          {{ filteredCategories.length }} results
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
import { Plus, Search, Edit, Eye, Trash2, Package } from 'lucide-vue-next'

const searchQuery = ref('')
const filterType = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Mock data
const categories = ref([
  {
    id: 1,
    code: 'CAT-001',
    name: 'Engine Parts',
    type: 'Spare Part',
    description: 'Engine components and spare parts',
    itemCount: 45,
    color: '#3B82F6',
    status: 'Active',
  },
  {
    id: 2,
    code: 'CAT-002',
    name: 'Safety Equipment',
    type: 'Safety',
    description: 'Personal protective equipment and safety gear',
    itemCount: 32,
    color: '#EF4444',
    status: 'Active',
  },
  {
    id: 3,
    code: 'CAT-003',
    name: 'Electronic Equipment',
    type: 'Equipment',
    description: 'Navigation and communication devices',
    itemCount: 18,
    color: '#8B5CF6',
    status: 'Active',
  },
  {
    id: 4,
    code: 'CAT-004',
    name: 'Lubricants & Oils',
    type: 'Consumable',
    description: 'Engine oils, hydraulic fluids, and lubricants',
    itemCount: 28,
    color: '#F59E0B',
    status: 'Active',
  },
  {
    id: 5,
    code: 'CAT-005',
    name: 'Deck Equipment',
    type: 'Equipment',
    description: 'Anchors, chains, and deck machinery',
    itemCount: 15,
    color: '#10B981',
    status: 'Active',
  },
  {
    id: 6,
    code: 'CAT-006',
    name: 'Electrical Components',
    type: 'Spare Part',
    description: 'Electrical parts and components',
    itemCount: 52,
    color: '#F59E0B',
    status: 'Active',
  },
  {
    id: 7,
    code: 'CAT-007',
    name: 'Fire Fighting',
    type: 'Safety',
    description: 'Fire extinguishers and fire fighting equipment',
    itemCount: 12,
    color: '#DC2626',
    status: 'Active',
  },
  {
    id: 8,
    code: 'CAT-008',
    name: 'Paints & Coatings',
    type: 'Consumable',
    description: 'Marine paints, coatings, and sealants',
    itemCount: 22,
    color: '#06B6D4',
    status: 'Active',
  },
])

const filteredCategories = computed(() => {
  let result = categories.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (category) =>
        category.code.toLowerCase().includes(query) ||
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query),
    )
  }

  if (filterType.value) {
    result = result.filter(
      (category) => category.type.toLowerCase() === filterType.value.toLowerCase(),
    )
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredCategories.value.length / itemsPerPage))

const getTypeColor = (type) => {
  const colors = {
    Consumable: 'bg-orange-100 text-orange-800',
    'Spare Part': 'bg-blue-100 text-blue-800',
    Equipment: 'bg-purple-100 text-purple-800',
    Safety: 'bg-red-100 text-red-800',
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

const getStatusColor = (status) => {
  const colors = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const openAddDialog = () => {
  console.log('Open add category dialog')
}

const editCategory = (category) => {
  console.log('Edit category:', category)
}

const viewCategory = (category) => {
  console.log('View category:', category)
}

const deleteCategory = (category) => {
  console.log('Delete category:', category)
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
