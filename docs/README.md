# Koruku Business Management System

A modern, single-page web application for managing clients, projects, invoices, and business operations for Mezokuru web development business.

## Features

- **Client Management** - Track business customers with contact information and revenue history
- **Project Management** - Monitor web development projects with support period tracking
- **Invoice Management** - Create and manage invoices with automatic numbering and status tracking
- **Dashboard** - Real-time business statistics and performance metrics
- **Settings** - Configure business information and default settings
- **Data Export** - Export all business data to JSON for backup

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router 7
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/koruku-business-management.git
cd koruku-business-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and run the migration file: `supabase/migrations/001_initial_schema.sql`

5. Create a user account:
   - In Supabase dashboard, go to Authentication > Users
   - Click "Add User" and create your account

6. Start the development server:
```bash
npm run dev
```

7. Open http://localhost:5173 in your browser

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run build:verify` - Build and verify bundle size
- `npm run deploy:check` - Run all pre-deployment checks

### Project Structure

```
koruku-business-management/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── clients/      # Client management components
│   │   ├── projects/     # Project management components
│   │   ├── invoices/     # Invoice management components
│   │   ├── layout/       # Layout components (Sidebar, Header)
│   │   └── ui/           # Base UI components (Button, Input, Modal)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and Supabase client
│   ├── pages/            # Page components
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Main application component
├── supabase/
│   └── migrations/       # Database migration files
├── public/               # Static assets
└── dist/                 # Production build output
```

## Deployment

### Quick Deploy (5 minutes)

See [QUICK_DEPLOY.md](QUICK_DEPLOY.md) for a condensed deployment guide.

### Full Deployment Guide

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions including:
- Setting up production Supabase project
- Deploying to Vercel or Netlify
- Configuring custom domain (koruku.xyz)
- Setting up continuous deployment
- Error monitoring setup

### Pre-Deployment Checklist

Before deploying, complete the checklist in [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md).

### Post-Deployment Verification

After deploying, verify everything works using [POST_DEPLOYMENT_VERIFICATION.md](POST_DEPLOYMENT_VERIFICATION.md).

## Features Documentation

### Client Management
- Create, read, update, and delete clients
- Search and filter clients
- Track client revenue and project count
- Mark clients as active/inactive

### Project Management
- Manage web development projects
- Track support periods with automatic end date calculation
- Monitor expiring support contracts (< 30 days warning)
- Link projects to clients
- Store project details (tech stack, URLs, description)

### Invoice Management
- Create invoices with automatic number generation
- Track invoice status (draft, sent, paid, overdue)
- Automatic overdue detection
- Link invoices to clients and projects
- Mark invoices as paid or sent

### Dashboard
- Total revenue (current year)
- Paid invoices count
- Pending and overdue invoices
- Outstanding amount
- Recent invoices list
- Support expiring alerts

### Settings
- Configure business information
- Set invoice defaults (prefix, payment terms)
- Set project defaults (support months)
- Export all data to JSON

## Accessibility

This application is built with accessibility in mind and meets WCAG 2.1 AA standards:
- Full keyboard navigation support
- Screen reader compatible
- Proper ARIA labels and live regions
- High contrast ratios
- Focus indicators on all interactive elements

See [src/ACCESSIBILITY.md](src/ACCESSIBILITY.md) for details.

## Performance

- Initial load time: < 2 seconds
- Page navigation: < 500ms
- Search results: < 300ms
- Bundle size: < 500KB gzipped
- Lighthouse score: > 90 in all categories

See [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) for details.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Security

- Authentication via Supabase Auth
- Row Level Security (RLS) policies on all tables
- HTTPS enforced in production
- Security headers configured
- Environment variables for sensitive data
- Session management with automatic expiry

## License

Private - All rights reserved

## Support

For issues or questions:
1. Check the documentation in this repository
2. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for deployment issues
3. Check Supabase documentation: https://supabase.com/docs
4. Check Vercel documentation: https://vercel.com/docs

## Acknowledgments

Built with:
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query/)
- [React Router](https://reactrouter.com/)
