<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Role Access</h1>
      <p class="mt-1 text-sm text-gray-500">Control which roles can open each application module.</p>
    </div>

    <div class="overflow-hidden rounded-lg bg-white shadow">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px]">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Module</th>
              <th
                v-for="userType in USER_TYPES"
                :key="userType"
                class="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500"
              >
                {{ userType }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="module in MODULES" :key="module.slug" class="hover:bg-gray-50">
              <td class="px-6 py-4" :class="module.parent ? 'pl-10' : ''">
                <div class="font-medium text-gray-900" :class="module.parent ? 'text-sm' : ''">
                  {{ module.label }}
                </div>
                <div class="text-xs text-gray-500">{{ module.slug }}</div>
              </td>
              <td v-for="userType in USER_TYPES" :key="userType" class="px-6 py-4 text-center">
                <label class="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    class="sr-only"
                    :checked="store.hasAccess(userType, module.slug)"
                    :disabled="isLocked(userType, module.slug) || savingKey === `${userType}:${module.slug}`"
                    @change="toggleAccess(userType, module.slug, $event.target.checked)"
                  />
                  <span
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="[
                      store.hasAccess(userType, module.slug) ? 'bg-indigo-600' : 'bg-gray-300',
                      isLocked(userType, module.slug) ? 'opacity-60' : '',
                    ]"
                  >
                    <span
                      class="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
                      :class="store.hasAccess(userType, module.slug) ? 'translate-x-5' : 'translate-x-1'"
                    ></span>
                  </span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { showError, showSuccess } from '@/services/notification.js'
import { getErrorMessage } from '@/utils/errorHandler.js'
import { MODULES, USER_TYPES, useModuleAccessStore } from '../store.js'

const store = useModuleAccessStore()
const savingKey = ref('')

const loadMappings = async () => {
  try {
    await store.fetchMappings()
  } catch (error) {
    showError(getErrorMessage(error) || 'Failed to load role access')
  }
}

onMounted(loadMappings)

const isLocked = (userType, moduleSlug) => {
  return (
    userType === 'Admin' &&
    ['settings', 'settings/users', 'settings/module-access'].includes(moduleSlug) &&
    store.hasAccess(userType, moduleSlug)
  )
}

const toggleAccess = async (userType, moduleSlug, enabled) => {
  savingKey.value = `${userType}:${moduleSlug}`
  try {
    await store.setAccess(userType, moduleSlug, enabled)
    showSuccess('Role access updated successfully')
  } catch (error) {
    showError(getErrorMessage(error) || 'Failed to update role access')
    await loadMappings()
  } finally {
    savingKey.value = ''
  }
}
</script>
