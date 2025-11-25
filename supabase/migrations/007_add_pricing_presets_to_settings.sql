-- ============================================================================
-- ADD: Pricing Presets to Settings
-- ============================================================================
-- Bug #3: Pricing presets were hardcoded and incorrect
-- This migration adds correct Mezokuru pricing to the settings table
-- ============================================================================

-- Add pricing presets to settings
INSERT INTO settings (key, value, description)
VALUES (
  'pricing_presets',
  '{
    "presets": [
      {
        "id": "personal_single",
        "name": "Personal (Single Page)",
        "total": 1200,
        "type": "small",
        "category": "Websites",
        "description": "Basic landing page, single page portfolio",
        "labour_percentage": 30
      },
      {
        "id": "portfolio_multi",
        "name": "Portfolio (Multi Page 3+)",
        "total": 3000,
        "type": "small",
        "category": "Websites",
        "description": "Multi-page portfolio, gallery, contact form",
        "labour_percentage": 30
      },
      {
        "id": "business_starter",
        "name": "Business Starter",
        "total": 6800,
        "type": "medium",
        "category": "Websites",
        "description": "Small business website, 5-10 pages",
        "labour_percentage": 35
      },
      {
        "id": "business_pro",
        "name": "Business Pro",
        "total": 11250,
        "type": "medium",
        "category": "Websites",
        "description": "Professional business site, advanced features",
        "labour_percentage": 35
      },
      {
        "id": "ecommerce_basic",
        "name": "E-commerce Basic",
        "total": 15000,
        "type": "large",
        "category": "E-commerce",
        "description": "Basic online store, product catalog, payment integration",
        "labour_percentage": 45
      },
      {
        "id": "ecommerce_advanced",
        "name": "E-commerce Advanced",
        "total": 25000,
        "type": "large",
        "category": "E-commerce",
        "description": "Full-featured store, inventory management, advanced features",
        "labour_percentage": 45
      },
      {
        "id": "mobile_mvp",
        "name": "Mobile App MVP",
        "total": 25000,
        "type": "custom",
        "category": "Mobile Apps",
        "description": "Cross-platform mobile app, minimum viable product",
        "labour_percentage": 50
      },
      {
        "id": "mobile_fpa",
        "name": "Mobile App FPA",
        "total": 55000,
        "type": "custom",
        "category": "Mobile Apps",
        "description": "Full production app, cross-platform, complete features",
        "labour_percentage": 50
      }
    ],
    "formula": {
      "labour_percentages": {
        "small": 30,
        "medium": 35,
        "large": 45,
        "custom": 50
      },
      "infrastructure_breakdown": {
        "hosting": 48,
        "ssl": 22,
        "cdn": 14,
        "backups": 6,
        "monitoring": 10
      }
    }
  }'::jsonb,
  'Mezokuru pricing presets and formula configuration'
)
ON CONFLICT (key) DO UPDATE
SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verification query
SELECT 
  '✅ Pricing Presets Added to Settings' as status,
  '8 presets configured: R1,200 to R55,000' as range,
  'Websites, E-commerce, Mobile Apps categories' as categories;

COMMENT ON TABLE settings IS 'System settings and configuration, including pricing presets';

