/**
 * Generate a unique device ID and store it in localStorage
 * @returns {string} Unique device ID
 */
export function getDeviceId() {
  const STORAGE_KEY = 'device_id'

  // Check if device ID already exists in localStorage
  let deviceId = localStorage.getItem(STORAGE_KEY)

  if (!deviceId) {
    // Generate a new unique device ID using crypto API if available
    if (crypto.randomUUID) {
      deviceId = crypto.randomUUID()
    } else {
      // Fallback for older browsers
      deviceId = generateUUID()
    }

    // Store it in localStorage for future use
    localStorage.setItem(STORAGE_KEY, deviceId)
  }

  return deviceId
}

/**
 * Fallback UUID generator for browsers that don't support crypto.randomUUID()
 * @returns {string} UUID v4 string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Clear the stored device ID (useful for testing or logout)
 */
export function clearDeviceId() {
  localStorage.removeItem('device_id')
}
