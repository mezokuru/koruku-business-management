# Koruku System - Complete Business Management Platform PRD

## Executive Summary

**Koruku** is a comprehensive business management system for Mezokuru, designed to handle the complete client lifecycle from lead capture to project delivery and ongoing maintenance. Unlike the simplified admin panel, Koruku is a full-featured SaaS platform with authentication, real-time collaboration, automated workflows, and client portals.

**Target Users:**
- Mezokuru (primary user - business owner)
- Clients (secondary users - view projects, invoices, make payments)
- Future: Other freelancers/agencies (multi-tenant SaaS)

**Core Philosophy:**
- Automate repetitive tasks
- Transparent client communication
- Data-driven decision making
- Scalable from solo freelancer to agency

---

## System Architecture

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Shadcn/ui for component library
- React Query for data fetching
- Zustand for state management
- React Router for navigation

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Row Level Security (RLS) for data protection
- Edge Functions for serverless logic
- Realtime subscriptions for live updates

**Integrations (Future - Post-Scale):**
- Stripe for payments (Phase 2+)
- Email service for automation (Phase 2+)
- Webhooks for extensibility (Phase 3+)

**Deployment:**
- Vercel/Netlify for frontend
- Supabase Cloud for backend
- Custom domain: koruku.mezokuru.xyz

---

## Database Schema

### Core Tables

```sql
-- Users (managed by Supabase Auth)
-- Extended with profiles table

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  business_name TEXT,
  role TEXT CHECK (role IN ('admin', 'client', 'team_member')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- If client has login
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  website TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('lead', 'active', 'inactive', 'archived')),
  source TEXT, -- How they found us
  tags TEXT[], -- For categorization
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('lead', 'quoted', 'planning', 'development', 'honey_period', 'retainer', 'completed', 'cancelled')),
  project_type TEXT, -- website, ecommerce, custom, etc.
  start_date DATE,
  launch_date DATE,
  support_end_date DATE,
  support_months INTEGER DEFAULT 6,
  
  -- Pricing
  total_price DECIMAL(10,2),
  labour_percentage INTEGER DEFAULT 30,
  labour_amount DECIMAL(10,2),
  infrastructure_amount DECIMAL(10,2),
  
  -- Repository & Deployment
  repo_url TEXT,
  staging_url TEXT,
  production_url TEXT,
  
  -- Metadata
  tags TEXT[],
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices/Quotations
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  type TEXT CHECK (type IN ('quotation', 'invoice', 'credit_note')),
  status TEXT CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  
  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Content
  description TEXT,
  notes TEXT,
  terms TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  period TEXT, -- "Once-off", "1 year", "5 years"
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT, -- bank_transfer, stripe, cash
  payment_date DATE NOT NULL,
  reference TEXT,
  notes TEXT,
  stripe_payment_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks/Todos
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Tracking
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  billable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications/Activity Log
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- client, project, invoice, etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- created, updated, sent, paid, etc.
  description TEXT,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents/Files
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[], -- Available variables like {{client_name}}
  category TEXT, -- quotation, invoice, welcome, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);
```

---

## Core Features

### 1. Dashboard

**Overview Metrics:**
- Total revenue (YTD, MTD, all-time)
- Outstanding invoices amount
- Active projects count
- Upcoming support expirations
- Recent activity feed

**Charts & Analytics:**
- Revenue over time (line chart)
- Project status distribution (pie chart)
- Invoice status breakdown
- Client acquisition timeline
- Average project value

**Quick Actions:**
- Create new invoice
- Add new client
- Start new project
- Log time entry

---

### 2. Client Management

**Client List:**
- Searchable, filterable table
- Status badges (lead, active, inactive)
- Quick stats per client (projects, revenue, outstanding)
- Bulk actions (export, email, archive)

**Client Detail Page:**
- Contact information (editable)
- All projects (timeline view)
- All invoices (with payment status)
- Communication history
- Documents/files
- Notes section
- Activity timeline

**Client Portal Access:**
- Generate secure login for clients
- Clients can view their projects
- Clients can view/download invoices
- Clients can make payments (Stripe integration)
- Clients can upload files/feedback

---

### 3. Project Management

**Project Board (Kanban):**
- Columns: Lead → Quoted → Planning → Development → Honey Period → Retainer → Completed
- Drag-and-drop to change status
- Color-coded by priority
- Quick filters (client, status, date range)

**Project Detail Page:**
- Overview (description, dates, pricing)
- Tasks/checklist (with progress bar)
- Time tracking
- Files/documents
- Git repository link
- Staging/production URLs
- Support period countdown
- Invoice history
- Activity log

**Project Templates:**
- Pre-defined project types (portfolio, e-commerce, custom)
- Default tasks for each type
- Pricing templates

---

### 4. Invoicing & Quotations

**Invoice Creation:**
- Auto-generate invoice number
- Select client (or create new)
- Link to project (optional)
- Enter total price
- Set labour percentage (30-50%)
- Set support period (1-10 years)
- Auto-calculate breakdown (48/22/14/6/10 split)
- Preview in real-time
- Save as draft or send immediately

**Invoice Management:**
- List view with filters (status, client, date range)
- Bulk actions (send, mark paid, export)
- Payment tracking
- Automatic overdue detection
- Payment reminders (automated emails)

**Invoice Templates:**
- Professional PDF generation
- Customizable branding
- Multiple layouts (standard, detailed, minimal)
- Print-friendly with backgrounds

**Payment Processing:**
- Manual payment tracking (bank transfer)
- Record payment with reference
- Manual status update
- Payment receipts (PDF generation)
- *Future: Stripe integration for online payments*

---

### 5. Time Tracking

**Timer:**
- Start/stop timer for tasks
- Manual time entry
- Description and project selection
- Billable/non-billable toggle

**Reports:**
- Time by project
- Time by client
- Time by date range
- Billable vs non-billable
- Export to CSV

**Integration:**
- Link time entries to tasks
- Show time spent on project detail page
- Use for internal analytics (not client-facing)

---

### 6. Task Management

**Task Board:**
- Kanban view (To Do, In Progress, Review, Done)
- List view with sorting/filtering
- Assign to self or team members
- Due dates with reminders
- Priority levels

**Task Detail:**
- Description with markdown support
- Checklist items
- Time tracking
- Comments/discussion
- File attachments
- Activity history

---

### 7. Automation & Workflows

**Automated Actions (Post-Scale):**
- *Future: Send quotation email when status = "sent"*
- *Future: Send payment reminder 3 days before due date*
- *Future: Send overdue notice 1 day after due date*
- *Future: Send support expiration warning 30 days before*
- *Future: Create retainer invoice automatically when honey period ends*
- *Future: Send welcome email to new clients*

**Manual Workflows (MVP):**
- Download invoice PDF and email manually
- Set calendar reminders for follow-ups
- Manually create recurring invoices
- Track communications in notes

**Email Automation (Post-Scale):**
- *Future: Template-based emails*
- *Future: Variable substitution*
- *Future: Scheduled sending*
- *Future: Track opens and clicks*

**Webhooks (Post-Scale):**
- *Future: Trigger external actions*
- *Future: Payment received webhook*
- *Future: Project status change webhook*

---

### 8. Reporting & Analytics

**Financial Reports:**
- Profit & Loss statement
- Revenue by client
- Revenue by project type
- Outstanding invoices report
- Payment history

**Project Reports:**
- Project timeline (Gantt chart)
- Project profitability
- Time spent vs estimated
- Completion rate

**Client Reports:**
- Client lifetime value
- Client acquisition cost
- Client retention rate
- Top clients by revenue

**Export Options:**
- PDF reports
- CSV/Excel export
- Scheduled email reports

---

### 9. Settings & Configuration

**Business Settings:**
- Business name, logo, contact info
- Banking details
- Invoice prefix and numbering
- Default payment terms
- Tax settings

**Email Settings:**
- SMTP configuration
- Email templates
- Signature
- Auto-reply settings

**Integration Settings:**
- Stripe API keys
- GitHub token
- Cloudflare API
- Webhook URLs

**User Management:**
- Team members (future)
- Roles and permissions
- Activity log

---

## User Flows

### Flow 1: New Client to First Invoice

1. **Add Client**
   - Click "New Client" button
   - Fill in contact details
   - Set status to "Lead"
   - Save

2. **Create Project**
   - From client page, click "New Project"
   - Enter project details
   - Set status to "Quoted"
   - Enter total price and labour %
   - Save

3. **Generate Quotation**
   - Click "Create Quotation" from project
   - Review auto-calculated breakdown
   - Add description and notes
   - Preview quotation
   - Send to client (email with PDF)

4. **Client Accepts**
   - Client views quotation in portal
   - Client clicks "Accept & Pay Deposit"
   - Stripe payment (75% deposit)
   - Status auto-updates to "Planning"

5. **Project Delivery**
   - Update status to "Development"
   - Complete tasks
   - Update status to "Honey Period"
   - Generate final invoice (25% balance)
   - Client pays, status → "Completed"

### Flow 2: Support Period Expiration

1. **30 Days Before Expiration**
   - Automated email to client
   - "Your support period ends in 30 days"
   - Option to extend or start retainer

2. **Client Chooses Retainer**
   - Client clicks "Start Retainer" in portal
   - System creates recurring invoice (R 350/month)
   - Project status → "Retainer"

3. **Monthly Billing**
   - Auto-generate invoice on 1st of month
   - Send to client
   - Track payment
   - Continue retainer

### Flow 3: Client Portal Experience

1. **Client Receives Invite**
   - Email with secure login link
   - Set password

2. **Client Dashboard**
   - See all their projects
   - See all invoices (paid/unpaid)
   - Upload files/feedback
   - View support period countdown

3. **Client Pays Invoice**
   - Download invoice PDF
   - Make bank transfer
   - Send proof of payment
   - Admin marks invoice as paid manually
   - *Future: Online payment with Stripe*

---

## Technical Implementation

### Phase 1: Foundation (Weeks 1-2)

**Setup:**
- Initialize React + Vite + TypeScript project
- Set up Supabase project
- Configure authentication
- Create database schema
- Set up RLS policies
- Deploy to Vercel

**Core Features:**
- Authentication (login, signup, password reset)
- Dashboard layout with navigation
- Basic client CRUD
- Basic project CRUD
- Settings page

### Phase 2: Invoicing (Weeks 3-4)

**Features:**
- Invoice creation with pricing calculator
- Invoice list and detail pages
- PDF generation
- Email sending (SendGrid/Resend)
- Payment tracking (manual)

### Phase 3: Client Portal (Weeks 5-6)

**Features:**
- Client authentication
- Client dashboard
- View projects and invoices
- File uploads
- Manual payment tracking (bank transfer)

### Phase 4: Automation (Weeks 7-8) - Post-MVP

**Features:**
- Email templates
- Automated workflows (Supabase Edge Functions)
- Payment reminders
- Support expiration warnings
- Activity logging

### Phase 5: Advanced Features (Weeks 9-10)

**Features:**
- Time tracking
- Task management
- Reporting and analytics
- Export functionality

### Phase 6: Polish & Launch (Weeks 11-12)

**Tasks:**
- UI/UX refinements
- Mobile responsiveness
- Performance optimization
- Security audit
- Documentation
- Beta testing
- Production launch

---

## Post-Launch: Integrations & Scale (Phase 7+)

**When to Add Integrations:**
- After 10+ active clients
- When manual processes become bottleneck
- When revenue justifies integration costs

**Priority Order:**
1. **Stripe** - Online payments (when clients request it)
2. **Email Service** - Automated emails (when sending 50+ emails/month)
3. **Webhooks** - External automation (when needed for specific workflows)
4. **Accounting** - QuickBooks/Xero (when doing taxes becomes complex)
5. **Communication** - Slack/WhatsApp (when team grows)

**Cost Considerations:**
- Stripe: 2.9% + R 2 per transaction
- Email Service: Free tier → R 200/month
- Most integrations: Free tier available
- Only pay when you need them

---

## Security & Compliance

**Authentication:**
- Supabase Auth with JWT tokens
- Email verification required
- Password strength requirements
- 2FA optional (future)

**Authorization:**
- Row Level Security (RLS) on all tables
- Role-based access control
- Clients can only see their own data
- Admin has full access

**Data Protection:**
- Encrypted at rest (Supabase default)
- Encrypted in transit (HTTPS)
- Regular backups
- GDPR compliance (data export, deletion)

**Payment Security:**
- PCI compliance via Stripe
- No credit card data stored
- Secure payment links
- Webhook signature verification

---

## Success Metrics

**Business Metrics:**
- Time saved per week (target: 10+ hours)
- Invoice payment time (target: <7 days)
- Client satisfaction score (target: 9/10)
- Revenue growth (track monthly)

**Technical Metrics:**
- Page load time (<2 seconds)
- Uptime (>99.9%)
- Error rate (<0.1%)
- API response time (<500ms)

**User Metrics:**
- Daily active usage
- Feature adoption rate
- Client portal login rate
- Invoice view-to-payment conversion

---

## Future Enhancements (Post-Scale)

**Payment Integrations:**
- Stripe for online payments
- PayPal integration
- Cryptocurrency payments
- Recurring billing automation

**Email & Communication:**
- SendGrid/Resend for automated emails
- Email templates with variables
- SMS notifications (Twilio)
- WhatsApp Business API

**Accounting Integrations:**
- QuickBooks/Xero sync
- Automated expense tracking
- Tax calculation
- Financial reporting

**Productivity Integrations:**
- Slack notifications
- Google Calendar sync
- Trello/Asana integration
- GitHub project sync

**Multi-Tenant SaaS:**
- Allow other freelancers/agencies to sign up
- Subscription pricing (free, pro, enterprise)
- White-label options
- Marketplace for templates

**Advanced Features:**
- Proposal builder with e-signatures
- Contract management
- Team collaboration
- Mobile app (React Native)
- AI-powered insights
- Automated project estimation

---

## Pricing Model (Future SaaS)

**Free Tier:**
- 3 active clients
- 5 projects
- 10 invoices/month
- Basic features

**Pro Tier (R 299/month):**
- Unlimited clients
- Unlimited projects
- Unlimited invoices
- Client portal
- Automation
- Time tracking
- Priority support

**Enterprise Tier (R 999/month):**
- Everything in Pro
- White-label
- Custom domain
- API access
- Dedicated support
- Custom integrations

---

## Development Resources

**Design:**
- Figma for UI/UX design
- Shadcn/ui component library
- TailwindCSS for styling
- Lucide icons

**Development:**
- VS Code with extensions
- GitHub for version control
- Supabase CLI for local development
- Postman for API testing

**Deployment:**
- Vercel for frontend
- Supabase Cloud for backend
- Cloudflare for CDN
- GitHub Actions for CI/CD

**Monitoring:**
- Sentry for error tracking
- Vercel Analytics
- Supabase Dashboard
- Google Analytics

---

## Conclusion

Koruku is designed to be the complete business management solution for Mezokuru, automating workflows, improving client communication, and providing data-driven insights. Starting with core features and expanding over time, it will scale from a solo freelancer tool to a multi-tenant SaaS platform.

**Next Steps:**
1. Review and approve this PRD
2. Create detailed wireframes in Figma
3. Set up development environment
4. Begin Phase 1 implementation
5. Weekly progress reviews

**Timeline:** 12 weeks to MVP launch
**Budget:** R 0 (using free tiers + existing tools)
**Success:** Launch with 1 client (Mezokuru) and expand from there
