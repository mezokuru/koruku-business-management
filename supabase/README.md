# Supabase Database Setup

This directory contains the SQL migration files for the Koruku Business Management System database.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - Name: koruku-business-management
   - Database Password: (choose a strong password)
   - Region: (choose closest to your location)
5. Wait for the project to be created

### 2. Run the Migration

1. In your Supabase project dashboard, go to the SQL Editor
2. Click "New Query"
3. Copy the entire contents of `migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

### 3. Get Your API Credentials

1. In your Supabase project dashboard, go to Settings > API
2. Copy the following values:
   - Project URL (under "Project URL")
   - anon/public key (under "Project API keys")

### 4. Configure Your Application

1. Copy `.env.example` to `.env` in the root of your project
2. Replace the placeholder values with your actual Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 5. Create a User Account

1. In your Supabase project dashboard, go to Authentication > Users
2. Click "Add User"
3. Choose "Create new user"
4. Enter an email and password
5. Click "Create User"

You can now use these credentials to log in to the application.

## Database Schema Overview

The migration creates the following tables:

- **clients**: Store client/customer information
- **projects**: Track web development projects with support periods
- **invoices**: Manage billing and payment tracking
- **settings**: Store application configuration

It also creates:

- **Indexes**: For optimized query performance
- **Triggers**: For automatic timestamp updates and business logic
- **Views**: For complex data aggregations (dashboard stats, revenue summaries)
- **RLS Policies**: For row-level security (authentication required)

## Verification

After running the migration, verify that:

1. All 4 tables are created (clients, projects, invoices, settings)
2. All 3 views are created (client_revenue_summary, project_status_summary, dashboard_stats)
3. RLS is enabled on all tables
4. Default settings data is inserted (3 rows in settings table)

You can check this in the Supabase dashboard under:
- Database > Tables
- Database > Views
- Authentication > Policies
