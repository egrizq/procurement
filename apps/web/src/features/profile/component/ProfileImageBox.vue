<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex flex-col items-center">
      <div
        class="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden"
      >
        <img
          v-if="profile.imgUrl"
          :src="profile.imgUrl"
          :alt="profile.fullName"
          class="w-full h-full object-cover"
        />
        <div v-else class="text-center">
          <svg class="w-20 h-20 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="text-gray-500 mt-2 text-sm">No image</p>
        </div>
      </div>
      <h2 class="text-xl font-bold text-gray-900 text-center">{{ profile.fullName }}</h2>
      <p class="text-gray-600 text-center mt-1">{{ profile.position }}</p>
      <span
        class="mt-3 inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
      >
        {{ profile.type }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  profile: {
    type: Object,
    required: true,
  },
})
</script>
