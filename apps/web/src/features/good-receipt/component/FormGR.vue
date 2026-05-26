<template>
  <FormDialog
    :is-open="isOpen"
    title="Buat Good Receipt baru"
    :loading="loading"
    submit-text="Simpan Good Receipt"
    size="lg"
    @close="handleClose"
    @submit="handleSubmit"
  >
    <template #default>
      <div class="space-y-6">
        <!-- PO Dropdown Selection -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">
            Pilih Purchase Order (PO) <span class="text-red-500">*</span>
          </label>
          <div v-if="isLoadingPOs" class="flex items-center gap-2 text-sm text-gray-500 py-1">
            <Loader2 class="w-4 h-4 animate-spin text-indigo-600" />
            <span>Memuat daftar PO...</span>
          </div>
          <select
            v-else
            v-model="grForm.purchaseOrderId"
            required
            class="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          >
            <option :value="null">-- Pilih Purchase Order --</option>
            <option
              v-for="po in pendingPOs"
              :key="po.id"
              :value="po.id"
            >
              {{ po.poNumber }} - {{ po.vendor?.name || 'No Vendor' }} ({{ po.vesselRequestItem?.item?.name || 'No Item' }})
            </option>
          </select>
          <div
            v-if="!isLoadingPOs && pendingPOs.length === 0"
            class="mt-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg"
          >
            <AlertTriangle class="w-4 h-4 shrink-0" />
            <span>Tidak ada Purchase Order yang telah disetujui (Approved / Auto Approved) yang belum diproses.</span>
          </div>
        </div>

        <!-- Selected PO Details -->
        <div v-if="selectedPO" class="space-y-4">
          <h4 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Detail Purchase Order</h4>
          <div class="bg-gradient-to-r from-indigo-50 to-blue-50/50 rounded-xl p-5 border border-indigo-100 space-y-4">
            <div class="flex justify-between items-start border-b border-indigo-100 pb-3">
              <div>
                <p class="text-lg font-black text-indigo-900 leading-none">{{ selectedPO.poNumber }}</p>
                <p class="text-[11px] text-gray-400 mt-1">Status PO: <strong class="text-emerald-700">{{ selectedPO.status }}</strong></p>
              </div>
              <div class="text-right">
                <span class="text-xs text-gray-400">Total Transaksi</span>
                <p class="text-base font-extrabold text-indigo-950">Rp {{ formatNumber(selectedPO.totalAmount) }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div class="flex items-start gap-2.5">
                <Ship class="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span class="text-xs text-gray-400 block leading-none">Kapal & Request Code</span>
                  <strong class="text-gray-900 block mt-0.5">{{ selectedPO.moc?.vesselRequest?.vessel?.name || '-' }}</strong>
                  <span class="text-xs text-gray-500">{{ selectedPO.moc?.vesselRequest?.requestCode || '-' }}</span>
                </div>
              </div>

              <div class="flex items-start gap-2.5">
                <Building2 class="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span class="text-xs text-gray-400 block leading-none">Vendor</span>
                  <strong class="text-gray-900 block mt-0.5">{{ selectedPO.vendor?.name || '-' }}</strong>
                </div>
              </div>

              <div class="flex items-start gap-2.5">
                <Package class="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span class="text-xs text-gray-400 block leading-none">Item & Kode</span>
                  <strong class="text-gray-900 block mt-0.5">{{ selectedPO.vesselRequestItem?.item?.name || '-' }}</strong>
                  <span class="text-xs text-gray-500">{{ selectedPO.vesselRequestItem?.item?.itemCode || '-' }}</span>
                </div>
              </div>

              <div class="flex items-start gap-2.5">
                <ClipboardCheck class="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span class="text-xs text-gray-400 block leading-none">Jumlah & Harga Satuan</span>
                  <strong class="text-gray-900 block mt-0.5">
                    {{ selectedPO.qty }} {{ selectedPO.vesselRequestItem?.unit || 'Pcs' }}
                  </strong>
                  <span class="text-xs text-gray-500">Rp {{ formatNumber(selectedPO.unitPrice) }} / unit</span>
                </div>
              </div>
            </div>

            <!-- PO Notes -->
            <div v-if="selectedPO.notes" class="pt-3 border-t border-indigo-100/50">
              <span class="text-xs text-gray-400 block">Catatan PO:</span>
              <p class="text-xs text-gray-600 mt-1 leading-relaxed bg-white/50 p-2.5 rounded-lg border border-slate-100">
                {{ selectedPO.notes }}
              </p>
            </div>
          </div>

          <!-- Checklist & Match status -->
          <div class="border-t border-gray-100 pt-4 space-y-4">
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  v-model="grForm.isSameItem"
                  type="checkbox"
                  class="mt-1 w-4.5 h-4.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div>
                  <span class="text-sm font-semibold text-gray-900">
                    Item dan Qty sudah sesuai dengan Purchase Order
                  </span>
                  <p class="text-xs text-gray-500 mt-0.5">
                    Centang jika spesifikasi barang dan jumlah yang diterima sama persis dengan PO.
                  </p>
                </div>
              </label>
            </div>

            <!-- Discrepancy Reason -->
            <div v-if="!grForm.isSameItem" class="space-y-1.5">
              <label class="block text-sm font-semibold text-gray-700">
                Alasan Ketidaksesuaian / Discrepancy Reason <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="grForm.reason"
                required
                rows="3"
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                placeholder="Tuliskan detail perbedaan barang, jumlah, atau alasan penolakan..."
              />
              <p class="text-xs text-red-500">
                * Wajib diisi jika item tidak sesuai dengan detail PO. Good Receipt akan disimpan dengan status <strong>Rejected</strong>.
              </p>
            </div>

            <div v-else class="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg">
              <ClipboardCheck class="w-4 h-4 text-emerald-600" />
              <span>Good Receipt akan disimpan dengan status <strong>Accepted</strong>.</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </FormDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Loader2,
  Building2,
  Ship,
  Package,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-vue-next'
import FormDialog from '@/components/base/form/Form.vue'
import { useGoodReceiptStore } from '../store'
import { showError, showSuccess } from '@/services/notification'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close', 'submit-completed'])

const grStore = useGoodReceiptStore()

const loading = ref(false)
const isLoadingPOs = ref(false)

const grForm = ref({
  purchaseOrderId: null,
  isSameItem: true,
  reason: '',
})

const pendingPOs = computed(() => grStore.pendingPOs || [])

const selectedPO = computed(() => {
  if (!grForm.value.purchaseOrderId) return null
  return pendingPOs.value.find((po) => po.id === grForm.value.purchaseOrderId) || null
})

const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return Number(num).toLocaleString('id-ID')
}

const loadPendingPOs = async () => {
  isLoadingPOs.value = true
  try {
    await grStore.fetchPendingPOs()
  } catch (error) {
    showError('Gagal memuat daftar Purchase Order pending.')
  } finally {
    isLoadingPOs.value = false
  }
}

const resetForm = () => {
  grForm.value = {
    purchaseOrderId: null,
    isSameItem: true,
    reason: '',
  }
}

watch(
  () => props.isOpen,
  (newOpen) => {
    if (newOpen) {
      resetForm()
      loadPendingPOs()
    }
  }
)

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSubmit = async () => {
  if (!grForm.value.purchaseOrderId) {
    showError('Pilih Purchase Order terlebih dahulu')
    return
  }

  if (!grForm.value.isSameItem && !grForm.value.reason.trim()) {
    showError('Alasan ketidaksesuaian harus diisi jika item tidak sesuai')
    return
  }

  loading.value = true
  try {
    await grStore.createGoodReceipt({
      purchaseOrderId: grForm.value.purchaseOrderId,
      isSameItem: grForm.value.isSameItem,
      reason: grForm.value.isSameItem ? null : grForm.value.reason,
    })
    showSuccess('Good Receipt berhasil disimpan!')
    emit('submit-completed')
    handleClose()
  } catch (error) {
    showError(error.message || 'Gagal menyimpan Good Receipt.')
  } finally {
    loading.value = false
  }
}
</script>
