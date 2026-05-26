/**
 * Error Response Format from Backend API
 *
 * The backend returns errors in two formats:
 *
 * 1. General Errors (from AppError in controllers):
 *    {
 *      "success": false,
 *      "error": "Invalid email or password",
 *      "errors": null
 *    }
 *
 * 2. Validation Errors (from Zod middleware):
 *    {
 *      "success": false,
 *      "error": "Validation error",
 *      "errors": [
 *        { "field": "body.email", "message": "Invalid email" },
 *        { "field": "body.password", "message": "Password too short" }
 *      ]
 *    }
 *
 * The axios interceptor (services/http.js) extracts error.response.data,
 * so error objects received in catch blocks have:
 * - error.error (string) - main error message
 * - error.errors (array or null) - validation errors if any
 */

/**
 * Extract user-friendly error message from backend error response
 *
 * @param {Object} error - Error object from axios interceptor
 * @param {string} [fallback='An unexpected error occurred'] - Fallback message
 * @returns {string} User-friendly error message
 *
 * @example
 * // General error
 * const error = { error: "Invalid credentials", errors: null }
 * getErrorMessage(error) // "Invalid credentials"
 *
 * @example
 * // Validation error
 * const error = {
 *   error: "Validation error",
 *   errors: [{ field: "body.email", message: "Invalid email" }]
 * }
 * getErrorMessage(error) // "Invalid email"
 *
 * @example
 * // Network error
 * const error = {}
 * getErrorMessage(error) // "An unexpected error occurred"
 */
export function getErrorMessage(error, fallback = 'An unexpected error occurred') {
  // Check if it's a validation error with errors array
  if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    // Return first validation error message, or fall back to general error
    return error.errors[0]?.message || error.error || fallback
  }

  // Return general error message
  return error?.error || fallback
}

/**
 * Extract all validation error messages from backend error response
 *
 * @param {Object} error - Error object from axios interceptor
 * @returns {Array<{field: string, message: string}>} Array of validation errors
 *
 * @example
 * const error = {
 *   error: "Validation error",
 *   errors: [
 *     { field: "body.email", message: "Invalid email" },
 *     { field: "body.password", message: "Password too short" }
 *   ]
 * }
 * getValidationErrors(error)
 * // [
 * //   { field: "body.email", message: "Invalid email" },
 * //   { field: "body.password", message: "Password too short" }
 * // ]
 */
export function getValidationErrors(error) {
  if (error?.errors && Array.isArray(error.errors)) {
    return error.errors
  }
  return []
}

/**
 * Check if error is a validation error
 *
 * @param {Object} error - Error object from axios interceptor
 * @returns {boolean} True if error contains validation errors
 */
export function isValidationError(error) {
  return error?.errors && Array.isArray(error.errors) && error.errors.length > 0
}

/**
 * Get error message for a specific field from validation errors
 *
 * @param {Object} error - Error object from axios interceptor
 * @param {string} fieldName - Field name to get error for (e.g., "body.email" or "email")
 * @returns {string|null} Error message for the field, or null if not found
 *
 * @example
 * const error = {
 *   errors: [
 *     { field: "body.email", message: "Invalid email" },
 *     { field: "body.password", message: "Password too short" }
 *   ]
 * }
 * getFieldError(error, "email") // "Invalid email"
 * getFieldError(error, "body.email") // "Invalid email"
 */
export function getFieldError(error, fieldName) {
  const validationErrors = getValidationErrors(error)

  // Try exact match first
  const exactMatch = validationErrors.find((err) => err.field === fieldName)
  if (exactMatch) return exactMatch.message

  // Try matching field name without "body." prefix
  const withoutPrefix = validationErrors.find(
    (err) => err.field === `body.${fieldName}` || err.field.endsWith(`.${fieldName}`),
  )
  if (withoutPrefix) return withoutPrefix.message

  return null
}
