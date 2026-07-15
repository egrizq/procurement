<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Good Receipt</h1>
        <p class="text-gray-500 mt-1 text-sm">Verifikasi penerimaan barang dari Purchase Order yang disetujui.</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
      >
        <Plus :size="16" />
        Buat Good Receipt
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <FileText :size="22" class="text-indigo-600" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">Total Good Receipt</p>
          <p class="text-2xl font-black text-gray-900">{{ stats.total }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-emerald-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <CheckCircle2 :size="22" class="text-emerald-600" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">Accepted (Sesuai)</p>
          <p class="text-2xl font-black text-emerald-600">{{ stats.accepted }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-red-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <XCircle :size="22" class="text-red-500" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">Rejected (Tidak Sesuai)</p>
          <p class="text-2xl font-black text-red-600">{{ stats.rejected }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div class="flex-1">
        <SearchFilter v-model="searchQuery" placeholder="Cari Good Receipt (nomor GR, PO, vendor, item)..." />
      </div>
      <select
        v-model="statusFilter"
        class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[160px]"
      >
        <option value="">Semua Status</option>
        <option value="Accepted">Accepted</option>
        <option value="Rejected">Rejected</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <DataTable
        :columns="columns"
        :data="grs"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :pagination="pagination"
        @update:current-page="currentPage = $event"
        @row-click="openDetail"
        :is-loading="isLoading"
      >
        <template #cell-grNumber="{ value }">
          <span class="font-mono font-semibold text-indigo-700 text-sm">{{ value }}</span>
        </template>

        <template #cell-poNumber="{ row }">
          <span class="font-mono font-semibold text-gray-700 text-sm">{{ row.purchaseOrder?.poNumber || '-' }}</span>
        </template>

        <template #cell-vesselInfo="{ row }">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-semibold text-gray-700">{{ row.purchaseOrder?.moc?.vesselRequest?.requestCode || '-' }}</span>
            <span class="text-[11px] text-gray-400">{{ row.purchaseOrder?.moc?.vesselRequest?.vessel?.name || '-' }}</span>
          </div>
        </template>

        <template #cell-vendor="{ row }">
          <span class="font-medium text-gray-800 text-sm">{{ row.purchaseOrder?.vendor?.name || '-' }}</span>
        </template>

        <template #cell-item="{ row }">
          <div class="flex flex-col gap-0.5">
            <span class="font-medium text-gray-800 text-sm">{{ row.purchaseOrder?.vesselRequestItem?.item?.name || '-' }}</span>
            <span class="text-[11px] text-gray-400">{{ row.purchaseOrder?.vesselRequestItem?.item?.itemCode || '' }}</span>
          </div>
        </template>

        <template #cell-qty="{ row }">
          <span class="text-gray-800 font-medium text-sm">
            {{ row.purchaseOrder?.qty || 0 }} {{ row.purchaseOrder?.vesselRequestItem?.unit || 'Pcs' }}
          </span>
        </template>

        <template #cell-isSameItem="{ value }">
          <span
            class="px-2 py-0.5 rounded text-xs font-semibold"
            :class="value ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'"
          >
            {{ value ? 'Sesuai' : 'Tidak Sesuai' }}
          </span>
        </template>

        <template #cell-status="{ value }">
          <span
            class="px-2.5 py-1 rounded-full text-xs font-semibold border"
            :class="statusClass(value)"
          >
            {{ value }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1.5">
            <button
              @click.stop="openDetail(row)"
              class="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Lihat Detail"
            >
              <Eye :size="15" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create Good Receipt Dialog -->
    <FormGR
      :is-open="isCreateOpen"
      @close="isCreateOpen = false"
      @submit-completed="fetchGoodReceipts"
    />

    <!-- Detail Dialog -->
    <FormDialog
      :is-open="Boolean(detailGR)"
      title="Detail Good Receipt"
      :show-footer="false"
      size="lg"
      @close="detailGR = null"
    >
      <div v-if="detailGR" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="field in detailFields" :key="field.label">
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
            <input :value="field.value" type="text" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
          </div>
        </div>

              <!-- Discrepancy Reason -->
        <div v-if="!detailGR.isSameItem && detailGR.discrepancyReason">
          <label class="block text-sm font-medium text-gray-700 mb-1">Alasan Ketidaksesuaian</label>
          <textarea :value="detailGR.discrepancyReason" rows="3" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"></textarea>
        </div>

              <!-- Attachments Section -->
        <div v-if="detailGR.attachments && detailGR.attachments.length > 0" class="pt-4 border-t border-gray-200 space-y-2">
                <label class="block text-sm font-medium text-gray-700">Media / Dokumen Bukti</label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    v-for="(url, idx) in detailGR.attachments"
                    :key="idx"
                    class="bg-white border border-gray-300 rounded-lg p-2.5 flex items-center gap-2.5"
                  >
                    <img
                      v-if="isImageUrl(url)"
                      :src="getFullUrl(url)"
                      class="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                    />
                    <div v-else class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center shrink-0 border border-slate-100">
                      <FileText class="w-5 h-5" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <a
                        :href="getFullUrl(url)"
                        target="_blank"
                        class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline truncate block"
                      >
                        Lihat File
                      </a>
                      <span class="text-[10px] text-gray-400 block truncate" :title="getFilenameFromUrl(url)">
                        {{ getFilenameFromUrl(url) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
        </div>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-vue-next'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import FormDialog from '@/components/base/form/Form.vue'
import FormGR from '../component/FormGR.vue'
import { useGoodReceiptStore } from '../store'

const grStore = useGoodReceiptStore()

// State
const grs = ref([])
const pagination = ref(null)
const isLoading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const isCreateOpen = ref(false)
const detailGR = ref(null)

// Columns
const columns = [
  { key: 'grNumber', label: 'Nomor GR' },
  { key: 'poNumber', label: 'Referensi PO' },
  { key: 'vesselInfo', label: 'Kapal / Req' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'item', label: 'Item' },
  { key: 'qty', label: 'Qty' },
  { key: 'isSameItem', label: 'Kesesuaian' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Aksi' },
]

// Stats
const stats = computed(() => {
  return {
    total: grs.value.length,
    accepted: grs.value.filter((g) => g.status === 'Accepted').length,
    rejected: grs.value.filter((g) => g.status === 'Rejected').length,
  }
})

// Helpers
const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return Number(num).toLocaleString('id-ID')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const detailFields = computed(() => {
  if (!detailGR.value) return []
  const po = detailGR.value.purchaseOrder
  return [
    { label: 'Nomor Good Receipt', value: detailGR.value.grNumber || '-' },
    { label: 'Status', value: detailGR.value.status || '-' },
    { label: 'Referensi PO', value: po?.poNumber || '-' },
    { label: 'Kapal', value: po?.moc?.vesselRequest?.vessel?.name || '-' },
    { label: 'Request Code', value: po?.moc?.vesselRequest?.requestCode || '-' },
    { label: 'Vendor', value: po?.vendor?.name || '-' },
    { label: 'Item', value: po?.vesselRequestItem?.item?.name || '-' },
    { label: 'Quantity', value: `${po?.qty || 0} ${po?.vesselRequestItem?.unit || 'Pcs'}` },
    { label: 'Harga Satuan', value: `Rp ${formatNumber(po?.unitPrice || 0)}` },
    { label: 'Total Harga', value: `Rp ${formatNumber(po?.totalAmount || 0)}` },
    { label: 'Dicek Oleh', value: detailGR.value.createdByUser?.fullName || '-' },
    { label: 'Tanggal Cek', value: formatDate(detailGR.value.createdAt) },
    { label: 'Kesesuaian Barang', value: detailGR.value.isSameItem ? 'Sesuai' : 'Tidak Sesuai' },
  ]
})

const statusClass = (status) => ({
  Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
}[status] || 'bg-gray-50 text-gray-600 border-gray-200')

const isImageUrl = (url) => {
  if (!url) return false
  return /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url)
}

const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  return `${apiBaseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}

const getFilenameFromUrl = (url) => {
  if (!url) return ''
  const parts = url.split('/')
  const fullFilename = parts[parts.length - 1]
  // Strip unique suffix prefix: uniqueSuffix-filename.ext
  // e.g. 1700000-2384920-my_file.pdf or similar
  const match = fullFilename.match(/^\d+-\d+-(.+)$/)
  if (match) return match[1]
  const matchSimple = fullFilename.match(/^\d+-(.+)$/)
  if (matchSimple) return matchSimple[1]
  return fullFilename
}

// Load Data
const fetchGoodReceipts = async () => {
  isLoading.value = true
  try {
    await grStore.fetchGoodReceipts(currentPage.value, itemsPerPage, searchQuery.value, statusFilter.value)
    grs.value = grStore.grs || []
    pagination.value = grStore.pagination
  } finally {
    isLoading.value = false
  }
}

// Actions
const openCreateModal = () => {
  isCreateOpen.value = true
}

const openDetail = (row) => {
  detailGR.value = row
}

// Lifecycle
onMounted(() => {
  fetchGoodReceipts()
})

// Watchers for filter & page changes
let searchTimeout = null
watch([searchQuery, statusFilter], () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchGoodReceipts()
  }, 500)
})

watch(currentPage, () => {
  fetchGoodReceipts()
})
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
