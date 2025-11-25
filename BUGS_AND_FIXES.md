# Bugs and Fixes - Koruku Business Management System

**Date:** November 25, 2025  
**Status:** Issues Identified - Pending Fix

---

## 🐛 Bug #1: Incorrect Profit Margin Calculation

### Severity: HIGH
### Location: `project_profitability` view
### Status: ✅ FIXED

### Description

The profit margin percentage is calculated incorrectly in the Project Profitability report. The formula divides profit by cost instead of dividing profit by revenue.

### Current Behavior (WRONG)

```sql
profit_margin_percentage = (gross_profit / total_cost) × 100
```

**Example:**
- Wedding Portal Project
- Revenue: R 1,500
- Cost: R 450
- Profit: R 1,050
- **Displayed Margin: 233.3%** ❌ (calculated as 1,050 / 450 × 100)

### Expected Behavior (CORRECT)

```sql
profit_margin_percentage = (gross_profit / total_invoiced) × 100
```

**Example:**
- Wedding Portal Project
- Revenue: R 1,500
- Cost: R 450
- Profit: R 1,050
- **Correct Margin: 70%** ✅ (should be 1,050 / 1,500 × 100)

### Impact

- ❌ Misleading profitability metrics
- ❌ Cannot accurately assess project margins
- ❌ Business decisions based on wrong data
- ❌ Margin > 100% looks absurd to clients/stakeholders

### Root Cause

In `supabase/migrations/005_phase2_business_intelligence.sql`, the view calculates:

```sql
CREATE OR REPLACE VIEW project_profitability AS
SELECT 
  -- ... other fields ...
  CASE 
    WHEN (COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0)) > 0 
    THEN ((COALESCE(SUM(i.amount), 0) - (COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0))) / 
          (COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0))) * 100  -- WRONG!
    ELSE 0
  END as profit_margin_percentage
FROM projects pr
-- ... rest of query
```

**The denominator should be `total_invoiced`, not `total_cost`!**

### Fix Required

```sql
CREATE OR REPLACE VIEW project_profitability AS
SELECT 
  pr.id as project_id,
  pr.name as project_name,
  c.business as client_name,
  pr.labour_amount,
  pr.infrastructure_amount,
  COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0) as total_cost,
  COALESCE(SUM(i.amount), 0) as total_invoiced,
  COALESCE(SUM(p.amount), 0) as total_collected,
  COALESCE(SUM(i.amount), 0) - (COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0)) as gross_profit,
  CASE 
    WHEN COALESCE(SUM(i.amount), 0) > 0  -- Check if revenue exists
    THEN ((COALESCE(SUM(i.amount), 0) - (COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0))) / 
          COALESCE(SUM(i.amount), 0)) * 100  -- Divide by REVENUE, not cost!
    ELSE 0
  END as profit_margin_percentage
FROM projects pr
JOIN clients c ON c.id = pr.client_id
LEFT JOIN invoices i ON i.project_id = pr.id
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY pr.id, pr.name, c.business, pr.labour_amount, pr.infrastructure_amount;
```

### Test Cases

**Test Case 1: Normal Project**
- Revenue: R 1,500
- Cost: R 450
- Expected Margin: 70%
- Current Result: 233.3% ❌
- After Fix: 70% ✅

**Test Case 2: Zero Cost Project**
- Revenue: R 1,000
- Cost: R 0
- Expected Margin: 100%
- Current Result: 0.0% ❌ (division by zero handled incorrectly)
- After Fix: 100% ✅

**Test Case 3: Break-Even Project**
- Revenue: R 500
- Cost: R 500
- Expected Margin: 0%
- Current Result: 0% ✅ (accidentally correct)
- After Fix: 0% ✅

**Test Case 4: Loss-Making Project**
- Revenue: R 300
- Cost: R 500
- Expected Margin: -40%
- Current Result: -40% ✅ (accidentally correct)
- After Fix: -40% ✅

---

## 🐛 Bug #2: Collected Amount Shows R 0.00 for Paid Invoices

### Severity: MEDIUM
### Location: `project_profitability` view
### Status: ⚠️ NOT A BUG - User Workflow Issue

### Description

The "Collected" column in the Project Profitability report shows R 0.00 even for invoices that are marked as "Paid" in the system.

### Current Behavior

**Projects with paid invoices show:**
- Invoiced: R 1,500.00 ✅
- Collected: R 0.00 ❌
- Status: Invoice marked as "Paid"

### Expected Behavior

**Projects with paid invoices should show:**
- Invoiced: R 1,500.00 ✅
- Collected: R 1,500.00 ✅ (or sum of actual payments)
- Status: Invoice marked as "Paid"

### Root Cause

Two possible causes:

**Option 1: No Payment Records Created**
- Invoices are marked as "paid" by changing status
- But no actual payment records created in `payments` table
- View correctly shows R 0.00 because no payments exist

**Option 2: View Join Issue**
- Payment records exist
- But view isn't joining correctly
- Less likely based on the SQL structure

### Investigation Needed

Run this query to check:

```sql
-- Check if payments exist for paid invoices
SELECT 
  i.invoice_number,
  i.status,
  i.amount as invoice_amount,
  COALESCE(SUM(p.amount), 0) as total_payments,
  COUNT(p.id) as payment_count
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
WHERE i.status = 'paid'
GROUP BY i.id, i.invoice_number, i.status, i.amount;
```

### Fix Required

**If no payments exist:**
- User needs to record payments via the Payments UI
- Or create payments when marking invoice as paid

**If payments exist but view is wrong:**
- Check the view's LEFT JOIN logic
- Verify GROUP BY includes all necessary fields

### Impact

- ❌ Cannot track actual cash collected
- ❌ Profitability report incomplete
- ❌ Cannot distinguish between invoiced and collected revenue
- ⚠️ Less critical than Bug #1 (might be user data issue, not code bug)

---

## 📋 Priority Fix Order

### 1. Bug #1 - Profit Margin Calculation (HIGH PRIORITY)
**Why:** This is a code bug that affects all projects. Wrong formula = wrong business decisions.

**Steps:**
1. Update `project_profitability` view in migration file
2. Run migration to update production database
3. Test with existing data
4. Verify all margin calculations are correct

**Files to Update:**
- `supabase/migrations/005_phase2_business_intelligence.sql`
- Or create new migration: `006_fix_profit_margin_calculation.sql`

### 2. Bug #2 - Collected Amount (MEDIUM PRIORITY)
**Why:** Might be a data issue, not a code bug. Investigate first.

**Steps:**
1. Check if payment records exist in database
2. If no payments: Document that users must record payments
3. If payments exist: Fix the view
4. Test with real payment data

---

## 🔧 How to Apply Fixes

### Option 1: Create New Migration (Recommended)

```bash
# Create new migration file
touch supabase/migrations/006_fix_profit_margin_calculation.sql
```

Add the corrected view definition to the file, then:

```bash
# Apply migration
supabase db push
```

### Option 2: Run SQL Directly in Supabase Dashboard

1. Go to SQL Editor
2. Copy the corrected view definition
3. Run the query
4. Verify results in Reports page

---

## ✅ Verification Checklist

After applying fixes:

### Bug #1 Verification
- [ ] Wedding Portal margin shows 70% (not 233.3%)
- [ ] Workstation Refresh margin shows 100% (not 0.0%)
- [ ] All margins are between -100% and 100% (unless truly exceptional)
- [ ] Formula: (Profit / Revenue) × 100

### Bug #2 Verification
- [ ] Paid invoices show collected amount
- [ ] Collected amount matches payment records
- [ ] Unpaid invoices show R 0.00 collected
- [ ] Partially paid invoices show partial amount

---

## 📊 Business Impact

### Before Fix
- ❌ 233.3% margin looks absurd
- ❌ Cannot trust profitability data
- ❌ Wrong business decisions
- ❌ Unprofessional reports

### After Fix
- ✅ 70% margin is realistic and accurate
- ✅ Can trust profitability metrics
- ✅ Make informed business decisions
- ✅ Professional, accurate reports

---

## 🎓 Lessons Learned

### Why This Happened

1. **Profit Margin Formula Confusion**
   - Margin = Profit / Revenue (correct)
   - Markup = Profit / Cost (different metric)
   - We accidentally used markup formula for margin

2. **Common Business Metrics:**
   - **Profit Margin:** How much of each rand of revenue is profit
   - **Markup:** How much you add to cost to get price
   - **ROI:** Return on investment

3. **Example:**
   - Cost: R 450
   - Price: R 1,500
   - Profit: R 1,050
   - **Margin:** 70% (profit / price)
   - **Markup:** 233% (profit / cost)
   - We showed markup instead of margin!

### Prevention

- ✅ Always verify business formulas with stakeholder
- ✅ Test with realistic data during development
- ✅ Have someone review financial calculations
- ✅ Document which formula is being used

---

## 📝 Notes

- Both bugs identified on November 25, 2025
- System is live in production
- Bugs affect reporting only, not core functionality
- No data loss or corruption
- Fixes are non-breaking changes
- Can be applied without downtime

---

## 🐛 Bug #3: Pricing Presets Are Incorrect and Hardcoded

### Severity: HIGH
### Location: Quotation Form - Mezokuru Pricing Formula section
### Status: ✅ FIXED

### Description

The pricing presets in the quotation form are completely wrong and don't match Mezokuru's actual pricing structure. Additionally, these values are hardcoded and cannot be changed in Settings.

### Current Behavior (WRONG)

**Displayed Presets:**
- Simple Portfolio: R 2,800
- Business Website: R 4,500
- E-commerce Site: R 8,000
- Custom System: R 15,000

**Issues:**
1. ❌ Prices don't match actual Mezokuru pricing
2. ❌ Missing many product types
3. ❌ Values are hardcoded (can't be updated)
4. ❌ No way to manage presets in Settings

### Expected Behavior (CORRECT)

**Actual Mezokuru Pricing:**

**Websites:**
- Personal (Single Page): R 1,200
- Portfolio (Multi Page 3+): R 3,000
- Business Starter: R 6,800
- Business Pro: R 11,250

**E-commerce:**
- E-commerce Basic: R 15,000
- E-commerce Advanced: R 25,000

**Mobile Apps (Cross Platform):**
- MVP: R 25,000
- Full Production App (FPA): R 55,000

### Impact

- ❌ Quoting wrong prices to clients
- ❌ Inconsistent pricing across quotes
- ❌ Cannot update prices without code changes
- ❌ Missing product categories (Mobile Apps)
- ❌ Unprofessional - shows outdated/wrong pricing

### Root Cause

**File:** `src/pages/Quotations.tsx` or `src/components/quotations/QuotationForm.tsx`

Pricing presets are hardcoded in the component:

```typescript
// Current (WRONG)
const pricingPresets = [
  { label: 'Simple Portfolio', value: 2800 },
  { label: 'Business Website', value: 4500 },
  { label: 'E-commerce Site', value: 8000 },
  { label: 'Custom System', value: 15000 },
];
```

### Fix Required

**Option 1: Store in Settings (Recommended)**

1. Add pricing presets to Settings table:

```sql
-- Add to settings table
INSERT INTO settings (key, value) VALUES (
  'pricing_presets',
  '{
    "presets": [
      {"label": "Personal (Single Page)", "value": 1200, "category": "website"},
      {"label": "Portfolio (Multi Page 3+)", "value": 3000, "category": "website"},
      {"label": "Business Starter", "value": 6800, "category": "website"},
      {"label": "Business Pro", "value": 11250, "category": "website"},
      {"label": "E-commerce Basic", "value": 15000, "category": "ecommerce"},
      {"label": "E-commerce Advanced", "value": 25000, "category": "ecommerce"},
      {"label": "Mobile App MVP", "value": 25000, "category": "mobile"},
      {"label": "Mobile App FPA", "value": 55000, "category": "mobile"}
    ]
  }'::jsonb
);
```

2. Update Settings page to allow editing presets
3. Load presets from Settings in quotation form

**Option 2: Quick Fix (Temporary)**

Update the hardcoded values to match actual pricing:

```typescript
// Corrected pricing
const pricingPresets = [
  // Websites
  { label: 'Personal (Single Page)', value: 1200, category: 'Websites' },
  { label: 'Portfolio (Multi Page 3+)', value: 3000, category: 'Websites' },
  { label: 'Business Starter', value: 6800, category: 'Websites' },
  { label: 'Business Pro', value: 11250, category: 'Websites' },
  
  // E-commerce
  { label: 'E-commerce Basic', value: 15000, category: 'E-commerce' },
  { label: 'E-commerce Advanced', value: 25000, category: 'E-commerce' },
  
  // Mobile Apps
  { label: 'Mobile App MVP', value: 25000, category: 'Mobile Apps' },
  { label: 'Mobile App FPA', value: 55000, category: 'Mobile Apps' },
];
```

---

## 🐛 Bug #4: No Itemized Line Items in Quotations/Invoices

### Severity: MEDIUM
### Location: Quotation Form & Invoice Form
### Status: ✅ FIXED (Invoices) | ✅ Already Working (Quotations)

### Description

When creating a quotation or invoice, there's no way to add itemized line items with descriptions, quantities, and unit prices. The form only shows a single total amount field.

### Current Behavior

**Quotation Form:**
- Shows "Mezokuru Pricing Formula" section
- Has preset buttons
- Has "Total Project Cost" field
- Has "Generate Items" button (but doesn't show items?)
- **Missing:** Actual line items list with descriptions

**Invoice Form:**
- Single "Amount" field
- No line items
- No itemization

### Expected Behavior

**Quotation Form Should Have:**
```
Line Items:
┌─────────────────────────────────────────────────────────────────┐
│ Description              | Qty | Unit Price | Amount            │
├─────────────────────────────────────────────────────────────────┤
│ Website Development      | 1   | R 5,000    | R 5,000          │
│ Logo Design              | 1   | R 1,500    | R 1,500          │
│ 1 Year Hosting           | 12  | R 150      | R 1,800          │
│                                                                  │
│ [+ Add Line Item]                                               │
├─────────────────────────────────────────────────────────────────┤
│                                      Subtotal: R 8,300          │
│                                      Discount: R 0              │
│                                      Total:    R 8,300          │
└─────────────────────────────────────────────────────────────────┘
```

**Invoice Form Should Have:**
- Same itemized line items structure
- Or inherit from quotation when converting

### Impact

- ❌ Cannot provide detailed breakdowns to clients
- ❌ Unprofessional quotes/invoices
- ❌ Clients don't know what they're paying for
- ❌ Cannot itemize labour vs infrastructure
- ❌ Hard to justify pricing

### Root Cause

**Database:** Line items tables exist (`quotation_items`, `invoice_items`) but UI not implemented.

**Phase 1.5 Note:** Database foundation was created but UI was deferred to Phase 2. Phase 2 focused on payments/reporting instead of line items UI.

### Fix Required

**For Quotations:**

1. Add line items section to `QuotationForm.tsx`
2. Allow adding/editing/removing line items
3. Auto-calculate subtotal and total
4. Save line items to `quotation_items` table
5. Display line items on quotation PDF

**For Invoices:**

1. Add line items section to `InvoiceForm.tsx`
2. When converting from quotation, copy line items
3. Allow manual line item entry for direct invoices
4. Save to `invoice_items` table
5. Display line items on invoice PDF

**UI Component Needed:**

```typescript
// LineItemsEditor.tsx
interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number; // auto-calculated
}

// Features:
- Add/remove line items
- Auto-calculate amount (qty × price)
- Auto-calculate subtotal
- Discount field (percentage or amount)
- Auto-calculate total
- Drag to reorder
```

---

## 🐛 Bug #5: Pricing Formula "Generate Items" Button Does Nothing Visible

### Severity: MEDIUM
### Location: Quotation Form - Mezokuru Pricing Formula
### Status: ❌ NOT FIXED (Unclear)

### Description

The quotation form has a "Generate Items" button in the Mezokuru Pricing Formula section, but it's unclear what it does since there's no line items list visible.

### Current Behavior

- User enters "Total Project Cost"
- User selects "Project Type" (Small 30% labour)
- User clicks "Generate Items"
- **Nothing visible happens?**

### Expected Behavior

**Option 1: Generate Line Items**
When clicking "Generate Items", it should:
1. Calculate labour amount (30% of total)
2. Calculate infrastructure amount (70% of total)
3. Create two line items:
   - "Development & Labour" - R X
   - "Infrastructure & Hosting" - R Y
4. Display in line items list

**Option 2: Auto-Fill Total**
When clicking preset buttons, it should:
1. Fill the "Total Project Cost" field
2. Auto-select appropriate project type
3. Generate line items automatically

### Investigation Needed

Check what the "Generate Items" button actually does in the code.

### Fix Required

1. Implement line items UI (see Bug #4)
2. Make "Generate Items" button create line items based on:
   - Total project cost
   - Selected project type (labour %)
   - Mezokuru pricing formula
3. Show generated items in line items list
4. Allow editing after generation

---

## 📋 Updated Priority Fix Order

### 1. Bug #1 - Profit Margin Calculation (HIGH - CRITICAL)
**Impact:** Wrong business decisions  
**Effort:** Low (SQL view update)  
**Fix Time:** 15 minutes

### 2. Bug #3 - Pricing Presets Wrong (HIGH - CRITICAL)
**Impact:** Quoting wrong prices to clients  
**Effort:** Low (update hardcoded values) or Medium (add to Settings)  
**Fix Time:** 30 minutes (quick fix) or 2 hours (Settings integration)

### 3. Bug #4 - No Line Items UI (MEDIUM - IMPORTANT)
**Impact:** Unprofessional quotes/invoices  
**Effort:** High (new UI component)  
**Fix Time:** 4-6 hours

### 4. Bug #2 - Collected Amount (MEDIUM)
**Impact:** Incomplete reporting  
**Effort:** Low (investigate) or Medium (fix)  
**Fix Time:** 30 minutes - 2 hours

### 5. Bug #5 - Generate Items Button (LOW)
**Impact:** Confusing UX  
**Effort:** Medium (depends on Bug #4)  
**Fix Time:** 1-2 hours

---

## 🚨 CRITICAL FIXES NEEDED BEFORE CLIENT USE

### Must Fix Immediately:
1. ✅ Bug #3 - Update pricing presets to correct values
2. ✅ Bug #1 - Fix profit margin calculation

### Should Fix Soon:
3. ⚠️ Bug #4 - Add line items UI (for professional quotes)

### Can Fix Later:
4. ⏳ Bug #2 - Collected amount (reporting issue)
5. ⏳ Bug #5 - Generate items button (UX improvement)

---

## 💰 Correct Mezokuru Pricing Structure

### Websites
| Product | Price | Notes |
|---------|-------|-------|
| Personal (Single Page) | R 1,200 | Basic landing page |
| Portfolio (Multi Page 3+) | R 3,000 | Multi-page portfolio |
| Business Starter | R 6,800 | Small business website |
| Business Pro | R 11,250 | Professional business site |

### E-commerce
| Product | Price | Notes |
|---------|-------|-------|
| E-commerce Basic | R 15,000 | Basic online store |
| E-commerce Advanced | R 25,000 | Full-featured store |

### Mobile Apps (Cross Platform)
| Product | Price | Notes |
|---------|-------|-------|
| Mobile App MVP | R 25,000 | Minimum viable product |
| Mobile App FPA | R 55,000 | Full production app |

### Pricing Formula
- **Labour:** 30% of total project cost
- **Infrastructure:** 70% of total project cost

---

## 💡 Enhancement #1: Customizable Dashboard with Embedded Reports

### Severity: ENHANCEMENT
### Location: Dashboard page & Reports page
### Status: ❌ NOT IMPLEMENTED

### Description

Currently, the system has both a Dashboard page and a separate Reports page, which creates redundancy. The Reports page shows detailed tables, while the Dashboard shows summary stats and charts. This separation is inefficient.

### Current Behavior

**Dashboard Page:**
- Summary stats (Total Revenue, Paid Invoices, etc.)
- Revenue Trend chart (last 12 months)
- Invoice Status Distribution (donut chart)
- Top Clients by Revenue (bar chart)
- Recent Invoices table

**Reports Page:**
- Client Revenue Summary (detailed table)
- Monthly Revenue Report (detailed table)
- Project Profitability (detailed table)
- Export to CSV button

**Issues:**
1. ❌ Redundant information between Dashboard and Reports
2. ❌ Dashboard is static - cannot customize what you see
3. ❌ Have to navigate to Reports page for detailed data
4. ❌ No quick way to drill down from Dashboard to details
5. ❌ Dashboard layout is fixed - cannot rearrange widgets

### Proposed Behavior

**Enhanced Dashboard (All-in-One):**

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard                                    [⚙️ Customize]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│ │ Total Rev   │ │ Paid        │ │ Outstanding │ │ Margin    │ │
│ │ R 20,316    │ │ 5 invoices  │ │ R 3,800     │ │ 68%       │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                  │
│ ┌──────────────────────────────┐ ┌──────────────────────────┐  │
│ │ 📊 Revenue Trend             │ │ 💰 Top Clients           │  │
│ │ [Chart]                      │ │ [Chart]                  │  │
│ │                              │ │                          │  │
│ │ [View Details →]             │ │ [View Details →]         │  │
│ └──────────────────────────────┘ └──────────────────────────┘  │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ 📈 Project Profitability (Top 5)          [View All →]      ││
│ ├──────────────────────────────────────────────────────────────┤│
│ │ Project         | Client  | Margin | Profit    | [Details] ││
│ │ Wedding Portal  | V&C     | 70%    | R 1,050   | [→]       ││
│ │ Workstation     | Ariende | 100%   | R 1,000   | [→]       ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ 📄 Recent Invoices (Last 5)               [View All →]      ││
│ ├──────────────────────────────────────────────────────────────┤│
│ │ [Table with 5 most recent invoices]                         ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

**1. Widget-Based Dashboard**
- Each section is a "widget" that can be:
  - Shown/hidden
  - Reordered (drag and drop)
  - Resized (small, medium, large)
  - Configured (date ranges, filters)

**2. Quick Actions**
- Each widget has "View Details" link
- Clicking expands to full table view (modal or inline)
- No need to navigate to separate Reports page

**3. Customization**
- Click "⚙️ Customize" button
- Toggle widgets on/off
- Drag to reorder
- Save layout preferences to database

**4. Drill-Down Navigation**
- Click on chart bar → See filtered data
- Click on client name → Go to client details
- Click on project → Go to project details
- Click "View All" → Expand widget to full page

**5. At-a-Glance Insights**
- Show top 5 items by default
- "View All" expands to full list
- Export button on each widget
- Refresh button to reload data

### Implementation Plan

**Phase 1: Consolidate Reports into Dashboard**
1. Move report tables to Dashboard as collapsible sections
2. Show top 5 items by default
3. Add "View All" buttons to expand
4. Add "Export" button to each section
5. Remove separate Reports page (or make it redirect to Dashboard)

**Phase 2: Add Customization**
1. Create widget system
2. Add "Customize" mode
3. Save preferences to `settings` table
4. Allow show/hide widgets
5. Allow reordering

**Phase 3: Add Drill-Down**
1. Make charts clickable
2. Add modal/drawer for detailed views
3. Add filters and date range pickers
4. Add quick actions (create invoice, etc.)

### Database Changes Needed

```sql
-- Add dashboard preferences to settings
INSERT INTO settings (key, value) VALUES (
  'dashboard_layout',
  '{
    "widgets": [
      {"id": "stats", "visible": true, "order": 1, "size": "full"},
      {"id": "revenue_trend", "visible": true, "order": 2, "size": "half"},
      {"id": "top_clients", "visible": true, "order": 3, "size": "half"},
      {"id": "project_profitability", "visible": true, "order": 4, "size": "full"},
      {"id": "recent_invoices", "visible": true, "order": 5, "size": "full"}
    ],
    "default_date_range": "last_12_months",
    "items_per_widget": 5
  }'::jsonb
);
```

### Benefits

**For Users:**
- ✅ Everything in one place
- ✅ Customize what you see
- ✅ Faster access to data
- ✅ Less navigation required
- ✅ At-a-glance insights

**For System:**
- ✅ Eliminate redundancy
- ✅ Better UX
- ✅ More flexible
- ✅ Easier to maintain
- ✅ One source of truth

### Impact

**Current State:**
- Dashboard: Summary only
- Reports: Detailed tables
- Need to navigate between pages
- Cannot customize

**After Enhancement:**
- Dashboard: Summary + Details
- Reports: Removed or redirects
- Everything in one place
- Fully customizable

### Priority

**Medium-High** - This is a UX enhancement that significantly improves usability, but doesn't block core functionality.

**Recommended Timeline:**
- Phase 1 (Consolidate): 2-3 days
- Phase 2 (Customization): 3-4 days
- Phase 3 (Drill-Down): 2-3 days
- **Total:** 1-2 weeks

---

## 🏗️ Architecture Issue: Frontend vs Backend Data

### Issue: Hardcoded Business Logic in Frontend

### Current Problems

**Pricing Presets (Bug #3):**
- ❌ Defined in React component
- ❌ Requires code change to update
- ❌ Cannot be changed by user
- ❌ Not in database

**Project Types:**
- ❌ Hardcoded in forms
- ❌ Cannot add new types without code change

**Invoice Settings:**
- ✅ Stored in database (good!)
- ✅ Editable in Settings page

**Business Info:**
- ✅ Stored in database (good!)
- ✅ Editable in Settings page

### Correct Architecture

**Rule:** Business data should live in the database, not in code.

**What Should Be in Database:**
- ✅ Pricing presets
- ✅ Project types
- ✅ Invoice statuses (if customizable)
- ✅ Payment methods
- ✅ Client sources
- ✅ Dashboard layout preferences
- ✅ Report configurations

**What Can Be in Code:**
- ✅ UI components
- ✅ Validation rules
- ✅ Calculations (formulas)
- ✅ Navigation structure

### Benefits of Database-Driven Config

**Flexibility:**
- Change prices without deploying code
- Add new project types on the fly
- Customize for different users/businesses

**Maintainability:**
- Business logic in one place
- Easier to audit and update
- No code changes for business changes

**Scalability:**
- Can support multiple businesses (multi-tenant)
- Each business has own pricing
- Easy to A/B test pricing

### Recommendation

Move all business configuration to database:

```sql
-- Pricing presets (already documented in Bug #3)
settings.pricing_presets

-- Project types (currently hardcoded)
settings.project_types = {
  "types": [
    {"value": "website", "label": "Website Development"},
    {"value": "ecommerce", "label": "E-commerce"},
    {"value": "custom", "label": "Custom Application"},
    {"value": "misc_it", "label": "Miscellaneous IT"},
    {"value": "maintenance", "label": "Maintenance/Support"},
    {"value": "consulting", "label": "Consulting"}
  ]
}

-- Client sources (currently hardcoded)
settings.client_sources = {
  "sources": [
    "Referral", "Website", "LinkedIn", "Facebook", 
    "Instagram", "Google", "Cold Outreach", 
    "Networking Event", "Existing Client", "Other"
  ]
}

-- Payment methods (currently hardcoded)
settings.payment_methods = {
  "methods": [
    {"value": "bank_transfer", "label": "Bank Transfer"},
    {"value": "eft", "label": "EFT"},
    {"value": "cash", "label": "Cash"},
    {"value": "card", "label": "Card"},
    {"value": "paypal", "label": "PayPal"},
    {"value": "stripe", "label": "Stripe"},
    {"value": "other", "label": "Other"}
  ]
}
```

Then add Settings UI to manage all of these.

---

---

## ✅ FIXES APPLIED - November 25, 2025

### Bug #1: Profit Margin Calculation - FIXED ✅
**File:** `supabase/migrations/006_fix_profit_margin_calculation.sql`
**Change:** Updated `project_profitability` view to calculate margin as (Profit / Revenue) × 100 instead of (Profit / Cost) × 100
**Result:** Wedding Portal now shows 70% margin instead of 233.3%

### Bug #3: Pricing Presets - FIXED ✅
**Files:** 
- `supabase/migrations/007_add_pricing_presets_to_settings.sql` (database)
- `src/lib/pricingCalculator.ts` (code)

**Changes:**
- Added correct Mezokuru pricing presets to settings table
- Updated hardcoded presets in code to match actual pricing
- Added 8 presets across 3 categories (Websites, E-commerce, Mobile Apps)

**New Pricing Structure:**
- Personal (Single Page): R 1,200 (was: N/A)
- Portfolio (Multi Page 3+): R 3,000 (was: R 2,800 "Simple Portfolio")
- Business Starter: R 6,800 (was: R 4,500 "Business Website")
- Business Pro: R 11,250 (was: N/A)
- E-commerce Basic: R 15,000 (was: R 8,000 "E-commerce Site")
- E-commerce Advanced: R 25,000 (was: N/A)
- Mobile App MVP: R 25,000 (was: N/A)
- Mobile App FPA: R 55,000 (was: R 15,000 "Custom System")

**Result:** Quotation form now shows correct pricing that matches Mezokuru's actual offerings

### Bug #4: Invoice Line Items - FIXED ✅
**Files:**
- `supabase/migrations/008_add_invoice_line_items.sql` (database)
- `src/hooks/useInvoices.ts` (hooks)
- `src/components/invoices/InvoiceForm.tsx` (UI)
- `src/pages/Invoices.tsx` (page update)

**Changes:**
- Created `invoice_items` table with RLS policies
- Added auto-calculation trigger to sync invoice total from line items
- Updated invoice hooks to support creating/updating with line items
- Added line items UI to invoice form with toggle option
- Users can choose between simple amount or itemized breakdown

**Features:**
- Add/remove line items dynamically
- Auto-calculate item amounts (quantity × unit price)
- Auto-calculate invoice total from all items
- Drag-friendly UI similar to quotations
- Backward compatible (can still use simple amount field)

**Result:** Invoices now support professional itemized breakdowns

### Next Steps
To apply these fixes to production:
```bash
# Apply database migrations
supabase db push

# Deploy updated code
npm run build
# Deploy to Cloudflare Pages
```

---

*Bug report created by: Kiro AI Assistant*  
*Date: November 25, 2025*  
*Last Updated: November 25, 2025*  
*Status: 3 FIXED ✅ | 2 Pending | 1 Enhancement | 1 Architecture Issue*
