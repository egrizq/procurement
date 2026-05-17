<template>
  <FormDialog
    :is-open="isOpen"
    :title="formTitle"
    :show-footer="true"
    size="md"
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
      <!-- Category ID -->
      <!-- <div v-if="mode !== 'add'">
        <label for="categoryId" class="block text-sm font-medium text-gray-700 mb-1">
          Category ID
        </label>
        <input
          id="categoryId"
          v-model="formData.id"
          type="text"
          disabled
          class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
        />
      </div> -->

      <!-- Category Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
          Category Name <span v-if="mode !== 'view'" class="text-red-500">*</span>
        </label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          :required="mode !== 'view'"
          :disabled="mode === 'view'"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="e.g. Consumables"
        />
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
          <option value="Publish">Publish</option>
          <option value="Unpublish">Unpublish</option>
        </select>
      </div>
    </form>
  </FormDialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import FormDialog from '@/components/base/form/Form.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  item: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'add', // 'add', 'edit', 'view'
  },
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  name: '',
  status: 'Publish',
})

const formTitle = computed(() => {
  switch (props.mode) {
    case 'add':
      return 'Add Category'
    case 'edit':
      return 'Edit Category'
    case 'view':
      return 'View Category'
    default:
      return 'Category Details'
  }
})

// Update form data when item changes or modal opens
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      if (props.item) {
        formData.value = { ...props.item }
      } else {
        formData.value = {
          name: '',
          status: 'Publish',
        }
      }
    }
  }
)

const handleClose = () => {
  emit('close')
}

const handleSubmit = () => {
  if (props.mode === 'view') {
    handleClose()
    return
  }

  // Basic validation
  if (!formData.value.name || !formData.value.status) {
    return
  }

  const submitData = {
    name: formData.value.name,
    status: formData.value.status,
  }

  emit('submit', submitData)
}
</script>