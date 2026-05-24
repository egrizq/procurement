<template>
  <aside
    class="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gray-800 text-white overflow-y-auto transition-transform duration-300 z-40"
    :class="{ '-translate-x-full': !isOpen, 'translate-x-0': isOpen }"
  >
    <nav class="p-4 space-y-2">
      <!-- Profile -->
      <router-link
        to="/profile"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-700"
        :class="isActive('/profile') ? 'bg-gray-700' : ''"
      >
        <User :size="20" />
        <span>Profile</span>
      </router-link>

      <!-- Vessels -->
      <router-link
        v-if="canOpen('vessels')"
        to="/vessels"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-700"
        :class="isActive('/vessels') ? 'bg-gray-700' : ''"
      >
        <Ship :size="20" />
        <span>Vessels</span>
      </router-link>

      <!-- Master Data with Children -->
      <div v-if="canOpenMasterData" class="space-y-1">
        <button
          @click="toggleMasterData"
          class="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors hover:bg-gray-700"
          :class="isActive('/master-data') ? 'bg-gray-700' : ''"
        >
          <div class="flex items-center gap-3">
            <Database :size="20" />
            <span>Master Data</span>
          </div>
          <ChevronDown
            :size="16"
            class="transition-transform duration-200"
            :class="{ 'rotate-180': masterDataOpen }"
          />
        </button>

        <!-- Master Data Children -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-96"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 max-h-96"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="masterDataOpen" class="ml-4 space-y-1 overflow-hidden">
            <router-link
              v-if="canOpen('master-data/items')"
              to="/master-data/items"
              class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 text-sm"
              :class="isActive('/master-data/items') ? 'bg-gray-700' : ''"
            >
              <Package :size="18" />
              <span>Items</span>
            </router-link>

            <router-link
              v-if="canOpen('master-data/category-items')"
              to="/master-data/category-items"
              class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 text-sm"
              :class="isActive('/master-data/category-items') ? 'bg-gray-700' : ''"
            >
              <Tags :size="18" />
              <span>Category Items</span>
            </router-link>

            <router-link
              v-if="canOpen('master-data/vendors')"
              to="/master-data/vendors"
              class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 text-sm"
              :class="isActive('/master-data/vendors') ? 'bg-gray-700' : ''"
            >
              <Building :size="18" />
              <span>Vendors</span>
            </router-link>

            <router-link
              v-if="canOpen('master-data/vessel-stocks')"
              to="/master-data/vessel-stocks"
              class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 text-sm"
              :class="isActive('/master-data/vessel-stocks') ? 'bg-gray-700' : ''"
            >
              <Warehouse :size="18" />
              <span>Vessel Stock</span>
            </router-link>
          </div>
        </transition>
      </div>

      <!-- Request -->
      <router-link
        v-if="canOpen('request')"
        to="/request"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-700"
        :class="isActive('/request') ? 'bg-gray-700' : ''"
      >
        <FileText :size="20" />
        <span>Request</span>
      </router-link>

      <!-- MOC (Matrix of Comparison) -->
      <router-link
        v-if="canOpen('moc')"
        to="/moc"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-700"
        :class="isActive('/moc') ? 'bg-gray-700' : ''"
      >
        <GitCompare :size="20" />
        <span>MOC</span>
      </router-link>

      <!-- Purchase Order -->
      <router-link
        v-if="canOpen('purchase-orders')"
        to="/purchase-orders"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-700"
        :class="isActive('/purchase-orders') ? 'bg-gray-700' : ''"
      >
        <ShoppingCart :size="20" />
        <span>Purchase Order</span>
      </router-link>

      <!-- Good Receipt -->
      <router-link
        v-if="canOpen('good-receipt')"
        to="/good-receipt"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-700"
        :class="isActive('/good-receipt') ? 'bg-gray-700' : ''"
      >
        <ClipboardCheck :size="20" />
        <span>Good Receipt</span>
      </router-link>

      <!-- Settings -->
      <div v-if="canOpenSettings" class="space-y-1">
        <button
          @click="toggleSettings"
          class="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors hover:bg-gray-700"
          :class="isActive('/settings') ? 'bg-gray-700' : ''"
        >
          <div class="flex items-center gap-3">
            <Settings :size="20" />
            <span>Settings</span>
          </div>
          <ChevronDown
            :size="16"
            class="transition-transform duration-200"
            :class="{ 'rotate-180': settingsOpen }"
          />
        </button>

        <transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-96"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 max-h-96"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="settingsOpen" class="ml-4 space-y-1 overflow-hidden">
            <router-link
              v-if="canOpen('settings/users')"
              to="/settings/users"
              class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 text-sm"
              :class="isActive('/settings/users') ? 'bg-gray-700' : ''"
            >
              <UserCog :size="18" />
              <span>Manage Users</span>
            </router-link>

            <router-link
              v-if="canOpen('settings/module-access')"
              to="/settings/module-access"
              class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 text-sm"
              :class="isActive('/settings/module-access') ? 'bg-gray-700' : ''"
            >
              <ShieldCheck :size="18" />
              <span>Role Access</span>
            </router-link>

            <router-link
              v-if="canOpen('settings/vessel-item-standards')"
              to="/settings/vessel-item-standard"
              class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-700 text-sm"
              :class="isActive('/settings/vessel-item-standard') ? 'bg-gray-700' : ''"
            >
              <Scale :size="18" />
              <span>Vessel Item Standard</span>
            </router-link>
          </div>
        </transition>
      </div>
    </nav>
  </aside>

  <!-- Overlay for mobile -->
  <div v-if="isOpen" @click="$emit('close')" class="fixed inset-0 bg-black/50 z-30 lg:hidden"></div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useModuleAccessStore } from '@/features/settings/module-access/store.js'
import {
  User,
  Ship,
  Database,
  ChevronDown,
  Package,
  Tags,
  Building,
  Warehouse,
  FileText,
  GitCompare,
  ShoppingCart,
  ClipboardCheck,
  Settings,
  Scale,
  ShieldCheck,
  UserCog
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])

const route = useRoute()
const moduleAccessStore = useModuleAccessStore()
const masterDataOpen = ref(false)

// Check if route is active
const isActive = (path) => {
  return route.path.startsWith(path)
}

// Toggle master data menu
const toggleMasterData = () => {
  masterDataOpen.value = !masterDataOpen.value
}

const canOpen = (moduleSlug) => {
  return moduleAccessStore.canOpen(moduleSlug)
}

const canOpenMasterData = computed(() =>
  moduleAccessStore.canOpenAny([
    'master-data/items',
    'master-data/category-items',
    'master-data/vendors',
    'master-data/vessel-stocks',
  ]),
)

const canOpenSettings = computed(() =>
  moduleAccessStore.canOpenAny([
    'settings/users',
    'settings/module-access',
    'settings/vessel-item-standards',
  ]),
)

onMounted(() => {
  moduleAccessStore.fetchMyAccess()
})

// Auto-open master data if we're on a master data route
watch(
  () => route.path,
  (newPath) => {
    if (newPath.startsWith('/master-data')) {
      masterDataOpen.value = true
    }
  },
  { immediate: true },
)

const settingsOpen = ref(false)

const toggleSettings = () => {
  settingsOpen.value = !settingsOpen.value
}

// Auto-open settings if we're on a settings route
watch(
  () => route.path,
  (newPath) => {
    if (newPath.startsWith('/settings')) {
      settingsOpen.value = true
    }
  },
  { immediate: true },
)
</script>
