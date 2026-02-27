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
      <!-- IMO Number -->
      <div>
        <label for="imoNumber" class="block text-sm font-medium text-gray-700 mb-1">
          IMO Number <span v-if="mode !== 'view'" class="text-red-500">*</span>
        </label>
        <input
          id="imoNumber"
          v-model="formData.imoNumber"
          type="text"
          :required="mode !== 'view'"
          :disabled="mode === 'view'"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="IMO9123456"
        />
      </div>

      <!-- Vessel Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
          Vessel Name <span v-if="mode !== 'view'" class="text-red-500">*</span>
        </label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          :required="mode !== 'view'"
          :disabled="mode === 'view'"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="MV Samudra Jaya"
        />
      </div>

      <!-- Flag and Type Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Flag -->
        <div>
          <label for="flag" class="block text-sm font-medium text-gray-700 mb-1">
            Flag <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            id="flag"
            v-model="formData.flag"
            type="text"
            :required="mode !== 'view'"
            :disabled="mode === 'view'"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Indonesia"
          />
        </div>

        <!-- Type -->
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700 mb-1">
            Type <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            v-if="mode === 'view'"
            id="type"
            v-model="formData.type"
            type="text"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          />
          <select
            v-else
            id="type"
            v-model="formData.type"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Type</option>
            <option value="Container Ship">Container Ship</option>
            <option value="Cargo Ship">Cargo Ship</option>
            <option value="Tanker">Tanker</option>
            <option value="Bulk Carrier">Bulk Carrier</option>
            <option value="General Cargo">General Cargo</option>
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

      <!-- Image URL -->
      <div>
        <label for="imgUrl" class="block text-sm font-medium text-gray-700 mb-1"> Image URL </label>
        <input
          id="imgUrl"
          v-model="formData.imgUrl"
          type="url"
          :disabled="mode === 'view'"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="https://example.com/vessel-image.jpg"
        />
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
  vessel: {
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
  imoNumber: '',
  name: '',
  flag: '',
  type: '',
  status: 'Publish',
  imgUrl: '',
})

const formTitle = computed(() => {
  if (props.mode === 'view') return 'View Vessel Details'
  return props.mode === 'edit' ? 'Edit Vessel' : 'Add New Vessel'
})

const resetForm = () => {
  formData.value = {
    imoNumber: '',
    name: '',
    flag: '',
    type: '',
    status: 'Publish',
    imgUrl: '',
  }
}

// Watch for vessel changes to populate form
watch(
  () => props.vessel,
  (newVessel) => {
    if (newVessel) {
      formData.value = {
        imoNumber: newVessel.imoNumber || '',
        name: newVessel.name || '',
        flag: newVessel.flag || '',
        type: newVessel.type || '',
        status: newVessel.status || 'Publish',
        imgUrl: newVessel.imgUrl || '',
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
