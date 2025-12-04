import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { storage } from '../storage';

const SITE_URL = 'https://qbids.ru';

// Cache for sitemaps (regenerate every hour)
let mainSitemapCache: string | null = null;
let auctionSitemapCache: string | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Helper to create URL-friendly slug from auction title and displayId
function createSlug(title: string, displayId: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-а-яё]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  return `${slug}-${displayId.toLowerCase()}`;
}

// Static pages with their priorities and change frequencies
const staticPages = [
  { url: '/', changefreq: 'daily' as const, priority: 1.0 },
  { url: '/auctions', changefreq: 'hourly' as const, priority: 0.9 },
  { url: '/how-it-works', changefreq: 'monthly' as const, priority: 0.8 },
  { url: '/support', changefreq: 'monthly' as const, priority: 0.6 },
  { url: '/auction-rules', changefreq: 'monthly' as const, priority: 0.5 },
  { url: '/privacy-policy', changefreq: 'yearly' as const, priority: 0.3 },
  { url: '/terms-of-service', changefreq: 'yearly' as const, priority: 0.3 },
];

export class SitemapService {
  /**
   * Generate main sitemap index
   */
  async generateSitemapIndex(): Promise<string> {
    const now = new Date().toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-auctions.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
  }

  /**
   * Generate sitemap for static pages
   */
  async generatePagesSitemap(): Promise<string> {
    const now = Date.now();

    // Return cached version if still valid
    if (mainSitemapCache && now - lastCacheTime < CACHE_DURATION) {
      return mainSitemapCache;
    }

    const links = staticPages.map(page => ({
      url: page.url,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: new Date().toISOString(),
    }));

    const stream = new SitemapStream({ hostname: SITE_URL });
    const xmlString = await streamToPromise(Readable.from(links).pipe(stream)).then(
      (data) => data.toString()
    );

    mainSitemapCache = xmlString;
    lastCacheTime = now;

    return xmlString;
  }

  /**
   * Generate sitemap for auction pages
   */
  async generateAuctionsSitemap(): Promise<string> {
    const now = Date.now();

    // Return cached version if still valid
    if (auctionSitemapCache && now - lastCacheTime < CACHE_DURATION) {
      return auctionSitemapCache;
    }

    try {
      // Get all auctions (live, upcoming, and recent finished)
      const liveAuctions = await storage.getAuctionsByStatus('live');
      const upcomingAuctions = await storage.getAuctionsByStatus('upcoming');
      const finishedAuctions = await storage.getAuctionsByStatus('finished');

      // Only include last 100 finished auctions for SEO
      const recentFinished = finishedAuctions.slice(0, 100);

      const links = [
        // Live auctions - highest priority, changes very frequently
        ...liveAuctions.map(auction => ({
          url: `/auction/${createSlug(auction.title, auction.displayId)}`,
          changefreq: 'always' as const,
          priority: 1.0,
          lastmod: new Date().toISOString(),
          img: auction.imageUrl ? [{
            url: auction.imageUrl,
            title: auction.title,
            caption: `${auction.title} - Пенни-аукцион QBIDS`,
          }] : undefined,
        })),

        // Upcoming auctions - high priority
        ...upcomingAuctions.map(auction => ({
          url: `/auction/${createSlug(auction.title, auction.displayId)}`,
          changefreq: 'hourly' as const,
          priority: 0.9,
          lastmod: new Date(auction.startTime).toISOString(),
          img: auction.imageUrl ? [{
            url: auction.imageUrl,
            title: auction.title,
            caption: `${auction.title} - Скоро на QBIDS`,
          }] : undefined,
        })),

        // Finished auctions - lower priority, historical record
        ...recentFinished.map(auction => ({
          url: `/auction/${createSlug(auction.title, auction.displayId)}`,
          changefreq: 'monthly' as const,
          priority: 0.5,
          lastmod: auction.endTime
            ? new Date(auction.endTime).toISOString()
            : new Date(auction.createdAt).toISOString(),
          img: auction.imageUrl ? [{
            url: auction.imageUrl,
            title: auction.title,
            caption: `${auction.title} - Завершенный аукцион`,
          }] : undefined,
        })),
      ];

      if (links.length === 0) {
        // Return empty sitemap if no auctions
        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`;
      }

      const stream = new SitemapStream({ hostname: SITE_URL });
      const xmlString = await streamToPromise(Readable.from(links).pipe(stream)).then(
        (data) => data.toString()
      );

      auctionSitemapCache = xmlString;
      lastCacheTime = now;

      return xmlString;
    } catch (error) {
      console.error('Error generating auctions sitemap:', error);
      // Return empty sitemap on error
      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
    }
  }

  /**
   * Invalidate sitemap cache (call when auctions are created/updated/deleted)
   */
  invalidateCache(): void {
    mainSitemapCache = null;
    auctionSitemapCache = null;
    lastCacheTime = 0;
    console.log('📍 Sitemap cache invalidated');
  }
}

export const sitemapService = new SitemapService();
