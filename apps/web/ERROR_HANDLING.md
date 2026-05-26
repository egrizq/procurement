# Error Handling Guide

## Backend Error Response Format

The Procurement API returns errors in a consistent format from `apps/api/src/shared/utils/response.ts`:

### 1. General Errors (Business Logic)

```json
{
  "success": false,
  "error": "Invalid email or password",
  "errors": null
}
```

**When it's used:**

- Authentication failures
- Authorization errors
- Business logic violations (e.g., "User already exists")
- Database errors

**Backend code:**

```typescript
// In controllers
throw new AppError('Invalid email or password', 401)

// In errorHandler middleware
return error(res, message, statusCode, err.errors || null)
```

### 2. Validation Errors (Zod Schema)

```json
{
  "success": false,
  "error": "Validation error",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email address"
    },
    {
      "field": "body.password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

**When it's used:**

- Request validation failures
- Invalid input format
- Missing required fields
- Type mismatches

**Backend code:**

```typescript
// In validate middleware (apps/api/src/shared/middlewares/validate.ts)
if (err instanceof z.ZodError) {
  const errors = err.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }))
  return next(new AppError('Validation error', 400, errors))
}
```

## Frontend Error Handling

### HTTP Interceptor

The axios interceptor in `apps/web/src/services/http.js` extracts the error data:

```javascript
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.data) {
      return Promise.reject(error.response.data)
    }
    return Promise.reject(error)
  },
)
```

**Result:** Catch blocks receive the error object with:

- `error.error` (string) - Main error message
- `error.errors` (array or null) - Validation errors if any

### Error Handler Utility

Use the `errorHandler.js` utility for consistent error handling:

```javascript
import { getErrorMessage } from '@/utils/errorHandler'

try {
  await api.login(email, password)
} catch (error) {
  // Automatically handles both validation and general errors
  errorMessage.value = getErrorMessage(error)
}
```

### Available Helper Functions

#### 1. `getErrorMessage(error, fallback)`

Extracts the most relevant error message.

```javascript
// General error
const error = { error: 'Invalid credentials', errors: null }
getErrorMessage(error) // "Invalid credentials"

// Validation error (returns first error)
const error = {
  error: 'Validation error',
  errors: [
    { field: 'body.email', message: 'Invalid email' },
    { field: 'body.password', message: 'Password too short' },
  ],
}
getErrorMessage(error) // "Invalid email"

// Network error with no data
const error = {}
getErrorMessage(error) // "An unexpected error occurred"

// Custom fallback
getErrorMessage(error, 'Login failed') // "Login failed"
```

#### 2. `getValidationErrors(error)`

Returns all validation errors as an array.

```javascript
const errors = getValidationErrors(error)
// [
//   { field: "body.email", message: "Invalid email" },
//   { field: "body.password", message: "Password too short" }
// ]

// Display all errors
errors.forEach((err) => {
  console.log(`${err.field}: ${err.message}`)
})
```

#### 3. `isValidationError(error)`

Check if the error contains validation errors.

```javascript
if (isValidationError(error)) {
  // Handle validation errors specifically
  displayFieldErrors(error)
} else {
  // Handle general errors
  displayGeneralError(error)
}
```

#### 4. `getFieldError(error, fieldName)`

Get error message for a specific field.

```javascript
const emailError = getFieldError(error, 'email')
const passwordError = getFieldError(error, 'password')

// Works with "body." prefix or without
getFieldError(error, 'email') // "Invalid email"
getFieldError(error, 'body.email') // "Invalid email" (same result)
```

## Simple Form Pattern (Backend Validation Only)

### Complete Example: Login Form

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Field with HTML5 validation -->
    <input v-model="email" type="email" required placeholder="Email" />

    <input v-model="password" type="password" required placeholder="Password" />

    <!-- Server error message -->
    <Message v-if="errorMessage" severity="error">
      {{ errorMessage }}
    </Message>

    <button :disabled="isLoading">Submit</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { getErrorMessage } from '@/utils/errorHandler'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (error) {
    // Backend handles all validation
    errorMessage.value = getErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}
</script>
```

## Best Practices

### ✅ DO

1. **Use `getErrorMessage()` for all error handling**

   ```javascript
   catch (error) {
     errorMessage.value = getErrorMessage(error);
   }
   ```

2. **Use HTML5 validation for basic checks**

   ```vue
   <input type="email" required />
   ```

3. **Let backend handle complex validation**
   - Email format
   - Password strength
   - Business rules
   - Database constraints

4. **Provide user-friendly fallback messages**
   ```javascript
   getErrorMessage(error, 'Failed to save changes')
   ```

### ❌ DON'T

1. **Don't access error properties directly**

   ```javascript
   // ❌ BAD - Crashes if errors is null
   errorMessage.value = error.errors[0].message

   // ✅ GOOD - Handles all error types
   errorMessage.value = getErrorMessage(error)
   ```

2. **Don't duplicate validation logic**
   - Backend has Zod schemas
   - Trust backend validation
   - Keep frontend simple

3. **Don't create complex client-side validation**
   - Adds complexity
   - Can get out of sync with backend
   - HTML5 + backend is sufficient

## Error Flow Diagram

```
User Input
    ↓
[HTML5 Basic Validation (required, type, etc.)]
    ↓ (if valid)
[API Request]
    ↓
[Server-Side Validation (Zod)]
    ↓ (if valid)
[Business Logic]
    ↓
[Response/Error]
    ↓
[HTTP Interceptor]
    ↓
[getErrorMessage()]
    ↓
[Display to User]
```

## Common Error Scenarios

### 1. Network Error (No Response)

```javascript
catch (error) {
  getErrorMessage(error); // "An unexpected error occurred"
}
```

### 2. Validation Error (400)

```javascript
// Server returns:
{
  "success": false,
  "error": "Validation error",
  "errors": [{ "field": "body.email", "message": "Invalid email" }]
}

// Frontend receives:
getErrorMessage(error); // "Invalid email"
```

### 3. Authentication Error (401)

```javascript
// Server returns:
{
  "success": false,
  "error": "Invalid email or password",
  "errors": null
}

// Frontend receives:
getErrorMessage(error); // "Invalid email or password"
```

### 4. Server Error (500)

```javascript
// Server returns:
{
  "success": false,
  "error": "Internal Server Error",
  "errors": null
}

// Frontend receives:
getErrorMessage(error); // "Internal Server Error"
```

## Related Files

- **Backend Error Handling:**
  - `apps/api/src/shared/utils/response.ts` - Error response format
  - `apps/api/src/shared/utils/error.ts` - AppError class
  - `apps/api/src/shared/middlewares/errorHandler.ts` - Global error handler
  - `apps/api/src/shared/middlewares/validate.ts` - Zod validation middleware

- **Frontend Error Handling:**
  - `apps/web/src/utils/errorHandler.js` - Error extraction utilities
  - `apps/web/src/services/http.js` - Axios interceptor

- **Shared Validation:**
  - `packages/validators/src/*.js` - Zod schemas used by backend
