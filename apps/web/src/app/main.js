import '../assets/styles/styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import { useTokenStore } from '@/features/token/store'
import { useNotificationStore } from '@/features/notification/store'
import { showError } from '@/services/notification'

async function initializeApp() {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
    },
  })

  const tokenStore = useTokenStore()
  await tokenStore.fetchToken()
  if (!tokenStore.token) {
    showError(tokenStore.error, 'Initialization Error')
  }

  await tokenStore.fetchTokenInfo()
  if (!tokenStore.data) {
    // showError(tokenStore.error)
    router.push('/login')
  } else {
    // User is authenticated — boot the notification system
    const notificationStore = useNotificationStore()
    notificationStore.fetchUnreadCount()
    notificationStore.connectSSE()
  }

  app.mount('#app')
}

initializeApp()
