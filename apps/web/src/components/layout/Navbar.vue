<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 bg-gray-800 dark:bg-gray-800/50 dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:bottom-0 dark:after:h-px dark:after:bg-white/10"
  >
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="relative flex h-16 items-center justify-between">
        <!-- Mobile menu button -->
        <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
          <button
            type="button"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500"
          >
            <span class="absolute -inset-0.5"></span>
            <span class="sr-only">Open main menu</span>
            <Menu v-if="!mobileMenuOpen" :size="24" />
            <X v-else :size="24" />
          </button>
        </div>

        <!-- Logo and navigation links -->
        <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
          <router-link to="/" class="flex shrink-0 items-center">
            <component :is="logoIcon" :size="32" class="text-indigo-500" />
          </router-link>
          <div class="hidden sm:ml-6 sm:block">
            <div class="flex space-x-4">
              <router-link
                v-for="link in navLinks"
                :key="link.to"
                :to="link.to"
                class="rounded-md px-3 py-2 text-sm font-medium transition-colors"
                :class="
                  isActiveRoute(link.to)
                    ? 'bg-gray-900 text-white dark:bg-gray-950/50'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                "
              >
                {{ link.label }}
              </router-link>
            </div>
          </div>
        </div>

        <!-- Right side actions -->
        <div
          class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
        >
          <!-- Notifications button -->
          <button
            v-if="showNotifications"
            type="button"
            @click="$emit('notification-click')"
            class="relative rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
          >
            <span class="absolute -inset-1.5"></span>
            <span class="sr-only">View notifications</span>
            <Bell :size="24" />
          </button>

          <!-- Profile dropdown -->
          <div v-if="showProfile" class="relative ml-3">
            <button
              @click.stop="profileMenuOpen = !profileMenuOpen"
              class="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">Open user menu</span>
              <div
                class="size-8 rounded-full bg-gray-700 flex items-center justify-center text-white outline -outline-offset-1 outline-white/10"
              >
                <User :size="20" />
              </div>
            </button>

            <!-- Profile dropdown menu -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="profileMenuOpen"
                v-click-outside="closeProfileMenu"
                class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
              >
                <a
                  v-for="item in profileMenuItems"
                  :key="item.label"
                  :href="item.href"
                  @click="handleProfileMenuClick(item)"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 cursor-pointer"
                >
                  {{ item.label }}
                </a>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="mobileMenuOpen" class="sm:hidden">
        <div class="space-y-1 px-2 pt-2 pb-3">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            @click="mobileMenuOpen = false"
            class="block rounded-md px-3 py-2 text-base font-medium transition-colors"
            :class="
              isActiveRoute(link.to)
                ? 'bg-gray-900 text-white dark:bg-gray-950/50'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            "
          >
            {{ link.label }}
          </router-link>
        </div>
      </div>
    </transition>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, X, Bell, User, Home } from 'lucide-vue-next'
import * as apiAUTH from '../../features/auth/api.js'

const props = defineProps({
  navLinks: {
    type: Array,
    default: () => [
      { label: 'Home', to: '/' },
      { label: 'Menu', to: '/menu' },
    ],
  },
  logoIcon: {
    type: Object,
    default: () => Home,
  },
  showNotifications: {
    type: Boolean,
    default: true,
  },
  showProfile: {
    type: Boolean,
    default: true,
  },
  profileMenuItems: {
    type: Array,
    default: () => [{ label: 'Sign out', href: apiAUTH.logout, action: 'signout' }],
  },
})

const emit = defineEmits(['notification-click', 'profile-menu-click'])

const route = useRoute()
const mobileMenuOpen = ref(false)
const profileMenuOpen = ref(false)

const isActiveRoute = (to) => {
  return route.path === to
}

const closeProfileMenu = () => {
  profileMenuOpen.value = false
}

const handleProfileMenuClick = (item) => {
  emit('profile-menu-click', item.action)
  profileMenuOpen.value = false
}

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  },
}
</script>
