<template>
  <FormDialog
    :is-open="isOpen"
    title="Purchase Order Details"
    :show-footer="false"
    size="xl"
    @close="handleClose"
  >
    <template #default>
      <div v-if="po" class="space-y-6">
        <!-- PO Header Card -->
        <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-100">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 class="text-2xl font-bold text-gray-900 tracking-tight">{{ po.poNumber }}</h3>
              <p class="text-sm text-gray-600 mt-1">
                Dibuat pada {{ formatDate(po.createdAt) }} oleh <span class="font-medium text-gray-800">{{ po.createdByUser?.fullName || '-' }}</span>
              </p>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
              <button
                @click="downloadPDF"
                class="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg shadow-sm hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isDownloading"
                title="Download PDF"
              >
                <Loader2 v-if="isDownloading" class="w-4 h-4 animate-spin" />
                <FileText v-else class="w-4 h-4" />
                PDF
              </button>
              <span
                class="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm border"
                :class="statusClass(po.status)"
              >
                {{ po.status }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100">
            <!-- Vessel Info -->
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Ship class="w-5 h-5 text-indigo-600" />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Vessel</label>
                <p class="text-base font-bold text-gray-900">{{ po.moc?.vesselRequest?.vessel?.name || '-' }}</p>
                <p class="text-xs text-gray-500">MOC Ref: {{ po.moc?.vesselRequest?.requestCode || '-' }}</p>
              </div>
            </div>

            <!-- Vendor Info -->
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Building2 class="w-5 h-5 text-indigo-600" />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Vendor</label>
                <p class="text-base font-bold text-gray-900">{{ po.vendor?.name || '-' }}</p>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="po.notes" class="mt-6 pt-6 border-t border-indigo-100">
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Catatan</label>
            <p class="text-sm text-gray-700 leading-relaxed bg-white/60 p-3 rounded-lg border border-slate-100">
              {{ po.notes }}
            </p>
          </div>

          <!-- Rejection Reason -->
          <div v-if="po.status === 'Rejected' && po.rejectionReason" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p class="font-bold text-xs uppercase tracking-wider mb-1">Alasan Penolakan</p>
            <p class="text-sm">{{ po.rejectionReason }}</p>
          </div>

          <!-- Approved/Processed by -->
          <div v-if="po.approvedByUser" class="mt-4 pt-4 border-t border-indigo-100 flex justify-between items-center text-xs text-gray-500">
            <span>Diproses oleh: <strong class="text-gray-700">{{ po.approvedByUser.fullName }}</strong></span>
            <span v-if="po.approvedAt">pada: <strong class="text-gray-700">{{ formatDate(po.approvedAt) }}</strong></span>
          </div>
        </div>

        <!-- PO Item Details Table -->
        <div>
          <h3 class="text-lg font-bold text-gray-900 mb-4">Item Detail</h3>
          
          <DataTable
            :columns="itemColumns"
            :data="[po]"
            :show-pagination="false"
            :clickable="false"
            row-key="id"
          >
            <!-- Item Column -->
            <template #cell-item="{ row }">
              <div class="flex items-center gap-2">
                <Package class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p class="text-sm font-semibold text-gray-900">{{ row.vesselRequestItem?.item?.name || 'Unknown Item' }}</p>
                  <p class="text-xs text-gray-500">{{ row.vesselRequestItem?.item?.itemCode || '-' }}</p>
                </div>
              </div>
            </template>

            <!-- Qty Column -->
            <template #cell-qty="{ row }">
              <div class="flex items-center gap-1 font-semibold text-gray-900">
                <span>{{ row.qty }}</span>
                <span class="text-xs font-normal text-gray-500">{{ row.vesselRequestItem?.unit || 'Pcs' }}</span>
              </div>
            </template>

            <!-- Unit Price Column -->
            <template #cell-unitPrice="{ row }">
              <span class="text-gray-700 font-medium">Rp {{ formatNumber(row.unitPrice) }}</span>
            </template>

            <!-- Total Amount Column -->
            <template #cell-totalAmount="{ row }">
              <span class="text-indigo-600 font-bold text-base">Rp {{ formatNumber(row.totalAmount) }}</span>
            </template>
          </DataTable>
        </div>

        <!-- Manager Actions -->
        <div v-if="canReview" class="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-950 border-l-4 border-l-indigo-500">
            Manager Actions
          </div>
          
          <div class="p-4 space-y-4">
            <div v-if="isRejecting" class="space-y-3">
              <label class="block text-sm font-semibold text-gray-700">Alasan Penolakan <span class="text-red-500">*</span></label>
              <textarea 
                v-model="rejectReason" 
                rows="3" 
                class="block w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-red-500 focus:border-red-500 focus:outline-none"
                placeholder="Masukkan alasan penolakan..."
              ></textarea>
              <div class="flex gap-2 justify-end pt-2">
                <button 
                  @click="isRejecting = false; rejectReason = ''" 
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  :disabled="isSubmitting"
                >
                  Batal
                </button>
                <button 
                  @click="submitReview('Reject')" 
                  class="px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 cursor-pointer disabled:opacity-50 transition-colors"
                  :disabled="isSubmitting || !rejectReason.trim()"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </div>
            
            <div v-else class="flex justify-end gap-3">
              <button 
                @click="isRejecting = true" 
                class="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-red-600 bg-white hover:bg-red-50 cursor-pointer transition-colors"
                :disabled="isSubmitting"
              >
                Reject PO
              </button>
              <button 
                @click="submitReview('Approve')" 
                class="px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center min-w-[100px] cursor-pointer disabled:opacity-50 transition-colors"
                :disabled="isSubmitting"
              >
                <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
                Approve PO
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Loading State -->
      <div v-else class="text-center py-16">
        <Loader2 class="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
        <p class="text-lg font-medium text-gray-700">Memuat detail Purchase Order...</p>
        <p class="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
      </div>
    </template>
  </FormDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Ship, Building2, Package, Loader2, FileText } from 'lucide-vue-next'
import FormDialog from '@/components/base/form/Form.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import { usePurchaseOrderStore } from '../store'
import useProfileStore from '@/features/profile/store'
import { showSuccess, showError } from '@/services/notification'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  po: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'action-completed'])
const poStore = usePurchaseOrderStore()
const profileStore = useProfileStore()

const isRejecting = ref(false)
const rejectReason = ref('')
const isSubmitting = ref(false)
const isDownloading = ref(false)

const isManager = computed(() => profileStore.profile?.type === 'Manager')

const canReview = computed(() => {
  return props.po && props.po.status === 'Pending Approval' && isManager.value
})

watch(() => props.po, () => {
  isRejecting.value = false
  rejectReason.value = ''
}, { immediate: true })

const downloadPDF = async () => {
  if (isDownloading.value) return
  isDownloading.value = true
  try {
    const blob = await poStore.downloadPdf(props.po.id)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `PurchaseOrder-${props.po.poNumber}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    showSuccess('PDF downloaded successfully')
  } catch (error) {
    showError(error.message || 'Failed to download PDF')
  } finally {
    isDownloading.value = false
  }
}

const submitReview = async (action) => {
  isSubmitting.value = true
  try {
    if (action === 'Approve') {
      await poStore.approvePO(props.po.id)
      showSuccess(`PO ${props.po.poNumber} berhasil di-approve.`)
    } else if (action === 'Reject') {
      await poStore.rejectPO(props.po.id, rejectReason.value)
      showSuccess(`PO ${props.po.poNumber} ditolak.`)
    }
    emit('action-completed')
    handleClose()
  } catch (error) {
    showError(error.message || `Gagal memproses PO`)
  } finally {
    isSubmitting.value = false
  }
}

const itemColumns = [
  { key: 'item', label: 'Nama & Kode Item' },
  { key: 'qty', label: 'Qty' },
  { key: 'unitPrice', label: 'Unit Price' },
  { key: 'totalAmount', label: 'Total Amount' },
]

const handleClose = () => {
  emit('close')
}

const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return Number(num).toLocaleString('id-ID')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const statusClass = (status) => ({
  'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
  'Auto Approved':    'bg-sky-50 text-sky-700 border-sky-200',
  'Approved':         'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Rejected':         'bg-red-50 text-red-700 border-red-200',
}[status] || 'bg-gray-50 text-gray-600 border-gray-200')
</script>
