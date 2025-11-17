# Quick Test Guide

## 🚀 Quick Start

### Run All Automated Checks
```bash
# 1. Build the application
npm run build

# 2. Run build verification
node verify-build.js

# 3. Check for linting issues
npm run lint
```

### Start Manual Testing
```bash
# 1. Start development server
npm run dev

# 2. Open browser to http://localhost:5173

# 3. Follow TEST_EXECUTION_GUIDE.md
```

---

## 📋 Test Documents

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **TESTING_CHECKLIST.md** | High-level checklist | Quick overview of test coverage |
| **TEST_EXECUTION_GUIDE.md** | Detailed test steps | Comprehensive manual testing |
| **verify-build.js** | Automated verification | Before deployment |
| **FINAL_TEST_SUMMARY.md** | Test results summary | Review test status |

---

## ✅ Pre-Deployment Checklist

### 1. Automated Tests
- [ ] `npm run build` succeeds
- [ ] `node verify-build.js` passes all checks
- [ ] `npm run lint` shows 0 errors

### 2. Manual Tests (Critical)
- [ ] Login/logout works
- [ ] Can create client
- [ ] Can create project
- [ ] Can create invoice
- [ ] Dashboard shows correct stats
- [ ] Settings save correctly
- [ ] Data export works

### 3. Browser Tests
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

### 4. Device Tests
- [ ] Works on mobile (<768px)
- [ ] Works on tablet (768-1024px)
- [ ] Works on desktop (>1024px)

### 5. Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast passes
- [ ] Focus indicators visible

### 6. Performance Tests
- [ ] Initial load < 2 seconds
- [ ] Page navigation < 500ms
- [ ] Search results < 300ms
- [ ] Lighthouse score > 90

---

## 🐛 Common Issues and Solutions

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Linting Errors
```bash
# Run linter with auto-fix
npm run lint -- --fix
```

### Environment Issues
```bash
# Check .env file exists
cat .env

# If missing, copy from example
cp .env.example .env
# Then edit .env with your Supabase credentials
```

### Port Already in Use
```bash
# Kill process on port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

---

## 📊 Test Results Interpretation

### Build Verification Results
- **8/8 Passed** = ✅ Ready for deployment
- **7/8 Passed** = ⚠️ Review warnings, may proceed
- **<7/8 Passed** = ❌ Fix issues before deployment

### Bundle Size
- **< 500KB gzipped** = ✅ Excellent
- **500-750KB gzipped** = ⚠️ Acceptable but optimize
- **> 750KB gzipped** = ❌ Too large, must optimize

### Lighthouse Scores
- **90-100** = ✅ Excellent
- **70-89** = ⚠️ Good but can improve
- **< 70** = ❌ Needs improvement

---

## 🔧 Quick Fixes

### Fix ESLint Warnings
Most warnings are non-critical. To fix unused variables:
```typescript
// Before
const { data, error } = useQuery();

// After (if error not used)
const { data } = useQuery();
```

### Fix TypeScript Any Types
```typescript
// Before
const handleChange = (e: any) => { ... }

// After
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
```

### Fix Missing Dependencies
```typescript
// Before
useEffect(() => {
  doSomething(value);
}, []); // Missing 'value' dependency

// After
useEffect(() => {
  doSomething(value);
}, [value]); // Added dependency
```

---

## 📱 Device Testing Tips

### Test on Real Devices
1. Get local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Start dev server: `npm run dev`
3. On mobile, visit: `http://YOUR_IP:5173`

### Simulate Devices in Browser
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device from dropdown
4. Test responsive behavior

---

## 🎯 Focus Areas for Manual Testing

### High Priority
1. **Authentication** - Must work perfectly
2. **CRUD Operations** - Core functionality
3. **Data Persistence** - Changes must save
4. **Error Handling** - Graceful failures

### Medium Priority
1. **Search/Filter** - User convenience
2. **Sorting** - Data organization
3. **Validation** - Data quality
4. **Responsive Design** - Multi-device support

### Low Priority
1. **Animations** - Polish
2. **Toast Timing** - UX refinement
3. **Empty States** - Edge cases
4. **Loading States** - Visual feedback

---

## 📞 Getting Help

### Documentation
- **Requirements:** `.kiro/specs/koruku-business-management/requirements.md`
- **Design:** `.kiro/specs/koruku-business-management/design.md`
- **Tasks:** `.kiro/specs/koruku-business-management/tasks.md`

### Test Guides
- **Checklist:** `TESTING_CHECKLIST.md`
- **Detailed Guide:** `TEST_EXECUTION_GUIDE.md`
- **Summary:** `FINAL_TEST_SUMMARY.md`

### Troubleshooting
1. Check console for errors (F12)
2. Check network tab for failed requests
3. Check Supabase dashboard for database issues
4. Review error logs in browser

---

## 🎉 Success Criteria

The application is ready for deployment when:

✅ All automated checks pass  
✅ All critical manual tests pass  
✅ Works in all major browsers  
✅ Works on mobile, tablet, desktop  
✅ Keyboard navigation works  
✅ No console errors  
✅ Performance targets met  
✅ Accessibility standards met  

---

**Last Updated:** November 17, 2025  
**Version:** 1.0.0  
**Status:** Testing Phase Complete
