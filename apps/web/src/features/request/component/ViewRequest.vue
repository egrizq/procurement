<template>
  <FormDialog
    :is-open="isOpen"
    title="Request Details"
    :show-footer="false"
    size="xl"
    @close="handleClose"
  >
    <template #default>
      <div v-if="request" class="space-y-6">
        <!-- Request Header Card -->
        <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-100">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-2xl font-bold text-gray-900">{{ request.requestCode }}</h3>
              <p class="text-sm text-gray-600 mt-1">
                Created on {{ formatDate(request.requestDate) }}
              </p>
            </div>
            <div class="flex gap-2 items-center">
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
                class="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm"
                :class="getStatusColor(request.status)"
              >
                {{ formatStatus(request.status) }}
              </span>
              <span
                class="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm"
                :class="getPriorityColor(request.priority)"
              >
                {{ request.priority }} Priority
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Vessel -->
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Ship class="w-5 h-5 text-indigo-600" />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Vessel</label>
                <p class="text-base font-semibold text-gray-900">{{ request.vessel?.name }}</p>
                <p class="text-sm text-gray-600">{{ request.vessel?.imoNumber }}</p>
              </div>
            </div>

            <!-- Requested By -->
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <User class="w-5 h-5 text-indigo-600" />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Requested By</label>
                <p class="text-base font-semibold text-gray-900">{{ request.user?.fullName }}</p>
              </div>
            </div>
          </div>

          <!-- Justification -->
          <div v-if="request.justification" class="mt-6 pt-6 border-t border-indigo-200">
            <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Justification</label>
            <p class="text-base text-gray-700 leading-relaxed">
              {{ request.justification }}
            </p>
          </div>
        </div>

        <!-- Request Items Table -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">Request Items</h3>
            <span class="text-sm font-medium text-gray-500">
              {{ request.vesselRequestItems?.length || 0 }} item(s)
            </span>
          </div>

          <DataTable
            v-if="request.vesselRequestItems && request.vesselRequestItems.length > 0"
            :columns="itemColumns"
            :data="request.vesselRequestItems"
            :show-pagination="false"
            :clickable="false"
            row-key="id"
          >
            <!-- Index Column -->
            <template #cell-index="{ row }">
              <div class="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                <span class="text-sm font-bold text-gray-600">{{ getItemIndex(row) }}</span>
              </div>
            </template>

            <!-- Item Column -->
            <template #cell-item="{ row }">
              <div class="flex items-center gap-2">
                <Package class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p class="text-sm font-semibold text-gray-900">{{ row.item?.name }}</p>
                  <p class="text-xs text-gray-500">{{ row.item?.itemCode }}</p>
                </div>
              </div>
            </template>

            <!-- Qty Requested Column -->
            <template #cell-qtyRequested="{ row }">
              <div class="flex items-center gap-1">
                <span class="text-sm font-semibold text-blue-900">{{ row.qtyRequested }}</span>
                <span class="text-xs text-gray-500">{{ row.unit }}</span>
              </div>
            </template>

            <!-- Qty Approved Column -->
            <template #cell-qtyApproved="{ row }">
              <div v-if="isAdjusting" class="flex flex-col gap-2 min-w-[120px]">
                <div class="flex items-center gap-2">
                  <button 
                    @click="decrementQty(row.itemId)"
                    class="w-6 h-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600"
                  >-</button>
                  <input 
                    type="number" 
                    min="0"
                    v-model.number="adjustments[row.itemId].qtyApproved"
                    class="w-16 text-center border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button 
                    @click="incrementQty(row.itemId)"
                    class="w-6 h-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600"
                  >+</button>
                  <span class="text-xs text-gray-500">{{ row.unit }}</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Justification (optional)"
                  v-model="adjustments[row.itemId].staffJustification"
                  class="w-full text-xs border-gray-300 rounded-md py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div v-else-if="row.qtyApproved" class="flex items-center gap-1">
                <span class="text-sm font-semibold text-green-900">{{ row.qtyApproved }}</span>
                <span class="text-xs text-gray-500">{{ row.unit }}</span>
                <div v-if="row.staffJustification" class="text-xs italic text-gray-500 block mt-1 ml-1" :title="row.staffJustification">
                  (Adjusted)
                </div>
              </div>
              <span v-else class="text-sm text-gray-400">-</span>
            </template>

            <!-- Status Column -->
            <template #cell-status="{ row }">
              <span
                class="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full"
                :class="getStatusColor(row.status)"
              >
                {{ formatStatus(row.status) }}
              </span>
            </template>

            <!-- Priority Column -->
            <template #cell-priority="{ row }">
              <span
                class="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full"
                :class="getPriorityColor(row.priority)"
              >
                {{ row.priority }}
              </span>
            </template>

            <!-- Actions Column -->
            <template #cell-actions="{ row }">
              <div class="flex items-center justify-end">
                <button
                  @click="downloadItemPDF(row)"
                  class="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-900 rounded transition-colors disabled:opacity-50"
                  :disabled="downloadingItemId !== null"
                  title="Download Item PDF"
                >
                  <Loader2 v-if="downloadingItemId === row.id" class="w-4 h-4 animate-spin" />
                  <FileText v-else class="w-4 h-4" />
                </button>
              </div>
            </template>
          </DataTable>

          <!-- No items -->
          <div v-else class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <PackageX class="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p class="text-gray-500 font-medium">No items in this request</p>
          </div>
        </div>

        <!-- Staff Action Panel for pending requests -->
        <div v-if="canReview" class="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 font-medium text-gray-900 border-l-4 border-l-indigo-500">
            Staff Actions
          </div>
          
          <div class="p-4 space-y-4">
            <div v-if="isRejecting" class="space-y-3">
              <label class="block text-sm font-medium text-gray-700">Reason for Rejection <span class="text-red-500">*</span></label>
              <textarea 
                v-model="rejectReason" 
                rows="3" 
                class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="Please provide a detailed reason for rejecting this request..."
              ></textarea>
              <div class="flex gap-2 justify-end pt-2">
                <button 
                  @click="isRejecting = false; rejectReason = ''" 
                  class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  :disabled="isSubmitting"
                >
                  Cancel
                </button>
                <button 
                  @click="submitReview('Reject')" 
                  class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  :disabled="isSubmitting || !rejectReason.trim()"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
            
            <div v-else class="flex flex-col sm:flex-row justify-between gap-4 items-center">
              <div class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="adjustToggle" 
                  v-model="isAdjusting" 
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="adjustToggle" class="text-sm text-gray-700 font-medium">
                  Adjust items before approving?
                </label>
              </div>
              
              <div class="flex gap-2">
                <button 
                  @click="isRejecting = true" 
                  class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  :disabled="isSubmitting"
                >
                  Reject...
                </button>
                <button 
                  @click="submitReview('Approve')" 
                  class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center min-w-[100px]"
                  :disabled="isSubmitting"
                >
                  <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Loading state -->
      <div v-else class="text-center py-16">
        <Loader2 class="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
        <p class="text-lg font-medium text-gray-700">Loading request details...</p>
        <p class="text-sm text-gray-500 mt-1">Please wait a moment</p>
      </div>
    </template>
  </FormDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Ship, User, Package, PackageX, Loader2, FileText } from 'lucide-vue-next'
import FormDialog from '@/components/base/form/Form.vue'
import DataTable from '@/components/base/data-table/DataTable.vue'
import { useRequestStore } from '../store'
import { showSuccess, showError } from '@/services/notification'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  request: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'reviewed'])
const requestStore = useRequestStore()

const adjustments = ref({})
const isAdjusting = ref(false)
const isRejecting = ref(false)
const rejectReason = ref('')
const isSubmitting = ref(false)
const isDownloading = ref(false)
const downloadingItemId = ref(null)

const downloadItemPDF = async (row) => {
  if (downloadingItemId.value !== null) return
  downloadingItemId.value = row.id
  try {
    const blob = await requestStore.downloadPdf(props.request.id, row.id)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `VesselRequestItem-${props.request.requestCode}-${row.item?.name.replace(/\s+/g, '_')}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    showSuccess('Item PDF downloaded successfully')
  } catch (error) {
    showError(error.message || 'Failed to download Item PDF')
  } finally {
    downloadingItemId.value = null
  }
}

const downloadPDF = async () => {
  if (isDownloading.value) return
  isDownloading.value = true
  try {
    const blob = await requestStore.downloadPdf(props.request.id)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `VesselRequest-${props.request.requestCode}.pdf`)
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

const canReview = computed(() => {
  return props.request && (props.request.status === 'Waiting' || props.request.status === 'Ok')
})

// Initialize adjustments when request details open
watch(() => props.request, (newReq) => {
  isAdjusting.value = false
  isRejecting.value = false
  rejectReason.value = ''
  adjustments.value = {}
  
  if (newReq && newReq.vesselRequestItems) {
    newReq.vesselRequestItems.forEach(item => {
      adjustments.value[item.itemId] = {
        qtyApproved: item.qtyRequested,
        staffJustification: ''
      }
    })
  }
}, { immediate: true })

const incrementQty = (itemId) => {
  adjustments.value[itemId].qtyApproved++
}

const decrementQty = (itemId) => {
  if (adjustments.value[itemId].qtyApproved > 0) {
    adjustments.value[itemId].qtyApproved--
  }
}

const submitReview = async (action) => {
  isSubmitting.value = true
  try {
    const payload = { action }
    
    if (action === 'Reject') {
      payload.rejectReason = rejectReason.value
    } else if (action === 'Approve' && isAdjusting.value) {
      payload.itemsAdjustment = Object.entries(adjustments.value).map(([itemId, data]) => ({
        itemId: Number(itemId),
        qtyApproved: data.qtyApproved,
        staffJustification: data.staffJustification || undefined
      }))
    }
    
    await requestStore.reviewRequest(props.request.id, payload)
    showSuccess(`Request successfully ${action.toLowerCase()}ed`)
    emit('reviewed')
    handleClose()
  } catch (error) {
    showError(error.message || 'Failed to review request')
  } finally {
    isSubmitting.value = false
  }
}

// Define columns for items table
const itemColumns = [
  { key: 'index', label: '#' },
  { key: 'item', label: 'Item' },
  { key: 'qtyRequested', label: 'Qty Requested' },
  { key: 'qtyApproved', label: 'Qty Approved' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'actions', label: '' },
]

// Helper to get item index
const getItemIndex = (item) => {
  return props.request.vesselRequestItems.findIndex(i => i.id === item.id) + 1
}

const handleClose = () => {
  emit('close')
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

const getStatusColor = (status) => {
  const colors = {
    Ok: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    Waiting: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    Approved: 'bg-green-100 text-green-800 border border-green-200',
    Rejected: 'bg-red-100 text-red-800 border border-red-200',
    Pending: 'bg-blue-100 text-blue-800 border border-blue-200',
    Completed: 'bg-purple-100 text-purple-800 border border-purple-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border border-gray-200'
}

const formatStatus = (status) => {
  return status === 'Ok' ? 'OK' : status
}

const getPriorityColor = (priority) => {
  const colors = {
    High: 'bg-red-100 text-red-800 border border-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    Low: 'bg-green-100 text-green-800 border border-green-200',
  }
  return colors[priority] || 'bg-gray-100 text-gray-800 border border-gray-200'
}
</script>
