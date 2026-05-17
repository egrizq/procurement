<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="fixed inset-0 bg-black/50" @click="close"></div>

    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl" @click.stop>
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          <button
            type="button"
            @click="close"
            class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Close"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit.prevent="submit">
          <label class="block">
            <span class="text-sm font-medium text-gray-700">Username</span>
            <input
              v-model.trim="form.username"
              :readonly="mode === 'view'"
              required
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
            />
          </label>

          <label class="block">
            <span class="text-sm font-medium text-gray-700">Email</span>
            <input
              v-model.trim="form.email"
              :readonly="mode === 'view'"
              type="email"
              required
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label class="block sm:col-span-2">
            <span class="text-sm font-medium text-gray-700">Full Name</span>
            <input
              v-model.trim="form.fullName"
              :readonly="mode === 'view'"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label v-if="mode !== 'view'" class="block sm:col-span-2">
            <span class="text-sm font-medium text-gray-700">
              Password{{ mode === 'edit' ? ' (leave blank to keep current)' : '' }}
            </span>
            <input
              v-model="form.password"
              :required="mode === 'add'"
              type="password"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label class="block">
            <span class="text-sm font-medium text-gray-700">Role</span>
            <select
              v-model="form.type"
              :disabled="mode === 'view'"
              required
              class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Role</option>
              <option v-for="type in userTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-medium text-gray-700">Department</span>
            <select
              v-model="form.department"
              :disabled="mode === 'view'"
              required
              class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Department</option>
              <option v-for="department in departments" :key="department" :value="department">
                {{ department }}
              </option>
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-medium text-gray-700">Vessel</span>
            <select
              v-model="form.vesselId"
              :disabled="mode === 'view'"
              required
              class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Vessel</option>
              <option v-for="vessel in vessels" :key="vessel.id" :value="vessel.id">
                {{ vessel.name }}
              </option>
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-medium text-gray-700">Status</span>
            <select
              v-model="form.status"
              :disabled="mode === 'view'"
              class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
            </select>
          </label>

          <label class="block sm:col-span-2">
            <span class="text-sm font-medium text-gray-700">Position</span>
            <input
              v-model.trim="form.position"
              :readonly="mode === 'view'"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <div class="mt-2 flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              @click="close"
              class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {{ mode === 'view' ? 'Close' : 'Cancel' }}
            </button>
            <button
              v-if="mode !== 'view'"
              type="submit"
              class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Save class="mr-2 h-4 w-4" />
              {{ mode === 'edit' ? 'Update' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Save, X } from 'lucide-vue-next'
import { useVesselStore } from '@/features/vessel/store.js'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  mode: { type: String, required: true },
  user: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit'])

const userTypes = ['Admin', 'Staff', 'Manager', 'Crew']
const departments = ['IT', 'HR', 'Finance', 'Deck', 'Engine']
const statuses = ['Contract', 'Permanent', 'Intern', 'Leave']

const vesselStore = useVesselStore()
const vessels = ref([])

const emptyForm = () => ({
  username: '',
  email: '',
  password: '',
  fullName: '',
  type: '',
  department: '',
  vesselId: '',
  position: '',
  status: 'Contract',
})

const form = ref(emptyForm())

const title = computed(() => {
  if (props.mode === 'view') return 'View User'
  return props.mode === 'edit' ? 'Edit User' : 'Add User'
})

const populateForm = () => {
  if (!props.user) {
    form.value = emptyForm()
    return
  }

  form.value = {
    username: props.user.username || '',
    email: props.user.email || '',
    password: '',
    fullName: props.user.fullName || '',
    type: props.user.type || '',
    department: props.user.department || '',
    vesselId: props.user.vesselId || props.user.vessel?.id || '',
    position: props.user.position || '',
    status: props.user.status || 'Contract',
  }
}

const loadVessels = async () => {
  await vesselStore.fetchVessels(1, 100, '')
  vessels.value = vesselStore.vessels
}

watch(() => props.user, populateForm, { immediate: true })

onMounted(loadVessels)

const close = () => {
  emit('close')
}

const submit = () => {
  const payload = {
    username: form.value.username,
    email: form.value.email,
    fullName: form.value.fullName || undefined,
    type: form.value.type,
    department: form.value.department,
    vesselId: Number(form.value.vesselId),
    position: form.value.position || undefined,
    status: form.value.status,
  }

  if (form.value.password) {
    payload.password = form.value.password
  }

  emit('submit', payload)
}
</script>
