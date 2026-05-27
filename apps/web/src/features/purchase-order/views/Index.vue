<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Purchase Order</h1>
        <p class="text-gray-500 mt-1 text-sm">Kelola Purchase Order dari MOC yang telah diselesaikan.</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <ShoppingCart :size="22" class="text-indigo-600" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">Total PO</p>
          <p class="text-2xl font-black text-gray-900">{{ stats.total }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-amber-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <Clock :size="22" class="text-amber-600" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">Pending Approval</p>
          <p class="text-2xl font-black text-amber-600">{{ stats.pending }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-emerald-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <CheckCircle2 :size="22" class="text-emerald-600" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">Approved</p>
          <p class="text-2xl font-black text-emerald-600">{{ stats.approved }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-sky-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
          <Zap :size="22" class="text-sky-600" />
        </div>
        <div>
          <p class="text-xs text-gray-400 font-medium">Auto Approved</p>
          <p class="text-2xl font-black text-sky-600">{{ stats.autoApproved }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div class="flex-1">
        <SearchFilter v-model="searchQuery" placeholder="Cari PO (nomor, vendor, item)..." />
      </div>
      <select
        v-model="statusFilter"
        class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[160px]"
      >
        <option value="">Semua Status</option>
        <option value="Pending Approval">Pending Approval</option>
        <option value="Auto Approved">Auto Approved</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <DataTable
        :columns="columns"
        :data="pos"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :pagination="pagination"
        @update:current-page="currentPage = $event"
        @row-click="openDetail"
        :is-loading="isLoading"
      >
        <template #cell-poNumber="{ value }">
          <span class="font-mono font-semibold text-indigo-700 text-sm">{{ value }}</span>
        </template>

        <template #cell-mocRef="{ row }">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-semibold text-gray-700">{{ row.moc?.vesselRequest?.requestCode || '-' }}</span>
            <span class="text-[11px] text-gray-400">{{ row.moc?.vesselRequest?.vessel?.name || '-' }}</span>
          </div>
        </template>

        <template #cell-vendor="{ row }">
          <span class="font-medium text-gray-800">{{ row.vendor?.name || '-' }}</span>
        </template>

        <template #cell-item="{ row }">
          <div class="flex flex-col gap-0.5">
            <span class="font-medium text-gray-800">{{ row.vesselRequestItem?.item?.name || '-' }}</span>
            <span class="text-[11px] text-gray-400">{{ row.vesselRequestItem?.item?.itemCode || '' }}</span>
          </div>
        </template>

        <template #cell-qty="{ row }">
          <span class="text-gray-800 font-medium">{{ row.qty }}</span>
        </template>

        <template #cell-unitPrice="{ row }">
          <span class="text-gray-700 text-sm">Rp {{ formatNumber(row.unitPrice) }}</span>
        </template>

        <template #cell-totalAmount="{ row }">
          <span class="font-bold text-gray-900">Rp {{ formatNumber(row.totalAmount) }}</span>
        </template>

        <template #cell-status="{ value }">
          <span
            class="px-2.5 py-1 rounded-full text-xs font-semibold border"
            :class="statusClass(value)"
          >
            {{ value }}
          </span>
        </template>

        <template #cell-pdf="{ row }">
          <button
            @click.stop="downloadPDF(row)"
            class="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
            :disabled="downloadingPoId === row.id"
            title="Download PDF"
          >
            <Loader2 v-if="downloadingPoId === row.id" class="w-4 h-4 animate-spin text-indigo-600" />
            <FileText v-else :size="15" />
          </button>
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
            <template v-if="isManager && row.status === 'Pending Approval'">
              <button
                @click.stop="handleApprove(row)"
                class="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Approve"
              >
                <CheckCircle2 :size="15" />
              </button>
              <button
                @click.stop="openReject(row)"
                class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Reject"
              >
                <XCircle :size="15" />
              </button>
            </template>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create PO Modal (opened from MOC redirect ?moc_id=X) -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="isCreateOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeCreate">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeCreate" />
          <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShoppingCart :size="18" class="text-white" />
                </div>
                <div>
                  <h2 class="text-white font-bold text-lg leading-tight">Buat Purchase Order</h2>
                  <p class="text-indigo-200 text-xs">Dari MOC #{{ poForm.mocId }}</p>
                </div>
              </div>
              <button @click="closeCreate" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                <X :size="16" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-4">
              <!-- Summary from MOC -->
              <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-400">Request Code</span>
                  <span class="font-semibold text-slate-800">{{ mocPreview.requestCode || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Vessel</span>
                  <span class="font-semibold text-slate-800">{{ mocPreview.vessel || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Item</span>
                  <span class="font-semibold text-slate-800">{{ mocPreview.item || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Selected Vendor</span>
                  <span class="font-semibold text-emerald-700">{{ mocPreview.vendor || '-' }}</span>
                </div>
              </div>

              <!-- Editable Fields -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">Unit Price (IDR) *</label>
                  <input
                    v-model.number="poForm.unitPrice"
                    type="number" min="1"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                  <p v-if="poForm.unitPrice" class="text-[10px] text-gray-400 mt-0.5">Rp {{ formatNumber(poForm.unitPrice) }}</p>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 mb-1">Qty *</label>
                  <input
                    v-model.number="poForm.qty"
                    type="number" min="1"
                    class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <!-- Total Preview -->
              <div v-if="poForm.unitPrice && poForm.qty" class="flex justify-between items-center bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
                <span class="text-sm font-semibold text-indigo-700">Total Amount</span>
                <span class="text-lg font-black text-indigo-700">Rp {{ formatNumber(poForm.unitPrice * poForm.qty) }}</span>
              </div>

              <!-- Threshold Info -->
              <div v-if="mocPreview.poThreshold > 0" class="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 flex items-start gap-2">
                <Info :size="13" class="shrink-0 mt-0.5 text-slate-400" />
                <span>
                  Threshold approval item ini: <strong>Rp {{ formatNumber(mocPreview.poThreshold) }}</strong>.
                  {{ (poForm.unitPrice * poForm.qty) >= mocPreview.poThreshold ? 'Total melebihi threshold → Pending Approval (manager).' : 'Total di bawah threshold → Auto Approved.' }}
                </span>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Catatan (opsional)</label>
                <textarea
                  v-model="poForm.notes"
                  rows="2"
                  class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-100 bg-slate-50/50 flex justify-end gap-3">
              <button @click="closeCreate" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button
                @click="submitCreatePO"
                :disabled="isSaving"
                class="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <span v-if="isSaving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <ShoppingCart v-else :size="14" />
                Buat PO
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Detail Dialog -->
    <FormPO
      :is-open="isDetailOpen"
      :po="selectedPO"
      @close="closeDetail"
      @action-completed="fetchPOs"
    />

    <!-- Reject Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="rejectTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="rejectTarget = null">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="rejectTarget = null" />
          <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle :size="18" class="text-red-500" />
              </div>
              <div>
                <h3 class="font-bold text-gray-900">Tolak Purchase Order</h3>
                <p class="text-xs text-gray-400">{{ rejectTarget.poNumber }}</p>
              </div>
            </div>
            <div class="p-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Alasan Penolakan *</label>
              <textarea
                v-model="rejectReason"
                rows="3"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Masukkan alasan penolakan..."
              />
            </div>
            <div class="px-6 py-4 border-t border-gray-100 bg-slate-50/50 flex justify-end gap-3">
              <button @click="rejectTarget = null" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button @click="submitReject" :disabled="isSaving || !rejectReason.trim()" class="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ShoppingCart, Clock, CheckCircle2, Zap, Eye, XCircle, X, Info, FileText, Loader2
} from 'lucide-vue-next'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import FormPO from '../component/FormPO.vue'
import { usePurchaseOrderStore } from '../store.js'
import useProfileStore from '@/features/profile/store.js'
import { showSuccess, showError } from '@/services/notification.js'
import { http } from '@/services/http'

const route = useRoute()
const router = useRouter()
const poStore = usePurchaseOrderStore()
const profileStore = useProfileStore()

// ── State ──────────────────────────────────────────────────────────
const pos = ref([])
const pagination = ref(null)
const isLoading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const isCreateOpen = ref(false)
const isSaving = ref(false)
const isDetailOpen = ref(false)
const selectedPO = ref(null)
const downloadingPoId = ref(null)
const rejectTarget = ref(null)
const rejectReason = ref('')

const poForm = ref({
  mocId: null,
  vendorId: null,
  vesselRequestItemId: null,
  unitPrice: 0,
  qty: 0,
  notes: '',
})

const mocPreview = ref({
  requestCode: '',
  vessel: '',
  item: '',
  vendor: '',
  poThreshold: 0,
})

// ── Computed ────────────────────────────────────────────────────────
const isManager = computed(() => profileStore.profile?.type === 'Manager')

const stats = computed(() => ({
  total: pos.value.length,
  pending: pos.value.filter((p) => p.status === 'Pending Approval').length,
  approved: pos.value.filter((p) => p.status === 'Approved').length,
  autoApproved: pos.value.filter((p) => p.status === 'Auto Approved').length,
}))

// ── Columns ─────────────────────────────────────────────────────────
const columns = [
  { key: 'poNumber', label: 'Nomor PO' },
  { key: 'mocRef', label: 'Referensi MOC' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'item', label: 'Item' },
  { key: 'qty', label: 'Qty' },
  { key: 'unitPrice', label: 'Unit Price' },
  { key: 'totalAmount', label: 'Total' },
  { key: 'status', label: 'Status' },
  { key: 'pdf', label: 'PDF', cellClass: 'text-center' },
  { key: 'actions', label: 'Aksi' },
]

// ── Helpers ──────────────────────────────────────────────────────────
const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return Number(num).toLocaleString('id-ID')
}

const statusClass = (status) => ({
  'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
  'Auto Approved':    'bg-sky-50 text-sky-700 border-sky-200',
  'Approved':         'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Rejected':         'bg-red-50 text-red-700 border-red-200',
}[status] || 'bg-gray-50 text-gray-600 border-gray-200')

// ── Data loading ──────────────────────────────────────────────────────
const fetchPOs = async () => {
  isLoading.value = true
  try {
    await poStore.fetchPOs(currentPage.value, itemsPerPage, searchQuery.value, statusFilter.value)
    pos.value = poStore.pos || []
    pagination.value = poStore.pagination
  } finally {
    isLoading.value = false
  }
}


// ── MOC redirect handler ──────────────────────────────────────────────
const loadMocForPO = async (mocId) => {
  try {
    const { data } = await http.get(`/moc/${mocId}`)
    const moc = data.moc
    if (!moc) return

    const selectedVendor = moc.selectedVendor || moc.mocVendors?.find((v) => v.isSelected)
    const vendorObj = selectedVendor?.vendor || selectedVendor

    // Load threshold from vessel-item-standard for this item
    let poThreshold = 0
    const itemId = moc.vesselRequestItem?.item?.id
    if (itemId) {
      try {
        const { data: visData } = await http.post('/settings/vessel-item-standards/list', { page: 1, limit: 100 })
        const standard = visData.items?.find((s) => s.itemId === itemId || s.item?.id === itemId)
        poThreshold = standard?.poThreshold ? Number(standard.poThreshold) : 0
      } catch {
        poThreshold = 0
      }
    }

    poForm.value = {
      mocId: moc.id,
      vendorId: selectedVendor?.vendorId || selectedVendor?.id || null,
      vesselRequestItemId: moc.vesselRequestItemId,
      unitPrice: selectedVendor?.unitPrice || 0,
      qty: moc.vesselRequestItem?.qtyApproved || moc.vesselRequestItem?.qtyRequested || 0,
      notes: '',
    }

    mocPreview.value = {
      requestCode: moc.vesselRequest?.requestCode || '-',
      vessel: moc.vesselRequest?.vessel?.name || '-',
      item: moc.vesselRequestItem?.item?.name || '-',
      vendor: vendorObj?.name || '-',
      poThreshold,
    }

    isCreateOpen.value = true
  } catch (err) {
    showError('Gagal memuat data MOC.')
  }
}

// ── Actions ────────────────────────────────────────────────────────────
const openDetail = async (row) => {
  try {
    isLoading.value = true
    await poStore.fetchPOById(row.id)
    selectedPO.value = poStore.currentPO
    isDetailOpen.value = true
  } catch (err) {
    showError('Gagal memuat detail Purchase Order.')
  } finally {
    isLoading.value = false
  }
}

const closeDetail = () => {
  isDetailOpen.value = false
  selectedPO.value = null
}

const downloadPDF = async (row) => {
  if (downloadingPoId.value !== null) return
  downloadingPoId.value = row.id
  try {
    const blob = await poStore.downloadPdf(row.id)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `PurchaseOrder-${row.poNumber}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    showSuccess('PDF downloaded successfully')
  } catch (error) {
    showError(error.message || 'Failed to download PDF')
  } finally {
    downloadingPoId.value = null
  }
}

const closeCreate = () => {
  isCreateOpen.value = false
  router.replace({ query: {} })
}

const submitCreatePO = async () => {
  if (!poForm.value.unitPrice || poForm.value.unitPrice <= 0) {
    showError('Unit price harus lebih dari 0')
    return
  }
  if (!poForm.value.qty || poForm.value.qty <= 0) {
    showError('Qty harus lebih dari 0')
    return
  }
  isSaving.value = true
  try {
    await poStore.createPO({
      mocId: poForm.value.mocId,
      vendorId: poForm.value.vendorId,
      vesselRequestItemId: poForm.value.vesselRequestItemId,
      unitPrice: poForm.value.unitPrice,
      qty: poForm.value.qty,
      notes: poForm.value.notes || null,
    })
    showSuccess('Purchase Order berhasil dibuat!')
    closeCreate()
    await fetchPOs()
  } catch (err) {
    showError(poStore.error || err?.message || 'Gagal membuat Purchase Order.')
  } finally {
    isSaving.value = false
  }
}

const handleApprove = async (row) => {
  try {
    await poStore.approvePO(row.id)
    showSuccess(`PO ${row.poNumber} berhasil di-approve.`)
    await fetchPOs()
  } catch (err) {
    showError(poStore.error || 'Gagal approve PO.')
  }
}

const openReject = (row) => {
  rejectTarget.value = row
  rejectReason.value = ''
}

const submitReject = async () => {
  if (!rejectReason.value.trim()) return
  isSaving.value = true
  try {
    await poStore.rejectPO(rejectTarget.value.id, rejectReason.value)
    showSuccess(`PO ${rejectTarget.value.poNumber} ditolak.`)
    rejectTarget.value = null
    await fetchPOs()
  } catch (err) {
    showError(poStore.error || 'Gagal menolak PO.')
  } finally {
    isSaving.value = false
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchPOs(), profileStore.fetchProfile()])

  // If redirected from MOC, PO was already auto-created — just clean the URL
  const mocId = route.query.moc_id
  if (mocId) {
    router.replace({ query: {} })
  }
})

let searchTimeout = null
watch([searchQuery, statusFilter], () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchPOs()
  }, 500)
})

watch(currentPage, () => fetchPOs())
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
