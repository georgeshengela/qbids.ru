/**
 * Page SEO Component (Organism)
 * Pre-configured SEO for specific page types
 */

import { SEOHead } from './seo-head';
import {
  generateHomePageMeta,
  generateAuctionsListMeta,
  generateHowItWorksMeta,
  generateSupportMeta,
  generateAuctionRulesMeta,
  generatePrivacyPolicyMeta,
  generateTermsOfServiceMeta,
  generateTopUpMeta,
  type SEOMetaTags,
} from '@/lib/seo-utils';
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateBreadcrumbSchema,
} from '@/lib/structured-data';

type PageType =
  | 'home'
  | 'auctions'
  | 'how-it-works'
  | 'support'
  | 'auction-rules'
  | 'privacy-policy'
  | 'terms-of-service'
  | 'topup'
  | 'custom';

interface PageSEOProps {
  page: PageType;
  customMeta?: Partial<SEOMetaTags>;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

/**
 * Get meta tags configuration for a specific page type
 */
function getPageMeta(page: PageType): SEOMetaTags {
  switch (page) {
    case 'home':
      return generateHomePageMeta();
    case 'auctions':
      return generateAuctionsListMeta();
    case 'how-it-works':
      return generateHowItWorksMeta();
    case 'support':
      return generateSupportMeta();
    case 'auction-rules':
      return generateAuctionRulesMeta();
    case 'privacy-policy':
      return generatePrivacyPolicyMeta();
    case 'terms-of-service':
      return generateTermsOfServiceMeta();
    case 'topup':
      return generateTopUpMeta();
    case 'custom':
    default:
      return generateHomePageMeta();
  }
}

/**
 * Page SEO component that provides pre-configured SEO for common pages
 */
export function PageSEO({ page, customMeta, breadcrumbs }: PageSEOProps) {
  const baseMeta = getPageMeta(page);

  // Merge custom meta with base meta
  const meta: SEOMetaTags = customMeta
    ? { ...baseMeta, ...customMeta }
    : baseMeta;

  // Build structured data array
  const structuredData: object[] = [];

  // Add organization schema for homepage
  if (page === 'home') {
    structuredData.push(generateOrganizationSchema());
    structuredData.push(generateWebsiteSchema());
  }

  // Add breadcrumb schema if provided
  if (breadcrumbs && breadcrumbs.length > 0) {
    structuredData.push(generateBreadcrumbSchema(breadcrumbs));
  }

  return (
    <SEOHead
      meta={meta}
      structuredData={structuredData.length > 0 ? structuredData : undefined}
    />
  );
}

export default PageSEO;
