<template>
  <FormDialog
    :is-open="isOpen"
    :title="formTitle"
    :loading="loading"
    :show-footer="true"
    size="lg"
    @close="handleClose"
    @submit="handleSubmit"
  >
    <template v-if="mode === 'view'" #footer>
      <button
        @click="handleClose"
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Close
      </button>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
      >
        {{ errorMessage }}
      </div>

      <!-- Vessel and Item Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Vessel -->
        <div>
          <label for="vesselId" class="block text-sm font-medium text-gray-700 mb-1">
            Vessel <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            v-if="mode === 'view'"
            :value="viewVesselName"
            type="text"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          />
          <select
            v-else
            id="vesselId"
            v-model="formData.vesselId"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Vessel</option>
            <option v-for="vessel in vessels" :key="vessel.id" :value="vessel.id">
              {{ vessel.name }}
            </option>
          </select>
        </div>

        <!-- Item -->
        <div>
          <label for="itemId" class="block text-sm font-medium text-gray-700 mb-1">
            Item <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            v-if="mode === 'view'"
            :value="viewItemName"
            type="text"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          />
          <select
            v-else
            id="itemId"
            v-model="formData.itemId"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Item</option>
            <option v-for="item in items" :key="item.id" :value="item.id">
              {{ item.name }} ({{ item.itemCode }})
            </option>
          </select>
        </div>
      </div>

      <!-- Stock On Hand and Stock Minimal Row -->
      <div :class="[
          'grid grid-cols-1 gap-4',
          !formData.unit ? 'md:grid-cols-2' : 'md:grid-cols-3'
        ]">
        <!-- Stock On Hand -->
        <div>
          <label for="stockOnHand" class="block text-sm font-medium text-gray-700 mb-1">
            Stock On Hand <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            id="stockOnHand"
            v-model.number="formData.stockOnHand"
            type="number"
            min="0"
            :required="mode !== 'view'"
            :disabled="mode === 'view'"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="0"
          />
        </div>

        <!-- Unit -->
        <div v-if="formData.unit">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Unit
          </label>
          <input
            :value="formData.unit"
            type="text"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          />
        </div>

        <!-- Stock Minimal -->
        <div>
          <label for="stockMinimal" class="block text-sm font-medium text-gray-700 mb-1">
            Minimum Stock <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            :value="formData.minimumStock"
            type="text"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>

      <!-- Last Update -->
      <div>
        <label for="lastUpdate" class="block text-sm font-medium text-gray-700 mb-1">
          Last Update <span v-if="mode !== 'view'" class="text-red-500">*</span>
        </label>
        <input
          id="lastUpdate"
          v-model="formData.lastUpdate"
          type="date"
          :required="mode !== 'view'"
          :disabled="mode === 'view'"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
    </form>
  </FormDialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormDialog from '@/components/base/form/Form.vue'
import { useVesselStore } from '@/features/vessel/store.js'
import { useItemStore } from '@/features/master-data/items/store.js'
import { getErrorMessage } from '@/utils/errorHandler.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  stock: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'add',
    validator: (value) => ['add', 'edit', 'view'].includes(value),
  },
})

const emit = defineEmits(['close', 'submit'])

const vesselStore = useVesselStore()
const itemStore = useItemStore()

const loading = ref(false)
const errorMessage = ref('')
const vessels = ref([])
const items = ref([])

const formData = ref({
  vesselId: '',
  itemId: '',
  unit: '',
  stockOnHand: 0,
  minimumStock: 0,
  lastUpdate: new Date().toISOString().split('T')[0],
})

const formTitle = computed(() => {
  if (props.mode === 'view') return 'View Vessel Stock'
  return props.mode === 'edit' ? 'Edit Vessel Stock' : 'Add Vessel Stock'
})

const viewVesselName = computed(() => {
  return props.stock?.vessel?.name || ''
})

const viewItemName = computed(() => {
  const item = props.stock?.item
  return item ? `${item.name} (${item.itemCode})` : ''
})

const resetForm = () => {
  formData.value = {
    vesselId: '',
    itemId: '',
    unit: '',
    stockOnHand: 0,
    minimumStock: 0,
    lastUpdate: new Date().toISOString().split('T')[0],
  }
  errorMessage.value = ''
}

// Load dropdown data
const loadDropdownData = async () => {
  try {
    await vesselStore.fetchVessels(1, 100, '')
    vessels.value = vesselStore.vessels
  } catch (e) {
    // silently fail
  }

  try {
    await itemStore.fetchItems(1, 100, '')
    items.value = itemStore.items
  } catch (e) {
    // silently fail
  }
}

// Watch for stock changes to populate form
watch(
  () => props.stock,
  (newStock) => {
    if (newStock) {
      formData.value = {
        vesselId: newStock?.vesselId || '',
        itemId: newStock?.itemId || '',
        stockOnHand: newStock?.stockOnHand || 0,
        minimumStock: newStock?.minStock || 0,
        lastUpdate: newStock.lastUpdate
          ? new Date(newStock.lastUpdate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        unit: newStock?.item.unit || '',
      }
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

// Load dropdowns when dialog opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.mode !== 'view') {
      loadDropdownData()
    }
  },
)

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSubmit = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    const submitData = {
      vesselId: Number(formData.value.vesselId),
      itemId: Number(formData.value.itemId),
      stockOnHand: Number(formData.value.stockOnHand),
      lastUpdate: formData.value.lastUpdate,
    }
    emit('submit', submitData)
    loading.value = false
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Failed to save vessel stock')
    loading.value = false
  }
}
</script>
