# Form Components Documentation

## Overview

The form system consists of two layers:

1. **Base Form Dialog** - Reusable modal/dialog component (`components/base/form/Form.vue`)
2. **Feature Forms** - Feature-specific form components that use the base dialog

## Base Form Dialog Component

### Location

`src/components/base/form/Form.vue`

### Features

- ✅ Modal overlay with backdrop blur
- ✅ Customizable size (sm, md, lg, xl, 2xl)
- ✅ Header with title and close button
- ✅ Scrollable content area
- ✅ Footer with cancel and submit buttons
- ✅ Loading state with spinner
- ✅ Smooth transitions
- ✅ Teleport to body for proper z-index
- ✅ Close on overlay click (configurable)
- ✅ Slot-based customization

### Props

| Prop             | Type    | Default       | Description                           |
| ---------------- | ------- | ------------- | ------------------------------------- |
| `isOpen`         | Boolean | -             | Controls dialog visibility (required) |
| `title`          | String  | -             | Dialog title (required)               |
| `size`           | String  | `'md'`        | Dialog size: sm, md, lg, xl, 2xl      |
| `showFooter`     | Boolean | `true`        | Show/hide footer                      |
| `cancelText`     | String  | `'Cancel'`    | Cancel button text                    |
| `submitText`     | String  | `'Save'`      | Submit button text                    |
| `loadingText`    | String  | `'Saving...'` | Loading state text                    |
| `loading`        | Boolean | `false`       | Loading state                         |
| `closeOnOverlay` | Boolean | `true`        | Close when clicking overlay           |

### Events

| Event    | Payload | Description                           |
| -------- | ------- | ------------------------------------- |
| `close`  | -       | Emitted when dialog should close      |
| `submit` | -       | Emitted when submit button is clicked |

### Slots

| Slot      | Description                                      |
| --------- | ------------------------------------------------ |
| `default` | Main content area                                |
| `footer`  | Custom footer content (replaces default buttons) |

### Basic Usage

```vue
<template>
  <FormDialog
    :is-open="isOpen"
    title="My Form"
    :loading="loading"
    @close="handleClose"
    @submit="handleSubmit"
  >
    <form @submit.prevent="handleSubmit">
      <!-- Your form fields here -->
      <input v-model="formData.name" />
    </form>
  </FormDialog>
</template>

<script setup>
import { ref } from 'vue'
import FormDialog from '@/components/base/form/Form.vue'

const isOpen = ref(false)
const loading = ref(false)
const formData = ref({ name: '' })

const handleClose = () => {
  isOpen.value = false
}

const handleSubmit = () => {
  loading.value = true
  // Submit logic here
}
</script>
```

## Feature-Specific Forms

### Example: Item Form

**Location:** `src/features/master-data/component/FormItem.vue`

Feature-specific forms wrap the base Form Dialog and provide:

- Specific form fields for the feature
- Validation logic
- Data transformation
- Integration with parent views

### Creating a New Feature Form

1. **Create the form component** in your feature's `component` folder:

```vue
<template>
  <FormDialog
    :is-open="isOpen"
    :title="formTitle"
    :loading="loading"
    @close="handleClose"
    @submit="handleSubmit"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Your specific form fields -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Field Name <span class="text-red-500">*</span>
        </label>
        <input
          v-model="formData.field"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </form>
  </FormDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FormDialog from '@/components/base/form/Form.vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  item: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit'])

const loading = ref(false)
const formData = ref({ field: '' })

const formTitle = computed(() => {
  return props.item ? 'Edit Item' : 'Add New Item'
})

// Load item data when editing
watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      formData.value = { ...newItem }
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

const resetForm = () => {
  formData.value = { field: '' }
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSubmit = async () => {
  loading.value = true
  // API call here
  emit('submit', { ...formData.value })
  loading.value = false
  handleClose()
}
</script>
```

2. **Use in your view:**

```vue
<template>
  <div>
    <button @click="openAddDialog">Add New</button>
    <button @click="editItem(item)">Edit</button>

    <FormItem
      :is-open="isFormOpen"
      :item="selectedItem"
      @close="closeForm"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FormItem from '../component/FormItem.vue'

const isFormOpen = ref(false)
const selectedItem = ref(null)
const items = ref([])

const openAddDialog = () => {
  selectedItem.value = null
  isFormOpen.value = true
}

const editItem = (item) => {
  selectedItem.value = { ...item }
  isFormOpen.value = true
}

const closeForm = () => {
  isFormOpen.value = false
  selectedItem.value = null
}

const handleFormSubmit = (formData) => {
  if (selectedItem.value) {
    // Update existing
    const index = items.value.findIndex((item) => item.id === formData.id)
    if (index !== -1) {
      items.value[index] = formData
    }
  } else {
    // Add new
    items.value.push({ id: Date.now(), ...formData })
  }
}
</script>
```

## Form Field Styling

All form fields follow consistent styling:

```vue
<!-- Text Input -->
<input
  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>

<!-- Select -->
<select
  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
>
</select>

<!-- Textarea -->
<textarea
  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
></textarea>

<!-- Label -->
<label class="block text-sm font-medium text-gray-700 mb-1">
  Field Name <span class="text-red-500">*</span>
</label>
```

## Grid Layout for Form Fields

Use responsive grid for side-by-side fields:

```vue
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <!-- Field 1 -->
  </div>
  <div>
    <!-- Field 2 -->
  </div>
</div>
```

## Best Practices

1. **Always reset form** on close to prevent stale data
2. **Use computed title** to distinguish Add vs Edit mode
3. **Watch item prop** to populate form when editing
4. **Show loading state** during async operations
5. **Emit data** instead of directly modifying props
6. **Validate required fields** with HTML5 validation or custom logic
7. **Use consistent spacing** with `space-y-4` class
8. **Group related fields** in grid layouts

## Example: Complete Item Form Integration

See the working example in:

- `src/features/master-data/component/FormItem.vue` (Form component)
- `src/features/master-data/views/Items.vue` (Integration)

This demonstrates:

- ✅ Add new items
- ✅ Edit existing items
- ✅ Form validation
- ✅ Loading states
- ✅ Responsive grid layout
- ✅ Proper data flow
