# Koruku Business Management System - PRD for Bolt.new

## Project Overview

**Name:** Koruku Business Management  
**Domain:** koruku.xyz  
**Purpose:** Complete business management system for Mezokuru web development business  
**Tech Stack:** React + Vite + Supabase + Tailwind CSS  
**Target:** Bolt.new with Supabase integration

---

## Core Functionality

A single-page application for managing clients, projects, invoices, and business operations with real-time data sync via Supabase.

---

## Database Schema (Supabase)

### Prerequisites
```sql
-- Enable UUID extension (run first)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Table: `clients`
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

-- Indexes for performance
CREATE INDEX idx_clients_business ON clients(business);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_active ON clients(active);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Table: `projects`
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

-- Indexes for performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_support_end_date ON projects(support_end_date);
CREATE INDEX idx_projects_start_date ON projects(start_date);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-calculate support_end_date
CREATE OR REPLACE FUNCTION calculate_support_end_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.support_end_date = NEW.start_date + (NEW.support_months || ' months')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_support_end_date
  BEFORE INSERT OR UPDATE OF start_date, support_months ON projects
  FOR EACH ROW
  EXECUTE FUNCTION calculate_support_end_date();
```

### Table: `invoices`
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

-- Indexes for performance
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- Trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update status to overdue
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != 'paid' AND NEW.due_date < CURRENT_DATE THEN
    NEW.status = 'overdue';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_invoice_status
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status();
```

### Table: `settings`
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('business_info', '{"name": "Mezokuru", "email": "info@mezokuru.com", "phone": "", "bank_name": "", "bank": "", "account": "", "branch": "", "account_type": ""}'),
  ('invoice_settings', '{"prefix": "MZK", "payment_terms": 14}'),
  ('project_settings', '{"default_support_months": 6}')
ON CONFLICT (key) DO NOTHING;
```

### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (single user system)
CREATE POLICY "Allow all for authenticated users" ON clients 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON projects 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON invoices 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON settings 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);
```

### Database Views (Optional but Recommended)

```sql
-- View for client revenue summary
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

-- View for project status summary
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

-- View for dashboard stats
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM invoices WHERE status = 'paid' AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)) as paid_invoices_count,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'paid' AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)) as total_revenue,
  (SELECT COUNT(*) FROM invoices WHERE status = 'sent') as pending_invoices_count,
  (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices_count,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status IN ('sent', 'overdue', 'draft')) as outstanding_amount,
  (SELECT COUNT(*) FROM projects WHERE support_end_date - CURRENT_DATE <= 30 AND support_end_date >= CURRENT_DATE) as expiring_support_count;
```

---

## Features & User Stories

### 1. Authentication
**Story:** As a user, I need to securely login to access my business data.

**Requirements:**
- Supabase Auth with email/password
- Login page with email and password fields
- "Remember me" option
- Password reset functionality
- Auto-redirect to dashboard after login
- Logout button in sidebar
- Session persistence

**UI:**
- Clean login form centered on page
- Mezokuru branding (dark theme, gold accent)
- Error messages for invalid credentials
- Loading state during authentication

---

### 2. Dashboard
**Story:** As a user, I want to see an overview of my business at a glance.

**Requirements:**
- Revenue stats (current year)
  - Total revenue (sum of paid invoices)
  - Paid invoices count
  - Pending invoices count (sent status)
  - Overdue invoices count
  - Outstanding amount (unpaid total)
- Recent invoices table (last 10)
- Quick action buttons (New Invoice, New Client, New Project)
- Support period alerts (projects ending in 30 days)

**UI:**
- 4-column stat cards with icons
- Recent invoices table with status badges
- Alert banner for expiring support periods
- Quick action buttons prominently displayed

---

### 3. Client Management
**Story:** As a user, I want to manage my client database.

**Requirements:**
- List all clients in a table
- Search clients by business name, contact, email
- Filter by active/inactive
- Sort by name, created date
- Add new client (modal form)
- Edit client (modal form)
- Delete client (with confirmation)
- View client details (modal)
  - Client info
  - List of projects
  - List of invoices
  - Total revenue from client
- Mark client as inactive (soft delete)

**Validation:**
- Business name: required, min 2 chars, max 200 chars
- Contact: required, min 2 chars, max 100 chars
- Email: required, valid email format, unique, max 255 chars
- Phone: required, valid format (allow international), max 20 chars
- Address: optional, max 500 chars
- Notes: optional, max 2000 chars

**UI:**
- Data table with search bar
- Action buttons (edit, delete) per row
- Modal forms for add/edit
- Client detail modal with tabs (Info, Projects, Invoices)
- Empty state when no clients

---

### 4. Project Management
**Story:** As a user, I want to track all my projects and their support periods.

**Requirements:**
- List all projects in a table
- Search projects by name, client
- Filter by status
- Sort by start date, name, support end date
- Add new project (modal form)
- Edit project (modal form)
- Delete project (with confirmation)
- View project details (modal)
  - Project info
  - Client details
  - Support period countdown
  - Related invoices
- Update project status (dropdown)
- Auto-calculate support end date (start date + months)
- Alert when support ending soon (< 30 days)

**Validation:**
- Name: required, min 3 chars, max 200 chars
- Client: required (dropdown from active clients only)
- Status: required (enum: planning, development, honey-period, retainer, completed)
- Start date: required, valid date, cannot be in future by more than 30 days
- Support months: required, number, min 0, max 60
- Description: optional, max 2000 chars
- Tech stack: optional, array of strings, max 20 items
- Live URL: optional, valid URL format
- GitHub URL: optional, valid URL format

**UI:**
- Data table with search and filter
- Status badges with colors
- Support countdown in table
- Warning icon for expiring support
- Modal forms for add/edit
- Project detail modal

---

### 5. Invoice Management
**Story:** As a user, I want to create, track, and manage invoices.

**Requirements:**
- List all invoices in a table
- Search invoices by number, client
- Filter by status
- Sort by date, amount, due date
- Add new invoice (modal form)
- Edit invoice (modal form)
- Delete invoice (with confirmation)
- Mark as sent
- Mark as paid (sets paid_date)
- Duplicate invoice (copy with new number)
- Auto-generate invoice number (MZK-YYYY-XXX)
- Auto-detect overdue (due_date < today && status != paid)
- Highlight overdue invoices in red

**Validation:**
- Invoice number: required, unique, format PREFIX-YYYY-XXX (e.g., MZK-2025-001)
- Client: required (dropdown from active clients)
- Project: optional (dropdown from client's projects)
- Amount: required, number, min 0.01, max 999999.99, 2 decimal places
- Date: required, valid date, cannot be more than 1 year in past or future
- Due date: required, valid date, must be >= invoice date, cannot be more than 1 year from invoice date
- Status: required (enum: draft, sent, paid, overdue)
- Description: required, min 5 chars, max 1000 chars
- Notes: optional, max 2000 chars
- Paid date: auto-set when status changes to 'paid', must be >= invoice date

**UI:**
- Data table with search and filter
- Status badges (draft=gray, sent=blue, paid=green, overdue=red)
- Overdue rows highlighted in light red
- Quick action buttons (mark paid, edit, delete)
- Modal form for add/edit
- Auto-fill invoice number on new invoice

---

### 6. Settings
**Story:** As a user, I want to configure business settings.

**Requirements:**
- Business information
  - Business name
  - Email
  - Phone
  - Bank details (name, bank, account, branch, type)
- Invoice settings
  - Invoice prefix (default: MZK)
  - Default payment terms (days, default: 14)
- Project settings
  - Default support period (months, default: 6)
- Save settings to Supabase

**UI:**
- Form with sections
- Save button
- Success notification on save

---

### 7. Data Export
**Story:** As a user, I want to export my data for backup.

**Requirements:**
- Export all data to JSON
- Include clients, projects, invoices, settings
- Filename: `koruku-backup-YYYY-MM-DD.json`
- Download to computer
- Button in settings page

**UI:**
- Export button with download icon
- Success notification after export

---

## UI/UX Requirements

### Design System

**Colors:**
- Primary: #2c3e50 (dark slate)
- Accent: #ffd166 (gold)
- Success: #27ae60 (green)
- Danger: #e74c3c (red)
- Warning: #f39c12 (orange)
- Info: #3498db (blue)
- Background: #f5f5f5 (light gray)
- Text: #2c3e50 (dark slate)
- Muted: #7f8c8d (gray)

**Typography:**
- Font: 'Inter' or 'Segoe UI'
- Headings: Bold, larger sizes
- Body: Regular, 14-16px

**Components:**
- Buttons: Rounded, with hover effects
- Inputs: Border, rounded, focus state
- Tables: Striped rows, hover effect
- Modals: Centered, backdrop blur
- Status badges: Rounded pills with colors
- Cards: White background, subtle shadow

### Layout

**Sidebar (Fixed Left):**
- Width: 250px
- Dark background (#2c3e50)
- Logo at top
- Navigation menu
- Logout at bottom

**Main Content:**
- Margin-left: 250px
- Padding: 20px
- White background cards

**Header (Per Page):**
- Page title (left)
- Search bar (center, if applicable)
- Primary action button (right)

### Navigation

**Sidebar Menu:**
- Dashboard (home icon)
- Clients (users icon)
- Projects (project icon)
- Invoices (invoice icon)
- Settings (cog icon)
- Export Data (download icon)
- Logout (sign-out icon)

**Active State:**
- Gold background (#ffd166)
- Dark text

### Modals

**Behavior:**
- Fade in/out animation
- Click backdrop to close
- ESC key to close
- Form validation before submit
- Loading state on submit

**Structure:**
- Header with title and close button
- Body with form fields
- Footer with cancel and save buttons

### Tables

**Features:**
- Sortable columns (click header)
- Hover effect on rows
- Action buttons (right column)
- Empty state message
- Loading skeleton

**Columns:**
- Left-aligned text
- Right-aligned numbers
- Center-aligned actions

### Forms

**Features:**
- Inline validation
- Required field indicators (*)
- Error messages below fields
- Disabled submit until valid
- Loading state on submit

**Fields:**
- Text inputs
- Email inputs
- Number inputs
- Date pickers (native)
- Dropdowns (searchable for clients)
- Textareas

### Notifications

**Toast Messages:**
- Position: Top-right
- Auto-dismiss: 3 seconds
- Types: Success (green), Error (red), Info (blue)
- Slide-in animation

---

## Technical Specifications

### Tech Stack

**Frontend:**
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (routing)
- React Query (data fetching)
- Zustand (state management, optional)

**Backend:**
- Supabase (PostgreSQL database)
- Supabase Auth (authentication)
- Supabase Realtime (optional, for live updates)

**Libraries:**
- date-fns (date formatting)
- react-hot-toast (notifications)
- lucide-react (icons)
- @supabase/supabase-js (Supabase client)

### Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── Layout.jsx
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── StatusBadge.jsx
│   │   └── StatCard.jsx
│   ├── clients/
│   │   ├── ClientList.jsx
│   │   ├── ClientForm.jsx
│   │   └── ClientDetail.jsx
│   ├── projects/
│   │   ├── ProjectList.jsx
│   │   ├── ProjectForm.jsx
│   │   └── ProjectDetail.jsx
│   └── invoices/
│       ├── InvoiceList.jsx
│       ├── InvoiceForm.jsx
│       └── InvoiceDetail.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Clients.jsx
│   ├── Projects.jsx
│   ├── Invoices.jsx
│   └── Settings.jsx
├── hooks/
│   ├── useClients.js
│   ├── useProjects.js
│   ├── useInvoices.js
│   └── useSettings.js
├── lib/
│   ├── supabase.js
│   └── utils.js
├── App.jsx
└── main.jsx
```

### Package Dependencies

**package.json:**
```json
{
  "name": "koruku",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.38.0",
    "@tanstack/react-query": "^5.12.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0",
    "react-hot-toast": "^2.4.1",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6"
  }
}
```

### Vite Configuration

**vite.config.js:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
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
})
```

### Tailwind Configuration

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2c3e50',
        accent: '#ffd166',
        success: '#27ae60',
        danger: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db',
        muted: '#7f8c8d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

**postcss.config.js:**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Supabase Setup

**Environment Variables (.env):**
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Environment Variables (.env.example):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Client Initialization (lib/supabase.js):**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
```

### React Query Setup

**App.jsx:**
```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Data Fetching Pattern

**Using React Query:**
```javascript
// hooks/useClients.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useClients(activeOnly = false) {
  return useQuery({
    queryKey: ['clients', { activeOnly }],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .order('business', { ascending: true })
      
      if (activeOnly) {
        query = query.eq('active', true)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useClient(id) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          projects:projects(count),
          invoices:invoices(count, amount, status)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (client) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
      
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data[0]
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] })
    }
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}
```

**Similar patterns for Projects and Invoices:**
```javascript
// hooks/useProjects.js
export function useProjects(filters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*, client:clients(business, contact)')
        .order('start_date', { ascending: false })
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

// hooks/useInvoices.js
export function useInvoices(filters = {}) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*, client:clients(business), project:projects(name)')
        .order('date', { ascending: false })
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// hooks/useDashboard.js
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single()
      
      if (error) throw error
      return data
    },
    refetchInterval: 60 * 1000, // Refresh every minute
  })
}
```

### Auto-calculations & Utility Functions

**Invoice Number Generation:**
```javascript
// lib/utils.js
export async function generateInvoiceNumber(supabase, prefix = 'MZK') {
  const year = new Date().getFullYear()
  const searchPrefix = `${prefix}-${year}-`
  
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${searchPrefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
  
  if (error) throw error
  
  let nextNumber = 1
  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].invoice_number.split('-').pop())
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1
  }
  
  return `${searchPrefix}${String(nextNumber).padStart(3, '0')}`
}
```

**Support End Date Calculation:**
```javascript
export function calculateSupportEndDate(startDate, months) {
  const date = new Date(startDate)
  date.setMonth(date.getMonth() + months)
  return date.toISOString().split('T')[0]
}

export function getDaysUntilSupportEnds(supportEndDate) {
  const today = new Date()
  const endDate = new Date(supportEndDate)
  const diffTime = endDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function isSupportExpiringSoon(supportEndDate, daysThreshold = 30) {
  const daysUntil = getDaysUntilSupportEnds(supportEndDate)
  return daysUntil > 0 && daysUntil <= daysThreshold
}
```

**Invoice Status Helpers:**
```javascript
export function isOverdue(invoice) {
  if (invoice.status === 'paid') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(invoice.due_date)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
}

export function getInvoiceStatusColor(status) {
  const colors = {
    draft: 'gray',
    sent: 'blue',
    paid: 'green',
    overdue: 'red'
  }
  return colors[status] || 'gray'
}

export function getProjectStatusColor(status) {
  const colors = {
    planning: 'purple',
    development: 'blue',
    'honey-period': 'yellow',
    retainer: 'green',
    completed: 'gray'
  }
  return colors[status] || 'gray'
}
```

**Date Formatting:**
```javascript
import { format, formatDistance, parseISO } from 'date-fns'

export function formatDate(date, formatStr = 'MMM dd, yyyy') {
  if (!date) return ''
  return format(parseISO(date), formatStr)
}

export function formatCurrency(amount, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatRelativeDate(date) {
  if (!date) return ''
  return formatDistance(parseISO(date), new Date(), { addSuffix: true })
}
```

**Validation Helpers:**
```javascript
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validateURL(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateInvoiceNumber(number, prefix = 'MZK') {
  const pattern = new RegExp(`^${prefix}-\\d{4}-\\d{3}$`)
  return pattern.test(number)
}
```

**Data Export:**
```javascript
export async function exportAllData(supabase) {
  const [clients, projects, invoices, settings] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('projects').select('*'),
    supabase.from('invoices').select('*'),
    supabase.from('settings').select('*'),
  ])
  
  const exportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    data: {
      clients: clients.data || [],
      projects: projects.data || [],
      invoices: invoices.data || [],
      settings: settings.data || [],
    }
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `koruku-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
```

---

## Error Handling

### Supabase Errors

**Network Errors:**
- Display toast: "Connection lost. Please check your internet."
- Show retry button
- Queue failed operations for retry
- Disable form submissions until reconnected

**Authentication Errors:**
- Session expired: Auto-redirect to login with message "Session expired. Please login again."
- Invalid credentials: "Invalid email or password"
- Password reset: "Password reset email sent. Check your inbox."
- Email not confirmed: "Please confirm your email address"

**Database Errors:**
- Unique constraint violation: "This [field] already exists"
- Foreign key violation: "Cannot delete [item] with associated [related items]"
- Check constraint violation: "Invalid value for [field]"
- Generic error: "Something went wrong. Please try again."

**Query Errors:**
- Empty results: Show appropriate empty state
- Timeout: "Request timed out. Please try again."
- Permission denied: "You don't have permission to perform this action"

### User Input Errors

**Form Validation:**
- Required fields: "This field is required"
- Email format: "Please enter a valid email address"
- URL format: "Please enter a valid URL (e.g., https://example.com)"
- Number format: "Please enter a valid number"
- Date format: "Please enter a valid date"
- Min/max length: "[Field] must be between X and Y characters"
- Min/max value: "[Field] must be between X and Y"

**Business Logic Errors:**
- Duplicate invoice number: "Invoice number already exists. Suggested: [next number]"
- Invalid date range: "Due date must be after invoice date"
- Delete with dependencies: "Cannot delete [client] with [X] active projects and [Y] invoices. Mark as inactive instead?"
- Inactive client selection: "This client is inactive. Activate to create new records?"

### Edge Cases

**No Internet Connection:**
- Show persistent banner: "You're offline. Changes will sync when connection is restored."
- Disable all data-modifying actions
- Show cached data with indicator
- Queue operations for when online

**Session Management:**
- Auto-logout after 24 hours of inactivity
- Warning 5 minutes before logout: "Your session will expire in 5 minutes"
- Preserve form data in localStorage before logout
- Restore form data after re-login

**Empty States:**
- No clients: "No clients yet. Add your first client to get started." + [Add Client button]
- No projects: "No projects yet. Create a project to start tracking." + [New Project button]
- No invoices: "No invoices yet. Create your first invoice." + [New Invoice button]
- No search results: "No results found for '[query]'. Try a different search term."
- No filtered results: "No [items] match your filters. [Clear filters button]"

**Data Integrity:**
- Concurrent edits: "This record was updated by another session. Reload to see changes?"
- Stale data: Auto-refresh data every 5 minutes
- Optimistic updates: Show changes immediately, rollback on error
- Conflict resolution: Last write wins (with warning)

**Performance Issues:**
- Slow query: Show loading skeleton for > 500ms
- Large datasets: Implement pagination (50 items per page)
- Heavy operations: Show progress indicator
- Failed operations: Retry automatically (max 3 attempts)

### Error Recovery

**Automatic Recovery:**
- Retry failed requests (exponential backoff: 1s, 2s, 4s)
- Refresh auth token automatically
- Reconnect to Supabase on connection restore
- Sync queued operations when online

**Manual Recovery:**
- "Retry" button on error messages
- "Refresh" button on stale data warnings
- "Clear cache" option in settings
- "Export data" before destructive operations

### Error Logging

**Client-Side Logging:**
```javascript
// lib/errorLogger.js
export function logError(error, context = {}) {
  console.error('Error:', error, 'Context:', context)
  
  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // Send to Sentry, LogRocket, etc.
  }
}

export function logWarning(message, context = {}) {
  console.warn('Warning:', message, 'Context:', context)
}
```

**Error Boundaries:**
```javascript
// components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    logError(error, { errorInfo })
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

---

## User Flows

### Create Invoice Flow
1. User clicks "New Invoice" button
2. Modal opens with form
3. Invoice number auto-generated
4. User selects client from dropdown
5. User enters amount, dates, description
6. User selects status (draft/sent)
7. User clicks "Save"
8. Invoice created in Supabase
9. Modal closes
10. Table refreshes with new invoice
11. Success toast notification

### Mark Invoice as Paid Flow
1. User clicks "Mark as Paid" button on invoice row
2. Confirmation dialog appears
3. User confirms
4. Invoice status updated to 'paid'
5. paid_date set to today
6. Table refreshes
7. Dashboard stats update
8. Success toast notification

### Client Management Flow
1. User navigates to Clients page
2. Sees list of all clients
3. User searches for specific client
4. User clicks client row
5. Detail modal opens showing:
   - Client info
   - List of projects
   - List of invoices
   - Total revenue
6. User can edit or delete from modal
7. Changes save to Supabase
8. Modal closes
9. Table refreshes

---

## Error Handling

### Supabase Errors
- Network errors: Show toast with retry button
- Auth errors: Redirect to login
- Validation errors: Show inline form errors
- Constraint errors: Show user-friendly message

### User Errors
- Invalid input: Inline validation messages
- Duplicate invoice number: Suggest next available
- Delete with dependencies: Warn about cascade
- Empty required fields: Highlight in red

### Edge Cases
- No internet: Show offline banner
- Session expired: Auto-redirect to login
- Empty states: Helpful messages with action buttons
- No search results: "No results found" message
- Overdue invoices: Highlight in red

---

## Performance Requirements

- Initial load: < 2 seconds
- Page navigation: < 500ms
- Data fetch: < 1 second
- Form submit: < 1 second
- Search results: < 300ms

---

## Security Requirements

- All data behind authentication
- RLS policies on all tables
- HTTPS only
- Secure session storage
- Password requirements (min 8 chars)
- Auto-logout after 24 hours

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**Keyboard Navigation:**
- All interactive elements accessible via Tab key
- Logical tab order (left-to-right, top-to-bottom)
- Visible focus indicators (2px gold outline)
- Escape key closes modals
- Enter key submits forms
- Arrow keys navigate tables and lists

**Screen Reader Support:**
- Semantic HTML (nav, main, article, aside)
- ARIA labels on all interactive elements
- ARIA live regions for dynamic content
- Alt text on all images/icons
- Form labels properly associated
- Error messages announced

**Visual Accessibility:**
- Color contrast ratio ≥ 4.5:1 for text
- Color contrast ratio ≥ 3:1 for UI components
- Don't rely on color alone (use icons + text)
- Text resizable up to 200% without loss of functionality
- Minimum touch target size: 44x44px
- Clear visual hierarchy

**Forms:**
- Clear labels for all inputs
- Required fields indicated with * and aria-required
- Error messages with aria-invalid and aria-describedby
- Success messages announced to screen readers
- Autocomplete attributes where appropriate

**Tables:**
- Proper table headers (th with scope)
- Caption or aria-label for table purpose
- Row headers for complex tables
- Sortable columns announced

**Modals:**
- Focus trapped within modal
- Focus returns to trigger element on close
- Announced to screen readers (role="dialog")
- Labeled with aria-labelledby

---

## Testing Requirements

### Unit Tests
- Utility functions (date calculations, formatting, validation)
- Custom hooks (data fetching, mutations)
- Form validation logic
- Auto-calculation functions

### Integration Tests
- Authentication flow
- CRUD operations for each entity
- Form submissions
- Data filtering and search
- Status updates

### E2E Tests (Optional for MVP)
- Complete user journeys
- Invoice creation and payment
- Client and project management
- Data export

### Manual Testing Checklist
- [ ] Login/logout works
- [ ] All CRUD operations work for clients, projects, invoices
- [ ] Search and filters work correctly
- [ ] Sorting works on all tables
- [ ] Modals open/close properly
- [ ] Forms validate correctly
- [ ] Auto-calculations work (invoice numbers, support dates)
- [ ] Dashboard stats are accurate
- [ ] Data export works
- [ ] Settings save correctly
- [ ] Responsive on mobile/tablet
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] No console errors
- [ ] Fast page loads

---

## Deployment

**Domain:** koruku.xyz

**Hosting:** Netlify or Vercel (recommended: Vercel for better Vite support)

**Build Configuration:**
```toml
# netlify.toml (if using Netlify)
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

```json
// vercel.json (if using Vercel)
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Environment Variables:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_APP_VERSION` - App version (optional)
- `VITE_ENVIRONMENT` - production/staging (optional)

**Pre-Deployment Checklist:**
- [ ] All environment variables set
- [ ] Database schema created in Supabase
- [ ] RLS policies enabled
- [ ] Default settings inserted
- [ ] Test user account created
- [ ] Build succeeds locally
- [ ] No console errors in production build
- [ ] Lighthouse score > 90
- [ ] All features tested in production-like environment

**DNS Configuration:**
- Point koruku.xyz A record to hosting provider IP
- Or use CNAME to hosting provider domain
- Enable HTTPS (automatic with Netlify/Vercel)
- Set up www redirect (www.koruku.xyz → koruku.xyz)

**Post-Deployment:**
- [ ] Test login with real account
- [ ] Verify all features work
- [ ] Check mobile responsiveness
- [ ] Test in multiple browsers
- [ ] Monitor error logs
- [ ] Set up uptime monitoring (optional)

**Continuous Deployment:**
- Connect GitHub repository to hosting provider
- Auto-deploy on push to main branch
- Preview deployments for pull requests
- Rollback capability

---

## Success Criteria

### Functionality
- ✅ User can login/logout
- ✅ User can CRUD clients
- ✅ User can CRUD projects
- ✅ User can CRUD invoices
- ✅ Dashboard shows accurate stats
- ✅ Search/filter works on all pages
- ✅ Data persists in Supabase
- ✅ Export data works

### Performance
- ✅ Lighthouse score > 90
- ✅ No console errors
- ✅ Fast page loads
- ✅ Smooth animations

### UX
- ✅ Intuitive navigation
- ✅ Clear error messages
- ✅ Helpful empty states
- ✅ Responsive design
- ✅ Accessible (WCAG AA)

---

## Future Enhancements (Not in MVP)

- Email integration (send invoices)
- PDF generation (invoice template)
- Recurring invoices
- Payment tracking (partial payments)
- Expense tracking
- Time tracking
- Reports (charts, analytics)
- Multi-currency support
- Tax calculations
- Client portal
- Mobile app
- Team collaboration

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Basic app structure and authentication

**Tasks:**
1. Set up Vite + React project
2. Install dependencies (Tailwind, Supabase, React Query, etc.)
3. Configure Tailwind with custom colors
4. Create Supabase project and database schema
5. Implement authentication (login/logout)
6. Create layout components (Sidebar, Header, Layout)
7. Set up routing (React Router)
8. Create basic UI components (Button, Input, Modal, Table)

**Deliverables:**
- Working login/logout
- App shell with navigation
- Reusable UI components

### Phase 2: Core Features (Week 2)
**Goal:** Client and project management

**Tasks:**
1. Implement client CRUD operations
2. Create client list, form, and detail views
3. Implement project CRUD operations
4. Create project list, form, and detail views
5. Add search and filter functionality
6. Implement support period calculations
7. Add validation and error handling

**Deliverables:**
- Full client management
- Full project management
- Working search/filter

### Phase 3: Invoicing (Week 3)
**Goal:** Invoice management and dashboard

**Tasks:**
1. Implement invoice CRUD operations
2. Create invoice list, form, and detail views
3. Implement invoice number generation
4. Add mark as paid/sent functionality
5. Implement overdue detection
6. Create dashboard with stats
7. Add recent invoices to dashboard

**Deliverables:**
- Full invoice management
- Working dashboard
- Auto-calculations

### Phase 4: Polish (Week 4)
**Goal:** Settings, export, and refinement

**Tasks:**
1. Implement settings page
2. Add data export functionality
3. Improve error handling
4. Add loading states and skeletons
5. Implement toast notifications
6. Optimize performance
7. Add accessibility features
8. Test thoroughly
9. Deploy to production

**Deliverables:**
- Complete, polished application
- Deployed to koruku.xyz
- All features tested

---

## Bolt.new Instructions

### Initial Prompt for Bolt:

```
Create a business management system for Mezokuru web development company called "Koruku".

TECH STACK:
- React 18 + Vite
- Supabase (PostgreSQL + Auth)
- Tailwind CSS
- React Query (@tanstack/react-query)
- React Router
- lucide-react (icons)
- react-hot-toast (notifications)
- date-fns (date formatting)

CORE FEATURES:
1. Authentication (Supabase Auth with email/password)
2. Dashboard with revenue statistics
3. Client management (CRUD with search/filter)
4. Project management (CRUD with support period tracking)
5. Invoice management (CRUD with auto-numbering and status tracking)
6. Settings page (business info, invoice settings, project defaults)
7. Data export to JSON

DATABASE SCHEMA (Supabase):

clients table:
- id (UUID, primary key)
- business (TEXT, required)
- contact (TEXT, required)
- email (TEXT, required, unique)
- phone (TEXT, required)
- address (TEXT, optional)
- notes (TEXT, optional)
- active (BOOLEAN, default true)
- created_at, updated_at (timestamps)

projects table:
- id (UUID, primary key)
- name (TEXT, required)
- client_id (UUID, foreign key to clients)
- status (TEXT, enum: planning, development, honey-period, retainer, completed)
- start_date (DATE, required)
- support_months (INTEGER, default 6)
- support_end_date (DATE, auto-calculated)
- description (TEXT, optional)
- tech_stack (TEXT[], optional)
- live_url (TEXT, optional)
- github_url (TEXT, optional)
- created_at, updated_at (timestamps)

invoices table:
- id (UUID, primary key)
- invoice_number (TEXT, unique, format: MZK-YYYY-XXX)
- client_id (UUID, foreign key to clients)
- project_id (UUID, foreign key to projects, nullable)
- amount (DECIMAL(10,2), required)
- date (DATE, required)
- due_date (DATE, required)
- paid_date (DATE, nullable)
- status (TEXT, enum: draft, sent, paid, overdue)
- description (TEXT, required)
- notes (TEXT, optional)
- created_at, updated_at (timestamps)

settings table:
- id (UUID, primary key)
- key (TEXT, unique)
- value (JSONB)
- updated_at (timestamp)

DESIGN SYSTEM:
- Primary color: #2c3e50 (dark slate)
- Accent color: #ffd166 (gold)
- Success: #27ae60, Danger: #e74c3c, Warning: #f39c12, Info: #3498db
- Background: #f5f5f5
- Font: Inter or system fonts
- Dark sidebar (250px wide) with gold accent for active items
- White content area with cards
- Rounded buttons and inputs
- Status badges with colors
- Toast notifications (top-right)

KEY FEATURES:
- Auto-generate invoice numbers (MZK-YYYY-001, MZK-YYYY-002, etc.)
- Auto-calculate support end dates (start_date + support_months)
- Auto-detect overdue invoices (due_date < today && status != paid)
- Dashboard shows: total revenue, paid/pending/overdue counts, recent invoices
- Alert for projects with support ending in < 30 days
- Search and filter on all list pages
- Modal forms for add/edit
- Confirmation dialogs for delete
- Client detail view shows projects and invoices
- Mark invoice as paid (sets paid_date and status)
- Export all data to JSON file
- Row Level Security (RLS) for authenticated users only

VALIDATION:
- Email format validation
- URL format validation
- Required fields marked with *
- Inline error messages
- Disable submit until valid

RESPONSIVE:
- Mobile-friendly
- Sidebar collapses on mobile
- Tables scroll horizontally on small screens

Start with the authentication and basic layout, then we'll build each feature incrementally.
```

### Follow-up Prompts:

**After authentication is working:**
```
Great! Now let's implement the client management feature:
1. Create a Clients page with a data table
2. Add search functionality (search by business, contact, email)
3. Add filter for active/inactive clients
4. Create a modal form for adding/editing clients
5. Implement CRUD operations using React Query
6. Add validation (business, contact, email required; email format)
7. Add a client detail modal showing client info, projects, and invoices
8. Add empty state when no clients exist
```

**After clients are working:**
```
Perfect! Now let's add project management:
1. Create a Projects page with a data table
2. Add search (by name, client) and filter (by status)
3. Create a modal form for adding/editing projects
4. Client dropdown should only show active clients
5. Auto-calculate support_end_date when start_date or support_months change
6. Show support countdown in the table
7. Highlight projects with support ending in < 30 days
8. Add project detail modal with client info and related invoices
9. Status badges with colors (planning=purple, development=blue, honey-period=yellow, retainer=green, completed=gray)
```

**After projects are working:**
```
Excellent! Now let's implement invoice management:
1. Create an Invoices page with a data table
2. Add search (by invoice number, client) and filter (by status)
3. Create a modal form for adding/editing invoices
4. Auto-generate invoice number on new invoice (MZK-YYYY-XXX format)
5. Client dropdown shows active clients, project dropdown shows client's projects
6. Auto-detect overdue invoices (due_date < today && status != paid)
7. Highlight overdue rows in light red
8. Add "Mark as Paid" button (sets status=paid, paid_date=today)
9. Add "Mark as Sent" button (sets status=sent)
10. Status badges (draft=gray, sent=blue, paid=green, overdue=red)
11. Validation: due_date must be >= date, amount > 0
```

**After invoices are working:**
```
Great! Now let's build the dashboard:
1. Create a Dashboard page with stat cards showing:
   - Total revenue (sum of paid invoices for current year)
   - Paid invoices count (current year)
   - Pending invoices count (status=sent)
   - Overdue invoices count (status=overdue)
   - Outstanding amount (sum of unpaid invoices)
2. Add a "Recent Invoices" table (last 10 invoices)
3. Add alert banner for projects with support ending in < 30 days
4. Add quick action buttons (New Invoice, New Client, New Project)
5. Use the dashboard_stats view for efficient data fetching
```

**After dashboard is working:**
```
Almost done! Let's add settings and export:
1. Create a Settings page with sections:
   - Business Information (name, email, phone, bank details)
   - Invoice Settings (prefix, default payment terms)
   - Project Settings (default support months)
2. Load settings from Supabase on mount
3. Save settings to Supabase on submit
4. Add data export button that downloads all data as JSON
5. Filename format: koruku-backup-YYYY-MM-DD.json
6. Show success toast after save/export
```

**Final polish:**
```
Let's polish the app:
1. Add loading skeletons for all data tables
2. Improve error handling with user-friendly messages
3. Add empty states for all list pages
4. Ensure all modals close on ESC key
5. Add confirmation dialogs for delete operations
6. Test all CRUD operations
7. Verify responsive design on mobile
8. Check accessibility (keyboard navigation, focus states)
9. Optimize performance (React Query caching, memoization)
10. Add any missing toast notifications
```

---

## Component Specifications

### Reusable UI Components

**Button Component:**
```javascript
// components/ui/Button.jsx
<Button 
  variant="primary|secondary|danger|ghost"
  size="sm|md|lg"
  loading={boolean}
  disabled={boolean}
  icon={LucideIcon}
  onClick={function}
>
  Button Text
</Button>
```

**Input Component:**
```javascript
// components/ui/Input.jsx
<Input
  type="text|email|number|date|tel|url"
  label="Label"
  placeholder="Placeholder"
  value={value}
  onChange={onChange}
  error="Error message"
  required={boolean}
  disabled={boolean}
  icon={LucideIcon}
/>
```

**Modal Component:**
```javascript
// components/ui/Modal.jsx
<Modal
  isOpen={boolean}
  onClose={function}
  title="Modal Title"
  size="sm|md|lg|xl"
>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>
    <Button onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={onSave}>Save</Button>
  </Modal.Footer>
</Modal>
```

**Table Component:**
```javascript
// components/ui/Table.jsx
<Table
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'actions', label: 'Actions', align: 'right' }
  ]}
  data={data}
  onSort={handleSort}
  loading={boolean}
  emptyMessage="No data found"
/>
```

**StatusBadge Component:**
```javascript
// components/ui/StatusBadge.jsx
<StatusBadge
  status="draft|sent|paid|overdue"
  variant="invoice|project"
/>
```

**StatCard Component:**
```javascript
// components/ui/StatCard.jsx
<StatCard
  title="Total Revenue"
  value="R 125,000"
  icon={DollarSign}
  trend="+12%"
  trendDirection="up|down"
/>
```

---

## Data Models & TypeScript Interfaces

```typescript
// types/index.ts

export interface Client {
  id: string
  business: string
  contact: string
  email: string
  phone: string
  address?: string
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  client_id: string
  status: 'planning' | 'development' | 'honey-period' | 'retainer' | 'completed'
  start_date: string
  support_months: number
  support_end_date: string
  description?: string
  tech_stack?: string[]
  live_url?: string
  github_url?: string
  created_at: string
  updated_at: string
  client?: Client
}

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  project_id?: string
  amount: number
  date: string
  due_date: string
  paid_date?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  description: string
  notes?: string
  created_at: string
  updated_at: string
  client?: Client
  project?: Project
}

export interface Settings {
  id: string
  key: string
  value: {
    business_info?: {
      name: string
      email: string
      phone: string
      bank_name: string
      bank: string
      account: string
      branch: string
      account_type: string
    }
    invoice_settings?: {
      prefix: string
      payment_terms: number
    }
    project_settings?: {
      default_support_months: number
    }
  }
  updated_at: string
}

export interface DashboardStats {
  total_revenue: number
  paid_invoices_count: number
  pending_invoices_count: number
  overdue_invoices_count: number
  outstanding_amount: number
  expiring_support_count: number
}
```

---

## Security Considerations

### Authentication Security
- Passwords hashed with bcrypt (handled by Supabase)
- Minimum password length: 8 characters
- Password complexity requirements (optional)
- Email verification required (optional)
- Rate limiting on login attempts
- Secure session storage (httpOnly cookies)
- CSRF protection (handled by Supabase)

### Data Security
- All data encrypted at rest (Supabase default)
- All data encrypted in transit (HTTPS)
- Row Level Security (RLS) enforced
- No sensitive data in URLs
- No sensitive data in localStorage
- Sanitize user inputs
- Prevent SQL injection (parameterized queries)
- Prevent XSS attacks (React escapes by default)

### API Security
- Supabase anon key is safe for client-side use
- RLS policies prevent unauthorized access
- Rate limiting on API calls
- CORS configured properly
- No API keys in client code

### Best Practices
- Regular security audits
- Keep dependencies updated
- Use environment variables for secrets
- Implement Content Security Policy (CSP)
- Add security headers
- Monitor for suspicious activity
- Regular backups
- Disaster recovery plan

---

## Performance Optimization

### Frontend Optimization
- Code splitting (React.lazy)
- Tree shaking (Vite default)
- Minification (Vite default)
- Gzip compression
- Image optimization
- Lazy loading images
- Debounce search inputs (300ms)
- Throttle scroll events
- Memoize expensive calculations (useMemo)
- Memoize callbacks (useCallback)
- Virtual scrolling for large lists (optional)

### Data Fetching Optimization
- React Query caching (5 min stale time)
- Prefetch data on hover
- Optimistic updates
- Pagination (50 items per page)
- Infinite scroll (optional)
- Debounce API calls
- Batch requests where possible
- Use database indexes
- Use database views for complex queries

### Bundle Size
- Target bundle size: < 500KB (gzipped)
- Analyze bundle with `vite-bundle-visualizer`
- Remove unused dependencies
- Use tree-shakeable libraries
- Lazy load routes
- Lazy load heavy components

### Lighthouse Targets
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## Monitoring & Analytics

### Error Monitoring (Optional)
- Sentry for error tracking
- LogRocket for session replay
- Track error rates
- Alert on critical errors

### Performance Monitoring (Optional)
- Web Vitals tracking
- Core Web Vitals (LCP, FID, CLS)
- Time to Interactive (TTI)
- First Contentful Paint (FCP)

### Usage Analytics (Optional)
- Google Analytics or Plausible
- Track page views
- Track user actions
- Track conversion funnels
- Privacy-friendly analytics

### Business Metrics
- Total clients
- Active projects
- Revenue trends
- Invoice payment rates
- Average project duration
- Client retention rate

---

## Maintenance & Support

### Regular Maintenance
- Weekly: Check for errors in logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Yearly: Performance review

### Backup Strategy
- Automatic Supabase backups (daily)
- Manual exports (weekly)
- Store backups in multiple locations
- Test restore process quarterly

### Update Process
1. Test updates in development
2. Review changelog
3. Update dependencies
4. Run tests
5. Deploy to staging
6. Test in staging
7. Deploy to production
8. Monitor for issues

### Support Channels
- Email support
- Documentation
- FAQ section
- Video tutorials (optional)

---

## Notes

- Keep it simple - focus on core business needs
- Prioritize data integrity
- Make UI fast and responsive
- Clear, helpful error messages
- Mobile-friendly (responsive)
- No over-engineering
- Build for one user (yourself) first
- Scale when needed
- Document as you build
- Test thoroughly before deploying

---

**Goal:** A reliable, fast, cloud-based business management system that works from anywhere and helps Mezokuru manage clients, projects, and invoices efficiently.
