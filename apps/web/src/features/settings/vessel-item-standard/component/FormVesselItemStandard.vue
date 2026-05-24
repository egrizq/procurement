<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 transition-opacity" @click="handleClose"></div>

    <!-- Dialog -->
    <div class="flex min-h-screen items-center justify-center p-4">
      <div
        class="relative w-full max-w-xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 dark:text-white"
        @click.stop
      >
        <!-- Header -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-medium">{{ formTitle }}</h3>
          <button
            @click="handleClose"
            class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <span class="sr-only">Close frame</span>
            <X class="h-6 w-6" />
          </button>
        </div>

        <div
          v-if="errorMessage"
          class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="isDuplicate"
          class="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200"
        >
          This item is already set up for this vessel.
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Form fields -->
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Vessel</label
            >
            <select
              v-if="mode !== 'view'"
              v-model="formData.vesselId"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Vessel</option>
              <option v-for="vessel in vessels" :key="vessel.id" :value="vessel.id">
                {{ vessel.name }}
              </option>
            </select>
            <div
              v-else
              class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              {{ viewVesselName }}
            </div>
          </div>

          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Item</label
            >
            <select
              v-if="mode !== 'view'"
              v-model="formData.itemId"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Item</option>
              <option v-for="item in items" :key="item.id" :value="item.id">
                {{ item.itemCode }} - {{ item.name }}
              </option>
            </select>
            <div
              v-else
              class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              {{ viewItemName }}
            </div>
          </div>

          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Periode</label
            >
            <select
              v-if="mode !== 'view'"
              v-model="formData.periode"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Periode</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="occasional">Occasional</option>
            </select>
            <div
              v-else
              class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              {{ standard?.periode }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >Min. Stock </label
              >
              <input
                v-if="mode !== 'view'"
                type="number"
                v-model="formData.minStock"
                min="0"
                required
                class="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <div
                v-else
                class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                {{ standard?.minStock }}
              </div>
            </div>

            <div class="col-span-2 sm:col-span-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >Max. Stock</label
              >
              <input
                v-if="mode !== 'view'"
                type="number"
                v-model="formData.maxStock"
                min="0"
                required
                class="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <div
                v-else
                class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                {{ standard?.maxStock }}
              </div>
            </div>
          </div>

          <!-- PO Threshold -->
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PO Threshold (IDR)
              <span class="text-xs text-gray-400 font-normal ml-1">— Opsional, untuk auto-approve PO</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
              <input
                v-if="mode !== 'view'"
                type="number"
                v-model="formData.poThreshold"
                min="0"
                placeholder="0"
                class="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 bg-white text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <div
                v-else
                class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                {{ standard?.poThreshold ? `Rp ${Number(standard.poThreshold).toLocaleString('id-ID')}` : '— Tidak diset' }}
              </div>
            </div>
            <p v-if="mode !== 'view'" class="text-xs text-gray-400 mt-1">
              Jika total PO &lt; threshold → Auto Approved. Jika kosong / 0 → selalu Pending Approval.
            </p>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              @click="handleClose"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {{ mode === 'view' ? 'Close' : 'Cancel' }}
            </button>
            <button
              v-if="mode !== 'view'"
              type="submit"
              :disabled="loading || isDuplicate"
              :class="[
                'inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                isDuplicate || loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              ]"
            >
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ mode === 'edit' ? 'Update' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import { useVesselStore } from '../../../vessel/store'
import { useItemStore } from '../../../master-data/items/store'
import { useVesselItemStandardStore } from '../store'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  standard: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'submit'])

const vesselStore = useVesselStore()
const itemStore = useItemStore()
const standardStore = useVesselItemStandardStore()

const loading = ref(false)
const errorMessage = ref('')
const vessels = ref([])
const items = ref([])

const formData = ref({
  vesselId: '',
  itemId: '',
  periode: '',
  minStock: 0,
  maxStock: 0,
  poThreshold: null,
})

const formTitle = computed(() => {
  if (props.mode === 'view') return 'View Standard'
  return props.mode === 'edit' ? 'Edit Standard' : 'Add Standard'
})

const viewVesselName = computed(() => {
  return props.standard?.vessel?.name || ''
})

const viewItemName = computed(() => {
  const item = props.standard?.item
  return item ? `${item.name} (${item.itemCode})` : ''
})

const isDuplicate = computed(() => {
  if (props.mode !== 'add' && !props.mode) return false;
  if (!formData.value.vesselId || !formData.value.itemId) return false;

  return standardStore.items.some(
    (item) =>
      item.vesselId === Number(formData.value.vesselId) &&
      item.itemId === Number(formData.value.itemId) &&
      item.id !== props.standard?.id
  )
})

const resetForm = () => {
  formData.value = {
    vesselId: '',
    itemId: '',
    periode: '',
    minStock: 0,
    maxStock: 0,
    poThreshold: null,
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

// Watch for standard changes to populate form
watch(
  () => props.standard,
  (newStandard) => {
    if (newStandard) {
      formData.value = {
        vesselId: newStandard.vessel?.id || '',
        itemId: newStandard.item?.id || '',
        periode: newStandard.periode || '',
        minStock: newStandard.minStock || 0,
        maxStock: newStandard.maxStock || 0,
        poThreshold: newStandard.poThreshold != null ? Number(newStandard.poThreshold) : null,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

// Load dropdowns when dialog opens
onMounted(
  () => {
    if (props.isOpen && props.mode !== 'view') {
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
      periode: formData.value.periode,
      minStock: Number(formData.value.minStock),
      maxStock: Number(formData.value.maxStock),
      poThreshold: formData.value.poThreshold != null && formData.value.poThreshold !== ''
        ? Number(formData.value.poThreshold)
        : null,
    }
    emit('submit', submitData)
  } catch (error) {
    errorMessage.value = error.message || 'Failed to submit form'
  } finally {
    loading.value = false
  }
}
</script>
