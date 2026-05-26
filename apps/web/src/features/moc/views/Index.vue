<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Matrix of Comparison (MOC)</h1>
        <p class="text-gray-500 mt-1 text-sm">Compare vendors, analyze pricing, qty availability, warranty & discounts using SAW algorithm.</p>
      </div>
      <button
        @click="openCreateWizard"
        class="flex items-center gap-2 px-4 py-2.5 cursor-pointer bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-200"
      >
        <Plus :size="20" />
        <span>Create MOC</span>
      </button>
    </div>

    <!-- Filters and Search -->
    <div class="flex flex-col sm:flex-row gap-4 w-full items-stretch sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div class="w-full">
        <SearchFilter v-model="searchQuery" placeholder="Search MOC drafts (Request, Vessel, Item)..." />
      </div>
      <!-- <div class="flex gap-2">
        <select
          v-model="statusFilter"
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Completed">Completed</option>
        </select>
      </div> -->
    </div>

    <!-- MOC Drafts Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <DataTable
        :columns="columns"
        :data="mocs"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :pagination="pagination"
        @update:current-page="currentPage = $event"
        :is-loading="isLoading"
        @row-click="openEditWizard"
        class="cursor-pointer"
      >
        <template #cell-requestCode="{ row }">
          <span class="font-medium text-gray-900">{{ row.vesselRequest?.requestCode || '-' }}</span>
        </template>

        <template #cell-vessel="{ row }">
          <span class="text-gray-900">{{ row.vesselRequest?.vessel?.name || '-' }}</span>
        </template>

        <template #cell-item="{ row }">
          <div class="flex flex-col">
            <span class="font-medium text-gray-900">{{ row.vesselRequestItem?.item?.name || '-' }}</span>
            <span class="text-xs text-gray-400">Qty: {{ row.vesselRequestItem?.qtyApproved }} {{ row.vesselRequestItem?.unit }}</span>
          </div>
        </template>

        <template #cell-vendorsCount="{ row }">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            <Users :size="12" />
            {{ row.mocVendors?.length || 0 }} Vendors
          </span>
        </template>

        <template #cell-winner="{ row }">
          <div v-if="getWinner(row)" class="flex flex-col gap-0.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle :size="12" />
              {{ getWinner(row).vendor?.name }}
            </span>
            <span v-if="getWinner(row).sawScore" class="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600">
              <BarChart2 :size="10" />
              SAW: {{ (parseFloat(getWinner(row).sawScore) * 100).toFixed(2) }}%
            </span>
          </div>
          <span v-else class="text-xs text-gray-400 italic">Pending SAW</span>
        </template>

        <template #cell-status="{ value }">
          <span
            class="px-2.5 py-1 text-xs font-semibold rounded-full border"
            :class="value === 'Completed' ? 'bg-purple-50 text-purple-700 border-purple-200' : value === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
          >
            {{ value }}
          </span>
        </template>

        <template #cell-poStatus="{ row }">
          <div v-if="row.purchaseOrders && row.purchaseOrders.length > 0" class="flex flex-col gap-0.5">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShoppingCart :size="10" />
              {{ row.purchaseOrders[0].poNumber }}
            </span>
            <span
              class="text-[10px] font-semibold"
              :class="{
                'text-amber-600': row.purchaseOrders[0].status === 'Pending Approval',
                'text-sky-600': row.purchaseOrders[0].status === 'Auto Approved',
                'text-emerald-600': row.purchaseOrders[0].status === 'Approved',
                'text-red-500': row.purchaseOrders[0].status === 'Rejected',
              }"
            >{{ row.purchaseOrders[0].status }}</span>
          </div>
          <span v-else class="text-xs text-gray-400 italic">Belum ada PO</span>
        </template>

        <template #cell-updatedAt="{ value }">
          <span class="text-xs text-gray-500">{{ formatDate(value) }}</span>
        </template>

        <!-- <template #cell-actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              @click.stop="confirmDeleteMoc(row)"
              class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              title="Delete MOC"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </template> -->
      </DataTable>
    </div>

    <FormMoc
      :is-open="isWizardOpen"
      :is-edit-mode="isEditMode"
      :moc-id="selectedMocId"
      @close="closeWizard"
      @saved="handleMocSaved"
      @go-to-po="handleGoToPO"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Trash2, Users, CheckCircle, Edit, Scale, ShoppingCart, BarChart2 } from 'lucide-vue-next'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import FormMoc from '../components/FormMoc.vue'
import { useMocStore } from '../store.js'
import { useRequestStore } from '../../request/store.js'
import { useVendorStore } from '../../master-data/vendors/store.js'
import { showInfo, showSuccess, showError } from '@/services/notification.js'
import Swal from 'sweetalert2'

const router = useRouter()

// Stores
const mocStore = useMocStore()
const requestStore = useRequestStore()
const vendorStore = useVendorStore()

// State
const mocs = ref([])
const pagination = ref(null)
const isLoading = ref(false)

const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Wizard modal states
const isWizardOpen = ref(false)
const isEditMode = ref(false)
const selectedMocId = ref(null)

// Columns for MOC Table
const columns = [
  { key: 'requestCode', label: 'Request Code', cellClass: 'font-medium' },
  { key: 'vessel', label: 'Vessel' },
  { key: 'item', label: 'Item Details' },
  { key: 'vendorsCount', label: 'Vendors' },
  { key: 'winner', label: 'Selected Option' },
  { key: 'poStatus', label: 'PO' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Last Updated' },
]

// Fetch MOC drafts
const fetchMocs = async () => {
  isLoading.value = true
  try {
    await mocStore.fetchMocs(currentPage.value, itemsPerPage, searchQuery.value, statusFilter.value)
    mocs.value = (mocStore.mocs || []).filter(Boolean)
    pagination.value = mocStore.pagination

    if (mocStore.error) {
      showInfo(`No MOC drafts found`, 'No Results')
      mocStore.clearError()
    }
  } finally {
    isLoading.value = false
  }
}

// Format numbers to currency display
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\n))/g, ',')
}

// Format date strings
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get the winning vendor comparison detail
const getWinner = (mocRow) => {
  return mocRow.mocVendors?.find(v => v.isSelected) || null
}

// Open modal for creating MOC
const openCreateWizard = async () => {
  isEditMode.value = false
  selectedMocId.value = null
  isWizardOpen.value = true
}

// Open modal for editing MOC
const openEditWizard = async (mocRow) => {
  isEditMode.value = true
  selectedMocId.value = mocRow.id
  isWizardOpen.value = true
}

const closeWizard = () => {
  isWizardOpen.value = false
  isEditMode.value = false
  selectedMocId.value = null
}

const handleMocSaved = async () => {
  closeWizard()
  await fetchMocs()
}

const handleGoToPO = (mocId) => {
  closeWizard()
  router.push({ path: '/purchase-orders', query: { moc_id: mocId } })
}

// Delete MOC
const confirmDeleteMoc = (mocRow) => {
  Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to delete MOC draft for item ${mocRow.vesselRequestItem?.item?.name || ''}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#ef4444',
    confirmButtonText: 'Yes, delete it!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await mocStore.deleteMoc(mocRow.id)
        showSuccess('MOC draft deleted successfully.')
        await fetchMocs()
      } catch (err) {
        showError('Failed to delete MOC draft.')
      }
    }
  })
}

// Lifecycle and search queries
onMounted(async () => {
  await Promise.all([
    fetchMocs(),
    vendorStore.fetchVendors(1, 1000, '')
  ])
})

let searchTimeout = null
watch([searchQuery, statusFilter], () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchMocs()
  }, 500)
})

watch(currentPage, () => {
  fetchMocs()
})
</script>

<style scoped>
/* Focus borders for aura presets */
select:focus, input:focus, textarea:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}
</style>
