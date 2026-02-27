<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Vendors</h1>
        <p class="text-gray-600 mt-1">Manage your vendor partners</p>
      </div>
      <button
        @click="openAddDialog"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus :size="20" />
        <span>Add Vendor</span>
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
              placeholder="Search vendors..."
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
          <option value="pending">Pending</option>
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
                Vendor Code
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Company Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Contact Person
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Phone
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Rating
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
              v-for="vendor in filteredVendors"
              :key="vendor.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ vendor.code }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ vendor.companyName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ vendor.contactPerson }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ vendor.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ vendor.phone }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div class="flex items-center gap-1">
                  <Star
                    v-for="n in 5"
                    :key="n"
                    :size="14"
                    :class="
                      n <= vendor.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    "
                  />
                  <span class="ml-1 text-xs">{{ vendor.rating }}/5</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getStatusColor(vendor.status)"
                >
                  {{ vendor.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <button
                    @click="editVendor(vendor)"
                    class="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit :size="16" />
                  </button>
                  <button
                    @click="viewVendor(vendor)"
                    class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    title="View"
                  >
                    <Eye :size="16" />
                  </button>
                  <button
                    @click="deleteVendor(vendor)"
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
          {{ Math.min(currentPage * itemsPerPage, filteredVendors.length) }} of
          {{ filteredVendors.length }} results
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
import { Plus, Search, Edit, Eye, Trash2, Star } from 'lucide-vue-next'

const searchQuery = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Mock data
const vendors = ref([
  {
    id: 1,
    code: 'VND-001',
    companyName: 'Marine Supply Co.',
    contactPerson: 'John Smith',
    email: 'john@marinesupply.com',
    phone: '+1-555-0101',
    rating: 4.5,
    status: 'Active',
  },
  {
    id: 2,
    code: 'VND-002',
    companyName: 'Ocean Equipment Ltd.',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@oceanequip.com',
    phone: '+1-555-0102',
    rating: 5,
    status: 'Active',
  },
  {
    id: 3,
    code: 'VND-003',
    companyName: 'Ship Parts International',
    contactPerson: 'Mike Davis',
    email: 'mike@shipparts.com',
    phone: '+1-555-0103',
    rating: 4,
    status: 'Active',
  },
  {
    id: 4,
    code: 'VND-004',
    companyName: 'Nautical Solutions',
    contactPerson: 'Emma Wilson',
    email: 'emma@nautical.com',
    phone: '+1-555-0104',
    rating: 3.5,
    status: 'Pending',
  },
  {
    id: 5,
    code: 'VND-005',
    companyName: 'Maritime Electronics',
    contactPerson: 'David Brown',
    email: 'david@maritime.com',
    phone: '+1-555-0105',
    rating: 4.5,
    status: 'Active',
  },
  {
    id: 6,
    code: 'VND-006',
    companyName: 'Vessel Services Inc.',
    contactPerson: 'Lisa Anderson',
    email: 'lisa@vesselservices.com',
    phone: '+1-555-0106',
    rating: 4,
    status: 'Inactive',
  },
])

const filteredVendors = computed(() => {
  let result = vendors.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (vendor) =>
        vendor.code.toLowerCase().includes(query) ||
        vendor.companyName.toLowerCase().includes(query) ||
        vendor.contactPerson.toLowerCase().includes(query) ||
        vendor.email.toLowerCase().includes(query),
    )
  }

  if (filterStatus.value) {
    result = result.filter(
      (vendor) => vendor.status.toLowerCase() === filterStatus.value.toLowerCase(),
    )
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredVendors.value.length / itemsPerPage))

const getStatusColor = (status) => {
  const colors = {
    Active: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Inactive: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const openAddDialog = () => {
  console.log('Open add vendor dialog')
}

const editVendor = (vendor) => {
  console.log('Edit vendor:', vendor)
}

const viewVendor = (vendor) => {
  console.log('View vendor:', vendor)
}

const deleteVendor = (vendor) => {
  console.log('Delete vendor:', vendor)
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
