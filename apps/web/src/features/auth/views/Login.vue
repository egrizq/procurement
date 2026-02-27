<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
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

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await authStore.login(email.value, password.value)
    showSuccess('You have successfully logged in!')
    router.push({ name: 'dashboard' })
  } catch (error) {
    errorMessage.value = error.errors[0].message
  } finally {
    isLoading.value = false
  }
}
</script>
