# Koruku Business Management System

A comprehensive business management platform for freelancers and agencies, built with React, TypeScript, and Supabase.

## Features

- **Dashboard** - Real-time business metrics, charts, and analytics
- **Client Management** - Track clients, contacts, and relationships
- **Project Management** - Manage projects with status tracking and support periods
- **Invoicing** - Create professional invoices with PDF export
- **Quotations** - Generate quotations with Mezokuru pricing formula
- **Settings** - Configure business information and preferences

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Query + Zustand
- **PDF Generation**: jsPDF
- **Charts**: Recharts
- **Deployment**: Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mezokuru/koruku-business-management.git
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
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
```bash
# See supabase/README.md for migration instructions
```

5. Start the development server:
```bash
npm run dev
```

## Documentation

- [Full System PRD](docs/KORUKU-SYSTEM-PRD.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Testing Checklist](docs/TESTING_CHECKLIST.md)
- [Supabase Setup](supabase/README.md)

## Deployment

The application is configured for deployment on Cloudflare Pages with PWA support.

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

## License

Private - All rights reserved

## Author

Mezokuru - [mezokuru@gmail.com](mailto:mezokuru@gmail.com)
