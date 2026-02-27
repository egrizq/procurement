<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Search Input -->
      <div class="flex-1">
        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            :size="20"
          />
          <input
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            type="text"
            :placeholder="placeholder"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <!-- Filter Selects -->
      <slot name="filters"></slot>
    </div>
  </div>
</template>

<script setup>
import { Search } from 'lucide-vue-next'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search...',
  },
})

defineEmits(['update:modelValue'])
</script>
