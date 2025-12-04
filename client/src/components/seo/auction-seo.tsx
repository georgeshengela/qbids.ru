/**
 * Auction SEO Component (Organism)
 * Specialized SEO for individual auction pages
 */

import { SEOHead } from './seo-head';
import { generateAuctionMeta } from '@/lib/seo-utils';
import {
  generateProductSchema,
  generateAuctionEventSchema,
  generateBreadcrumbSchema,
} from '@/lib/structured-data';

interface AuctionSEOProps {
  auction: {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    displayId: string;
    currentPrice: string | number;
    retailPrice: string | number;
    status: string;
    startTime?: string;
    endTime?: string;
  };
}

/**
 * Auction SEO component that provides complete SEO for auction detail pages
 * Includes product schema and event schema for rich search results
 */
export function AuctionSEO({ auction }: AuctionSEOProps) {
  // Generate meta tags
  const meta = generateAuctionMeta(auction);

  // Generate structured data
  const structuredData = [
    // Product schema for Google Shopping and rich snippets
    generateProductSchema(auction),

    // Event schema for auction as an event
    generateAuctionEventSchema(auction),

    // Breadcrumb navigation
    generateBreadcrumbSchema([
      { name: 'Главная', url: '/' },
      { name: 'Аукционы', url: '/auctions' },
      { name: auction.title, url: meta.canonical || '' },
    ]),
  ];

  return <SEOHead meta={meta} structuredData={structuredData} />;
}

export default AuctionSEO;
