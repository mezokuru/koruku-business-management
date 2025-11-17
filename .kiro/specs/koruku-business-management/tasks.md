# Implementation Plan

- [x] 1. Set up project foundation and configuration







  - Initialize Vite + React project with TypeScript support
  - Install all required dependencies (React Router, Supabase, React Query, Tailwind, date-fns, lucide-react, react-hot-toast)
  - Configure Tailwind CSS with custom color palette and design tokens
  - Configure Vite build settings with code splitting for vendor chunks
  - Create .env.example file with required environment variables
  - Set up ESLint configuration for code quality
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Create Supabase database schema and configuration





  - Create SQL migration file with UUID extension enablement
  - Write SQL for clients table with indexes and triggers
  - Write SQL for projects table with indexes, triggers, and auto-calculate support_end_date trigger
  - Write SQL for invoices table with indexes, triggers, and auto-update overdue status trigger
  - Write SQL for settings table with default data insertion
  - Create database views (client_revenue_summary, project_status_summary, dashboard_stats)
  - Implement Row Level Security policies for all tables
  - Create Supabase client initialization file (lib/supabase.js) with environment variables
  - _Requirements: 1.2, 2.1, 2.3, 3.1, 4.1, 5.1, 6.2, 7.1_

- [x] 3. Implement core utility functions and helpers





  - Create lib/utils.js with invoice number generation function
  - Implement support date calculation functions (calculateSupportEndDate, getDaysUntilSupportEnds, isSupportExpiringSoon)
  - Implement validation functions (validateEmail, validateURL, validateInvoiceNumber)
  - Implement formatting functions (formatDate, formatCurrency, formatRelativeDate)
  - Implement status helper functions (isOverdue, getInvoiceStatusColor, getProjectStatusColor)
  - Create data export function (exportAllData)
  - Create error logging utility (lib/errorLogger.js)
  - _Requirements: 4.2, 4.6, 3.3, 6.4, 7.2, 7.3, 9.3, 9.4, 10.3_

- [x] 4. Build reusable UI component library





  - Create Button component with variants (primary, secondary, danger, ghost) and loading state
  - Create Input component with validation states and error display
  - Create Modal component with backdrop, ESC key handling, and focus trap
  - Create Table component with sortable columns and loading skeleton
  - Create StatusBadge component for invoice and project statuses
  - Create StatCard component for dashboard metrics
  - Create LoadingSpinner component for loading states
  - Create EmptyState component for no-data scenarios
  - _Requirements: 2.3, 3.2, 4.3, 5.1, 8.4, 9.1, 9.2, 9.6, 12.1, 12.2, 12.3_

- [x] 5. Implement authentication system














  - Create useAuth custom hook for authentication state management
  - Create Login page component with email/password form
  - Implement login mutation with Supabase Auth
  - Add form validation for email format and required fields
  - Implement error handling for invalid credentials and network errors
  - Create ProtectedRoute component to guard authenticated routes
  - Implement logout functionality with session clearing
  - Add session expiry detection and redirect logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.3, 10.2, 12.7_
- [x] 6. Create layout and navigation structure









- [ ] 6. Create layout and navigation structure

  - Create Sidebar component with navigation menu and active state highlighting
  - Create Header component with page title and action button slot
  - Create Layout component combining Sidebar and main content area
  - Implement responsive sidebar (hamburger menu on mobile)
  - Set up React Router with route configuration
  - Create route structure for Dashboard, Clients, Projects, Invoices, Settings
  - Implement navigation with proper focus management
  - _Requirements: 11.1, 12.1, 12.2_

- [x] 7. Set up React Query and data fetching infrastructure





  - Configure QueryClient with caching and retry settings
  - Wrap application with QueryClientProvider
  - Create useClients hook with queries and mutations (useClients, useClient, useCreateClient, useUpdateClient, useDeleteClient)
  - Create useProjects hook with queries and mutations (useProjects, useProject, useCreateProject, useUpdateProject, useDeleteProject)
  - Create useInvoices hook with queries and mutations (useInvoices, useInvoice, useCreateInvoice, useUpdateInvoice, useDeleteInvoice, useMarkInvoicePaid)
  - Create useSettings hook with query and mutation (useSettings, useUpdateSettings)
  - Create useDashboard hook with queries (useDashboardStats, useRecentInvoices, useExpiringSupportProjects)
  - Implement cache invalidation strategy for cross-entity updates
  - _Requirements: 2.1, 2.4, 2.5, 3.1, 3.4, 3.5, 4.1, 4.4, 4.5, 5.1, 5.6, 6.2, 6.3, 7.1_

- [x] 8. Build Client Management feature





  - Create Clients page component with table layout
  - Implement ClientList component with search and filter functionality
  - Create ClientForm component for add/edit operations
  - Implement form validation (business, contact, email, phone required with length constraints)
  - Add unique email validation with error handling
  - Create ClientDetail modal showing client info, projects, invoices, and revenue
  - Implement delete confirmation with dependency check
  - Add mark as inactive functionality
  - Implement empty state for no clients
  - Add debounced search (300ms delay)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 8.1, 8.2, 8.3, 9.1, 9.2, 9.5, 9.6_

- [x] 9. Build Project Management feature





  - Create Projects page component with table layout
  - Implement ProjectList component with search and filter by status
  - Create ProjectForm component for add/edit operations
  - Implement client dropdown showing only active clients
  - Add auto-calculation of support_end_date when start_date or support_months change
  - Implement form validation (name, client, status, start_date, support_months required)
  - Add URL validation for live_url and github_url fields
  - Create ProjectDetail modal showing project info, client details, and related invoices
  - Display support countdown in table with warning icon for expiring support (< 30 days)
  - Implement status badges with appropriate colors
  - Add empty state for no projects
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 8.1, 8.2, 8.4, 9.1, 9.2, 9.4, 9.5, 9.6_

- [x] 10. Build Invoice Management feature





  - Create Invoices page component with table layout
  - Implement InvoiceList component with search and filter by status
  - Create InvoiceForm component for add/edit operations
  - Implement auto-generation of invoice number on new invoice creation
  - Add client dropdown with active clients and project dropdown filtered by selected client
  - Implement form validation (invoice_number, client, amount, date, due_date, description required)
  - Add date validation (due_date >= date, within 1 year range)
  - Add amount validation (0.01-999999.99 with 2 decimal places)
  - Implement overdue detection and row highlighting in light red
  - Create "Mark as Paid" button functionality setting status and paid_date
  - Create "Mark as Sent" button functionality
  - Handle duplicate invoice number error with suggested next number
  - Display status badges with appropriate colors
  - Add empty state for no invoices
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 8.1, 8.2, 8.3, 9.1, 9.2, 9.5, 9.6, 9.7_

- [x] 11. Build Dashboard page





  - Create Dashboard page component with stat cards layout
  - Implement stat card for total revenue (sum of paid invoices for current year)
  - Implement stat card for paid invoices count (current year)
  - Implement stat card for pending invoices count (status = 'sent')
  - Implement stat card for overdue invoices count (status = 'overdue')
  - Implement stat card for outstanding amount (sum of unpaid invoices)
  - Create recent invoices table showing last 10 invoices
  - Implement alert banner for projects with support ending within 30 days
  - Add quick action buttons (New Invoice, New Client, New Project)
  - Set up auto-refresh of dashboard stats every minute
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 12. Build Settings page






  - Create Settings page component with form sections
  - Implement business information section (name, email, phone, bank details)
  - Implement invoice settings section (prefix, default payment terms)
  - Implement project settings section (default support months)
  - Load current settings from Supabase on page mount
  - Implement form validation (email format for business email)
  - Create save functionality updating settings in Supabase
  - Add success toast notification on save
  - Implement data export button triggering exportAllData function
  - Add success toast notification on export completion
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 9.3_

- [x] 13. Implement search and filter functionality across all pages





  - Add debounced search input (300ms) to Clients, Projects, and Invoices pages
  - Implement filter dropdowns for active/inactive (Clients), status (Projects, Invoices)
  - Add "Clear filters" button when filters are applied
  - Display "No results found" message when search/filter returns empty
  - Implement sortable table columns with ascending/descending toggle
  - Ensure search and filter work together correctly
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 14. Implement comprehensive error handling





  - Add network error detection with toast notification and retry button
  - Implement authentication error handling with redirect to login
  - Add database constraint error handling with user-friendly messages
  - Create offline detection banner with sync message
  - Implement automatic retry with exponential backoff (1s, 2s, 4s, max 3 attempts)
  - Add manual retry button on failed operations
  - Create ErrorBoundary component for unexpected React errors
  - Implement form validation error display with aria-invalid and aria-describedby
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 9.2, 12.7_

- [x] 15. Implement toast notification system





  - Set up react-hot-toast with custom styling
  - Create toast notification wrapper with success, error, and info variants
  - Add toast notifications for all CRUD operations (create, update, delete success/error)
  - Add toast for settings save success
  - Add toast for data export success
  - Add toast for mark invoice as paid/sent
  - Position toasts at top-right with 3-second auto-dismiss
  - Ensure toasts are announced to screen readers
  - _Requirements: 2.4, 2.5, 3.4, 3.5, 4.4, 4.5, 4.6, 6.3, 7.4, 12.4_

- [x] 16. Implement responsive design for mobile and tablet





  - Make sidebar collapse to hamburger menu on screens < 768px
  - Enable horizontal scrolling for tables on mobile devices
  - Ensure all touch targets are at least 44x44px
  - Make modals full-width on mobile, fixed-width on desktop
  - Test layout adjustments on window resize
  - Ensure forms are usable on mobile devices
  - Test all features on mobile viewport
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 12.3_

- [x] 17. Implement accessibility features for WCAG 2.1 AA compliance





  - Add visible focus indicators (2px gold outline) to all interactive elements
  - Implement logical tab order for keyboard navigation
  - Add ESC key handler to close modals
  - Implement focus trap within modals
  - Add ARIA labels to all interactive elements
  - Create ARIA live regions for dynamic content updates
  - Ensure color contrast ratios meet WCAG AA standards (4.5:1 for text, 3:1 for UI)
  - Add text labels/icons alongside color-coded status indicators
  - Implement proper form error announcements with aria-invalid and aria-describedby
  - Add semantic HTML (nav, main, article) throughout application
  - Test with keyboard-only navigation
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 18. Optimize performance and bundle size





  - Implement lazy loading for page components (Dashboard, Clients, Projects, Invoices, Settings)
  - Configure Vite manual chunks for vendor code splitting
  - Add useMemo for expensive calculations (sorting, filtering)
  - Add useCallback for event handlers passed to child components
  - Implement prefetching on hover for detail modals
  - Verify bundle size is < 500KB gzipped
  - Test initial load time < 2 seconds
  - Test page navigation < 500ms
  - Test search results < 300ms
  - Run Lighthouse audit and achieve score > 90 in all categories
  - _Requirements: Performance targets from design document_

- [x] 19. Final testing and polish





  - Test all CRUD operations for clients, projects, invoices
  - Verify search and filter functionality on all pages
  - Test sorting on all table columns
  - Verify auto-calculations (invoice numbers, support dates, overdue detection)
  - Test dashboard stats accuracy
  - Verify data export functionality
  - Test settings save and load
  - Test all modals open/close properly
  - Verify form validation on all forms
  - Test error handling scenarios (network errors, validation errors)
  - Test responsive design on mobile and tablet
  - Test keyboard navigation throughout application
  - Verify no console errors in production build
  - Test in Chrome, Firefox, Safari, Edge browsers
  - _Requirements: All requirements_

- [x] 20. Prepare for deployment





  - Create production environment variables file
  - Test production build locally
  - Set up Vercel or Netlify project
  - Configure custom domain (koruku.xyz)
  - Set up continuous deployment from GitHub
  - Create Supabase production project
  - Run database migrations on production Supabase
  - Create production user account
  - Deploy application to production
  - Verify all features work in production environment
  - Set up error monitoring (optional)
  - _Requirements: Deployment requirements from design document_
