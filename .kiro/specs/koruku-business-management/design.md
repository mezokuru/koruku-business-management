# Design Document

## Overview

The Koruku Business Management System is a single-page React application built with Vite, utilizing Supabase for backend services (PostgreSQL database and authentication). The application follows a modern component-based architecture with React Query for data fetching and state management, Tailwind CSS for styling, and React Router for navigation.

The system is designed for a single-user scenario (business owner) with a focus on simplicity, performance, and data integrity. All business logic resides in the frontend, with Supabase handling data persistence, authentication, and real-time capabilities through Row Level Security (RLS) policies.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Application (SPA)                   │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   Pages     │  │  Components  │  │   Hooks     │  │  │
│  │  │  (Routes)   │  │   (UI/Logic) │  │ (Data Mgmt) │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  │         │                 │                 │          │  │
│  │         └─────────────────┴─────────────────┘          │  │
│  │                          │                              │  │
│  │                 ┌────────▼────────┐                    │  │
│  │                 │  React Query    │                    │  │
│  │                 │  (Cache/State)  │                    │  │
│  │                 └────────┬────────┘                    │  │
│  │                          │                              │  │
│  │                 ┌────────▼────────┐                    │  │
│  │                 │ Supabase Client │                    │  │
│  │                 └────────┬────────┘                    │  │
│  └──────────────────────────┼──────────────────────────────┘  │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │    Supabase     │
                    │   (Backend)     │
                    │  ┌───────────┐  │
                    │  │PostgreSQL │  │
                    │  │ Database  │  │
                    │  └───────────┘  │
                    │  ┌───────────┐  │
                    │  │   Auth    │  │
                    │  │  Service  │  │
                    │  └───────────┘  │
                    └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18.2.0 - UI library
- Vite 5.0.8 - Build tool and dev server
- React Router 6.20.0 - Client-side routing
- Tailwind CSS 3.3.6 - Utility-first CSS framework
- React Query 5.12.0 - Data fetching and caching
- Lucide React 0.294.0 - Icon library
- React Hot Toast 2.4.1 - Toast notifications
- date-fns 2.30.0 - Date manipulation and formatting

**Backend:**
- Supabase (PostgreSQL 15+) - Database
- Supabase Auth - Authentication service
- Row Level Security (RLS) - Authorization

**Development:**
- ESLint - Code linting
- PostCSS + Autoprefixer - CSS processing



## Components and Interfaces

### Component Hierarchy

```
App
├── QueryClientProvider (React Query)
├── Router
│   ├── PublicRoute
│   │   └── Login
│   └── ProtectedRoute
│       └── Layout
│           ├── Sidebar
│           ├── Header
│           └── Outlet (Page Content)
│               ├── Dashboard
│               ├── Clients
│               ├── Projects
│               ├── Invoices
│               └── Settings
```

### Core Components

#### 1. Layout Components

**Sidebar** (`components/layout/Sidebar.jsx`)
- Fixed left sidebar (250px width)
- Navigation menu with active state highlighting
- Logo at top, logout button at bottom
- Responsive: collapses to hamburger menu on mobile
- Props: None (uses React Router for navigation state)

**Header** (`components/layout/Header.jsx`)
- Page title display
- Optional search bar (context-dependent)
- Primary action button (context-dependent)
- Props: `{ title, searchValue, onSearchChange, actionButton }`

**Layout** (`components/layout/Layout.jsx`)
- Wrapper component combining Sidebar and main content area
- Handles authentication state
- Props: `{ children }`

#### 2. UI Components

**Button** (`components/ui/Button.jsx`)
- Variants: primary, secondary, danger, ghost
- Sizes: sm, md, lg
- States: default, hover, active, disabled, loading
- Props: `{ variant, size, loading, disabled, icon, onClick, children }`

**Input** (`components/ui/Input.jsx`)
- Types: text, email, number, date, tel, url
- Validation states: default, error, success
- Props: `{ type, label, placeholder, value, onChange, error, required, disabled, icon }`

**Modal** (`components/ui/Modal.jsx`)
- Sizes: sm (400px), md (600px), lg (800px), xl (1000px)
- Backdrop click to close
- ESC key to close
- Focus trap within modal
- Props: `{ isOpen, onClose, title, size, children }`

**Table** (`components/ui/Table.jsx`)
- Sortable columns
- Loading skeleton state
- Empty state message
- Hover effects on rows
- Props: `{ columns, data, onSort, loading, emptyMessage }`

**StatusBadge** (`components/ui/StatusBadge.jsx`)
- Variants: invoice (draft/sent/paid/overdue), project (planning/development/honey-period/retainer/completed)
- Color-coded with icons
- Props: `{ status, variant }`

**StatCard** (`components/ui/StatCard.jsx`)
- Display metric with icon
- Optional trend indicator
- Props: `{ title, value, icon, trend, trendDirection }`

#### 3. Feature Components

**ClientList** (`components/clients/ClientList.jsx`)
- Data table with search and filter
- Action buttons per row (view, edit, delete)
- Empty state
- Props: None (manages own state)

**ClientForm** (`components/clients/ClientForm.jsx`)
- Add/edit modal form
- Validation logic
- Props: `{ client, isOpen, onClose, onSave }`

**ClientDetail** (`components/clients/ClientDetail.jsx`)
- Modal showing client info, projects, invoices
- Revenue summary
- Props: `{ clientId, isOpen, onClose }`

**ProjectList** (`components/projects/ProjectList.jsx`)
- Data table with search and filter
- Support countdown display
- Warning indicators for expiring support
- Props: None

**ProjectForm** (`components/projects/ProjectForm.jsx`)
- Add/edit modal form
- Auto-calculate support end date
- Client dropdown (active only)
- Props: `{ project, isOpen, onClose, onSave }`

**ProjectDetail** (`components/projects/ProjectDetail.jsx`)
- Modal showing project info, client, invoices
- Support status display
- Props: `{ projectId, isOpen, onClose }`

**InvoiceList** (`components/invoices/InvoiceList.jsx`)
- Data table with search and filter
- Overdue highlighting
- Quick actions (mark paid, mark sent)
- Props: None

**InvoiceForm** (`components/invoices/InvoiceForm.jsx`)
- Add/edit modal form
- Auto-generate invoice number
- Client and project dropdowns
- Date validation
- Props: `{ invoice, isOpen, onClose, onSave }`



### Custom Hooks

**useClients** (`hooks/useClients.js`)
- `useClients(activeOnly)` - Fetch all clients with optional active filter
- `useClient(id)` - Fetch single client with related data
- `useCreateClient()` - Mutation for creating client
- `useUpdateClient()` - Mutation for updating client
- `useDeleteClient()` - Mutation for deleting client

**useProjects** (`hooks/useProjects.js`)
- `useProjects(filters)` - Fetch projects with optional filters (status, clientId)
- `useProject(id)` - Fetch single project with related data
- `useCreateProject()` - Mutation for creating project
- `useUpdateProject()` - Mutation for updating project
- `useDeleteProject()` - Mutation for deleting project

**useInvoices** (`hooks/useInvoices.js`)
- `useInvoices(filters)` - Fetch invoices with optional filters (status, clientId)
- `useInvoice(id)` - Fetch single invoice with related data
- `useCreateInvoice()` - Mutation for creating invoice
- `useUpdateInvoice()` - Mutation for updating invoice
- `useDeleteInvoice()` - Mutation for deleting invoice
- `useMarkInvoicePaid(id)` - Mutation for marking invoice as paid

**useSettings** (`hooks/useSettings.js`)
- `useSettings()` - Fetch all settings
- `useUpdateSettings()` - Mutation for updating settings

**useDashboard** (`hooks/useDashboard.js`)
- `useDashboardStats()` - Fetch dashboard statistics
- `useRecentInvoices()` - Fetch recent invoices
- `useExpiringSupportProjects()` - Fetch projects with expiring support

**useAuth** (`hooks/useAuth.js`)
- `useAuth()` - Get current auth state
- `useLogin()` - Mutation for login
- `useLogout()` - Mutation for logout
- `useSession()` - Get current session

## Data Models

### Database Schema

#### clients Table
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_clients_business` on business (for search)
- `idx_clients_email` on email (for uniqueness check)
- `idx_clients_active` on active (for filtering)

**Triggers:**
- `update_clients_updated_at` - Auto-update updated_at on modification

#### projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('planning', 'development', 'honey-period', 'retainer', 'completed')),
  start_date DATE NOT NULL,
  support_months INTEGER NOT NULL DEFAULT 6,
  support_end_date DATE NOT NULL,
  description TEXT,
  tech_stack TEXT[],
  live_url TEXT,
  github_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_projects_client_id` on client_id (for joins)
- `idx_projects_status` on status (for filtering)
- `idx_projects_support_end_date` on support_end_date (for expiring support queries)
- `idx_projects_start_date` on start_date (for sorting)

**Triggers:**
- `update_projects_updated_at` - Auto-update updated_at on modification
- `auto_calculate_support_end_date` - Auto-calculate support_end_date from start_date + support_months

#### invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  description TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_due_date CHECK (due_date >= date),
  CONSTRAINT valid_paid_date CHECK (paid_date IS NULL OR paid_date >= date)
);
```

**Indexes:**
- `idx_invoices_client_id` on client_id (for joins)
- `idx_invoices_project_id` on project_id (for joins)
- `idx_invoices_status` on status (for filtering)
- `idx_invoices_date` on date DESC (for sorting)
- `idx_invoices_due_date` on due_date (for overdue detection)
- `idx_invoices_invoice_number` on invoice_number (for uniqueness and search)

**Triggers:**
- `update_invoices_updated_at` - Auto-update updated_at on modification
- `auto_update_invoice_status` - Auto-update status to 'overdue' when due_date < CURRENT_DATE and status != 'paid'

#### settings Table
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Default Data:**
- `business_info` - Business name, email, phone, bank details
- `invoice_settings` - Invoice prefix, default payment terms
- `project_settings` - Default support months

**Triggers:**
- `update_settings_updated_at` - Auto-update updated_at on modification

### Database Views

#### client_revenue_summary View
```sql
CREATE OR REPLACE VIEW client_revenue_summary AS
SELECT 
  c.id,
  c.business,
  c.contact,
  c.email,
  c.active,
  COUNT(DISTINCT p.id) as project_count,
  COUNT(DISTINCT i.id) as invoice_count,
  COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN i.status != 'paid' THEN i.amount ELSE 0 END), 0) as outstanding_amount
FROM clients c
LEFT JOIN projects p ON p.client_id = c.id
LEFT JOIN invoices i ON i.client_id = c.id
GROUP BY c.id, c.business, c.contact, c.email, c.active;
```

#### project_status_summary View
```sql
CREATE OR REPLACE VIEW project_status_summary AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.start_date,
  p.support_end_date,
  c.business as client_name,
  c.id as client_id,
  (p.support_end_date - CURRENT_DATE) as days_until_support_ends,
  CASE 
    WHEN p.support_end_date < CURRENT_DATE THEN 'expired'
    WHEN p.support_end_date - CURRENT_DATE <= 30 THEN 'expiring_soon'
    ELSE 'active'
  END as support_status
FROM projects p
JOIN clients c ON c.id = p.client_id;
```

#### dashboard_stats View
```sql
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM invoices WHERE status = 'paid' AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)) as paid_invoices_count,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'paid' AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)) as total_revenue,
  (SELECT COUNT(*) FROM invoices WHERE status = 'sent') as pending_invoices_count,
  (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices_count,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status IN ('sent', 'overdue', 'draft')) as outstanding_amount,
  (SELECT COUNT(*) FROM projects WHERE support_end_date - CURRENT_DATE <= 30 AND support_end_date >= CURRENT_DATE) as expiring_support_count;
```

### TypeScript Interfaces

```typescript
interface Client {
  id: string;
  business: string;
  contact: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
  status: 'planning' | 'development' | 'honey-period' | 'retainer' | 'completed';
  start_date: string;
  support_months: number;
  support_end_date: string;
  description?: string;
  tech_stack?: string[];
  live_url?: string;
  github_url?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id?: string;
  amount: number;
  date: string;
  due_date: string;
  paid_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  description: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  project?: Project;
}

interface Settings {
  id: string;
  key: string;
  value: {
    business_info?: BusinessInfo;
    invoice_settings?: InvoiceSettings;
    project_settings?: ProjectSettings;
  };
  updated_at: string;
}

interface BusinessInfo {
  name: string;
  email: string;
  phone: string;
  bank_name: string;
  bank: string;
  account: string;
  branch: string;
  account_type: string;
}

interface InvoiceSettings {
  prefix: string;
  payment_terms: number;
}

interface ProjectSettings {
  default_support_months: number;
}

interface DashboardStats {
  total_revenue: number;
  paid_invoices_count: number;
  pending_invoices_count: number;
  overdue_invoices_count: number;
  outstanding_amount: number;
  expiring_support_count: number;
}
```



## Error Handling

### Error Handling Strategy

The application implements a multi-layered error handling approach:

1. **Form Validation Layer** - Client-side validation before submission
2. **API Error Layer** - Supabase error handling with user-friendly messages
3. **Network Error Layer** - Connection loss detection and retry logic
4. **Global Error Boundary** - Catch-all for unexpected React errors

### Error Types and Responses

#### Authentication Errors
- **Invalid credentials**: Display "Invalid email or password"
- **Session expired**: Redirect to login with "Session expired. Please login again."
- **Network error during auth**: Display "Connection lost. Please check your internet." with retry button

#### Database Errors
- **Unique constraint violation**: "This [field] already exists"
- **Foreign key violation**: "Cannot delete [item] with associated [related items]"
- **Check constraint violation**: "Invalid value for [field]"
- **Generic database error**: "Something went wrong. Please try again."

#### Validation Errors
- **Required field**: "This field is required"
- **Email format**: "Please enter a valid email address"
- **URL format**: "Please enter a valid URL (e.g., https://example.com)"
- **Date range**: "Due date must be after invoice date"
- **Number range**: "[Field] must be between X and Y"

#### Network Errors
- **Connection lost**: Display persistent banner "You're offline. Changes will sync when connection is restored."
- **Request timeout**: "Request timed out. Please try again."
- **Failed after retries**: Display error with manual "Retry" button

### Error Recovery Mechanisms

**Automatic Retry:**
- Failed requests retry with exponential backoff (1s, 2s, 4s)
- Maximum 3 retry attempts
- Auth token refresh on 401 errors

**Manual Recovery:**
- "Retry" button on error messages
- "Refresh" button on stale data warnings
- Form data preservation in localStorage before logout

**Error Logging:**
```javascript
// lib/errorLogger.js
export function logError(error, context = {}) {
  console.error('Error:', error, 'Context:', context);
  // In production: send to error tracking service
}
```

## Testing Strategy

### Unit Testing

**Utility Functions** (`lib/utils.js`)
- `generateInvoiceNumber()` - Test sequential numbering, year rollover
- `calculateSupportEndDate()` - Test date calculations with various month values
- `getDaysUntilSupportEnds()` - Test countdown calculations
- `isOverdue()` - Test overdue detection logic
- `validateEmail()` - Test email format validation
- `validateURL()` - Test URL format validation
- `formatCurrency()` - Test currency formatting with various amounts

**Custom Hooks**
- Test data fetching with mock Supabase responses
- Test mutation success and error scenarios
- Test cache invalidation after mutations
- Test loading and error states

### Integration Testing

**Authentication Flow**
- Login with valid credentials → redirect to dashboard
- Login with invalid credentials → display error
- Logout → clear session and redirect to login
- Session expiry → redirect to login

**CRUD Operations**
- Create client → verify in database and UI
- Update client → verify changes persist
- Delete client with dependencies → show warning
- Delete client without dependencies → remove from database

**Data Relationships**
- Create project with client → verify foreign key
- Delete client → cascade delete projects and invoices
- Filter projects by client → verify correct results

### Manual Testing Checklist

**Functionality:**
- [ ] All CRUD operations work for clients, projects, invoices
- [ ] Search and filters work correctly
- [ ] Sorting works on all tables
- [ ] Auto-calculations work (invoice numbers, support dates)
- [ ] Dashboard stats are accurate
- [ ] Data export works

**UI/UX:**
- [ ] Modals open/close properly
- [ ] Forms validate correctly
- [ ] Loading states display
- [ ] Empty states display
- [ ] Toast notifications appear
- [ ] Responsive on mobile/tablet

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA

**Performance:**
- [ ] Initial load < 2 seconds
- [ ] Page navigation < 500ms
- [ ] Search results < 300ms
- [ ] No console errors



## Routing Structure

### Route Configuration

```javascript
// App.jsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
```

### Protected Route Logic

```javascript
// components/ProtectedRoute.jsx
function ProtectedRoute() {
  const { session, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  
  return <Outlet />;
}
```

## State Management

### React Query Configuration

```javascript
// App.jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### Cache Invalidation Strategy

**After Create Operations:**
- Invalidate list queries for the entity type
- Example: After creating client, invalidate `['clients']`

**After Update Operations:**
- Invalidate list queries and specific entity query
- Example: After updating client, invalidate `['clients']` and `['clients', id]`

**After Delete Operations:**
- Invalidate list queries
- Remove specific entity from cache
- Example: After deleting client, invalidate `['clients']`

**Cross-Entity Invalidation:**
- After client operations, invalidate dashboard stats
- After invoice operations, invalidate dashboard stats and client revenue
- After project operations, invalidate client project counts

### Local State Management

**Form State:**
- Managed by React useState within form components
- Validation state tracked separately
- Form data preserved in localStorage for recovery

**UI State:**
- Modal open/close state
- Search/filter values
- Sort direction
- Pagination state

**No Global State Library:**
- React Query handles server state
- React Context for auth state only
- Component-level state for UI concerns

## Utility Functions

### Invoice Number Generation

```javascript
// lib/utils.js
export async function generateInvoiceNumber(supabase, prefix = 'MZK') {
  const year = new Date().getFullYear();
  const searchPrefix = `${prefix}-${year}-`;
  
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${searchPrefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);
  
  if (error) throw error;
  
  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].invoice_number.split('-').pop());
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
  }
  
  return `${searchPrefix}${String(nextNumber).padStart(3, '0')}`;
}
```

### Support Date Calculations

```javascript
export function calculateSupportEndDate(startDate, months) {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

export function getDaysUntilSupportEnds(supportEndDate) {
  const today = new Date();
  const endDate = new Date(supportEndDate);
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function isSupportExpiringSoon(supportEndDate, daysThreshold = 30) {
  const daysUntil = getDaysUntilSupportEnds(supportEndDate);
  return daysUntil > 0 && daysUntil <= daysThreshold;
}
```

### Validation Functions

```javascript
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateInvoiceNumber(number, prefix = 'MZK') {
  const pattern = new RegExp(`^${prefix}-\\d{4}-\\d{3}$`);
  return pattern.test(number);
}
```

### Formatting Functions

```javascript
import { format, formatDistance, parseISO } from 'date-fns';

export function formatDate(date, formatStr = 'MMM dd, yyyy') {
  if (!date) return '';
  return format(parseISO(date), formatStr);
}

export function formatCurrency(amount, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatRelativeDate(date) {
  if (!date) return '';
  return formatDistance(parseISO(date), new Date(), { addSuffix: true });
}
```

### Data Export Function

```javascript
export async function exportAllData(supabase) {
  const [clients, projects, invoices, settings] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('projects').select('*'),
    supabase.from('invoices').select('*'),
    supabase.from('settings').select('*'),
  ]);
  
  const exportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    data: {
      clients: clients.data || [],
      projects: projects.data || [],
      invoices: invoices.data || [],
      settings: settings.data || [],
    }
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `koruku-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

## Design System

### Color Palette

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#2c3e50',    // Dark slate
        accent: '#ffd166',     // Gold
        success: '#27ae60',    // Green
        danger: '#e74c3c',     // Red
        warning: '#f39c12',    // Orange
        info: '#3498db',       // Blue
        muted: '#7f8c8d',      // Gray
      },
    },
  },
};
```

### Typography

- **Font Family**: Inter (fallback: system-ui, sans-serif)
- **Headings**: Bold weight, sizes 24px-32px
- **Body**: Regular weight, 14-16px
- **Small**: 12-14px for labels and captions

### Component Styling Patterns

**Buttons:**
- Primary: Gold background (#ffd166), dark text, rounded corners
- Secondary: White background, dark border, dark text
- Danger: Red background (#e74c3c), white text
- Ghost: Transparent background, hover effect

**Inputs:**
- Border: 1px solid #e0e0e0
- Focus: 2px gold border (#ffd166)
- Error: Red border (#e74c3c)
- Rounded corners (4px)
- Padding: 8px 12px

**Cards:**
- White background
- Subtle shadow: 0 1px 3px rgba(0,0,0,0.1)
- Rounded corners (8px)
- Padding: 16-24px

**Status Badges:**
- Rounded pill shape
- Padding: 4px 12px
- Font size: 12px
- Colors based on status:
  - Draft: Gray (#7f8c8d)
  - Sent: Blue (#3498db)
  - Paid: Green (#27ae60)
  - Overdue: Red (#e74c3c)
  - Planning: Purple (#9b59b6)
  - Development: Blue (#3498db)
  - Honey-period: Yellow (#f39c12)
  - Retainer: Green (#27ae60)
  - Completed: Gray (#7f8c8d)

### Responsive Breakpoints

```javascript
// Tailwind default breakpoints
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
```

**Responsive Behavior:**
- Sidebar: Fixed on desktop (≥768px), hamburger menu on mobile (<768px)
- Tables: Horizontal scroll on mobile
- Modals: Full width on mobile, fixed width on desktop
- Grid layouts: Stack on mobile, multi-column on desktop



## Security Design

### Authentication Flow

```
1. User enters credentials on login page
2. Frontend calls supabase.auth.signInWithPassword()
3. Supabase validates credentials
4. On success: Session token stored in localStorage
5. Frontend redirects to dashboard
6. All subsequent requests include session token
7. Supabase validates token via RLS policies
```

### Row Level Security (RLS)

**Policy Design:**
- All tables have RLS enabled
- Single policy per table: "Allow all for authenticated users"
- Policy checks: `auth.uid() IS NOT NULL`
- Single-user system: No user-specific data isolation needed

**RLS Policies:**
```sql
-- Clients table
CREATE POLICY "Allow all for authenticated users" ON clients 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Projects table
CREATE POLICY "Allow all for authenticated users" ON projects 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Invoices table
CREATE POLICY "Allow all for authenticated users" ON invoices 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Settings table
CREATE POLICY "Allow all for authenticated users" ON settings 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);
```

### Data Security

**Encryption:**
- All data encrypted at rest (Supabase default)
- All data encrypted in transit (HTTPS only)
- Session tokens stored securely in localStorage

**Input Sanitization:**
- React escapes all user input by default (XSS prevention)
- Supabase uses parameterized queries (SQL injection prevention)
- URL validation before opening external links

**Sensitive Data:**
- No passwords stored in frontend
- No API keys in client code
- Environment variables for Supabase credentials
- Bank details stored in encrypted JSONB field

### Session Management

**Session Lifecycle:**
- Session duration: 24 hours
- Auto-refresh: Enabled via Supabase client
- Session expiry: Redirect to login with message
- Logout: Clear session and redirect

**Session Storage:**
- Stored in localStorage (Supabase default)
- Includes: access_token, refresh_token, user metadata
- Cleared on logout or expiry

## Performance Optimization

### Frontend Optimization

**Code Splitting:**
```javascript
// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Projects = lazy(() => import('./pages/Projects'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Settings = lazy(() => import('./pages/Settings'));
```

**Bundle Optimization:**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'query-vendor': ['@tanstack/react-query']
        }
      }
    }
  }
});
```

**Memoization:**
```javascript
// Memoize expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);

// Memoize callbacks
const handleSearch = useCallback((value) => {
  setSearchTerm(value);
}, []);
```

**Debouncing:**
```javascript
// Debounce search input (300ms)
const debouncedSearch = useMemo(
  () => debounce((value) => setSearchTerm(value), 300),
  []
);
```

### Data Fetching Optimization

**React Query Caching:**
- Stale time: 5 minutes (data considered fresh)
- Cache time: 10 minutes (data kept in cache)
- Refetch on window focus: Disabled
- Retry: 1 attempt

**Prefetching:**
```javascript
// Prefetch on hover
const queryClient = useQueryClient();

const handleMouseEnter = (clientId) => {
  queryClient.prefetchQuery({
    queryKey: ['clients', clientId],
    queryFn: () => fetchClient(clientId)
  });
};
```

**Optimistic Updates:**
```javascript
// Update UI immediately, rollback on error
const mutation = useMutation({
  mutationFn: updateClient,
  onMutate: async (newClient) => {
    await queryClient.cancelQueries(['clients']);
    const previousClients = queryClient.getQueryData(['clients']);
    queryClient.setQueryData(['clients'], (old) => 
      old.map(c => c.id === newClient.id ? newClient : c)
    );
    return { previousClients };
  },
  onError: (err, newClient, context) => {
    queryClient.setQueryData(['clients'], context.previousClients);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['clients']);
  }
});
```

**Database Optimization:**
- Indexes on frequently queried columns
- Database views for complex aggregations
- Limit query results (pagination)
- Select only needed columns

### Performance Targets

- **Initial Load**: < 2 seconds
- **Page Navigation**: < 500ms
- **Data Fetch**: < 1 second
- **Form Submit**: < 1 second
- **Search Results**: < 300ms
- **Bundle Size**: < 500KB (gzipped)
- **Lighthouse Score**: > 90 (all categories)

## Accessibility Implementation

### Keyboard Navigation

**Focus Management:**
- Visible focus indicators (2px gold outline)
- Logical tab order (left-to-right, top-to-bottom)
- Skip to main content link
- Focus trap in modals

**Keyboard Shortcuts:**
- Tab: Move focus forward
- Shift+Tab: Move focus backward
- Enter: Submit forms, activate buttons
- Escape: Close modals, clear search
- Arrow keys: Navigate tables (optional)

### Screen Reader Support

**Semantic HTML:**
```html
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Dashboard</a></li>
  </ul>
</nav>

<main aria-label="Main content">
  <h1>Dashboard</h1>
</main>
```

**ARIA Attributes:**
```html
<!-- Form fields -->
<input 
  type="text" 
  id="business" 
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "business-error" : undefined}
/>
{hasError && <span id="business-error" role="alert">This field is required</span>}

<!-- Modals -->
<div 
  role="dialog" 
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Add Client</h2>
</div>

<!-- Live regions -->
<div role="status" aria-live="polite" aria-atomic="true">
  {notification}
</div>
```

**Table Accessibility:**
```html
<table>
  <caption>Client List</caption>
  <thead>
    <tr>
      <th scope="col">Business Name</th>
      <th scope="col">Contact</th>
      <th scope="col">Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Acme Corp</td>
      <td>John Doe</td>
      <td>john@acme.com</td>
    </tr>
  </tbody>
</table>
```

### Visual Accessibility

**Color Contrast:**
- Text: 4.5:1 minimum (WCAG AA)
- UI components: 3:1 minimum (WCAG AA)
- Test with contrast checker tools

**Non-Color Indicators:**
- Status badges include icons + text
- Error states show icon + message
- Required fields marked with * and aria-required

**Touch Targets:**
- Minimum size: 44x44px
- Adequate spacing between targets
- Larger targets on mobile

## Deployment Strategy

### Build Configuration

**Environment Variables:**
```env
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

**Build Command:**
```bash
npm run build
```

**Output:**
- Directory: `dist/`
- Assets: Hashed filenames for cache busting
- Sourcemaps: Disabled in production

### Hosting Options

**Vercel (Recommended):**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Netlify:**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### DNS Configuration

- Point koruku.xyz A record to hosting provider
- Enable HTTPS (automatic with Vercel/Netlify)
- Set up www redirect (www.koruku.xyz → koruku.xyz)

### Continuous Deployment

1. Connect GitHub repository to hosting provider
2. Auto-deploy on push to main branch
3. Preview deployments for pull requests
4. Rollback capability

### Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Database schema created in Supabase
- [ ] RLS policies enabled
- [ ] Default settings inserted
- [ ] Test user account created
- [ ] Build succeeds locally
- [ ] No console errors in production build
- [ ] Lighthouse score > 90
- [ ] All features tested

### Post-Deployment Monitoring

**Health Checks:**
- Uptime monitoring (optional)
- Error tracking (Sentry, optional)
- Performance monitoring (Web Vitals)

**Backup Strategy:**
- Automatic Supabase backups (daily)
- Manual exports (weekly via app)
- Store backups in multiple locations

## Design Decisions and Rationale

### Why React Query?
- Eliminates need for global state management
- Built-in caching and background refetching
- Optimistic updates and error handling
- Reduces boilerplate code

### Why Supabase?
- PostgreSQL database with full SQL capabilities
- Built-in authentication and RLS
- Real-time capabilities (future enhancement)
- Generous free tier
- Easy to set up and deploy

### Why Tailwind CSS?
- Utility-first approach speeds development
- Consistent design system
- Small bundle size (purged unused styles)
- No CSS naming conflicts
- Easy to customize

### Why Vite?
- Fast development server with HMR
- Optimized production builds
- Native ES modules support
- Better than Create React App for modern projects

### Why Single-Page Application?
- Better user experience (no page reloads)
- Faster navigation
- Easier state management
- Modern web app standard

### Why No Backend API?
- Supabase provides database and auth
- RLS handles authorization
- Reduces complexity and maintenance
- Faster development
- Lower hosting costs

## Future Enhancements

### Phase 2 Features (Not in MVP)
- Email integration (send invoices via email)
- PDF generation (invoice templates)
- Recurring invoices
- Payment tracking (partial payments)
- Multi-currency support
- Tax calculations

### Phase 3 Features
- Expense tracking
- Time tracking
- Reports and analytics (charts)
- Client portal (view invoices, projects)
- Team collaboration (multi-user)
- Mobile app (React Native)

### Technical Improvements
- Implement Supabase Realtime for live updates
- Add service worker for offline support
- Implement virtual scrolling for large datasets
- Add advanced search with filters
- Implement data import functionality
- Add audit log for all changes

