<template>
  <div class="relative" ref="dropdownRef">
    <!-- Bell Button -->
    <button
      id="notification-bell-btn"
      type="button"
      @click="toggleDropdown"
      class="relative rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500 transition-colors"
      aria-label="View notifications"
      :aria-expanded="isOpen"
    >
      <Bell :size="24" />
      <!-- Unread Badge -->
      <span
        v-if="store.unreadCount > 0"
        class="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
      >
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="transform opacity-0 scale-95 translate-y-1"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 translate-y-1"
    >
      <div
        v-if="isOpen"
        id="notification-dropdown"
        class="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-gray-900 shadow-2xl ring-1 ring-white/10 z-50 overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <Bell :size="16" class="text-indigo-400" />
            <h3 class="text-sm font-semibold text-white">Notifications</h3>
            <span
              v-if="store.unreadCount > 0"
              class="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full"
            >
              {{ store.unreadCount }}
            </span>
          </div>
          <button
            v-if="store.hasUnread"
            @click="handleMarkAllAsRead"
            class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            Mark all read
          </button>
        </div>

        <!-- Notification List -->
        <div class="max-h-[420px] overflow-y-auto overscroll-contain">
          <!-- Loading State -->
          <div v-if="store.isLoading && store.notifications.length === 0" class="py-10 text-center">
            <div class="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p class="text-xs text-gray-500">Loading notifications…</p>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="store.notifications.length === 0"
            class="py-12 flex flex-col items-center gap-3 text-center px-4"
          >
            <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <BellOff :size="22" class="text-gray-500" />
            </div>
            <p class="text-sm text-gray-400 font-medium">You're all caught up!</p>
            <p class="text-xs text-gray-600">No notifications yet.</p>
          </div>

          <!-- Notification Items -->
          <template v-else>
            <button
              v-for="notif in store.notifications"
              :key="notif.id"
              @click="handleNotificationClick(notif)"
              class="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 group"
              :class="{ 'bg-indigo-950/40': !notif.isRead }"
            >
              <!-- Icon -->
              <div
                class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                :class="iconBg(notif.type)"
              >
                <component :is="iconFor(notif.type)" :size="14" :class="iconColor(notif.type)" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <p
                    class="text-xs font-semibold text-white leading-snug line-clamp-1"
                    :class="{ 'text-indigo-200': !notif.isRead }"
                  >
                    {{ notif.title }}
                  </p>
                  <span class="shrink-0 text-[10px] text-gray-500 mt-px whitespace-nowrap">
                    {{ relativeTime(notif.createdAt) }}
                  </span>
                </div>
                <p class="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mt-0.5">
                  {{ notif.message }}
                </p>
              </div>

              <!-- Unread dot -->
              <div
                v-if="!notif.isRead"
                class="shrink-0 w-2 h-2 rounded-full bg-indigo-400 mt-1.5"
              ></div>
            </button>

            <!-- Load More -->
            <div v-if="hasMorePages" class="px-4 py-3">
              <button
                @click.stop="loadMore"
                :disabled="store.isLoading"
                class="w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1.5 rounded-md hover:bg-white/5 disabled:opacity-50"
              >
                {{ store.isLoading ? 'Loading…' : 'Load more' }}
              </button>
            </div>
          </template>
        </div>

        <!-- Footer SSE status -->
        <div class="px-4 py-2 border-t border-white/5 flex items-center gap-1.5">
          <div
            class="w-1.5 h-1.5 rounded-full"
            :class="store.isConnected ? 'bg-green-400' : 'bg-gray-600'"
          ></div>
          <span class="text-[10px] text-gray-600">
            {{ store.isConnected ? 'Live' : 'Offline' }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  BellOff,
  ClipboardList,
  CheckCircle,
  XCircle,
  FileText,
  ShoppingCart,
  PackageCheck,
  Package,
} from 'lucide-vue-next'
import { useNotificationStore } from '@/features/notification/store'

const store = useNotificationStore()
const router = useRouter()
const isOpen = ref(false)
const dropdownRef = ref(null)

// ─── Toggle ───────────────────────────────────────────────────────────────────
function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value && store.notifications.length === 0) {
    store.fetchNotifications(1)
  }
}

// ─── Load More ────────────────────────────────────────────────────────────────
const hasMorePages = computed(
  () => store.notifications.length < store.totalNotifications,
)

async function loadMore() {
  await store.fetchNotifications(store.currentPage + 1)
}

// ─── Mark all read ────────────────────────────────────────────────────────────
async function handleMarkAllAsRead() {
  await store.markAllAsRead()
}

// ─── Notification click ───────────────────────────────────────────────────────
async function handleNotificationClick(notif) {
  if (!notif.isRead) {
    await store.markAsRead(notif.id)
  }

  isOpen.value = false

  // Navigate to related entity
  const routes = {
    vessel_request: '/request',
    purchase_order: '/purchase-orders',
    moc: '/moc',
    good_receipt: '/good-receipt',
  }
  const path = routes[notif.entityType]
  if (path) {
    router.push(path)
  }
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const TYPE_ICON_MAP = {
  vessel_request_submitted: ClipboardList,
  vessel_request_approved: CheckCircle,
  vessel_request_rejected: XCircle,
  moc_created: FileText,
  purchase_order_created: ShoppingCart,
  purchase_order_approved: CheckCircle,
  purchase_order_rejected: XCircle,
  good_receipt_submitted: PackageCheck,
}

function iconFor(type) {
  return TYPE_ICON_MAP[type] ?? Package
}

function iconBg(type) {
  if (type.includes('approved')) return 'bg-green-500/15'
  if (type.includes('rejected')) return 'bg-red-500/15'
  if (type.includes('submitted') || type.includes('created')) return 'bg-indigo-500/15'
  return 'bg-gray-500/15'
}

function iconColor(type) {
  if (type.includes('approved')) return 'text-green-400'
  if (type.includes('rejected')) return 'text-red-400'
  if (type.includes('submitted') || type.includes('created')) return 'text-indigo-400'
  return 'text-gray-400'
}

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// ─── Click outside ────────────────────────────────────────────────────────────
function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
