# Error Handling Quick Reference

## Common Patterns

### 1. Handle Mutation Errors
```typescript
import { getUserFriendlyErrorMessage } from '../lib/errorHandling';
import { logError } from '../lib/errorLogger';

const mutation = useMutation({
  mutationFn: async (data) => {
    const { data: result, error } = await supabase
      .from('table')
      .insert(data);
    
    if (error) {
      logError(error, { component: 'MyComponent', action: 'create' });
      throw error;
    }
    return result;
  },
  onError: (error) => {
    const message = getUserFriendlyErrorMessage(error);
    toast.error(message);
  },
});
```

### 2. Form Validation
```typescript
import { validateField } from '../lib/errorHandling';

const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState<string>();

const handleChange = (value: string) => {
  setEmail(value);
  const error = validateField(value, {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  });
  setEmailError(error);
};

// In JSX
<Input
  type="email"
  value={email}
  onChange={(e) => handleChange(e.target.value)}
  error={emailError}
  required
/>
```

### 3. Check Online Status
```typescript
import { useOnlineStatus } from '../hooks/useOnlineStatus';

function MyComponent() {
  const isOnline = useOnlineStatus();
  
  return (
    <Button disabled={!isOnline}>
      {isOnline ? 'Submit' : 'Offline'}
    </Button>
  );
}
```

### 4. Manual Retry
```typescript
import { retryWithBackoff } from '../lib/errorHandling';

const fetchData = async () => {
  return retryWithBackoff(
    () => supabase.from('table').select(),
    {
      maxAttempts: 3,
      onRetry: (attempt) => console.log(`Retry ${attempt}`),
    }
  );
};
```

### 5. Error Classification
```typescript
import { isNetworkError, isAuthError } from '../lib/errorHandling';

try {
  await operation();
} catch (error) {
  if (isNetworkError(error)) {
    // Show retry option
  } else if (isAuthError(error)) {
    // Redirect to login
  }
}
```

## Validation Rules

```typescript
validateField(value, {
  required: true,              // Field is required
  minLength: 5,                // Minimum 5 characters
  maxLength: 100,              // Maximum 100 characters
  pattern: /regex/,            // Must match pattern
  min: 0,                      // Minimum number value
  max: 100,                    // Maximum number value
  custom: (val) => {           // Custom validation
    return val === 'test' ? 'Invalid' : undefined;
  },
});
```

## Error Messages

### Network
- "Connection lost. Please check your internet."

### Auth
- "Session expired. Please login again."
- "Invalid email or password"

### Database
- "This email already exists" (23505)
- "Cannot delete client with associated projects" (23503)
- "Invalid value provided" (23514)

### Validation
- "This field is required"
- "Please enter a valid email address"
- "Must be at least X characters"

## ARIA Attributes

```tsx
<Input
  aria-required={required}
  aria-invalid={!!error}
  aria-describedby={error ? 'field-error' : undefined}
/>

{error && (
  <div id="field-error" role="alert">
    {error}
  </div>
)}
```

## React Query Retry

Already configured in App.tsx:
- Network errors: 3 retries with exponential backoff
- Auth errors: No retry
- Other errors: 1 retry

## Components

- `<ErrorBoundary>` - Wrap app to catch React errors
- `<OfflineBanner>` - Shows when offline (auto-included)
- `<FormError>` - Display form errors with ARIA

## Hooks

- `useOnlineStatus()` - Returns boolean online status
- `useAuth()` - Handles auth state and expiry

## Utilities

- `logError(error, context)` - Log with context
- `getUserFriendlyErrorMessage(error)` - Convert to friendly message
- `retryWithBackoff(fn, options)` - Retry with backoff
- `validateField(value, rules)` - Validate form field
- `isNetworkError(error)` - Check if network error
- `isAuthError(error)` - Check if auth error
