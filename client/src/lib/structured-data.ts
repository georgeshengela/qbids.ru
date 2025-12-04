/**
 * Structured Data (JSON-LD) Generators for QBIDS.RU
 * Generates Schema.org compliant structured data for search engines
 */

const SITE_URL = 'https://qbids.ru';
const SITE_NAME = 'QBIDS';
const LOGO_URL = `${SITE_URL}/favicon.png`;

/**
 * Organization Schema for the company
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: 'QBIDS.RU',
    url: SITE_URL,
    logo: LOGO_URL,
    description: 'Платформа пенни-аукционов №1 в России. Выигрывайте премиум товары со скидкой до 99%.',
    foundingDate: '2024',
    areaServed: {
      '@type': 'Country',
      name: 'Russia',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Russian', 'English'],
    },
    sameAs: [
      // Add social media URLs when available
      // 'https://t.me/qbids_ru',
      // 'https://vk.com/qbids',
    ],
  };
}

/**
 * Website Schema for search features
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'QBIDS Пенни-аукционы',
    url: SITE_URL,
    description: 'Пенни-аукционы в России - выигрывайте iPhone, MacBook и другие товары со скидкой до 99%',
    inLanguage: 'ru-RU',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/auctions?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Product Schema for auction items
 */
export function generateProductSchema(auction: {
  title: string;
  description?: string;
  imageUrl?: string;
  displayId: string;
  currentPrice: string | number;
  retailPrice: string | number;
  status: string;
  startTime?: string;
  endTime?: string;
}) {
  const currentPrice = typeof auction.currentPrice === 'string'
    ? parseFloat(auction.currentPrice)
    : auction.currentPrice;
  const retailPrice = typeof auction.retailPrice === 'string'
    ? parseFloat(auction.retailPrice)
    : auction.retailPrice;

  const slug = auction.title
    .toLowerCase()
    .replace(/[^\w\s-а-яё]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const productUrl = `${SITE_URL}/auction/${slug}-${auction.displayId.toLowerCase()}`;

  // Determine availability based on auction status
  let availability: string;
  switch (auction.status) {
    case 'live':
      availability = 'https://schema.org/InStock';
      break;
    case 'upcoming':
      availability = 'https://schema.org/PreOrder';
      break;
    case 'finished':
      availability = 'https://schema.org/SoldOut';
      break;
    default:
      availability = 'https://schema.org/OutOfStock';
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: auction.title,
    description: auction.description || `${auction.title} - доступен на пенни-аукционе QBIDS`,
    image: auction.imageUrl || LOGO_URL,
    url: productUrl,
    sku: auction.displayId,
    brand: {
      '@type': 'Brand',
      name: extractBrandFromTitle(auction.title),
    },
    offers: {
      '@type': 'AggregateOffer',
      url: productUrl,
      priceCurrency: 'RUB',
      lowPrice: currentPrice.toFixed(2),
      highPrice: retailPrice.toFixed(2),
      offerCount: 1,
      availability: availability,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      priceValidUntil: auction.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
}

/**
 * Event Schema for live auctions
 */
export function generateAuctionEventSchema(auction: {
  title: string;
  description?: string;
  imageUrl?: string;
  displayId: string;
  currentPrice: string | number;
  retailPrice: string | number;
  status: string;
  startTime?: string;
  endTime?: string;
}) {
  const slug = auction.title
    .toLowerCase()
    .replace(/[^\w\s-а-яё]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const eventUrl = `${SITE_URL}/auction/${slug}-${auction.displayId.toLowerCase()}`;

  // Determine event status
  let eventStatus: string;
  switch (auction.status) {
    case 'live':
      eventStatus = 'https://schema.org/EventScheduled';
      break;
    case 'upcoming':
      eventStatus = 'https://schema.org/EventScheduled';
      break;
    case 'finished':
      eventStatus = 'https://schema.org/EventCancelled'; // or EventPostponed
      break;
    default:
      eventStatus = 'https://schema.org/EventScheduled';
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `Аукцион: ${auction.title}`,
    description: auction.description || `Пенни-аукцион на ${auction.title}. Участвуйте и выигрывайте!`,
    image: auction.imageUrl || LOGO_URL,
    url: eventUrl,
    eventStatus: eventStatus,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    startDate: auction.startTime || new Date().toISOString(),
    endDate: auction.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    location: {
      '@type': 'VirtualLocation',
      url: eventUrl,
    },
    organizer: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    offers: {
      '@type': 'Offer',
      url: eventUrl,
      availability: auction.status === 'finished'
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
      price: '0',
      priceCurrency: 'RUB',
      validFrom: auction.startTime || new Date().toISOString(),
    },
  };
}

/**
 * BreadcrumbList Schema for navigation
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * FAQ Schema for How It Works page
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Helper function to extract brand from product title
 */
function extractBrandFromTitle(title: string): string {
  const knownBrands = [
    'Apple', 'iPhone', 'MacBook', 'iPad', 'AirPods',
    'Samsung', 'Galaxy',
    'Sony', 'PlayStation',
    'Microsoft', 'Xbox',
    'Xiaomi', 'Huawei', 'OnePlus', 'Google', 'Pixel',
    'Nintendo', 'Switch',
    'Dyson', 'DJI', 'GoPro', 'Canon', 'Nikon',
  ];

  const titleLower = title.toLowerCase();
  for (const brand of knownBrands) {
    if (titleLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return 'QBIDS';
}

/**
 * Serialize schema to JSON-LD script content
 */
export function serializeSchema(schema: object | object[]): string {
  return JSON.stringify(schema, null, 0);
}
