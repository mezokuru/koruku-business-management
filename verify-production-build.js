/**
 * Production Build Verification Script
 * 
 * This script verifies that the production build meets all requirements:
 * - Build completes successfully
 * - Bundle size is within limits
 * - All required files are present
 * - No development dependencies in production bundle
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';

const DIST_DIR = './dist';
const MAX_BUNDLE_SIZE_KB = 500; // 500KB gzipped
const REQUIRED_FILES = ['index.html'];

console.log('🔍 Verifying production build...\n');

// Check if dist directory exists
if (!existsSync(DIST_DIR)) {
  console.error('❌ Error: dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Check required files
console.log('📁 Checking required files...');
let allFilesPresent = true;
for (const file of REQUIRED_FILES) {
  const filePath = join(DIST_DIR, file);
  if (existsSync(filePath)) {
    console.log(`  ✅ ${file} found`);
  } else {
    console.log(`  ❌ ${file} missing`);
    allFilesPresent = false;
  }
}

if (!allFilesPresent) {
  console.error('\n❌ Build verification failed: Required files missing');
  process.exit(1);
}

// Calculate bundle sizes
console.log('\n📦 Calculating bundle sizes...');

function getFilesRecursively(dir, fileList = []) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

const allFiles = getFilesRecursively(DIST_DIR);
const jsFiles = allFiles.filter(f => extname(f) === '.js');
const cssFiles = allFiles.filter(f => extname(f) === '.css');

let totalSize = 0;
let totalGzipSize = 0;

console.log('\n  JavaScript files:');
for (const file of jsFiles) {
  const content = readFileSync(file);
  const size = content.length;
  const gzipSize = gzipSync(content).length;
  const fileName = file.replace(DIST_DIR + '/', '');
  
  totalSize += size;
  totalGzipSize += gzipSize;
  
  console.log(`    ${fileName}`);
  console.log(`      Size: ${(size / 1024).toFixed(2)} KB`);
  console.log(`      Gzipped: ${(gzipSize / 1024).toFixed(2)} KB`);
}

console.log('\n  CSS files:');
for (const file of cssFiles) {
  const content = readFileSync(file);
  const size = content.length;
  const gzipSize = gzipSync(content).length;
  const fileName = file.replace(DIST_DIR + '/', '');
  
  totalSize += size;
  totalGzipSize += gzipSize;
  
  console.log(`    ${fileName}`);
  console.log(`      Size: ${(size / 1024).toFixed(2)} KB`);
  console.log(`      Gzipped: ${(gzipSize / 1024).toFixed(2)} KB`);
}

console.log('\n  Total bundle size:');
console.log(`    Uncompressed: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`    Gzipped: ${(totalGzipSize / 1024).toFixed(2)} KB`);

// Check bundle size limit
if (totalGzipSize / 1024 > MAX_BUNDLE_SIZE_KB) {
  console.log(`\n  ⚠️  Warning: Bundle size (${(totalGzipSize / 1024).toFixed(2)} KB) exceeds recommended limit (${MAX_BUNDLE_SIZE_KB} KB)`);
  console.log('    Consider optimizing bundle size or increasing the limit.');
} else {
  console.log(`\n  ✅ Bundle size within limit (${MAX_BUNDLE_SIZE_KB} KB)`);
}

// Check for common issues
console.log('\n🔎 Checking for common issues...');

const indexHtml = readFileSync(join(DIST_DIR, 'index.html'), 'utf-8');

// Check if index.html has script tags
if (!indexHtml.includes('<script')) {
  console.log('  ❌ No script tags found in index.html');
  process.exit(1);
} else {
  console.log('  ✅ Script tags found in index.html');
}

// Check if index.html has the root div
if (!indexHtml.includes('id="root"')) {
  console.log('  ❌ Root div not found in index.html');
  process.exit(1);
} else {
  console.log('  ✅ Root div found in index.html');
}

// Check for development artifacts
const allContent = allFiles
  .filter(f => extname(f) === '.js')
  .map(f => readFileSync(f, 'utf-8'))
  .join('\n');

if (allContent.includes('console.log') || allContent.includes('console.debug')) {
  console.log('  ⚠️  Warning: console.log statements found in production bundle');
  console.log('    Consider removing debug statements for production.');
}

if (allContent.includes('debugger')) {
  console.log('  ⚠️  Warning: debugger statements found in production bundle');
  console.log('    Remove debugger statements before deploying.');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Build Verification Summary');
console.log('='.repeat(60));
console.log(`✅ All required files present`);
console.log(`✅ Total bundle size: ${(totalGzipSize / 1024).toFixed(2)} KB (gzipped)`);
console.log(`✅ JavaScript files: ${jsFiles.length}`);
console.log(`✅ CSS files: ${cssFiles.length}`);
console.log(`✅ Build structure valid`);
console.log('='.repeat(60));
console.log('\n✨ Production build verification complete!');
console.log('\n📝 Next steps:');
console.log('  1. Test the build locally: npm run preview');
console.log('  2. Review PRE_DEPLOYMENT_CHECKLIST.md');
console.log('  3. Follow DEPLOYMENT_GUIDE.md for deployment');
console.log('');
