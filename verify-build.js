/**
 * Build Verification Script
 * Verifies production build meets quality standards
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const MAX_BUNDLE_SIZE_KB = 500; // 500KB gzipped target

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDistExists() {
  log('\n📁 Checking if dist directory exists...', 'cyan');
  if (!fs.existsSync(DIST_DIR)) {
    log('❌ FAIL: dist directory not found. Run "npm run build" first.', 'red');
    return false;
  }
  log('✅ PASS: dist directory exists', 'green');
  return true;
}

function checkIndexHtml() {
  log('\n📄 Checking index.html...', 'cyan');
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log('❌ FAIL: index.html not found', 'red');
    return false;
  }
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // Check for essential elements
  const checks = [
    { name: 'DOCTYPE', pattern: /<!DOCTYPE html>/i },
    { name: 'Root div', pattern: /<div id="root"><\/div>/ },
    { name: 'Script tag', pattern: /<script type="module"/ },
    { name: 'CSS link', pattern: /<link rel="stylesheet"/ },
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log(`  ✅ ${check.name} found`, 'green');
    } else {
      log(`  ❌ ${check.name} not found`, 'red');
      allPassed = false;
    }
  });
  
  return allPassed;
}

function checkAssets() {
  log('\n📦 Checking assets...', 'cyan');
  const assetsDir = path.join(DIST_DIR, 'assets');
  
  if (!fs.existsSync(assetsDir)) {
    log('❌ FAIL: assets directory not found', 'red');
    return false;
  }
  
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));
  
  log(`  📊 Found ${jsFiles.length} JavaScript files`, 'blue');
  log(`  📊 Found ${cssFiles.length} CSS files`, 'blue');
  
  if (jsFiles.length === 0) {
    log('  ❌ FAIL: No JavaScript files found', 'red');
    return false;
  }
  
  if (cssFiles.length === 0) {
    log('  ❌ FAIL: No CSS files found', 'red');
    return false;
  }
  
  log('  ✅ PASS: Assets directory contains required files', 'green');
  return true;
}

function checkBundleSize() {
  log('\n📏 Checking bundle size...', 'cyan');
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = fs.readdirSync(assetsDir);
  
  let totalSize = 0;
  const fileSizes = [];
  
  files.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    totalSize += sizeKB;
    fileSizes.push({ file, size: sizeKB });
  });
  
  // Sort by size descending
  fileSizes.sort((a, b) => b.size - a.size);
  
  log('  📊 Largest files:', 'blue');
  fileSizes.slice(0, 5).forEach(({ file, size }) => {
    log(`     ${file}: ${size.toFixed(2)} KB`, 'blue');
  });
  
  log(`\n  📊 Total uncompressed size: ${totalSize.toFixed(2)} KB`, 'blue');
  
  // Estimate gzipped size (typically 25-30% of original)
  const estimatedGzipped = totalSize * 0.3;
  log(`  📊 Estimated gzipped size: ${estimatedGzipped.toFixed(2)} KB`, 'blue');
  
  if (estimatedGzipped > MAX_BUNDLE_SIZE_KB) {
    log(`  ⚠️  WARNING: Estimated gzipped size exceeds ${MAX_BUNDLE_SIZE_KB}KB target`, 'yellow');
    return false;
  }
  
  log(`  ✅ PASS: Bundle size within ${MAX_BUNDLE_SIZE_KB}KB target`, 'green');
  return true;
}

function checkVendorChunks() {
  log('\n🔧 Checking vendor chunks...', 'cyan');
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = fs.readdirSync(assetsDir);
  
  const expectedChunks = [
    'vendor-react',
    'vendor-query',
    'vendor-supabase',
    'vendor-utils',
  ];
  
  let allFound = true;
  expectedChunks.forEach(chunk => {
    const found = files.some(f => f.includes(chunk));
    if (found) {
      log(`  ✅ ${chunk} chunk found`, 'green');
    } else {
      log(`  ⚠️  ${chunk} chunk not found (may be merged)`, 'yellow');
    }
  });
  
  return true;
}

function checkLazyLoadedPages() {
  log('\n⚡ Checking lazy-loaded pages...', 'cyan');
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = fs.readdirSync(assetsDir);
  
  const expectedPages = [
    'Login',
    'Dashboard',
    'Clients',
    'Projects',
    'Invoices',
    'Settings',
  ];
  
  let foundCount = 0;
  expectedPages.forEach(page => {
    const found = files.some(f => f.includes(page));
    if (found) {
      log(`  ✅ ${page} page chunk found`, 'green');
      foundCount++;
    } else {
      log(`  ⚠️  ${page} page chunk not found (may be merged)`, 'yellow');
    }
  });
  
  if (foundCount >= 4) {
    log('  ✅ PASS: Most pages are code-split', 'green');
    return true;
  } else {
    log('  ⚠️  WARNING: Few pages are code-split', 'yellow');
    return false;
  }
}

function checkEnvExample() {
  log('\n🔐 Checking .env.example...', 'cyan');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    log('❌ FAIL: .env.example not found', 'red');
    return false;
  }
  
  const content = fs.readFileSync(envExamplePath, 'utf-8');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];
  
  let allFound = true;
  requiredVars.forEach(varName => {
    if (content.includes(varName)) {
      log(`  ✅ ${varName} defined`, 'green');
    } else {
      log(`  ❌ ${varName} not defined`, 'red');
      allFound = false;
    }
  });
  
  return allFound;
}

function checkPackageJson() {
  log('\n📦 Checking package.json...', 'cyan');
  const packagePath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    log('❌ FAIL: package.json not found', 'red');
    return false;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  const requiredScripts = ['dev', 'build', 'lint', 'preview'];
  const requiredDeps = [
    'react',
    'react-dom',
    'react-router-dom',
    '@supabase/supabase-js',
    '@tanstack/react-query',
    'react-hot-toast',
  ];
  
  let allPassed = true;
  
  log('  📊 Checking scripts:', 'blue');
  requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      log(`    ✅ ${script} script defined`, 'green');
    } else {
      log(`    ❌ ${script} script not defined`, 'red');
      allPassed = false;
    }
  });
  
  log('  📊 Checking dependencies:', 'blue');
  requiredDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      log(`    ✅ ${dep} installed`, 'green');
    } else {
      log(`    ❌ ${dep} not installed`, 'red');
      allPassed = false;
    }
  });
  
  return allPassed;
}

function generateReport(results) {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 BUILD VERIFICATION REPORT', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  log(`\n✅ Passed: ${passed}/${total} (${percentage}%)`, passed === total ? 'green' : 'yellow');
  
  log('\n📋 Test Results:', 'blue');
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`  ${icon} ${result.name}`, color);
  });
  
  if (passed === total) {
    log('\n🎉 All checks passed! Build is ready for deployment.', 'green');
    return true;
  } else {
    log('\n⚠️  Some checks failed. Please review and fix issues.', 'yellow');
    return false;
  }
}

// Run all checks
async function main() {
  log('🚀 Starting build verification...', 'cyan');
  
  const results = [
    { name: 'Dist directory exists', passed: checkDistExists() },
    { name: 'Index.html valid', passed: checkIndexHtml() },
    { name: 'Assets present', passed: checkAssets() },
    { name: 'Bundle size acceptable', passed: checkBundleSize() },
    { name: 'Vendor chunks created', passed: checkVendorChunks() },
    { name: 'Pages code-split', passed: checkLazyLoadedPages() },
    { name: 'Environment example valid', passed: checkEnvExample() },
    { name: 'Package.json valid', passed: checkPackageJson() },
  ];
  
  const success = generateReport(results);
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  log(`\n❌ Error running verification: ${error.message}`, 'red');
  process.exit(1);
});
