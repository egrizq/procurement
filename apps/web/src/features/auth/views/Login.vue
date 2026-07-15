<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Procurement ERP</h1>
        <p class="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="flex flex-col gap-2">
          <label for="email" class="text-sm font-medium text-gray-700"> Email </label>
          <InputText
            id="email"
            v-model="email"
            placeholder="Enter your email"
            required
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="password" class="text-sm font-medium text-gray-700"> Password </label>
          <Password
            id="password"
            v-model="password"
            placeholder="Enter your password"
            :feedback="false"
            :toggleMask="true"
            required
            class="w-full"
            inputClass="w-full"
          />
        </div>

        <Message v-if="errorMessage" severity="error" :closable="false">
          {{ errorMessage }}
        </Message>

        <Button
          type="submit"
          :loading="isLoading"
          label="Sign In"
          class="w-full"
          :disabled="isLoading"
        />
      </form>

      <div class="mt-8 border-t border-gray-200 pt-6">
        <div class="mb-3">
          <h2 class="text-sm font-semibold text-gray-800">Akun Demo TA</h2>
          <p class="mt-1 text-xs text-gray-500">Klik akun untuk mengisi email dan password.</p>
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="account in demoAccounts"
            :key="account.role"
            type="button"
            class="rounded-lg border border-gray-200 p-3 text-left transition hover:border-primary-400 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            :aria-label="`Gunakan akun demo ${account.role}`"
            @click="selectDemoAccount(account)"
          >
            <span class="text-xs font-semibold uppercase tracking-wide text-primary-600">
              {{ account.role }}
            </span>
            <span class="mt-1 block truncate text-xs text-gray-700">{{ account.email }}</span>
            <span class="mt-0.5 block text-xs text-gray-500">Password: {{ account.password }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { showSuccess } from '../../../services/notification'
import { getErrorMessage } from '../../../utils/errorHandler'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const demoAccounts = [
  { role: 'Admin', email: 'admin@limm.co.id', password: 'password123' },
  { role: 'Manager', email: 'budi.wibowo@limm.co.id', password: 'password123' },
  { role: 'Staff', email: 'arif.santoso@limm.co.id', password: 'password123' },
  { role: 'Crew', email: 'eko.prasetyo@limm.co.id', password: 'password123' },
]

const selectDemoAccount = (account) => {
  email.value = account.email
  password.value = account.password
  errorMessage.value = ''
}

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await authStore.login(email.value, password.value)
    showSuccess('You have successfully logged in!')
    router.push({ name: 'dashboard' })
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}
</script>
