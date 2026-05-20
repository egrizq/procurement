<template>
  <FormDialog
    :is-open="isOpen"
    :title="isEditMode ? 'Edit Matrix of Comparison' : 'Create Matrix of Comparison'"
    :loading="isSaving"
    size="2xl"
    @close="handleClose"
  >
    <template #default>
      <!-- Step indicator (only for create mode) -->
      <div v-if="!isEditMode" class="mb-8 border-b border-gray-100 pb-4">
        <div class="flex items-center justify-center gap-2">
          <div class="flex items-center gap-2">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-200"
              :class="currentStep === 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-gray-100 text-gray-500'"
            >
              1
            </span>
            <span class="text-sm font-medium" :class="currentStep === 1 ? 'text-indigo-600 font-semibold' : 'text-gray-500'">
              Select Request & Item
            </span>
          </div>
          <div class="w-12 h-px bg-gray-200"></div>
          <div class="flex items-center gap-2">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-200"
              :class="currentStep === 2 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-gray-100 text-gray-500'"
            >
              2
            </span>
            <span class="text-sm font-medium" :class="currentStep === 2 ? 'text-indigo-600 font-semibold' : 'text-gray-500'">
              Comparison Matrix
            </span>
          </div>
        </div>
      </div>

      <!-- Step 1: Select Request & Item -->
      <div v-if="currentStep === 1 && !isEditMode" class="space-y-6">
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">Choose Approved Request *</label>
          <select
            v-model="wizardData.vesselRequestId"
            class="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
            @change="handleRequestChange"
          >
            <option :value="null" disabled>Select an approved request</option>
            <option v-for="req in approvedRequests" :key="req.id" :value="req.id">
              {{ req.requestCode }} - {{ req.vessel?.name }} (Requested by: {{ req.user?.fullName }})
            </option>
          </select>
        </div>

        <div v-if="selectedRequestDetail" class="space-y-3">
          <label class="block text-sm font-semibold text-gray-700">Select Item to Compare *</label>
          
          <div v-if="approvedItems.length === 0" class="text-sm text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200">
            No approved items found in this request.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="item in approvedItems"
              :key="item.id"
              @click="selectRequestItem(item)"
              class="flex flex-col justify-between p-4 border rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all duration-150"
              :class="wizardData.vesselRequestItemId === item.id ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500' : 'border-gray-200 bg-white'"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h5 class="font-semibold text-gray-900">{{ item.item?.name || 'Unknown Item' }}</h5>
                  <p class="text-xs text-gray-400 mt-0.5">Code: {{ item.item?.itemCode || '-' }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Approved
                  </span>
                  <CheckCircle
                    v-if="wizardData.vesselRequestItemId === item.id"
                    class="w-5 h-5 text-indigo-600"
                  />
                </div>
              </div>
              <div class="flex justify-between items-center mt-4 border-t border-gray-100 pt-3">
                <span class="text-xs text-gray-500">Qty Approved:</span>
                <span class="text-sm font-bold text-gray-800">{{ item.qtyApproved }} {{ item.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Vendor Comparison Matrix -->
      <div v-if="currentStep === 2 || isEditMode" class="space-y-6">
        <!-- Summary Header -->
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-700">
          <div>
            <span class="text-slate-400">Request:</span>
            <strong class="ml-1 text-slate-900">{{ summaryRequestCode }}</strong>
          </div>
          <div>
            <span class="text-slate-400">Vessel:</span>
            <strong class="ml-1 text-slate-900">{{ summaryVesselName }}</strong>
          </div>
          <div>
            <span class="text-slate-400">Item:</span>
            <strong class="ml-1 text-slate-900">{{ summaryItemName }}</strong>
          </div>
          <div>
            <span class="text-slate-400">Approved Qty:</span>
            <strong class="ml-1 text-slate-900">{{ summaryApprovedQty }}</strong>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <h4 class="text-md font-bold text-gray-900 flex items-center gap-1.5">
            <Scale :size="18" class="text-indigo-600" />
            Vendor Matrix List
            <span class="text-xs font-normal text-gray-400">(Minimum 3 vendors required)</span>
          </h4>
          <button
            @click="addVendorToMatrix"
            type="button"
            class="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 bg-indigo-50/50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus :size="14" />
            Add Vendor
          </button>
        </div>

        <!-- Matrix Comparison Board -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div
            v-for="(matrix, idx) in wizardData.vendors"
            :key="idx"
            class="flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200"
            :class="matrix.isSelected ? 'border-emerald-500 shadow-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-gray-200 hover:border-gray-300'"
          >
            <!-- Card Header -->
            <div class="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-gray-100">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor #{{ idx + 1 }}</span>
              <button
                @click="removeVendorFromMatrix(idx)"
                type="button"
                :disabled="wizardData.vendors.length <= 3"
                class="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Remove this vendor"
              >
                <Trash2 :size="14" />
              </button>
            </div>

            <!-- Card Body -->
            <div class="p-4 space-y-3.5 flex-1">
              <!-- Vendor Selection -->
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Select Vendor *</label>
                <select
                  v-model="matrix.vendorId"
                  required
                  class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option :value="null" disabled>Choose vendor</option>
                  <option v-for="v in masterVendors" :key="v.id" :value="v.id">
                    {{ v.name }}
                  </option>
                </select>
              </div>

              <!-- Unit Price -->
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Unit Price (IDR) *</label>
                <input
                  v-model.number="matrix.unitPrice"
                  type="number"
                  min="0"
                  required
                  class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter unit price"
                />
                <span class="text-[10px] text-gray-400 mt-0.5 block" v-if="matrix.unitPrice">
                  Rp {{ formatNumber(matrix.unitPrice) }}
                </span>
              </div>

              <!-- Lead Time -->
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Lead Time *</label>
                <input
                  v-model="matrix.leadTime"
                  type="text"
                  required
                  class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. 3 days, 1 week"
                />
              </div>

              <!-- Remarks -->
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Remarks</label>
                <textarea
                  v-model="matrix.remarks"
                  rows="2"
                  class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="Notes, terms, etc."
                ></textarea>
              </div>
            </div>

            <!-- Card Footer (Winner Selection) -->
            <div class="px-4 py-3 bg-slate-50/50 border-t border-gray-100 flex items-center justify-between">
              <span class="text-xs font-medium" :class="matrix.isSelected ? 'text-emerald-700 font-bold' : 'text-gray-500'">
                Selected Winner?
              </span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  :checked="matrix.isSelected"
                  @change="toggleWinner(idx)"
                  class="sr-only peer"
                />
                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Custom footer to handle navigation & submission -->
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <!-- Back button (only on Step 2 in create mode) -->
        <button
          v-if="currentStep === 2 && !isEditMode"
          @click="currentStep = 1"
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <div v-else></div>

        <div class="flex items-center gap-3">
          <button
            @click="handleClose"
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <!-- Next button (Step 1 in create mode) -->
          <button
            v-if="currentStep === 1 && !isEditMode"
            @click="goToStep2"
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Next
          </button>

          <!-- Submit button (Step 2 or Edit mode) -->
          <button
            v-else
            @click="submitWizardForm"
            type="button"
            :disabled="isSaving"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="isSaving" class="flex items-center gap-2">
              <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Saving...
            </span>
            <span v-else>Save Draft</span>
          </button>
        </div>
      </div>
    </template>
  </FormDialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Plus, Trash2, CheckCircle, Scale } from 'lucide-vue-next'
import FormDialog from '@/components/base/form/Form.vue'
import { useMocStore } from '../store.js'
import { useRequestStore } from '../../request/store.js'
import { useVendorStore } from '../../master-data/vendors/store.js'
import { showSuccess, showError } from '@/services/notification.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  mocId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const mocStore = useMocStore()
const requestStore = useRequestStore()
const vendorStore = useVendorStore()

const currentStep = ref(1)
const isSaving = ref(false)

const approvedRequests = ref([])
const selectedRequestDetail = ref(null)
const approvedItems = ref([])

const wizardData = ref({
  vesselRequestId: null,
  vesselRequestItemId: null,
  status: 'Draft',
  vendors: [
    { vendorId: null, unitPrice: 0, leadTime: '', remarks: '', isSelected: false },
    { vendorId: null, unitPrice: 0, leadTime: '', remarks: '', isSelected: false },
    { vendorId: null, unitPrice: 0, leadTime: '', remarks: '', isSelected: false },
  ]
})

const masterVendors = computed(() => vendorStore.vendors || [])

const summaryRequestCode = computed(() => {
  if (props.isEditMode && mocStore.currentMoc) {
    return mocStore.currentMoc.vesselRequest?.requestCode || '-'
  }
  return selectedRequestDetail.value?.requestCode || '-'
})

const summaryVesselName = computed(() => {
  if (props.isEditMode && mocStore.currentMoc) {
    return mocStore.currentMoc.vesselRequest?.vessel?.name || '-'
  }
  return selectedRequestDetail.value?.vessel?.name || '-'
})

const summaryItemName = computed(() => {
  if (props.isEditMode && mocStore.currentMoc) {
    return mocStore.currentMoc.vesselRequestItem?.item?.name || '-'
  }
  const itemObj = approvedItems.value.find(i => i.id === wizardData.value.vesselRequestItemId)
  return itemObj?.item?.name || '-'
})

const summaryApprovedQty = computed(() => {
  if (props.isEditMode && mocStore.currentMoc) {
    return `${mocStore.currentMoc.vesselRequestItem?.qtyApproved || 0} ${mocStore.currentMoc.vesselRequestItem?.unit || ''}`
  }
  const itemObj = approvedItems.value.find(i => i.id === wizardData.value.vesselRequestItemId)
  return itemObj ? `${itemObj.qtyApproved} ${itemObj.unit}` : '-'
})

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const fetchApprovedRequestsList = async () => {
  try {
    await mocStore.fetchApprovedRequests(1, 100, '')
    approvedRequests.value = mocStore.requests || []
  } catch (err) {
    showError('Failed to fetch approved crew requests.')
  }
}

const handleRequestChange = async () => {
  selectedRequestDetail.value = null
  approvedItems.value = []
  wizardData.value.vesselRequestItemId = null

  if (!wizardData.value.vesselRequestId) return

  try {
    const fullRequest = await requestStore.fetchRequestById(wizardData.value.vesselRequestId)
    if (fullRequest) {
      selectedRequestDetail.value = fullRequest
      approvedItems.value = fullRequest.vesselRequestItems?.filter(i => i.status === 'Approved' || i.qtyApproved > 0) || []
      
      if (approvedItems.value.length === 1) {
        wizardData.value.vesselRequestItemId = approvedItems.value[0].id
      }
    }
  } catch (error) {
    showError('Failed to load request item details')
  }
}

const selectRequestItem = (item) => {
  wizardData.value.vesselRequestItemId = item.id
}

const goToStep2 = () => {
  if (!wizardData.value.vesselRequestId) {
    showError('Please choose an approved crew request first.')
    return
  }
  if (!wizardData.value.vesselRequestItemId) {
    showError('Please select one item to compare.')
    return
  }
  currentStep.value = 2
}

const addVendorToMatrix = () => {
  wizardData.value.vendors.push({
    vendorId: null,
    unitPrice: 0,
    leadTime: '',
    remarks: '',
    isSelected: false
  })
}

const removeVendorFromMatrix = (idx) => {
  if (wizardData.value.vendors.length > 3) {
    wizardData.value.vendors.splice(idx, 1)
  }
}

const toggleWinner = (winnerIdx) => {
  wizardData.value.vendors.forEach((v, idx) => {
    if (idx === winnerIdx) {
      v.isSelected = !v.isSelected
    } else {
      v.isSelected = false
    }
  })
}

const handleClose = () => {
  emit('close')
}

const initForm = async () => {
  if (props.isEditMode && props.mocId) {
    currentStep.value = 2
    try {
      await mocStore.fetchMocById(props.mocId)
      const current = mocStore.currentMoc
      if (current) {
        const loadedVendors = current.mocVendors?.map(v => ({
          vendorId: v.vendorId,
          unitPrice: v.unitPrice,
          leadTime: v.leadTime,
          remarks: v.remarks || '',
          isSelected: !!v.isSelected
        })) || []

        while (loadedVendors.length < 3) {
          loadedVendors.push({
            vendorId: null,
            unitPrice: 0,
            leadTime: '',
            remarks: '',
            isSelected: false
          })
        }

        wizardData.value = {
          vesselRequestId: current.vesselRequestId,
          vesselRequestItemId: current.vesselRequestItemId,
          status: current.status,
          vendors: loadedVendors
        }
      }
    } catch (err) {
      showError('Failed to fetch MOC details.')
    }
  } else {
    currentStep.value = 1
    selectedRequestDetail.value = null
    approvedItems.value = []
    
    wizardData.value = {
      vesselRequestId: null,
      vesselRequestItemId: null,
      status: 'Draft',
      vendors: [
        { vendorId: null, unitPrice: 0, leadTime: '', remarks: '', isSelected: false },
        { vendorId: null, unitPrice: 0, leadTime: '', remarks: '', isSelected: false },
        { vendorId: null, unitPrice: 0, leadTime: '', remarks: '', isSelected: false },
      ]
    }
    await fetchApprovedRequestsList()
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    initForm()
  }
})

const validateMocForm = () => {
  const vData = wizardData.value
  const isDraft = vData.status === 'Draft'

  const activeVendors = vData.vendors.filter(v => v.vendorId !== null)

  if (isDraft) {
    if (activeVendors.length < 1) {
      showError('Please choose at least one vendor to save a draft.')
      return false
    }

    const activeVendorIds = activeVendors.map(v => v.vendorId)
    if (new Set(activeVendorIds).size !== activeVendorIds.length) {
      showError('Duplicate vendors found. Each vendor in the comparison matrix must be unique.')
      return false
    }

    const hasInvalidPrice = activeVendors.some(v => v.unitPrice < 0)
    if (hasInvalidPrice) {
      showError('Please input a valid price.')
      return false
    }
  } else {
    if (vData.vendors.length < 3) {
      showError('Minimum comparison is 3 vendors.')
      return false
    }

    const vendorIds = vData.vendors.map(v => v.vendorId).filter(Boolean)
    if (vendorIds.length < vData.vendors.length) {
      showError('Please choose a vendor for all entries in the matrix.')
      return false
    }

    const uniqueVendorIds = new Set(vendorIds)
    if (uniqueVendorIds.size !== vendorIds.length) {
      showError('Duplicate vendors found. Each vendor in the comparison matrix must be unique.')
      return false
    }

    const hasMissingPrice = vData.vendors.some(v => v.unitPrice === null || v.unitPrice === undefined || v.unitPrice <= 0)
    if (hasMissingPrice) {
      showError('Please input a valid price greater than 0 for all compared vendors.')
      return false
    }

    const hasMissingLead = vData.vendors.some(v => !v.leadTime || !v.leadTime.trim())
    if (hasMissingLead) {
      showError('Please enter lead times for all compared vendors.')
      return false
    }

    const selectedWinners = vData.vendors.filter(v => v.isSelected)
    if (selectedWinners.length !== 1) {
      showError('Please select exactly one winning vendor.')
      return false
    }
  }

  return true
}

const submitWizardForm = async () => {
  if (!validateMocForm()) return

  isSaving.value = true
  try {
    const isDraft = wizardData.value.status === 'Draft'

    const payload = {
      vesselRequestId: Number(wizardData.value.vesselRequestId),
      vesselRequestItemId: Number(wizardData.value.vesselRequestItemId),
      status: wizardData.value.status,
      vendors: isDraft
        ? wizardData.value.vendors
            .filter(v => v.vendorId !== null)
            .map(v => ({
              vendorId: Number(v.vendorId),
              unitPrice: Number(v.unitPrice) || 0,
              leadTime: v.leadTime || '',
              remarks: v.remarks || '',
              isSelected: !!v.isSelected
            }))
        : wizardData.value.vendors.map(v => ({
            vendorId: Number(v.vendorId),
            unitPrice: Number(v.unitPrice),
            leadTime: v.leadTime,
            remarks: v.remarks || '',
            isSelected: !!v.isSelected
          }))
    }

    if (props.isEditMode) {
      await mocStore.updateMoc(props.mocId, payload)
      showSuccess('MOC draft updated successfully.')
    } else {
      await mocStore.createMoc(payload)
      showSuccess('MOC draft saved successfully.')
    }
    emit('saved')
    handleClose()
  } catch (error) {
    showError(mocStore.error || 'Failed to save MOC draft.')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
select:focus, input:focus, textarea:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}
</style>