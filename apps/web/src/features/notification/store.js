import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as notifApi from './api'

export const useNotificationStore = defineStore('notification', () => {
  // ─── State ───────────────────────────────────────────────────────────────────
  const notifications = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const isConnected = ref(false)
  const currentPage = ref(1)
  const totalNotifications = ref(0)

  /** @type {EventSource|null} */
  let eventSource = null

  // ─── Getters ─────────────────────────────────────────────────────────────────
  const hasUnread = computed(() => unreadCount.value > 0)

  // ─── Actions ─────────────────────────────────────────────────────────────────
  async function fetchNotifications(page = 1) {
    isLoading.value = true
    try {
      const res = await notifApi.fetchNotifications(page)
      const { notifications: items, pagination } = res.data

      if (page === 1) {
        notifications.value = items
      } else {
        notifications.value.push(...items)
      }

      currentPage.value = page
      totalNotifications.value = pagination?.total ?? 0
    } catch (err) {
      console.error('[Notification] Failed to fetch:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      const res = await notifApi.fetchUnreadCount()
      unreadCount.value = res.data?.count ?? 0
    } catch (err) {
      console.error('[Notification] Failed to fetch unread count:', err)
    }
  }

  async function markAsRead(id) {
    try {
      await notifApi.markAsRead(id)
      const notif = notifications.value.find((n) => n.id === id)
      if (notif && !notif.isRead) {
        notif.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (err) {
      console.error('[Notification] Failed to mark as read:', err)
    }
  }

  async function markAllAsRead() {
    try {
      await notifApi.markAllAsRead()
      notifications.value.forEach((n) => (n.isRead = true))
      unreadCount.value = 0
    } catch (err) {
      console.error('[Notification] Failed to mark all as read:', err)
    }
  }

  /**
   * Opens a Server-Sent Events connection.
   * Call once after the user is authenticated.
   */
  function connectSSE() {
    if (eventSource) return // already connected

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
    const tokenKey = import.meta.env.VITE_TOKEN_SECRET
    const token = localStorage.getItem(tokenKey)

    if (!token) return

    // EventSource doesn't support custom headers natively, so pass the token
    // as a query param. The backend apiAuth middleware must support this as well,
    // OR we use a polyfill. For simplicity here we pass as query param and the
    // backend will read from the header — so we use fetch-based SSE approach.
    const url = `${baseUrl}/notifications/sse`

    // Use a simple EventSource; the API auth token is set via a header via the
    // http interceptor, so we proxy through a small fetch-based readable stream.
    // Since EventSource doesn't support headers, we use a lightweight approach:
    // send the token key as a header by using a custom fetch-EventSource polyfill.
    // Here we use the native approach with a query parameter fallback.
    eventSource = new EventSourceWithToken(url, token, tokenKey, {
      onMessage: handleSseMessage,
      onConnected: () => {
        isConnected.value = true
      },
      onError: () => {
        isConnected.value = false
      },
    })
  }

  function handleSseMessage(event) {
    try {
      const payload = JSON.parse(event.data)
      if (payload.type === 'connected') return // Initial ping

      if (payload.type === 'notification' && payload.data) {
        // Prepend to list
        notifications.value.unshift(payload.data)
        totalNotifications.value += 1
        unreadCount.value += 1
      }
    } catch (err) {
      console.error('[Notification] SSE parse error:', err)
    }
  }

  function disconnectSSE() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
      isConnected.value = false
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    currentPage,
    totalNotifications,
    hasUnread,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    connectSSE,
    disconnectSSE,
  }
})

// ─── SSE with Auth Header Helper ─────────────────────────────────────────────
// Native EventSource doesn't support custom headers, so we use fetch + ReadableStream.
class EventSourceWithToken {
  constructor(url, token, tokenKey, { onMessage, onConnected, onError }) {
    this._closed = false
    this._onMessage = onMessage
    this._onConnected = onConnected
    this._onError = onError
    this._connect(url, token, tokenKey)
  }

  async _connect(url, token, tokenKey) {
    try {
      const response = await fetch(url, {
        headers: {
          [tokenKey]: token,
          Accept: 'text/event-stream',
        },
      })

      if (!response.ok || !response.body) {
        this._onError()
        return
      }

      this._onConnected()

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!this._closed) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            this._onMessage({ data })
          }
        }
      }
    } catch (err) {
      if (!this._closed) {
        this._onError()
        // Reconnect after 5s
        setTimeout(() => {
          if (!this._closed) this._connect(url, token, tokenKey)
        }, 5000)
      }
    }
  }

  close() {
    this._closed = true
  }
}
