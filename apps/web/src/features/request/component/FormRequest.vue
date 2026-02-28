<template>
  <FormDialog
    :is-open="isOpen"
    :title="formTitle"
    :loading="loading"
    size="xl"
    @close="handleClose"
    @submit="handleSubmit"
  >
    <template #default>
      <!-- Step Indicator -->
      <div class="mb-6">
        <div class="flex items-center justify-center">
          <div class="flex items-center">
            <!-- Step 1 -->
            <div class="flex items-center">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors"
                :class="
                  currentStep === 1
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-indigo-600 bg-white text-indigo-600'
                "
              >
                <span class="text-sm font-semibold">1</span>
              </div>
              <span
                class="ml-2 text-sm font-medium"
                :class="currentStep === 1 ? 'text-indigo-600' : 'text-gray-500'"
                >Request Info</span
              >
            </div>

            <!-- Divider -->
            <div class="w-16 h-0.5 mx-4 bg-gray-300"></div>

            <!-- Step 2 -->
            <div class="flex items-center">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors"
                :class="
                  currentStep === 2
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                "
              >
                <span class="text-sm font-semibold">2</span>
              </div>
              <span
                class="ml-2 text-sm font-medium"
                :class="currentStep === 2 ? 'text-indigo-600' : 'text-gray-500'"
                >Add Items</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Step 1: Request Header Information -->
      <form v-show="currentStep === 1" @submit.prevent="goToNextStep" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Vessel Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Vessel <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.vesselId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option :value="null" disabled>Select a vessel</option>
              <option v-for="vessel in vessels" :key="vessel.id" :value="vessel.id">
                {{ vessel.name }} ({{ vessel.imoNumber }})
              </option>
            </select>
          </div>

          <!-- Request Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Request Date <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.requestDate"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Priority <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.priority"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <!-- Justification -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Justification
          </label>
          <textarea
            v-model="formData.justification"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Provide justification for this request..."
          ></textarea>
        </div>
      </form>

      <!-- Step 2: Items List -->
      <div v-show="currentStep === 2" class="space-y-3">
        <!-- Items Header -->
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-lg font-semibold text-gray-900">Request Items</h4>
          <button
            @click="addItem"
            type="button"
            class="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus :size="16" />
            <span>Add Item</span>
          </button>
        </div>

        <!-- Items List -->
        <div v-if="formData.items.length === 0" class="text-center py-8 text-gray-500">
          No items added yet. Click "Add Item" to start.
        </div>

        <div
          v-for="(item, index) in formData.items"
          :key="index"
          class="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2"
        >
          <!-- Item Header -->
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-semibold text-gray-700">{{ items[item.itemId-1]?.name || `Item ${index + 1}` }}</span>
            <button
              @click="removeItem(index)"
              type="button"
              class="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              :disabled="formData.items.length === 1"
              :class="{ 'opacity-50 cursor-not-allowed': formData.items.length === 1 }"
            >
              <Trash2 :size="16" />
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
            <!-- Item Selection -->
            <div class="">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Item <span class="text-red-500">*</span>
              </label>
              <select
                v-model="item.itemId"
                required
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option :value="null" disabled>Select an item</option>
                <option v-for="masterItem in items" :key="masterItem.id" :value="masterItem.id">
                  {{ masterItem.name }} ({{ masterItem.itemCode }}) ({{ masterItem.id }})
                </option>
              </select>
            </div>

            <!-- Quantity Requested -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Qty <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="item.qtyRequested"
                type="number"
                min="1"
                required
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <!-- Unit -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Unit <span class="text-red-500">*</span>
              </label>
              <select
                v-model="item.unit"
                required
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Pcs">Pcs</option>
                <option value="Box">Box</option>
                <option value="Liter">Liter</option>
                <option value="Meter">Meter</option>
                <option value="Kg">Kg</option>
              </select>
            </div>

            <!-- Item Priority -->
            <div class="">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Priority <span class="text-red-500">*</span>
              </label>
              <select
                v-model="item.priority"
                required
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <!-- Item Justification -->
            <div class="md:col-span-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Justification
              </label>
              <textarea
                v-model="item.justification"
                rows="2"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                placeholder="Item-specific justification..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Custom Footer for Multi-Step Navigation -->
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <!-- Previous Button (only on Step 2) -->
        <button
          v-if="currentStep === 2"
          @click="goToPreviousStep"
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <div v-else></div>

        <!-- Right Side Buttons -->
        <div class="flex items-center gap-3">
          <button
            @click="handleClose"
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <!-- Next Button (Step 1) -->
          <button
            v-if="currentStep === 1"
            @click="goToNextStep"
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Next
          </button>

          <!-- Submit Button (Step 2) -->
          <button
            v-else
            @click="handleSubmit"
            type="button"
            :disabled="loading || formData.items.length === 0"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <span
                class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></span>
              Saving...
            </span>
            <span v-else>Submit Request</span>
          </button>
        </div>
      </div>
    </template>
  </FormDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import FormDialog from '@/components/base/form/Form.vue'
import { useItemStore } from '@/features/master-data/items/store.js'
import { useVesselStore } from '@/features/vessel/store.js'
import { showError, showSuccess } from '@/services/notification.js'

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

const emit = defineEmits(['close', 'submit'])

// Stores
const itemStore = useItemStore()
const vesselStore = useVesselStore()

// State
const loading = ref(false)
const currentStep = ref(1)
const formData = ref({
  vesselId: null,
  status: 'Waiting',
  priority: 'Medium',
  justification: '',
  requestDate: new Date().toISOString().split('T')[0],
  items: [
    {
      itemId: null,
      qtyRequested: 1,
      unit: 'Pcs',
      status: 'Waiting',
      priority: 'Medium',
      justification: '',
    },
  ],
})

// Computed
const formTitle = computed(() => {
  return 'New Request'
})

const items = computed(() => itemStore.items || [])
const vessels = computed(() => vesselStore.vessels || [])

// Reset form
const resetForm = () => {
  currentStep.value = 1
  formData.value = {
    vesselId: null,
    status: 'Waiting',
    priority: 'Medium',
    justification: '',
    requestDate: new Date().toISOString().split('T')[0],
    items: [
      {
        itemId: null,
        qtyRequested: 1,
        unit: 'Pcs',
        status: 'Waiting',
        priority: 'Medium',
        justification: '',
      },
    ],
  }
}

// Fetch dropdown data
onMounted(async () => {
  try {
    await Promise.all([
      itemStore.fetchItems(1, 1000, ''),
      vesselStore.fetchVessels(1, 1000, ''),
    ])
  } catch (error) {
    showError('Failed to load form data')
  }
})

// Watch for prop changes (edit mode)
watch(
  () => props.request,
  (newRequest) => {
    if (newRequest) {
      formData.value = {
        vesselId: newRequest.vesselId,
        status: newRequest.status,
        priority: newRequest.priority,
        justification: newRequest.justification || '',
        requestDate: newRequest.requestDate
          ? new Date(newRequest.requestDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        items:
          newRequest.vesselRequestItems?.map((item) => ({
            itemId: item.itemId,
            qtyRequested: item.qtyRequested,
            unit: item.unit,
            status: item.status,
            priority: item.priority,
            justification: item.justification || '',
          })) || [
            {
              itemId: null,
              qtyRequested: 1,
              unit: 'Pcs',
              status: 'Waiting',
              priority: 'Medium',
              justification: '',
            },
          ],
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)



// Navigation
const goToNextStep = () => {
  // Validate Step 1
  if (!formData.value.vesselId || !formData.value.requestDate) {
    showError('Please fill in all required fields')
    return
  }
  currentStep.value = 2
}

const goToPreviousStep = () => {
  currentStep.value = 1
}

// Item management
const addItem = () => {
  formData.value.items.push({
    itemId: null,
    qtyRequested: 1,
    unit: 'Pcs',
    status: 'Waiting',
    priority: 'Medium',
    justification: '',
  })
}

const removeItem = (index) => {
  if (formData.value.items.length > 1) {
    formData.value.items.splice(index, 1)
  }
}

// Form actions
const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSubmit = async () => {
  // Validate Step 2
  const hasInvalidItems = formData.value.items.some(
    (item) => !item.itemId || !item.qtyRequested || item.qtyRequested < 1
  )

  if (hasInvalidItems || formData.value.items.length === 0) {
    showError('Please fill in all item fields correctly')
    return
  }

  loading.value = true
  try {
    emit('submit', { ...formData.value })
    showSuccess('Request submitted successfully')
  } catch (error) {
    showError('Failed to submit request')
  } finally {
    loading.value = false
  }
}
</script>
