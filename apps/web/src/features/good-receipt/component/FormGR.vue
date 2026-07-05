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

            <!-- Upload Media Section -->
            <div class="space-y-2 pt-4 border-t border-gray-100">
              <label class="block text-sm font-semibold text-gray-700">
                Unggah Dokumen / Foto Bukti (Opsional)
              </label>
              <div
                class="border-2 border-dashed border-gray-200 hover:border-indigo-500 rounded-xl p-6 transition-colors duration-150 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-50/50"
                @click="triggerFileInput"
                @dragover.prevent
                @drop.prevent="handleFileDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  class="hidden"
                  @change="handleFileChange"
                />
                <UploadCloud class="w-8 h-8 text-gray-400 mb-2" />
                <span class="text-sm font-semibold text-gray-600">Klik untuk upload atau drag & drop file</span>
                <span class="text-xs text-gray-400 mt-1">Maks. 5MB per file (PNG, JPG, PDF)</span>
              </div>

              <!-- Selected Files List -->
              <div v-if="selectedFiles.length > 0" class="mt-3 space-y-2">
                <div
                  v-for="(file, idx) in selectedFiles"
                  :key="idx"
                  class="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <img
                      v-if="isImage(file)"
                      :src="getFilePreviewUrl(file)"
                      class="w-10 h-10 object-cover rounded border border-gray-100 shrink-0"
                    />
                    <div v-else class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center shrink-0">
                      <FileText class="w-5 h-5" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-gray-700 truncate" :title="file.name">
                        {{ file.name }}
                      </p>
                      <p class="text-[10px] text-gray-400">
                        {{ formatFileSize(file.size) }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="removeFile(idx)"
                    class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
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
  UploadCloud,
  Trash2,
  FileText,
} from 'lucide-vue-next'
import FormDialog from '@/components/base/form/Form.vue'
import { useGoodReceiptStore } from '../store'
import { uploadFiles } from '../api.js'
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
const selectedFiles = ref([])
const fileInput = ref(null)

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
  selectedFiles.value = []
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = (e) => {
  const files = Array.from(e.target.files)
  addFiles(files)
}

const handleFileDrop = (e) => {
  const files = Array.from(e.dataTransfer.files)
  addFiles(files)
}

const addFiles = (files) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      showError(`File ${file.name} melebihi batas 5MB.`)
      continue
    }
    if (!allowedTypes.includes(file.type)) {
      showError(`File ${file.name} harus berupa gambar (JPG, PNG, WEBP, GIF) atau PDF.`)
      continue
    }
    selectedFiles.value.push(file)
  }
}

const removeFile = (idx) => {
  selectedFiles.value.splice(idx, 1)
}

const isImage = (file) => file.type.startsWith('image/')

const getFilePreviewUrl = (file) => URL.createObjectURL(file)

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
    let uploadedUrls = null
    if (selectedFiles.value.length > 0) {
      const uploadResult = await uploadFiles(selectedFiles.value)
      uploadedUrls = uploadResult.files.map((f) => f.url)
    }

    await grStore.createGoodReceipt({
      purchaseOrderId: grForm.value.purchaseOrderId,
      isSameItem: grForm.value.isSameItem,
      reason: grForm.value.isSameItem ? null : grForm.value.reason,
      attachments: uploadedUrls,
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
