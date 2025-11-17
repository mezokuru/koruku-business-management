# Error Handling Guide

This guide explains the comprehensive error handling system implemented in the Koruku Business Management System.

## Overview

The error handling system provides:

1. **Network Error Detection** - Automatic detection and retry with exponential backoff
2. **Authentication Error Handling** - Automatic redirect to login on session expiry
3. **Database Constraint Errors** - User-friendly messages for constraint violations
4. **Offline Detection** - Persistent banner when connection is lost
5. **Automatic Retry Logic** - Exponential backoff (1s, 2s, 4s) with max 3 attempts
6. **React Error Boundary** - Catches unexpected React errors
7. **Form Validation** - WCAG 2.1 AA compliant with aria attributes

## Components

### ErrorBoundary

Wraps the entire application to catch unexpected React errors.

```tsx
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### OfflineBanner

Displays a persistent banner when the user loses internet connectivity.

```tsx
import OfflineBanner from './components/OfflineBanner';

<OfflineBanner />
```

### FormError

Displays form validation errors with proper ARIA attributes.

```tsx
import { FormError } from './components/ui';

<FormError id="email-error" error={emailError} />
```

## Utilities

### Error Handling Functions

#### `retryWithBackoff<T>(fn, options)`

Retry a function with exponential backoff.

```typescript
import { retryWithBackoff } from '../lib/errorHandling';

const data = await retryWithBackoff(
  () => fetchData(),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 4000,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error);
    },
  }
);
```

#### `getUserFriendlyErrorMessage(error)`

Convert technical errors to user-friendly messages.

```typescript
import { getUserFriendlyErrorMessage } from '../lib/errorHandling';

try {
  await supabase.from('clients').insert(data);
} catch (error) {
  const message = getUserFriendlyErrorMessage(error);
  toast.error(message);
}
```

#### `handleErrorWithToast(error, context)`

Handle error with toast notification and logging.

```typescript
import { handleErrorWithToast } from '../lib/errorHandling';

try {
  await updateClient(data);
} catch (error) {
  handleErrorWithToast(error, {
    component: 'ClientForm',
    action: 'update',
    showRetry: true,
    onRetry: () => updateClient(data),
  });
}
```

#### `validateField(value, rules)`

Validate form field with comprehensive rules.

```typescript
import { validateField } from '../lib/errorHandling';

const error = validateField(email, {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  minLength: 5,
  maxLength: 255,
});

if (error) {
  setEmailError(error);
}
```

### Error Classification

#### `isNetworkError(error)`

Check if error is a network error.

```typescript
import { isNetworkError } from '../lib/errorHandling';

if (isNetworkError(error)) {
  // Show retry option
}
```

#### `isAuthError(error)`

Check if error is an authentication error.

```typescript
import { isAuthError } from '../lib/errorHandling';

if (isAuthError(error)) {
  // Redirect to login
}
```

#### `isDatabaseConstraintError(error)`

Check if error is a database constraint error.

```typescript
import { isDatabaseConstraintError } from '../lib/errorHandling';

if (isDatabaseConstraintError(error)) {
  // Show constraint-specific message
}
```

## React Query Configuration

The QueryClient is configured with automatic retry logic:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error.message.includes('JWT')) return false;
        // Retry network errors up to 3 times
        if (isNetworkError(error)) return failureCount < 3;
        // Retry other errors once
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
      },
    },
  },
});
```

## Custom Hooks

### useOnlineStatus

Track online/offline status.

```typescript
import { useOnlineStatus } from '../hooks/useOnlineStatus';

function MyComponent() {
  const isOnline = useOnlineStatus();
  
  return (
    <Button disabled={!isOnline}>
      Submit
    </Button>
  );
}
```

### useRetryMutation

Mutation hook with automatic retry logic.

```typescript
import { useRetryMutation } from '../hooks/useRetryMutation';

const mutation = useRetryMutation({
  mutationFn: async (data) => {
    return await supabase.from('clients').insert(data);
  },
  enableRetry: true,
  maxRetries: 3,
  onSuccess: () => {
    toast.success('Client created');
  },
  onError: (error) => {
    toast.error(getUserFriendlyErrorMessage(error));
  },
});
```

## Form Validation with ARIA

All form inputs support WCAG 2.1 AA compliant validation:

```tsx
<Input
  type="email"
  label="Email Address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  required
  aria-invalid={!!emailError}
  aria-describedby={emailError ? 'email-error' : undefined}
/>

{emailError && (
  <FormError id="email-error" error={emailError} />
)}
```

## Error Logging

All errors are logged with context information:

```typescript
import { logError } from '../lib/errorLogger';

try {
  await riskyOperation();
} catch (error) {
  logError(error, {
    component: 'MyComponent',
    action: 'riskyOperation',
    data: { userId: '123' },
  });
}
```

## Best Practices

1. **Always use getUserFriendlyErrorMessage** for displaying errors to users
2. **Log errors with context** using logError for debugging
3. **Validate forms on change and submit** for better UX
4. **Use aria attributes** for accessibility compliance
5. **Check online status** before network operations
6. **Handle auth errors** by redirecting to login
7. **Provide retry options** for network errors
8. **Use ErrorBoundary** to catch unexpected errors

## Error Messages

### Network Errors
- "Connection lost. Please check your internet."

### Authentication Errors
- "Session expired. Please login again."
- "Invalid email or password"

### Database Constraint Errors
- "This email already exists" (unique constraint)
- "Cannot delete client with associated projects or invoices" (foreign key)
- "Invalid value provided. Please check your input." (check constraint)

### Validation Errors
- "This field is required"
- "Please enter a valid email address"
- "Please enter a valid URL (e.g., https://example.com)"
- "Must be at least X characters"
- "Must be no more than X characters"

## Testing Error Handling

To test error handling:

1. **Network Errors**: Disable network in DevTools
2. **Offline Detection**: Toggle offline mode in DevTools
3. **Auth Errors**: Clear localStorage and try protected routes
4. **Validation**: Submit forms with invalid data
5. **React Errors**: Throw error in component to test ErrorBoundary

## Requirements Coverage

This implementation satisfies the following requirements:

- **10.1**: Network error detection with toast notification and retry button
- **10.2**: Authentication error handling with redirect to login
- **10.3**: Database constraint error handling with user-friendly messages
- **10.4**: Offline detection banner with sync message
- **10.5**: Automatic retry with exponential backoff (1s, 2s, 4s, max 3 attempts)
- **9.2**: Form validation error display with aria-invalid and aria-describedby
- **12.7**: WCAG 2.1 AA accessibility compliance
