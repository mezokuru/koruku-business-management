# Keyboard Navigation Testing Guide

This guide helps you test the keyboard accessibility features of the Koruku Business Management System.

## Prerequisites
- Close all mouse/trackpad input
- Use only keyboard for navigation
- Test in Chrome, Firefox, and Edge browsers

## Test Scenarios

### 1. Login Page
**Steps:**
1. Load the login page
2. Press `Tab` - Focus should move to email field
3. Type email address
4. Press `Tab` - Focus should move to password field
5. Type password
6. Press `Tab` - Focus should move to "Sign in" button
7. Press `Enter` or `Space` - Should submit form

**Expected:**
- ✓ Visible gold outline (2px) on focused elements
- ✓ Logical tab order: email → password → button
- ✓ Form submits on Enter/Space

### 2. Skip to Main Content
**Steps:**
1. After login, press `Tab` immediately
2. First focus should be on "Skip to main content" link
3. Press `Enter` - Focus should jump to main content area

**Expected:**
- ✓ Skip link appears on focus
- ✓ Pressing Enter skips navigation
- ✓ Focus moves to main content

### 3. Sidebar Navigation
**Steps:**
1. Press `Tab` to reach hamburger menu (mobile) or first nav item
2. Press `Tab` through all navigation items
3. Press `Enter` or `Space` on a nav item to navigate
4. Press `Tab` to reach logout button
5. On mobile: Press `Escape` to close sidebar

**Expected:**
- ✓ All nav items receive focus with visible indicator
- ✓ Enter/Space activates navigation
- ✓ Current page indicated to screen readers
- ✓ Escape closes mobile menu

### 4. Dashboard Interactions
**Steps:**
1. Tab through quick action buttons (New Invoice, New Client, New Project)
2. Press `Enter` on "New Invoice" button
3. Modal should open with focus inside
4. Press `Escape` - Modal should close
5. Focus should return to "New Invoice" button

**Expected:**
- ✓ All buttons receive focus
- ✓ Modal opens on Enter/Space
- ✓ Focus trapped inside modal
- ✓ Escape closes modal
- ✓ Focus returns to trigger button

### 5. Table Sorting
**Steps:**
1. Navigate to Invoices page
2. Tab to table header (e.g., "Invoice #")
3. Press `Enter` or `Space` - Table should sort ascending
4. Press `Enter` or `Space` again - Table should sort descending

**Expected:**
- ✓ Table headers are keyboard accessible
- ✓ Enter/Space triggers sort
- ✓ Sort direction announced to screen readers
- ✓ Visual indicator shows sort direction

### 6. Form Interactions
**Steps:**
1. Open "New Client" modal
2. Tab through all form fields
3. Skip a required field and tab to next field
4. Error message should appear
5. Tab to submit button
6. Press `Enter` - Form should validate

**Expected:**
- ✓ All form fields receive focus
- ✓ Required fields marked with asterisk
- ✓ Error messages appear on blur
- ✓ Errors announced to screen readers
- ✓ Submit button disabled until form valid

### 7. Modal Focus Trap
**Steps:**
1. Open any modal (e.g., New Client)
2. Tab through all elements in modal
3. After last element, Tab should cycle to first element
4. Shift+Tab should cycle backwards
5. Press Escape to close

**Expected:**
- ✓ Focus stays within modal
- ✓ Tab cycles forward through modal elements
- ✓ Shift+Tab cycles backward
- ✓ Cannot tab to elements behind modal
- ✓ Escape closes modal

### 8. Search and Filter
**Steps:**
1. Navigate to Clients page
2. Tab to search input
3. Type search query
4. Results should filter automatically
5. Tab to filter dropdown
6. Use arrow keys to select option

**Expected:**
- ✓ Search input receives focus
- ✓ Results update as you type
- ✓ Filter dropdown keyboard accessible
- ✓ Arrow keys navigate options

### 9. Action Buttons in Tables
**Steps:**
1. Navigate to any list page (Clients, Projects, Invoices)
2. Tab through table rows
3. Tab to action buttons (Edit, Delete, View)
4. Press `Enter` to activate

**Expected:**
- ✓ Action buttons receive focus
- ✓ Focus indicator visible
- ✓ Enter/Space activates button
- ✓ Button purpose clear from label

### 10. Settings Page
**Steps:**
1. Navigate to Settings page
2. Tab through all form sections
3. Modify a setting
4. Tab to "Save Settings" button
5. Press `Enter` to save
6. Tab to "Export Data" button
7. Press `Enter` to export

**Expected:**
- ✓ All form fields accessible
- ✓ Save button receives focus
- ✓ Success message announced
- ✓ Export button accessible

## Common Issues to Check

### Focus Indicators
- [ ] All interactive elements have visible focus indicator
- [ ] Focus indicator is at least 2px thick
- [ ] Focus indicator color (#ffd166) is visible against all backgrounds
- [ ] Focus indicator doesn't get cut off by overflow

### Tab Order
- [ ] Tab order follows visual layout (left-to-right, top-to-bottom)
- [ ] No focus traps (except intentional modal traps)
- [ ] Hidden elements don't receive focus
- [ ] Disabled elements don't receive focus

### Keyboard Shortcuts
- [ ] Enter activates buttons and links
- [ ] Space activates buttons
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys work in dropdowns and selects

### Screen Reader Announcements
- [ ] Form errors announced when they appear
- [ ] Loading states announced
- [ ] Success/error messages announced
- [ ] Dynamic content changes announced

## Browser-Specific Notes

### Chrome/Edge
- Use F12 DevTools → Accessibility tab to inspect ARIA attributes
- Use Lighthouse audit for accessibility score

### Firefox
- Use F12 DevTools → Accessibility tab
- Better support for some ARIA features

### Safari
- Use VoiceOver (Cmd+F5) for screen reader testing
- Check iOS Safari on actual device

## Automated Testing Tools

1. **axe DevTools** (Browser Extension)
   - Install from Chrome/Firefox store
   - Run automated accessibility scan
   - Fix any issues found

2. **Lighthouse** (Chrome DevTools)
   - Open DevTools → Lighthouse tab
   - Run accessibility audit
   - Aim for score > 90

3. **WAVE** (Browser Extension)
   - Install from Chrome/Firefox store
   - Visualize accessibility issues
   - Check color contrast

## Pass Criteria

All tests should pass with:
- ✓ No keyboard traps (except modal focus traps)
- ✓ All interactive elements keyboard accessible
- ✓ Visible focus indicators on all elements
- ✓ Logical tab order throughout application
- ✓ Escape key closes modals
- ✓ Enter/Space activates buttons
- ✓ Screen reader announcements for dynamic content

## Reporting Issues

If you find any keyboard navigation issues:
1. Document the specific page/component
2. Note the expected vs actual behavior
3. Include browser and OS information
4. Take screenshots if helpful
5. Report to development team
