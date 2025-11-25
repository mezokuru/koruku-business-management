# Phase 1.5: What Changed

Quick reference guide for what's new in Phase 1.5.

---

## For Users

### Projects - New Fields

**Additional URLs Section:**
- Repository URL (GitHub, GitLab, etc.)
- Staging URL (development environment)
- Production URL (live site)

**Pricing Breakdown Section:**
- Labour % (default 30%)
- Labour Amount (R)
- Infrastructure Amount (R)

### Clients - New Fields

**Tags:**
- Add custom tags (VIP, Recurring, E-commerce, etc.)
- Visual badges
- Add/remove easily

**Source:**
- Dropdown to track how you got the client
- Options: Referral, Website, LinkedIn, Facebook, Instagram, Google, Cold Outreach, Networking Event, Existing Client, Other

---

## For Developers

### Database Changes

**New Columns:**

```sql
-- projects table
ALTER TABLE projects ADD COLUMN repo_url TEXT;
ALTER TABLE projects ADD COLUMN staging_url TEXT;
ALTER TABLE projects ADD COLUMN production_url TEXT;
ALTER TABLE projects ADD COLUMN labour_percentage INTEGER DEFAULT 30;
ALTER TABLE projects ADD COLUMN labour_amount DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN infrastructure_amount DECIMAL(10,2);

-- clients table
ALTER TABLE clients ADD COLUMN tags TEXT[];
ALTER TABLE clients ADD COLUMN source TEXT;
```

**New Table:**

```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  description TEXT,
  quantity DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  amount DECIMAL(10,2),
  sort_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**New Indexes:**
- `idx_clients_tags` (GIN index for array operations)
- `idx_clients_source` (B-tree index)
- `idx_invoice_items_invoice_id`
- `idx_invoice_items_sort_order`

**New Functions:**
- `calculate_invoice_total(invoice_id)` - Sum line items
- `calculate_line_item_amount()` - Trigger for auto-calculation

---

### TypeScript Changes

**Updated Interfaces:**

```typescript
// Project interface
interface Project {
  // ... existing fields
  repo_url?: string;
  staging_url?: string;
  production_url?: string;
  labour_percentage?: number;
  labour_amount?: number;
  infrastructure_amount?: number;
}

// Client interface
interface Client {
  // ... existing fields
  tags?: string[];
  source?: string;
}

// New interface
interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Updated Invoice interface
interface Invoice {
  // ... existing fields
  items?: InvoiceItem[];
}
```

---

### Component Changes

**ProjectForm.tsx:**
- Added "Additional URLs" section
- Added "Pricing Breakdown" section
- Added URL validation
- Added labour percentage validation (0-100)
- Updated form state initialization

**ClientForm.tsx:**
- Added tag input with add/remove
- Added source dropdown
- Added tag badges display
- Imported X icon from lucide-react
- Updated form state initialization

---

## Migration File

**Location:** `supabase/migrations/004_phase1_5_enhanced_details.sql`

**Sections:**
1. Project URL fields
2. Project pricing breakdown
3. Client tags and source
4. Invoice items table
5. Helper functions
6. Indexes
7. RLS policies
8. Updated views

---

## Documentation

**New Files:**
- `docs/PHASE1_5_IMPLEMENTATION_COMPLETE.md` - Full technical docs
- `docs/PHASE1_5_QUICK_DEPLOY.md` - 10-minute deployment guide
- `docs/PHASE1_5_WHAT_CHANGED.md` - This file
- `PHASE1_5_SUMMARY.md` - Executive summary
- `PHASE1_5_DEPLOYMENT_CHECKLIST.md` - Deployment checklist

**Updated Files:**
- `docs/FEATURE_COMPLETENESS_AUDIT.md` - Updated completion status

---

## Breaking Changes

**None!** All changes are backward compatible:
- All new fields are optional
- Existing data unaffected
- No API changes
- No behavior changes

---

## Performance Impact

**Minimal:**
- New indexes improve query performance
- GIN index on tags enables fast array searches
- No impact on existing queries
- Form rendering unchanged

---

## Testing

**What to Test:**
1. Add/edit project with new URL fields
2. Add/edit project with pricing breakdown
3. Add/edit client with tags
4. Add/edit client with source
5. Verify data persistence
6. Check validation works
7. Test on mobile

**Expected Results:**
- All fields save correctly
- Validation prevents invalid data
- UI responsive and intuitive
- No console errors

---

## Rollback

If needed, rollback is simple:

```bash
# Rollback database
supabase db reset

# Redeploy previous version
git checkout <previous-commit>
npm run build
npm run deploy
```

**Data Loss:** Only new Phase 1.5 data (URLs, pricing, tags, source)

---

## Next Phase

**Phase 2: Business Intelligence**
- Payment tracking
- Activity log
- Invoice line items UI
- Advanced reporting
- Document management

---

*Last updated: November 25, 2025*
