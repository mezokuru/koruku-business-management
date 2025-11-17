# Test Execution Guide - Koruku Business Management System

## Pre-Test Setup

### 1. Environment Setup
```bash
# Ensure .env file exists with valid Supabase credentials
cp .env.example .env
# Edit .env with your Supabase URL and anon key
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Database Setup
- Ensure Supabase database has all migrations applied
- Ensure RLS policies are enabled
- Create a test user account if needed

## Test Execution Instructions

### How to Use This Guide
1. Open the application in your browser
2. Follow each test section in order
3. Mark each test as PASS/FAIL in the checklist
4. Document any issues found
5. Take screenshots of critical issues

---

## Section 1: Authentication Testing

### Test 1.1: Login with Valid Credentials
**Steps:**
1. Navigate to `/login`
2. Enter valid email and password
3. Click "Login" button

**Expected Result:**
- Redirected to dashboard
- No error messages
- Session established

**Status:** [ ] PASS [ ] FAIL

---

### Test 1.2: Login with Invalid Credentials
**Steps:**
1. Navigate to `/login`
2. Enter invalid email or password
3. Click "Login" button

**Expected Result:**
- Error message: "Invalid email or password"
- Remains on login page
- No redirect

**Status:** [ ] PASS [ ] FAIL

---

### Test 1.3: Logout Functionality
**Steps:**
1. While logged in, click logout button in sidebar
2. Observe behavior

**Expected Result:**
- Redirected to login page
- Session cleared
- Cannot access protected routes

**Status:** [ ] PASS [ ] FAIL

---

## Section 2: Client Management Testing

### Test 2.1: Create New Client
**Steps:**
1. Navigate to `/clients`
2. Click "Add Client" button
3. Fill in all required fields:
   - Business: "Test Company Ltd"
   - Contact: "John Doe"
   - Email: "john@testcompany.com"
   - Phone: "+27123456789"
4. Click "Save"

**Expected Result:**
- Success toast: "Client added successfully"
- Modal closes
- New client appears in table
- Client data persists after page refresh

**Status:** [ ] PASS [ ] FAIL

---

### Test 2.2: Create Client with Duplicate Email
**Steps:**
1. Try to create another client with same email as Test 2.1
2. Click "Save"

**Expected Result:**
- Error message: "This email already exists"
- Form submission prevented
- Modal remains open

**Status:** [ ] PASS [ ] FAIL

---

### Test 2.3: Update Existing Client
**Steps:**
1. Click edit button on a client row
2. Modify business name to "Updated Company Ltd"
3. Click "Save"

**Expected Result:**
- Success toast: "Client updated successfully"
- Modal closes
- Updated name appears in table
- Changes persist after page refresh

**Status:** [ ] PASS [ ] FAIL

---

### Test 2.4: Delete Client Without Dependencies
**Steps:**
1. Create a new client (no projects/invoices)
2. Click delete button on that client
3. Confirm deletion

**Expected Result:**
- Success toast: "Client deleted successfully"
- Client removed from table
- Deletion persists after page refresh

**Status:** [ ] PASS [ ] FAIL

---

### Test 2.5: Delete Client With Dependencies
**Steps:**
1. Try to delete a client that has projects or invoices
2. Click delete button

**Expected Result:**
- Warning dialog: "Cannot delete client with X active projects and Y invoices. Mark as inactive instead?"
- Deletion prevented
- Client remains in table

**Status:** [ ] PASS [ ] FAIL

---

### Test 2.6: Mark Client as Inactive
**Steps:**
1. Click on a client to view details
2. Toggle "Active" status to inactive
3. Save changes

**Expected Result:**
- Client marked as inactive
- Client no longer appears in active client dropdowns
- Client still visible in clients list with inactive badge

**Status:** [ ] PASS [ ] FAIL

---

### Test 2.7: Search Clients
**Steps:**
1. Enter search term in search box (e.g., "Test")
2. Wait 300ms for debounce
3. Observe filtered results

**Expected Result:**
- Only clients matching search term displayed
- Search works on business name, contact name, and email
- Results update within 300ms
- Case-insensitive search

**Status:** [ ] PASS [ ] FAIL

---

### Test 2.8: Filter Clients by Status
**Steps:**
1. Select "Active" from status filter dropdown
2. Observe results
3. Select "Inactive" from filter
4. Observe results

**Expected Result:**
- Only clients with selected status displayed
- "Clear filters" button appears
- Filter persists during search

**Status:** [ ] PASS [ ] FAIL

---

### Test 2.9: Client Form Validation
**Steps:**
1. Click "Add Client"
2. Try to submit empty form
3. Try invalid email format
4. Try exceeding character limits

**Expected Result:**
- Required field errors display
- Email format validation works
- Character limit validation works
- Submit button disabled when errors exist
- Error messages have proper ARIA attributes

**Status:** [ ] PASS [ ] FAIL

---

## Section 3: Project Management Testing

### Test 3.1: Create New Project
**Steps:**
1. Navigate to `/projects`
2. Click "New Project" button
3. Fill in required fields:
   - Name: "Test Website Project"
   - Client: Select from dropdown
   - Status: "development"
   - Start Date: Today's date
   - Support Months: 6
4. Click "Save"

**Expected Result:**
- Success toast: "Project created successfully"
- Modal closes
- New project appears in table
- Support end date auto-calculated (6 months from start date)

**Status:** [ ] PASS [ ] FAIL

---

### Test 3.2: Auto-Calculate Support End Date
**Steps:**
1. Click "New Project"
2. Enter start date: 2025-01-01
3. Enter support months: 12
4. Observe support end date field

**Expected Result:**
- Support end date automatically calculates to 2026-01-01
- Updates in real-time when start date or support months change

**Status:** [ ] PASS [ ] FAIL

---

### Test 3.3: Client Dropdown Shows Only Active Clients
**Steps:**
1. Mark a client as inactive (from Test 2.6)
2. Open project form
3. Check client dropdown

**Expected Result:**
- Only active clients appear in dropdown
- Inactive clients not selectable
- Existing projects with inactive clients still display client name

**Status:** [ ] PASS [ ] FAIL

---

### Test 3.4: Update Project
**Steps:**
1. Click edit button on a project
2. Change status to "completed"
3. Click "Save"

**Expected Result:**
- Success toast: "Project updated successfully"
- Status badge updates in table
- Changes persist after page refresh

**Status:** [ ] PASS [ ] FAIL

---

### Test 3.5: Delete Project
**Steps:**
1. Click delete button on a project
2. Confirm deletion

**Expected Result:**
- Success toast: "Project deleted successfully"
- Project removed from table
- Deletion persists after page refresh

**Status:** [ ] PASS [ ] FAIL

---

### Test 3.6: Support Expiring Soon Warning
**Steps:**
1. Create or edit a project with support end date within 30 days
2. Observe table display

**Expected Result:**
- Warning icon appears next to project
- Days remaining displayed
- Color coding indicates urgency

**Status:** [ ] PASS [ ] FAIL

---

### Test 3.7: Filter Projects by Status
**Steps:**
1. Select "development" from status filter
2. Observe results
3. Try other status values

**Expected Result:**
- Only projects with selected status displayed
- "Clear filters" button appears
- Filter works correctly for all status values

**Status:** [ ] PASS [ ] FAIL

---

### Test 3.8: Project Form Validation
**Steps:**
1. Click "New Project"
2. Try to submit with empty required fields
3. Try invalid URL formats
4. Try start date more than 30 days in future

**Expected Result:**
- Required field errors display
- URL validation works
- Start date validation works
- Submit button disabled when errors exist

**Status:** [ ] PASS [ ] FAIL

---

## Section 4: Invoice Management Testing

### Test 4.1: Create New Invoice
**Steps:**
1. Navigate to `/invoices`
2. Click "New Invoice" button
3. Observe auto-generated invoice number
4. Fill in required fields:
   - Client: Select from dropdown
   - Project: Select from filtered list
   - Amount: 5000.00
   - Date: Today
   - Due Date: 30 days from today
   - Description: "Website development services"
5. Click "Save"

**Expected Result:**
- Invoice number auto-generated (e.g., MZK-2025-001)
- Success toast: "Invoice created successfully"
- Modal closes
- New invoice appears in table

**Status:** [ ] PASS [ ] FAIL

---

### Test 4.2: Invoice Number Sequential Generation
**Steps:**
1. Create first invoice of the year
2. Note invoice number (e.g., MZK-2025-001)
3. Create second invoice
4. Note invoice number (should be MZK-2025-002)

**Expected Result:**
- Sequential numbering works
- Format: PREFIX-YYYY-XXX
- Numbers padded to 3 digits

**Status:** [ ] PASS [ ] FAIL

---

### Test 4.3: Duplicate Invoice Number Prevention
**Steps:**
1. Try to manually create invoice with existing number
2. Click "Save"

**Expected Result:**
- Error message: "Invoice number already exists. Suggested: [next number]"
- Form submission prevented
- Suggested next available number provided

**Status:** [ ] PASS [ ] FAIL

---

### Test 4.4: Project Dropdown Filtered by Client
**Steps:**
1. Click "New Invoice"
2. Select a client from dropdown
3. Observe project dropdown

**Expected Result:**
- Project dropdown only shows projects for selected client
- Dropdown updates when client changes
- Can create invoice without project (optional field)

**Status:** [ ] PASS [ ] FAIL

---

### Test 4.5: Mark Invoice as Paid
**Steps:**
1. Find an invoice with status "sent"
2. Click "Mark as Paid" button
3. Observe changes

**Expected Result:**
- Success toast: "Invoice marked as paid"
- Status changes to "paid"
- Paid date set to current date
- Status badge updates
- Changes persist after page refresh

**Status:** [ ] PASS [ ] FAIL

---

### Test 4.6: Mark Invoice as Sent
**Steps:**
1. Find an invoice with status "draft"
2. Click "Mark as Sent" button
3. Observe changes

**Expected Result:**
- Success toast: "Invoice marked as sent"
- Status changes to "sent"
- Status badge updates
- Changes persist after page refresh

**Status:** [ ] PASS [ ] FAIL

---

### Test 4.7: Overdue Invoice Detection
**Steps:**
1. Create or edit an invoice with due date in the past
2. Set status to "sent"
3. Observe table display

**Expected Result:**
- Status automatically changes to "overdue"
- Row highlighted in light red
- Overdue badge displayed
- Dashboard overdue count updates

**Status:** [ ] PASS [ ] FAIL

---

### Test 4.8: Filter Invoices by Status
**Steps:**
1. Select "paid" from status filter
2. Observe results
3. Try other status values

**Expected Result:**
- Only invoices with selected status displayed
- "Clear filters" button appears
- Filter works for all status values

**Status:** [ ] PASS [ ] FAIL

---

### Test 4.9: Invoice Form Validation
**Steps:**
1. Click "New Invoice"
2. Try to submit with empty required fields
3. Try amount outside range (0.01-999999.99)
4. Try due date before invoice date
5. Try dates more than 1 year in past/future

**Expected Result:**
- Required field errors display
- Amount validation works
- Date range validation works
- Submit button disabled when errors exist

**Status:** [ ] PASS [ ] FAIL

---

## Section 5: Dashboard Testing

### Test 5.1: Dashboard Stats Accuracy
**Steps:**
1. Navigate to `/` (dashboard)
2. Note all stat card values
3. Manually verify calculations:
   - Total Revenue: Sum of paid invoices for current year
   - Paid Invoices: Count of paid invoices for current year
   - Pending Invoices: Count of sent invoices
   - Overdue Invoices: Count of overdue invoices
   - Outstanding Amount: Sum of unpaid invoices

**Expected Result:**
- All calculations accurate
- Stats update when data changes
- Currency formatting correct

**Status:** [ ] PASS [ ] FAIL

---

### Test 5.2: Recent Invoices Table
**Steps:**
1. Observe recent invoices table on dashboard
2. Verify it shows last 10 invoices
3. Check sorting (most recent first)

**Expected Result:**
- Shows 10 most recent invoices
- Sorted by date descending
- Displays key information (number, client, amount, status)

**Status:** [ ] PASS [ ] FAIL

---

### Test 5.3: Expiring Support Alert
**Steps:**
1. Create project with support ending within 30 days
2. Navigate to dashboard
3. Observe alert banner

**Expected Result:**
- Alert banner displays: "X projects have support ending soon"
- Link to projects page works
- Count accurate
- Banner only shows when applicable

**Status:** [ ] PASS [ ] FAIL

---

### Test 5.4: Dashboard Auto-Refresh
**Steps:**
1. Stay on dashboard for 1+ minute
2. Observe if stats refresh automatically

**Expected Result:**
- Dashboard stats refresh every minute
- No page reload required
- Smooth update without flickering

**Status:** [ ] PASS [ ] FAIL

---

## Section 6: Settings Testing

### Test 6.1: Load Settings
**Steps:**
1. Navigate to `/settings`
2. Observe form fields

**Expected Result:**
- All settings load correctly
- Business information populated
- Invoice settings populated
- Project settings populated

**Status:** [ ] PASS [ ] FAIL

---

### Test 6.2: Update Business Information
**Steps:**
1. Modify business name, email, phone
2. Click "Save Settings"
3. Refresh page

**Expected Result:**
- Success toast: "Settings saved successfully"
- Changes persist after page refresh
- Email validation works

**Status:** [ ] PASS [ ] FAIL

---

### Test 6.3: Update Invoice Settings
**Steps:**
1. Change invoice prefix to "TEST"
2. Change default payment terms to 45
3. Click "Save Settings"
4. Create new invoice

**Expected Result:**
- Settings saved successfully
- New invoices use updated prefix (TEST-YYYY-XXX)
- Default payment terms applied

**Status:** [ ] PASS [ ] FAIL

---

### Test 6.4: Update Project Settings
**Steps:**
1. Change default support months to 12
2. Click "Save Settings"
3. Create new project

**Expected Result:**
- Settings saved successfully
- New projects default to 12 support months

**Status:** [ ] PASS [ ] FAIL

---

### Test 6.5: Data Export
**Steps:**
1. Click "Export Data" button
2. Wait for download
3. Open downloaded JSON file

**Expected Result:**
- File downloads with name: koruku-backup-YYYY-MM-DD.json
- Success toast: "Data exported successfully"
- JSON contains all clients, projects, invoices, settings
- JSON properly formatted with metadata

**Status:** [ ] PASS [ ] FAIL

---

## Section 7: Search and Filter Testing

### Test 7.1: Debounced Search
**Steps:**
1. On any list page, start typing in search box
2. Observe timing of results

**Expected Result:**
- Results appear after 300ms delay
- No search triggered on every keystroke
- Smooth user experience

**Status:** [ ] PASS [ ] FAIL

---

### Test 7.2: Clear Filters Button
**Steps:**
1. Apply any filter
2. Observe "Clear filters" button appears
3. Click button

**Expected Result:**
- Button appears when filters active
- Clicking clears all filters
- Results reset to show all items

**Status:** [ ] PASS [ ] FAIL

---

### Test 7.3: No Results Message
**Steps:**
1. Search for non-existent term
2. Observe message

**Expected Result:**
- Message displays: "No results found for '[query]'. Try a different search term."
- Empty state shown
- Clear instructions provided

**Status:** [ ] PASS [ ] FAIL

---

## Section 8: Table Sorting Testing

### Test 8.1: Sort by Text Column
**Steps:**
1. Click on a text column header (e.g., Business Name)
2. Observe sorting
3. Click again

**Expected Result:**
- First click: Ascending order (A-Z)
- Second click: Descending order (Z-A)
- Sort indicator shows direction
- Data sorted correctly

**Status:** [ ] PASS [ ] FAIL

---

### Test 8.2: Sort by Date Column
**Steps:**
1. Click on a date column header
2. Observe sorting
3. Click again

**Expected Result:**
- First click: Ascending (oldest first)
- Second click: Descending (newest first)
- Dates sorted correctly
- Sort indicator shows direction

**Status:** [ ] PASS [ ] FAIL

---

### Test 8.3: Sort by Number Column
**Steps:**
1. Click on a number column header (e.g., Amount)
2. Observe sorting
3. Click again

**Expected Result:**
- First click: Ascending (lowest first)
- Second click: Descending (highest first)
- Numbers sorted correctly
- Sort indicator shows direction

**Status:** [ ] PASS [ ] FAIL

---

## Section 9: Modal Testing

### Test 9.1: Modal Opens
**Steps:**
1. Click any button that opens a modal
2. Observe modal behavior

**Expected Result:**
- Modal opens smoothly
- Backdrop appears
- Focus moves to modal
- Page content behind modal not scrollable

**Status:** [ ] PASS [ ] FAIL

---

### Test 9.2: Modal Closes on Backdrop Click
**Steps:**
1. Open any modal
2. Click on backdrop (outside modal)

**Expected Result:**
- Modal closes
- Focus returns to trigger element
- No data loss if form not submitted

**Status:** [ ] PASS [ ] FAIL

---

### Test 9.3: Modal Closes on ESC Key
**Steps:**
1. Open any modal
2. Press ESC key

**Expected Result:**
- Modal closes
- Focus returns to trigger element
- No data loss if form not submitted

**Status:** [ ] PASS [ ] FAIL

---

### Test 9.4: Modal Focus Trap
**Steps:**
1. Open any modal
2. Press Tab key repeatedly
3. Try to tab outside modal

**Expected Result:**
- Focus stays within modal
- Tab cycles through modal elements
- Cannot tab to page content behind modal

**Status:** [ ] PASS [ ] FAIL

---

## Section 10: Error Handling Testing

### Test 10.1: Network Error Handling
**Steps:**
1. Disconnect internet
2. Try to perform any data operation
3. Observe error handling

**Expected Result:**
- Offline banner displays
- Toast notification: "Connection lost. Please check your internet."
- Retry button available
- Data-modifying actions disabled

**Status:** [ ] PASS [ ] FAIL

---

### Test 10.2: Network Recovery
**Steps:**
1. While offline, reconnect internet
2. Observe behavior

**Expected Result:**
- Offline banner disappears
- Can perform operations again
- Pending operations retry automatically

**Status:** [ ] PASS [ ] FAIL

---

### Test 10.3: Form Validation Errors
**Steps:**
1. Submit form with invalid data
2. Observe error messages

**Expected Result:**
- Error messages display below fields
- Error messages have aria-invalid attribute
- Error messages have aria-describedby linking
- Screen readers announce errors

**Status:** [ ] PASS [ ] FAIL

---

### Test 10.4: Database Constraint Errors
**Steps:**
1. Try to create duplicate email
2. Observe error message

**Expected Result:**
- User-friendly error message
- No technical details exposed
- Clear guidance on how to fix

**Status:** [ ] PASS [ ] FAIL

---

## Section 11: Responsive Design Testing

### Test 11.1: Mobile View (<768px)
**Steps:**
1. Resize browser to mobile width (e.g., 375px)
2. Test all pages

**Expected Result:**
- Sidebar collapses to hamburger menu
- Hamburger menu opens/closes correctly
- Tables scroll horizontally
- Modals are full-width
- All touch targets ≥ 44x44px
- Forms usable on mobile

**Status:** [ ] PASS [ ] FAIL

---

### Test 11.2: Tablet View (768px-1024px)
**Steps:**
1. Resize browser to tablet width (e.g., 768px)
2. Test all pages

**Expected Result:**
- Layout adjusts appropriately
- All features accessible
- Touch targets adequate
- Good use of space

**Status:** [ ] PASS [ ] FAIL

---

### Test 11.3: Desktop View (>1024px)
**Steps:**
1. View on desktop resolution (e.g., 1920px)
2. Test all pages

**Expected Result:**
- Sidebar fixed and visible
- Modals are fixed-width (not full screen)
- All features accessible
- Good use of space

**Status:** [ ] PASS [ ] FAIL

---

### Test 11.4: Window Resize
**Steps:**
1. Resize browser window from mobile to desktop and back
2. Observe layout adjustments

**Expected Result:**
- Layout adjusts smoothly
- No page refresh required
- No broken layouts
- Responsive breakpoints work correctly

**Status:** [ ] PASS [ ] FAIL

---

## Section 12: Keyboard Navigation Testing

### Test 12.1: Tab Navigation
**Steps:**
1. Use only Tab key to navigate through page
2. Observe focus order

**Expected Result:**
- Focus moves through interactive elements
- Logical order (left-to-right, top-to-bottom)
- All interactive elements reachable
- Focus visible (2px gold outline)

**Status:** [ ] PASS [ ] FAIL

---

### Test 12.2: Shift+Tab Navigation
**Steps:**
1. Use Shift+Tab to navigate backward
2. Observe focus order

**Expected Result:**
- Focus moves backward through elements
- Reverse of Tab order
- All elements reachable

**Status:** [ ] PASS [ ] FAIL

---

### Test 12.3: Enter Key Activation
**Steps:**
1. Tab to a button
2. Press Enter key

**Expected Result:**
- Button activates
- Same behavior as mouse click
- Form submits when on submit button

**Status:** [ ] PASS [ ] FAIL

---

### Test 12.4: ESC Key Functionality
**Steps:**
1. Open modal
2. Press ESC key
3. Try in search fields

**Expected Result:**
- Modals close on ESC
- Focus returns to trigger
- Search clears on ESC (if implemented)

**Status:** [ ] PASS [ ] FAIL

---

### Test 12.5: Focus Indicators
**Steps:**
1. Tab through all interactive elements
2. Observe focus indicators

**Expected Result:**
- All elements have visible focus indicator
- 2px gold outline
- High contrast
- Clearly visible

**Status:** [ ] PASS [ ] FAIL

---

## Section 13: Accessibility Testing

### Test 13.1: Screen Reader Compatibility
**Steps:**
1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate through application
3. Test all major features

**Expected Result:**
- All interactive elements have labels
- Form errors announced
- Dynamic content updates announced
- Status messages announced
- Logical reading order

**Status:** [ ] PASS [ ] FAIL

---

### Test 13.2: ARIA Attributes
**Steps:**
1. Inspect form fields with errors
2. Check modal elements
3. Check live regions

**Expected Result:**
- Form fields have aria-required
- Error fields have aria-invalid
- Error messages have aria-describedby
- Modals have role="dialog" and aria-modal="true"
- Live regions have aria-live and aria-atomic

**Status:** [ ] PASS [ ] FAIL

---

### Test 13.3: Color Contrast
**Steps:**
1. Use browser extension or tool to check contrast
2. Test all text elements
3. Test UI components

**Expected Result:**
- Text contrast ≥ 4.5:1
- UI component contrast ≥ 3:1
- Meets WCAG AA standards
- Status indicators have text/icon (not just color)

**Status:** [ ] PASS [ ] FAIL

---

### Test 13.4: Semantic HTML
**Steps:**
1. Inspect page structure
2. Check for proper HTML elements

**Expected Result:**
- nav elements have aria-label
- main element present
- Headings in logical order (h1, h2, h3)
- Tables have caption or aria-label
- Buttons are <button> elements
- Links are <a> elements

**Status:** [ ] PASS [ ] FAIL

---

## Section 14: Performance Testing

### Test 14.1: Initial Load Time
**Steps:**
1. Clear browser cache
2. Open application
3. Measure time to interactive

**Expected Result:**
- Initial load < 2 seconds
- Content visible quickly
- No long loading states

**Status:** [ ] PASS [ ] FAIL
**Actual Time:** _____ seconds

---

### Test 14.2: Page Navigation Speed
**Steps:**
1. Navigate between pages
2. Measure navigation time

**Expected Result:**
- Page navigation < 500ms
- Smooth transitions
- No flickering

**Status:** [ ] PASS [ ] FAIL
**Actual Time:** _____ ms

---

### Test 14.3: Search Response Time
**Steps:**
1. Enter search term
2. Measure time to results

**Expected Result:**
- Search results < 300ms
- Debounced properly
- Smooth user experience

**Status:** [ ] PASS [ ] FAIL
**Actual Time:** _____ ms

---

### Test 14.4: Bundle Size
**Steps:**
1. Check build output
2. Calculate total gzipped size

**Expected Result:**
- Total bundle < 500KB gzipped
- Code splitting working
- Vendor chunks separated

**Status:** [ ] PASS [ ] FAIL
**Actual Size:** _____ KB

---

### Test 14.5: Lighthouse Audit
**Steps:**
1. Open Chrome DevTools
2. Run Lighthouse audit
3. Check all categories

**Expected Result:**
- Performance score > 90
- Accessibility score > 90
- Best Practices score > 90
- SEO score > 90

**Status:** [ ] PASS [ ] FAIL
**Scores:** P:___ A:___ BP:___ SEO:___

---

## Section 15: Browser Compatibility Testing

### Test 15.1: Chrome
**Steps:**
1. Test all features in Chrome
2. Check console for errors

**Expected Result:**
- All features work
- No console errors
- Performance acceptable

**Status:** [ ] PASS [ ] FAIL
**Version:** _____

---

### Test 15.2: Firefox
**Steps:**
1. Test all features in Firefox
2. Check console for errors

**Expected Result:**
- All features work
- No console errors
- Performance acceptable

**Status:** [ ] PASS [ ] FAIL
**Version:** _____

---

### Test 15.3: Safari
**Steps:**
1. Test all features in Safari
2. Check console for errors

**Expected Result:**
- All features work
- No console errors
- Performance acceptable

**Status:** [ ] PASS [ ] FAIL
**Version:** _____

---

### Test 15.4: Edge
**Steps:**
1. Test all features in Edge
2. Check console for errors

**Expected Result:**
- All features work
- No console errors
- Performance acceptable

**Status:** [ ] PASS [ ] FAIL
**Version:** _____

---

## Test Summary

### Overall Statistics
- **Total Tests:** 100+
- **Tests Passed:** _____
- **Tests Failed:** _____
- **Tests Blocked:** _____
- **Pass Rate:** _____%

### Critical Issues Found
1. [Issue description]
   - Severity: Critical/High/Medium/Low
   - Affected Feature: _____
   - Steps to Reproduce: _____
   - Expected vs Actual: _____

### Recommendations
1. [Recommendation based on test results]
2. [Recommendation based on test results]
3. [Recommendation based on test results]

### Sign-off
- **Tester Name:** _____
- **Test Date:** _____
- **Environment:** Development/Staging/Production
- **Build Version:** _____
- **Ready for Production:** YES / NO

---

## Notes
- This guide covers manual testing only
- Automated tests should be added for regression testing
- Performance metrics may vary based on network and hardware
- Some tests require Supabase database access
- Browser versions should be latest stable releases
