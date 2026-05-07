<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-bold text-gray-900 mb-6">Personal Information</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="field in profileFields" :key="field.key">
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ field.label }}</label>
        <p class="text-gray-900 bg-gray-50 px-4 py-2 rounded border border-gray-200">
          {{ field.value || "-" }} 
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  profile: {
    type: Object,
    required: true,
  },
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const profileFields = computed(() => {
  const fields = [
    { key: 'username', label: 'Username', value: props.profile.username },
    { key: 'email', label: 'Email', value: props.profile.email },
    { key: 'fullName', label: 'Full Name', value: props.profile.fullName },
    { key: 'position', label: 'Position', value: props.profile.position },
    { key: 'department', label: 'Department', value: props.profile.department },
    { key: 'type', label: 'Type', value: props.profile.type },
    { key: 'status', label: 'Status', value: props.profile.status },
    { key: 'vessel', label: 'Vessel', value: props.profile.vessel?.name || 'N/A' },
  ]

  if (props.profile.leaveDate) {
    fields.push({
      key: 'leaveDate',
      label: 'Leave Date',
      value: formatDate(props.profile.leaveDate),
    })
  }

  return fields
})
</script>
