# Phase 0 Migration Application Script (PowerShell)
# This script applies the Phase 0 critical features migration

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 0 Critical Features Migration" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is installed
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI is not installed." -ForegroundColor Red
    Write-Host "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Check if project is linked
if (-not (Test-Path ".supabase/config.toml")) {
    Write-Host "⚠️  Project is not linked to Supabase." -ForegroundColor Yellow
    Write-Host "Please run: supabase link --project-ref your-project-ref"
    exit 1
}

Write-Host "✅ Project is linked" -ForegroundColor Green
Write-Host ""

# Apply migration
Write-Host "📦 Applying Phase 0 migration..." -ForegroundColor Cyan
Write-Host ""

supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Create 'logos' storage bucket in Supabase Dashboard"
    Write-Host "2. Set bucket as public"
    Write-Host "3. Add storage policies (see docs/PHASE0_IMPLEMENTATION_COMPLETE.md)"
    Write-Host "4. Test all features"
    Write-Host "5. Deploy to production"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above and try again."
    Write-Host "You can also apply the migration manually via Supabase Dashboard."
    exit 1
}
