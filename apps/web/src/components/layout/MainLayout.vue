<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navbar -->
    <Navbar
      :nav-links="navLinks"
      :logo-icon="logoIcon"
      :show-notifications="true"
      :show-profile="true"
      :profile-menu-items="profileMenuItems"
      @profile-menu-click="handleProfileMenuClick"
      @notification-click="handleNotificationClick"
    >
      <template #left>
        <button
          @click="toggleSidebar"
          class="lg:hidden mr-2 p-2 rounded-md text-gray-400 hover:bg-white/5 hover:text-white"
        >
          <Menu :size="24" />
        </button>
      </template>
    </Navbar>

    <!-- Sidebar -->
    <Sidebar :is-open="sidebarOpen" @close="closeSidebar" />

    <!-- Main Content Area -->
    <div
      class="pt-16 min-h-screen flex flex-col transition-all duration-300"
      :class="sidebarOpen ? 'lg:pl-64' : 'pl-0'"
    >
      <main class="flex-1 p-6">
        <router-view />
      </main>

      <!-- Footer -->
      <Footer />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, Anchor } from 'lucide-vue-next'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'
import Footer from './Footer.vue'
import { useAuthStore } from '../../features/auth/store'
import { showSuccess } from '../../services/notification'

const authStore = useAuthStore()

const router = useRouter()
const sidebarOpen = ref(true)
const logoIcon = Anchor

const navLinks = [
  { label: 'Dashboard', to: '/' },
  { label: 'Master Data', to: '/master-data/items' },
  { label: 'Request', to: '/request' },
]

const profileMenuItems = [
  { label: 'Your Profile', href: '#', action: 'profile' },
  // { label: 'Settings', href: '#', action: 'settings' },
  { label: 'Sign out', href: '#', action: 'signout' },
]

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const handleProfileMenuClick = (action) => {
  console.log('Profile menu action:', action)
  if (action === 'profile') {
    router.push('/profile')
  } else if (action === 'settings') {
    router.push('/settings')
  } else if (action === 'signout') {
    authStore.logout().then(() => {
      showSuccess('You have successfully logged out!')
      router.push('/login')
    })
  }
}

const handleNotificationClick = () => {
  console.log('Notification clicked')
}
</script>
