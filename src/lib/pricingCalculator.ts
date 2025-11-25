/**
 * Mezokuru Pricing Formula Calculator
 * 
 * Automatically breaks down project costs into:
 * - Labour (30-50% depending on complexity)
 * - Infrastructure (50-70% for 1 year)
 *   - Web Hosting (48%)
 *   - SSL & Security (22%)
 *   - CDN (14%)
 *   - Automated Backups (6%)
 *   - Monitoring & Maintenance (10%)
 */

export interface PricingBreakdown {
  total: number;
  labour: {
    amount: number;
    percentage: number;
    description: string;
  };
  infrastructure: {
    total: number;
    percentage: number;
    items: {
      hosting: number;
      ssl: number;
      cdn: number;
      backups: number;
      monitoring: number;
    };
  };
}

export interface QuotationLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

/**
 * Calculate pricing breakdown based on total project cost
 * @param total - Total project cost
 * @param projectType - Type of project (affects labour/infrastructure split)
 * @returns Pricing breakdown
 */
export function calculatePricingBreakdown(
  total: number,
  projectType: 'small' | 'medium' | 'large' | 'custom' = 'small'
): PricingBreakdown {
  // Determine labour/infrastructure split based on project type
  let labourPercentage: number;
  
  switch (projectType) {
    case 'small': // 1-5 pages, simple portfolio
      labourPercentage = 0.30; // 30% labour, 70% infrastructure
      break;
    case 'medium': // 5-10 pages, business site
      labourPercentage = 0.35; // 35% labour, 65% infrastructure
      break;
    case 'large': // 10+ pages, e-commerce
      labourPercentage = 0.45; // 45% labour, 55% infrastructure
      break;
    case 'custom': // Custom systems like Koruku
      labourPercentage = 0.50; // 50% labour, 50% infrastructure
      break;
    default:
      labourPercentage = 0.30;
  }

  const labourAmount = total * labourPercentage;
  const infrastructureTotal = total * (1 - labourPercentage);

  // Infrastructure breakdown (always these percentages)
  const hosting = infrastructureTotal * 0.48;
  const ssl = infrastructureTotal * 0.22;
  const cdn = infrastructureTotal * 0.14;
  const backups = infrastructureTotal * 0.06;
  const monitoring = infrastructureTotal * 0.10;

  return {
    total,
    labour: {
      amount: labourAmount,
      percentage: labourPercentage * 100,
      description: 'Website Development',
    },
    infrastructure: {
      total: infrastructureTotal,
      percentage: (1 - labourPercentage) * 100,
      items: {
        hosting,
        ssl,
        cdn,
        backups,
        monitoring,
      },
    },
  };
}

/**
 * Generate standard line items for a quotation based on total cost
 * @param total - Total project cost
 * @param projectType - Type of project
 * @param customLabourDescription - Optional custom description for labour
 * @returns Array of line items ready for quotation
 */
export function generateStandardLineItems(
  total: number,
  projectType: 'small' | 'medium' | 'large' | 'custom' = 'small',
  customLabourDescription?: string
): QuotationLineItem[] {
  const breakdown = calculatePricingBreakdown(total, projectType);

  const items: QuotationLineItem[] = [
    // Labour
    {
      description: customLabourDescription || breakdown.labour.description,
      quantity: 1,
      unit_price: breakdown.labour.amount,
      amount: breakdown.labour.amount,
    },
    // Infrastructure - Web Hosting
    {
      description: 'Web Hosting (1 year) - Cloud hosting, 99.9% uptime',
      quantity: 1,
      unit_price: breakdown.infrastructure.items.hosting,
      amount: breakdown.infrastructure.items.hosting,
    },
    // Infrastructure - SSL & Security
    {
      description: 'SSL & Security (1 year) - HTTPS encryption, security monitoring',
      quantity: 1,
      unit_price: breakdown.infrastructure.items.ssl,
      amount: breakdown.infrastructure.items.ssl,
    },
    // Infrastructure - CDN
    {
      description: 'CDN (1 year) - Content delivery network for fast loading',
      quantity: 1,
      unit_price: breakdown.infrastructure.items.cdn,
      amount: breakdown.infrastructure.items.cdn,
    },
    // Infrastructure - Backups
    {
      description: 'Automated Backups (1 year) - Daily backups and recovery',
      quantity: 1,
      unit_price: breakdown.infrastructure.items.backups,
      amount: breakdown.infrastructure.items.backups,
    },
    // Infrastructure - Monitoring
    {
      description: 'Monitoring & Maintenance (1 year) - Uptime monitoring, technical maintenance',
      quantity: 1,
      unit_price: breakdown.infrastructure.items.monitoring,
      amount: breakdown.infrastructure.items.monitoring,
    },
  ];

  return items;
}

/**
 * Get project type suggestion based on total cost
 * @param total - Total project cost
 * @returns Suggested project type
 */
export function suggestProjectType(total: number): 'small' | 'medium' | 'large' | 'custom' {
  if (total < 3500) return 'small';
  if (total < 7000) return 'medium';
  if (total < 15000) return 'large';
  return 'custom';
}

/**
 * Format pricing breakdown for display
 * @param breakdown - Pricing breakdown
 * @returns Formatted string
 */
export function formatPricingBreakdown(breakdown: PricingBreakdown): string {
  return `
Labour (${breakdown.labour.percentage.toFixed(1)}%): R ${breakdown.labour.amount.toFixed(2)}
Infrastructure (${breakdown.infrastructure.percentage.toFixed(1)}%): R ${breakdown.infrastructure.total.toFixed(2)}
  - Web Hosting (48%): R ${breakdown.infrastructure.items.hosting.toFixed(2)}
  - SSL & Security (22%): R ${breakdown.infrastructure.items.ssl.toFixed(2)}
  - CDN (14%): R ${breakdown.infrastructure.items.cdn.toFixed(2)}
  - Automated Backups (6%): R ${breakdown.infrastructure.items.backups.toFixed(2)}
  - Monitoring & Maintenance (10%): R ${breakdown.infrastructure.items.monitoring.toFixed(2)}

Total: R ${breakdown.total.toFixed(2)}
  `.trim();
}

/**
 * Pricing presets for common project types
 * Updated to match actual Mezokuru pricing structure
 */
export const PRICING_PRESETS = {
  personal_single: {
    name: 'Personal (Single Page)',
    total: 1200,
    type: 'small' as const,
    category: 'Websites',
    description: 'Basic landing page, single page portfolio',
  },
  portfolio_multi: {
    name: 'Portfolio (Multi Page 3+)',
    total: 3000,
    type: 'small' as const,
    category: 'Websites',
    description: 'Multi-page portfolio, gallery, contact form',
  },
  business_starter: {
    name: 'Business Starter',
    total: 6800,
    type: 'medium' as const,
    category: 'Websites',
    description: 'Small business website, 5-10 pages',
  },
  business_pro: {
    name: 'Business Pro',
    total: 11250,
    type: 'medium' as const,
    category: 'Websites',
    description: 'Professional business site, advanced features',
  },
  ecommerce_basic: {
    name: 'E-commerce Basic',
    total: 15000,
    type: 'large' as const,
    category: 'E-commerce',
    description: 'Basic online store, product catalog, payment integration',
  },
  ecommerce_advanced: {
    name: 'E-commerce Advanced',
    total: 25000,
    type: 'large' as const,
    category: 'E-commerce',
    description: 'Full-featured store, inventory management, advanced features',
  },
  mobile_mvp: {
    name: 'Mobile App MVP',
    total: 25000,
    type: 'custom' as const,
    category: 'Mobile Apps',
    description: 'Cross-platform mobile app, minimum viable product',
  },
  mobile_fpa: {
    name: 'Mobile App FPA',
    total: 55000,
    type: 'custom' as const,
    category: 'Mobile Apps',
    description: 'Full production app, cross-platform, complete features',
  },
};
