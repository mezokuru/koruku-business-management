#!/bin/bash

# Phase 0 Migration Application Script
# This script applies the Phase 0 critical features migration

echo "========================================="
echo "Phase 0 Critical Features Migration"
echo "========================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project is not linked to Supabase."
    echo "Please run: supabase link --project-ref your-project-ref"
    exit 1
fi

echo "✅ Project is linked"
echo ""

# Apply migration
echo "📦 Applying Phase 0 migration..."
echo ""

supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Migration applied successfully!"
    echo "========================================="
    echo ""
    echo "Next steps:"
    echo "1. Create 'logos' storage bucket in Supabase Dashboard"
    echo "2. Set bucket as public"
    echo "3. Add storage policies (see docs/PHASE0_IMPLEMENTATION_COMPLETE.md)"
    echo "4. Test all features"
    echo "5. Deploy to production"
    echo ""
else
    echo ""
    echo "========================================="
    echo "❌ Migration failed!"
    echo "========================================="
    echo ""
    echo "Please check the error messages above and try again."
    echo "You can also apply the migration manually via Supabase Dashboard."
    exit 1
fi
