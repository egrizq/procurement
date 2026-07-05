import { http } from '@/services/http'

/**
 * Fetch paginated notifications for the current user.
 * @param {number} page
 * @param {number} limit
 */
export const fetchNotifications = (page = 1, limit = 20) =>
  http.get('/notifications/list', { params: { page, limit } })

/**
 * Fetch the unread notification count.
 */
export const fetchUnreadCount = () => http.get('/notifications/unread-count')

/**
 * Mark a single notification as read.
 * @param {number} id
 */
export const markAsRead = (id) => http.patch(`/notifications/${id}/read`)

/**
 * Mark all notifications as read.
 */
export const markAllAsRead = () => http.patch('/notifications/read-all')
