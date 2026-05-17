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
            <option value=0>Engine</option>
            <option value=1>Electrical</option>
            <option value=2>Safety</option>
            <option value=3>Mechanical</option>
            <option value=4>General</option>
          </select>
        </div>

        <!-- City -->
        <div>
          <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
            City <span v-if="mode !== 'view'" class="text-red-500">*</span>
          </label>
          <select
            v-if="mode === 'view'"
            id="city"
            v-model="formData.city"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          >
            <option value="">Select City</option>
            <option v-for="city in listCities" :key="city.id" :value="city.cityName">
              {{ city.cityName }}
            </option>
          </select>
          <select
            v-else
            id="city"
            v-model="formData.city"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select City</option>
            <option v-for="city in listCities" :key="city.id" :value="city.cityName">
              {{ city.cityName }}
            </option>
          </select>
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
            type="text"
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
import { list } from '@primeuix/themes/aura/autocomplete'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  vendor: {
    type: Object,
    default: null,
  },
  listCities: {
    type: Object,
    default: () => [],
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
  try {
    console.log('Submitting form with data:', formData.value)
    await emit('submit', { ...formData.value })
    handleClose()
  } catch (error) {

  } finally {
    loading.value = false
  }
}
</script>
