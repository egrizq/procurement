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
      <!-- Item Code -->
      <div>
        <label for="itemCode" class="block text-sm font-medium text-gray-700 mb-1">
          Item Code <span v-if="mode !== 'view'" class="text-red-500">*</span>
        </label>
        <input
          id="itemCode"
          v-model="formData.itemCode"
          type="text"
          :required="mode !== 'view'"
          :disabled="mode === 'view'"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="ITM-001"
        />
      </div>

      <!-- Item Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
          Item Name <span v-if="mode !== 'view'" class="text-red-500">*</span>
        </label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          :required="mode !== 'view'"
          :disabled="mode === 'view'"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Engine Oil SAE 40"
        />
      </div>

      <!-- Category and Unit Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Category -->
        <div>
          <label for="categoryName" class="block text-sm font-medium text-gray-700 mb-1">
            Category <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            v-if="mode === 'view'"
            id="categoryName"
            v-model="formData.categoryName"
            type="text"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          />
          <select
            v-else
            id="categoryName"
            v-model="formData.categoryName"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Category</option>
            <option value="Engine Parts">Engine Parts</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Safety">Safety</option>
            <option value="Electronics">Electronics</option>
            <option value="Tools">Tools</option>
          </select>
        </div>

        <!-- Unit -->
        <div>
          <label for="unit" class="block text-sm font-medium text-gray-700 mb-1">
            Unit <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            v-if="mode === 'view'"
            id="unit"
            v-model="formData.unit"
            type="text"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          />
          <select
            v-else
            id="unit"
            v-model="formData.unit"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Unit</option>
            <option value="Pcs">Pcs</option>
            <option value="Unit">Unit</option>
            <option value="Liter">Liter</option>
            <option value="Meter">Meter</option>
            <option value="Set">Set</option>
            <option value="Box">Box</option>
            <option value="Kg">Kg</option>
          </select>
        </div>
      </div>

      <!-- Status -->
      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
          Status <span v-if="mode !== 'view'" class="text-red-500">*</span>
        </label>
        <input
          v-if="mode === 'view'"
          id="status"
          v-model="formData.status"
          type="text"
          disabled
          class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
        />
        <select
          v-else
          id="status"
          v-model="formData.status"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select Status</option>
          <option value="Publish">Publish</option>
          <option value="Unpublish">Unpublish</option>
        </select>
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          v-model="formData.description"
          rows="3"
          :disabled="mode === 'view'"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter item description..."
        ></textarea>
      </div>
    </form>
  </FormDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FormDialog from '@/components/base/form/Form.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  item: {
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

const loading = ref(false)

const formData = ref({
  itemCode: '',
  name: '',
  categoryName: '',
  unit: '',
  status: 'Publish',
  description: '',
})

const formTitle = computed(() => {
  if (props.mode === 'view') return 'View Item Details'
  return props.mode === 'edit' ? 'Edit Item' : 'Add New Item'
})

const resetForm = () => {
  formData.value = {
    itemCode: '',
    name: '',
    categoryName: '',
    unit: '',
    status: 'Publish',
    description: '',
  }
}

// Watch for item changes to populate form
watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      formData.value = {
        itemCode: newItem.itemCode || '',
        name: newItem.name || '',
        categoryName: newItem.category?.name || '',
        unit: newItem.unit || '',
        status: newItem.status || 'Publish',
        description: newItem.description || '',
      }
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSubmit = async () => {
  loading.value = true

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  emit('submit', { ...formData.value })
  loading.value = false
  handleClose()
}
</script>
