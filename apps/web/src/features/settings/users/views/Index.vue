<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Manage Users</h1>
        <p class="mt-1 text-sm text-gray-500">Create users and assign their role, vessel, and status.</p>
      </div>
      <button
        @click="openAddDialog"
        class="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <Plus class="mr-2 h-4 w-4" />
        Add User
      </button>
    </div>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_160px_180px_160px]">
      <SearchFilter v-model="searchQuery" placeholder="Search username, email, or name..." />
      <select v-model="filters.type" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
        <option value="">All Roles</option>
        <option v-for="type in userTypes" :key="type" :value="type">{{ type }}</option>
      </select>
      <select v-model="filters.department" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
        <option value="">All Departments</option>
        <option v-for="department in departments" :key="department" :value="department">
          {{ department }}
        </option>
      </select>
      <select v-model="filters.status" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
        <option value="">All Statuses</option>
        <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
      </select>
    </div>

    <DataTable
      :columns="columns"
      :data="users"
      :pagination="pagination"
      @update:current-page="handlePageChange"
      @row-click="openViewDialog"
    >
      <template #cell-fullName="{ row }">
        <div class="font-medium text-gray-900">{{ row.fullName || row.username }}</div>
        <div class="text-xs text-gray-500">{{ row.email }}</div>
      </template>

      <template #cell-type="{ row }">
        <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          {{ row.type }}
        </span>
      </template>

      <template #cell-status="{ row }">
        <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(row.status)">
          {{ row.status }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex justify-end gap-2">
          <button
            @click.stop="openViewDialog(row)"
            class="rounded-md p-2 text-gray-500 hover:bg-gray-100"
            title="View user"
          >
            <Eye class="h-4 w-4" />
          </button>
          <button
            @click.stop="openEditDialog(row)"
            class="rounded-md p-2 text-blue-500 hover:bg-blue-50"
            title="Edit user"
          >
            <Edit class="h-4 w-4" />
          </button>
          <button
            @click.stop="deactivateUser(row)"
            class="rounded-md p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
            :disabled="row.status === 'Leave'"
            title="Deactivate user"
          >
            <UserX class="h-4 w-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <FormUser
      v-if="dialogOpen"
      :is-open="dialogOpen"
      :mode="dialogMode"
      :user="selectedUser"
      @close="closeDialog"
      @submit="saveUser"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { Edit, Eye, Plus, UserX } from 'lucide-vue-next'
import DataTable from '@/components/base/data-table/DataTable.vue'
import SearchFilter from '@/components/base/data-table/SearchFilter.vue'
import { showError, showSuccess } from '@/services/notification.js'
import { getErrorMessage } from '@/utils/errorHandler.js'
import FormUser from '../component/FormUser.vue'
import { useSettingsUserStore } from '../store.js'

const userStore = useSettingsUserStore()

const userTypes = ['Admin', 'Staff', 'Manager', 'Crew']
const departments = ['IT', 'HR', 'Finance', 'Deck', 'Engine']
const statuses = ['Contract', 'Permanent', 'Intern', 'Leave']

const users = ref([])
const pagination = ref({})
const currentPage = ref(1)
const searchQuery = ref('')
const filters = reactive({
  type: '',
  department: '',
  status: '',
})

const dialogOpen = ref(false)
const dialogMode = ref('add')
const selectedUser = ref(null)

const columns = [
  { key: 'username', label: 'Username' },
  { key: 'fullName', label: 'User' },
  { key: 'type', label: 'Role' },
  { key: 'department', label: 'Department' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const loadUsers = async () => {
  try {
    await userStore.fetchUsers({
      page: currentPage.value,
      limit: 10,
      search: searchQuery.value,
      type: filters.type || undefined,
      department: filters.department || undefined,
      status: filters.status || undefined,
    })
    users.value = userStore.users
    pagination.value = userStore.pagination
  } catch (error) {
    showError(getErrorMessage(error) || 'Failed to load users')
  }
}

onMounted(loadUsers)

let searchTimeout = null
watch([searchQuery, filters], () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadUsers()
  }, 400)
})

const handlePageChange = (page) => {
  currentPage.value = page
  loadUsers()
}

const statusClass = (status) => {
  const classes = {
    Contract: 'bg-blue-50 text-blue-700',
    Permanent: 'bg-green-50 text-green-700',
    Intern: 'bg-amber-50 text-amber-700',
    Leave: 'bg-gray-100 text-gray-600',
  }
  return classes[status] || 'bg-gray-100 text-gray-600'
}

const openAddDialog = () => {
  dialogMode.value = 'add'
  selectedUser.value = null
  dialogOpen.value = true
}

const openEditDialog = (user) => {
  dialogMode.value = 'edit'
  selectedUser.value = user
  dialogOpen.value = true
}

const openViewDialog = (user) => {
  dialogMode.value = 'view'
  selectedUser.value = user
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  selectedUser.value = null
}

const saveUser = async (payload) => {
  try {
    if (dialogMode.value === 'edit') {
      await userStore.updateUser(selectedUser.value.id, payload)
      showSuccess('User updated successfully')
    } else {
      await userStore.createUser(payload)
      showSuccess('User created successfully')
    }
    closeDialog()
    loadUsers()
  } catch (error) {
    showError(getErrorMessage(error) || 'Failed to save user')
  }
}

const deactivateUser = async (user) => {
  if (!confirm(`Deactivate ${user.fullName || user.username}?`)) return

  try {
    await userStore.deleteUser(user.id)
    showSuccess('User deactivated successfully')
    loadUsers()
  } catch (error) {
    showError(getErrorMessage(error) || 'Failed to deactivate user')
  }
}
</script>
