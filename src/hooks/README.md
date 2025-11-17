# React Query Hooks Documentation

This directory contains all the custom React Query hooks for data fetching and mutations in the Koruku Business Management System.

## Available Hooks

### Authentication (`useAuth.ts`)
- `useAuth()` - Get current authentication state
- `useLogin()` - Login mutation
- `useLogout()` - Logout mutation
- `useSession()` - Get current session

### Clients (`useClients.ts`)
- `useClients(activeOnly?)` - Fetch all clients with optional active filter
- `useClient(id)` - Fetch single client with related data
- `useCreateClient()` - Create new client
- `useUpdateClient()` - Update existing client
- `useDeleteClient()` - Delete client

### Projects (`useProjects.ts`)
- `useProjects(filters?)` - Fetch all projects with optional filters (status, clientId)
- `useProject(id)` - Fetch single project with related data
- `useCreateProject()` - Create new project
- `useUpdateProject()` - Update existing project
- `useDeleteProject()` - Delete project

### Invoices (`useInvoices.ts`)
- `useInvoices(filters?)` - Fetch all invoices with optional filters (status, clientId)
- `useInvoice(id)` - Fetch single invoice with related data
- `useCreateInvoice()` - Create new invoice
- `useUpdateInvoice()` - Update existing invoice
- `useDeleteInvoice()` - Delete invoice
- `useMarkInvoicePaid(id)` - Mark invoice as paid

### Settings (`useSettings.ts`)
- `useSettings()` - Fetch all settings
- `useUpdateSettings()` - Update settings

### Dashboard (`useDashboard.ts`)
- `useDashboardStats()` - Fetch dashboard statistics (auto-refreshes every minute)
- `useRecentInvoices(limit?)` - Fetch recent invoices
- `useExpiringSupportProjects()` - Fetch projects with support ending within 30 days

## Cache Invalidation Strategy

The hooks implement a comprehensive cache invalidation strategy to ensure data consistency across the application:

### Client Operations
**After Create/Update/Delete:**
- Invalidate `['clients']` - Refresh clients list
- Invalidate `['clients', id]` - Refresh specific client (update only)
- Invalidate `['dashboard-stats']` - Refresh dashboard statistics

### Project Operations
**After Create/Update/Delete:**
- Invalidate `['projects']` - Refresh projects list
- Invalidate `['projects', id]` - Refresh specific project (update only)
- Invalidate `['dashboard-stats']` - Refresh dashboard statistics
- Invalidate `['expiring-support-projects']` - Refresh expiring support list

### Invoice Operations
**After Create/Update/Delete/Mark Paid:**
- Invalidate `['invoices']` - Refresh invoices list
- Invalidate `['invoices', id]` - Refresh specific invoice (update/mark paid only)
- Invalidate `['dashboard-stats']` - Refresh dashboard statistics
- Invalidate `['recent-invoices']` - Refresh recent invoices list

### Settings Operations
**After Update:**
- Invalidate `['settings']` - Refresh settings

### Authentication Operations
**After Login:**
- Invalidate all queries - Refresh all data for new session

**After Logout:**
- Clear all queries - Remove all cached data

## Query Configuration

All queries use the following default configuration (set in `App.tsx`):

```typescript
{
  staleTime: 5 * 60 * 1000,      // 5 minutes - data considered fresh
  gcTime: 10 * 60 * 1000,        // 10 minutes - data kept in cache
  refetchOnWindowFocus: false,    // Don't refetch on window focus
  retry: 1,                       // Retry failed requests once
}
```

### Exceptions:
- **Settings**: `staleTime: 10 minutes` - Settings change infrequently
- **Dashboard Stats**: `refetchInterval: 60 seconds` - Auto-refresh for real-time data

## Error Handling

All mutations include:
- User-friendly error messages via `react-hot-toast`
- Specific handling for database constraint violations
- Automatic error propagation to UI components

## Usage Example

```typescript
import { useClients, useCreateClient } from '@/hooks';

function ClientsPage() {
  // Fetch clients
  const { data: clients, isLoading, error } = useClients(true); // active only
  
  // Create client mutation
  const createClient = useCreateClient();
  
  const handleSubmit = async (clientData) => {
    await createClient.mutateAsync(clientData);
    // Toast notification and cache invalidation happen automatically
  };
  
  return (
    // ... component JSX
  );
}
```

## Best Practices

1. **Always use the hooks** - Don't call Supabase directly in components
2. **Let React Query handle loading states** - Use `isLoading`, `isFetching`, `isPending`
3. **Handle errors gracefully** - Check `error` state and display user-friendly messages
4. **Use optimistic updates** - For better UX (can be added in future iterations)
5. **Leverage cache** - Data is automatically cached and shared across components
