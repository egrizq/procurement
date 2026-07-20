<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p class="text-gray-600 mt-1">Riwayat aktivitas pengadaan barang</p>
      </div>
      <span class="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
        {{ store.pagination?.total_items ?? 0 }} aktivitas
      </span>
    </div>

    <div class="bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Modul</label>
          <select v-model="filters.module" class="filter-control" @change="applyFilters">
            <option value="">Semua Modul</option>
            <option value="vessel_request">Vessel Request</option>
            <option value="moc">MOC</option>
            <option value="purchase_order">Purchase Order</option>
            <option value="good_receipt">Penerimaan Barang</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Aksi</label>
          <select v-model="filters.action" class="filter-control" @change="applyFilters">
            <option value="">Semua Aksi</option>
            <option v-for="action in actions" :key="action" :value="action">{{ action }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dari tanggal</label>
          <input v-model="filters.from" type="date" class="filter-control" @change="applyFilters" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sampai tanggal</label>
          <input v-model="filters.to" type="date" class="filter-control" @change="applyFilters" />
        </div>
        <button class="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors" @click="resetFilters">
          <RotateCcw :size="16" />
          Reset
        </button>
      </div>
    </div>

    <div v-if="store.loading" class="bg-white rounded-lg shadow p-10 text-center text-gray-500">
      Memuat audit log...
    </div>

    <div v-else-if="store.error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {{ store.error }}
    </div>

    <div v-else-if="store.logs.length === 0" class="bg-white rounded-lg shadow p-10 text-center text-gray-500">
      Tidak ada data audit log ditemukan.
    </div>

    <DataTable
      v-else
      :columns="columns"
      :data="store.logs"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :pagination="store.pagination"
      @update:current-page="goToPage"
      @row-click="openDetail"
    >
      <template #cell-createdAt="{ value }">
        <div class="flex flex-col">
          <span class="font-medium text-gray-900">{{ formatDate(value) }}</span>
          <span class="text-xs text-gray-500">{{ formatTime(value) }}</span>
        </div>
      </template>

      <template #cell-user="{ value }">
        <div class="flex flex-col">
          <span class="font-medium text-gray-900">{{ value?.fullName ?? '-' }}</span>
          <span class="text-xs text-gray-500">{{ value?.type ?? '-' }}</span>
        </div>
      </template>

      <template #cell-module="{ value }">
        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {{ moduleLabel(value) }}
        </span>
      </template>

      <template #cell-action="{ value }">
        <span class="px-2 py-1 text-xs font-medium rounded-full" :class="actionClass(value)">
          {{ value }}
        </span>
      </template>

      <template #cell-entityCode="{ row }">
        <code class="text-xs text-gray-700">{{ row.entityCode ?? `#${row.entityId}` }}</code>
      </template>

      <template #cell-description="{ value }">
        <span class="block max-w-xs truncate" :title="value">{{ value ?? '-' }}</span>
      </template>

      <template #cell-ipAddress="{ value }">
        <span class="text-gray-500">{{ value ?? '-' }}</span>
      </template>

      <template #cell-actions="{ row }">
        <button
          class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          title="Lihat detail"
          @click.stop="openDetail(row)"
        >
          <Eye :size="16" />
        </button>
      </template>
    </DataTable>

    <Teleport to="body">
      <div v-if="detailLog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="closeDetail">
        <div class="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Detail Audit Log</h2>
              <p class="text-sm text-gray-500">{{ detailLog.entityCode ?? `Entitas #${detailLog.entityId}` }}</p>
            </div>
            <button class="p-1 text-gray-500 hover:text-gray-800 rounded" @click="closeDetail" aria-label="Tutup detail">
              <X :size="20" />
            </button>
          </div>

          <div class="p-6 space-y-6">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt class="text-gray-500">Waktu</dt><dd class="font-medium text-gray-900">{{ formatDate(detailLog.createdAt) }} {{ formatTime(detailLog.createdAt) }}</dd></div>
              <div><dt class="text-gray-500">Pelaku</dt><dd class="font-medium text-gray-900">{{ detailLog.user?.fullName ?? '-' }} ({{ detailLog.user?.type ?? '-' }})</dd></div>
              <div><dt class="text-gray-500">Modul</dt><dd class="font-medium text-gray-900">{{ moduleLabel(detailLog.module) }}</dd></div>
              <div><dt class="text-gray-500">IP Address</dt><dd class="font-medium text-gray-900">{{ detailLog.ipAddress ?? '-' }}</dd></div>
            </dl>

            <div>
              <h3 class="text-sm font-medium text-gray-700">Deskripsi</h3>
              <p class="mt-1 text-sm text-gray-900">{{ detailLog.description ?? '-' }}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Data Sebelum</h3>
                <pre class="detail-json">{{ formatJson(detailLog.beforeData) }}</pre>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Data Sesudah</h3>
                <pre class="detail-json">{{ formatJson(detailLog.afterData) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Eye, RotateCcw, X } from 'lucide-vue-next'
import DataTable from '@/components/base/data-table/DataTable.vue'
import { useAuditLogStore } from '../store.js'

const store = useAuditLogStore()
const currentPage = ref(1)
const detailLog = ref(null)
const itemsPerPage = 20
const actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'REVIEW', 'SAW_SCORE', 'SAW_WEIGHT_REQUEST', 'SAW_WEIGHT_REVIEW']
const filters = ref({ module: '', action: '', from: '', to: '' })

const columns = [
  { key: 'createdAt', label: 'Waktu' },
  { key: 'user', label: 'Pelaku' },
  { key: 'module', label: 'Modul' },
  { key: 'action', label: 'Aksi' },
  { key: 'description', label: 'Deskripsi' },
  { key: 'actions', label: 'Aksi' },
]

onMounted(() => fetchLogs())

function fetchLogs() {
  store.fetchLogs(currentPage.value)
}

function applyFilters() {
  store.setFilters(filters.value)
  currentPage.value = 1
  fetchLogs()
}

function resetFilters() {
  filters.value = { module: '', action: '', from: '', to: '' }
  store.resetFilters()
  currentPage.value = 1
  fetchLogs()
}

function goToPage(page) {
  currentPage.value = page
  fetchLogs()
}

function openDetail(log) {
  detailLog.value = log
}

function closeDetail() {
  detailLog.value = null
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatJson(value) {
  return value ? JSON.stringify(value, null, 2) : '— Tidak ada data'
}

function moduleLabel(module) {
  return {
    vessel_request: 'Vessel Request',
    moc: 'MOC',
    purchase_order: 'Purchase Order',
    good_receipt: 'Penerimaan Barang',
  }[module] ?? module
}

function actionClass(action) {
  return {
    CREATE: 'bg-emerald-100 text-emerald-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    APPROVE: 'bg-emerald-100 text-emerald-800',
    REJECT: 'bg-red-100 text-red-800',
    REVIEW: 'bg-amber-100 text-amber-800',
    SAW_SCORE: 'bg-purple-100 text-purple-800',
    SAW_WEIGHT_REQUEST: 'bg-purple-100 text-purple-800',
    SAW_WEIGHT_REVIEW: 'bg-amber-100 text-amber-800',
  }[action] ?? 'bg-gray-100 text-gray-800'
}
</script>

<style scoped>
.filter-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  color: #374151;
  background: white;
}

.filter-control:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.detail-json {
  min-height: 7rem;
  max-height: 18rem;
  overflow: auto;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: #374151;
}
</style>
