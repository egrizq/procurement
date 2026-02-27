<template>
  <div class="space-y-6">
    <!-- Profile Header -->
    <!-- <div class="bg-white rounded-lg shadow p-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
      <p class="text-gray-600">User profile information</p>
    </div> -->

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-center items-center h-64">
        <p class="text-gray-500">Loading profile...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 rounded-lg shadow p-6 border border-red-200">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Image Box -->
      <div class="lg:col-span-1">
        <ProfileImageBox :profile="profile" />
      </div>

      <!-- Profile Details -->
      <div class="lg:col-span-2">
        <ProfileInfoBox :profile="profile" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-6">
      <p class="text-gray-500 text-center">No profile data available</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ProfileImageBox from '../component/ProfileImageBox.vue'
import ProfileInfoBox from '../component/ProfileInfoBox.vue'
import useProfileStore from '../store'

const profileStore = useProfileStore()
const profile = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    loading.value = true
    error.value = null
    await profileStore.fetchProfile()
    profile.value = profileStore.profile
  } catch (err) {
    error.value = profileStore.error || 'Failed to load profile data'
  } finally {
    loading.value = false
  }
})
</script>
