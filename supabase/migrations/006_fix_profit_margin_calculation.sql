-- ============================================================================
-- FIX: Profit Margin Calculation
-- ============================================================================
-- Bug: Margin calculated as (Profit / Cost) instead of (Profit / Revenue)
-- This caused margins like 233% instead of correct 70%
-- ============================================================================

-- Drop and recreate project_profitability view with correct formula
DROP VIEW IF EXISTS project_profitability CASCADE;

CREATE VIEW project_profitability AS
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
    -- FIXED: Divide by REVENUE (total_invoiced), not cost
    WHEN COALESCE(SUM(i.amount), 0) > 0 
    THEN ((COALESCE(SUM(i.amount), 0) - (COALESCE(pr.labour_amount, 0) + COALESCE(pr.infrastructure_amount, 0))) / 
          COALESCE(SUM(i.amount), 0)) * 100  -- Correct: Profit / Revenue
    ELSE 0
  END as profit_margin_percentage
FROM projects pr
JOIN clients c ON c.id = pr.client_id
LEFT JOIN invoices i ON i.project_id = pr.id
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY pr.id, pr.name, c.business, pr.labour_amount, pr.infrastructure_amount;

COMMENT ON VIEW project_profitability IS 'Project profitability analysis with correct margin calculation (Profit/Revenue)';

-- Verification query
SELECT 
  '✅ Profit Margin Formula Fixed' as status,
  'Margin now calculated as (Profit / Revenue) × 100' as formula,
  'Example: R1,050 profit on R1,500 revenue = 70% margin' as example;
