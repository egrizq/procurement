import Swal from 'sweetalert2'

/**
 * Toast notification configuration
 * Positioned at top-right corner with auto-close
 */
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
  },
})

/**
 * Show success notification
 * @param {string} message - Success message to display
 * @param {string} title - Optional title (defaults to 'Success')
 */
export const showSuccess = (message, title = 'Success') => {
  return Toast.fire({
    icon: 'success',
    title: title,
    text: message,
  })
}

/**
 * Show error notification
 * @param {string} message - Error message to display
 * @param {string} title - Optional title (defaults to 'Error')
 */
export const showError = (message, title = 'Error') => {
  return Toast.fire({
    icon: 'error',
    title: title,
    text: message,
  })
}

/**
 * Show info notification
 * @param {string} message - Info message to display
 * @param {string} title - Optional title (defaults to 'Info')
 */
export const showInfo = (message, title = 'Info') => {
  return Toast.fire({
    icon: 'info',
    title: title,
    text: message,
  })
}

/**
 * Show warning notification
 * @param {string} message - Warning message to display
 * @param {string} title - Optional title (defaults to 'Warning')
 */
export const showWarning = (message, title = 'Warning') => {
  return Toast.fire({
    icon: 'warning',
    title: title,
    text: message,
  })
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Optional title (defaults to 'Are you sure?')
 * @returns {Promise} - Promise that resolves with user's choice
 */
export const showConfirm = (message, title = 'Are you sure?') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
  })
}
