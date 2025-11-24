# Koruku Enhancement Plan

## 🎯 Overview
Transform the Koruku Business Management System into a god-tier application with advanced analytics, PDF exports, and quotation management.

---

## 📊 Phase 1: God-Tier Dashboard

### Visual Enhancements Needed

#### 1. Revenue Chart (Line/Area Chart)
- **Purpose**: Show revenue trends over time
- **Data**: Monthly revenue for current year
- **Library**: Recharts (lightweight, React-native)
- **Features**:
  - Smooth animations
  - Tooltips on hover
  - Responsive design
  - Toggle between line/area view

#### 2. Invoice Status Distribution (Pie/Donut Chart)
- **Purpose**: Visual breakdown of invoice statuses
- **Data**: Count of Draft, Sent, Paid, Overdue invoices
- **Features**:
  - Color-coded segments
  - Percentage labels
  - Interactive legend
  - Click to filter

#### 3. Client Revenue Breakdown (Bar Chart)
- **Purpose**: Top clients by revenue
- **Data**: Top 10 clients with total revenue
- **Features**:
  - Horizontal bars
  - Sortable
  - Click to view client details

#### 4. Monthly Comparison (Bar Chart)
- **Purpose**: Compare current month vs previous months
- **Data**: Revenue, invoices created, payments received
- **Features**:
  - Grouped bars
  - Year-over-year comparison
  - Growth percentage indicators

#### 5. Project Status Overview (Progress Bars)
- **Purpose**: Active projects and their status
- **Data**: Projects with support expiry dates
- **Features**:
  - Visual progress bars
  - Color-coded by urgency
  - Days remaining indicators

#### 6. Cash Flow Indicator
- **Purpose**: Quick financial health check
- **Data**: Outstanding vs received payments
- **Features**:
  - Gauge chart
  - Red/yellow/green zones
  - Trend arrows

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  Quick Stats Cards (4 cards)                            │
├──────────────────────┬──────────────────────────────────┤
│  Revenue Chart       │  Invoice Status Pie Chart        │
│  (Line/Area)         │  (Donut)                         │
├──────────────────────┴──────────────────────────────────┤
│  Top Clients by Revenue (Horizontal Bar Chart)          │
├──────────────────────┬──────────────────────────────────┤
│  Monthly Comparison  │  Support Expiring Projects       │
│  (Grouped Bars)      │  (Progress Bars)                 │
├──────────────────────┴──────────────────────────────────┤
│  Recent Invoices Table                                   │
└─────────────────────────────────────────────────────────┘
```

### Implementation Steps
1. Install Recharts: `npm install recharts`
2. Create chart components in `src/components/dashboard/`
3. Add new database views for analytics data
4. Create custom hooks for chart data
5. Update Dashboard page with new layout

---

## 📄 Phase 2: PDF Export for Invoices

### Features
- **Generate professional PDF invoices**
- **Include business branding**
- **Itemized breakdown**
- **Payment terms and due dates**
- **Download or email options**

### Implementation

#### Library Choice: jsPDF + html2canvas
- **jsPDF**: PDF generation
- **html2canvas**: Convert HTML to canvas for PDF
- **Alternative**: react-pdf (more React-native)

#### Invoice PDF Template
```
┌─────────────────────────────────────────────┐
│  [LOGO] KORUKU                              │
│  Business Address                           │
│  Contact Information                        │
├─────────────────────────────────────────────┤
│  INVOICE #INV-001                           │
│  Date: 2025-01-15                           │
│  Due Date: 2025-02-15                       │
├─────────────────────────────────────────────┤
│  Bill To:                                   │
│  Client Name                                │
│  Client Address                             │
├─────────────────────────────────────────────┤
│  Description          Qty    Rate    Amount │
│  ─────────────────────────────────────────  │
│  Service 1            1      R1000   R1000  │
│  Service 2            2      R500    R1000  │
│                                              │
│                       Subtotal:     R2000   │
│                       Tax (15%):    R300    │
│                       Total:        R2300   │
├─────────────────────────────────────────────┤
│  Payment Terms: Net 30                      │
│  Bank Details: [Banking info]               │
│                                              │
│  Thank you for your business!               │
└─────────────────────────────────────────────┘
```

#### Implementation Steps
1. Install libraries: `npm install jspdf html2canvas`
2. Create `InvoiceTemplate` component
3. Add "Download PDF" button to invoice details
4. Create PDF generation utility function
5. Add print functionality

---

## 💼 Phase 3: Quotations/Estimates Feature

### Database Schema

#### New Table: `quotations`
```sql
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Features
1. **Create Quotations**
   - Similar to invoice creation
   - Add line items
   - Set validity period
   - Attach to client/project

2. **Quotation Status Management**
   - Draft → Sent → Accepted/Rejected
   - Auto-expire after valid_until date
   - Convert accepted quotation to invoice

3. **Quotation PDF Export**
   - Similar to invoice PDF
   - Include validity period
   - "QUOTATION" watermark
   - Terms and conditions

4. **Quotation List Page**
   - Filter by status
   - Search by client/number
   - Quick actions (send, convert, delete)

### UI Components Needed
- `QuotationForm.tsx` - Create/edit quotations
- `QuotationList.tsx` - List all quotations
- `QuotationDetails.tsx` - View quotation details
- `QuotationPDF.tsx` - PDF template
- `ConvertToInvoice.tsx` - Convert quotation to invoice

### Navigation Updates
Add "Quotations" to sidebar menu

---

## 📦 Required Dependencies

```json
{
  "recharts": "^2.10.0",           // Charts and graphs
  "jspdf": "^2.5.1",               // PDF generation
  "html2canvas": "^1.4.1",         // HTML to canvas
  "date-fns": "^4.1.0"             // Already installed
}
```

---

## 🗂️ File Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── RevenueChart.tsx
│   │   ├── InvoiceStatusChart.tsx
│   │   ├── ClientRevenueChart.tsx
│   │   ├── MonthlyComparisonChart.tsx
│   │   ├── ProjectStatusList.tsx
│   │   └── CashFlowGauge.tsx
│   ├── invoices/
│   │   ├── InvoicePDF.tsx
│   │   └── PDFExportButton.tsx
│   └── quotations/
│       ├── QuotationForm.tsx
│       ├── QuotationList.tsx
│       ├── QuotationDetails.tsx
│       └── QuotationPDF.tsx
├── hooks/
│   ├── useChartData.ts
│   ├── useQuotations.ts
│   └── usePDFExport.ts
├── lib/
│   ├── pdfGenerator.ts
│   └── chartUtils.ts
├── pages/
│   └── Quotations.tsx
└── types/
    └── quotation.ts
```

---

## 🎨 Design Considerations

### Color Palette for Charts
- **Revenue**: #27ae60 (Green)
- **Expenses**: #e74c3c (Red)
- **Pending**: #f39c12 (Orange)
- **Paid**: #3498db (Blue)
- **Draft**: #7f8c8d (Gray)

### Chart Animations
- Smooth entrance animations (300ms)
- Hover effects with tooltips
- Responsive to screen size
- Loading states with skeletons

### PDF Styling
- Professional typography
- Consistent spacing
- Brand colors
- Print-optimized layout

---

## 📋 Implementation Priority

### High Priority (Do First)
1. ✅ Fix sidebar visibility (DONE!)
2. 🔄 Install chart library (Recharts)
3. 🔄 Create basic revenue chart
4. 🔄 Add invoice status pie chart
5. 🔄 Implement PDF export for invoices

### Medium Priority (Do Next)
6. Create quotations database schema
7. Build quotation CRUD operations
8. Add quotation UI components
9. Implement quotation PDF export
10. Add more dashboard charts

### Low Priority (Nice to Have)
11. Email quotations/invoices
12. Recurring invoices
13. Payment tracking
14. Expense tracking
15. Profit/loss reports

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install recharts jspdf html2canvas

# Run database migration for quotations
# (Execute SQL in Supabase dashboard)

# Start development
npm run dev
```

---

## 📊 Expected Outcomes

### Dashboard Improvements
- **Visual Appeal**: 10x more engaging
- **Information Density**: 5x more data at a glance
- **User Experience**: Intuitive and interactive
- **Performance**: < 2s load time with charts

### PDF Export
- **Professional**: Client-ready invoices
- **Branded**: Custom business branding
- **Flexible**: Download or print
- **Fast**: < 1s generation time

### Quotations
- **Streamlined**: Quick quote creation
- **Conversion**: Easy quote-to-invoice
- **Tracking**: Monitor quote acceptance rate
- **Professional**: PDF export for clients

---

## 🎯 Success Metrics

- Dashboard load time < 2 seconds
- Charts render smoothly (60fps)
- PDF generation < 1 second
- Quotation creation < 30 seconds
- User satisfaction: "This is god-tier!" 🚀

---

**Ready to implement? Let's start with Phase 1: God-Tier Dashboard!**
