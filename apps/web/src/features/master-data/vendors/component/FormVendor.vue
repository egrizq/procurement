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
      <!-- Vendor Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
          Company Name <span v-if="mode !== 'view'" class="text-red-500">*</span>
        </label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          :required="mode !== 'view'"
          :disabled="mode === 'view'"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="PT Samudra Engine Service"
        />
      </div>

      <!-- Category and City Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Category -->
        <div>
          <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
            Category <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            v-if="mode === 'view'"
            id="category"
            v-model="formData.category"
            type="text"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          />
          <select
            v-else
            id="category"
            v-model="formData.category"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Category</option>
            <option value="Engine">Engine</option>
            <option value="Electrical">Electrical</option>
            <option value="Safety">Safety</option>
            <option value="Mechanical">Mechanical</option>
            <option value="General">General</option>
          </select>
        </div>

        <!-- City -->
        <div>
          <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
            City <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            id="city"
            v-model="formData.city"
            type="text"
            :required="mode !== 'view'"
            :disabled="mode === 'view'"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Jakarta"
          />
        </div>
      </div>

      <!-- Address -->
      <div>
        <label for="address" class="block text-sm font-medium text-gray-700 mb-1">
          Address <span v-if="mode !== 'view'" class="text-red-500">*</span>
        </label>
        <textarea
          id="address"
          v-model="formData.address"
          rows="2"
          :required="mode !== 'view'"
          :disabled="mode === 'view'"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Jl. Pelabuhan Tanjung Priok No. 45"
        ></textarea>
      </div>

      <!-- Phone and Email Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Phone -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
            Phone <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            id="phone"
            v-model="formData.phone"
            type="tel"
            :required="mode !== 'view'"
            :disabled="mode === 'view'"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="+62-21-43921234"
          />
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            :required="mode !== 'view'"
            :disabled="mode === 'view'"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="info@company.com"
          />
        </div>
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
  vendor: {
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
  name: '',
  category: '',
  address: '',
  phone: '',
  email: '',
  city: '',
})

const formTitle = computed(() => {
  if (props.mode === 'view') return 'View Vendor Details'
  return props.mode === 'edit' ? 'Edit Vendor' : 'Add New Vendor'
})

const resetForm = () => {
  formData.value = {
    name: '',
    category: '',
    address: '',
    phone: '',
    email: '',
    city: '',
  }
}

// Watch for vendor changes to populate form
watch(
  () => props.vendor,
  (newVendor) => {
    if (newVendor) {
      formData.value = {
        name: newVendor.name || '',
        category: newVendor.category || '',
        address: newVendor.address || '',
        phone: newVendor.phone || '',
        email: newVendor.email || '',
        city: newVendor.city || '',
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
