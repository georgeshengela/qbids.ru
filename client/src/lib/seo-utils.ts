/**
 * SEO Utility Functions for QBIDS.RU
 * Provides helpers for generating meta tags, structured data, and SEO content
 */

const SITE_URL = 'https://qbids.ru';
const SITE_DOMAIN = 'qbids.ru';
const SITE_NAME = 'QBIDS';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Sanitize text for use in meta tags
 * Removes HTML, extra whitespace, and truncates to max length
 */
export function sanitizeForSEO(text: string, maxLength = 160): string {
  if (!text) return '';

  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, maxLength);
}

/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(title: string, displayId: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-а-яё]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  return `${slug}-${displayId.toLowerCase()}`;
}

/**
 * Calculate savings percentage for auction
 */
export function calculateSavingsPercentage(retailPrice: number, currentPrice: number): number {
  if (retailPrice <= 0) return 0;
  const savings = ((retailPrice - currentPrice) / retailPrice) * 100;
  return Math.round(Math.max(0, Math.min(99, savings)));
}

/**
 * Format price for display in Russian locale
 */
export function formatPriceForSEO(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numPrice);
}

/**
 * SEO Meta Tags Interface
 */
export interface SEOMetaTags {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robots?: string;
  author?: string;
  language?: string;
}

/**
 * Generate meta tags for homepage
 */
export function generateHomePageMeta(): SEOMetaTags {
  return {
    title: 'QBIDS - №1 Пенни-аукционы в России | Выиграй iPhone за копейки',
    description: 'Участвуйте в живых пенни-аукционах! Выигрывайте iPhone 16, MacBook, Samsung Galaxy со скидкой до 99%. Надежная платформа онлайн аукционов №1 в России.',
    keywords: 'пенни аукционы, qbids, онлайн аукционы россия, выиграть айфон, дешевые товары, аукцион электроники, живые торги',
    canonical: SITE_URL,
    ogTitle: 'QBIDS - №1 Пенни-аукционы в России',
    ogDescription: 'Выигрывайте премиум товары со скидкой до 99%! iPhone, MacBook, Samsung Galaxy и многое другое на живых пенни-аукционах.',
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    ogUrl: SITE_URL,
    twitterCard: 'summary_large_image',
    robots: 'index, follow',
    author: SITE_NAME,
    language: 'ru',
  };
}

/**
 * Generate meta tags for auctions list page
 */
export function generateAuctionsListMeta(): SEOMetaTags {
  return {
    title: 'Все аукционы | QBIDS - Пенни-аукционы в России',
    description: 'Смотрите все активные и предстоящие пенни-аукционы на QBIDS. iPhone, MacBook, Samsung, PlayStation и другая электроника со скидкой до 99%.',
    keywords: 'аукционы, пенни аукционы, живые аукционы, онлайн торги, купить айфон дешево',
    canonical: `${SITE_URL}/auctions`,
    ogTitle: 'Все пенни-аукционы | QBIDS',
    ogDescription: 'Присоединяйтесь к живым аукционам и выигрывайте премиум товары по минимальным ценам!',
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    ogUrl: `${SITE_URL}/auctions`,
    twitterCard: 'summary_large_image',
    robots: 'index, follow',
    language: 'ru',
  };
}

/**
 * Generate meta tags for individual auction page
 */
export function generateAuctionMeta(auction: {
  title: string;
  description?: string;
  imageUrl?: string;
  displayId: string;
  currentPrice: string | number;
  retailPrice: string | number;
  status: string;
}): SEOMetaTags {
  const currentPrice = typeof auction.currentPrice === 'string'
    ? parseFloat(auction.currentPrice)
    : auction.currentPrice;
  const retailPrice = typeof auction.retailPrice === 'string'
    ? parseFloat(auction.retailPrice)
    : auction.retailPrice;

  const savings = calculateSavingsPercentage(retailPrice, currentPrice);
  const slug = generateSlug(auction.title, auction.displayId);
  const url = `${SITE_URL}/auction/${slug}`;

  const statusText = auction.status === 'live'
    ? 'Идет торги!'
    : auction.status === 'upcoming'
      ? 'Скоро начнется'
      : 'Завершен';

  const title = `${auction.title} - ${statusText} | QBIDS Пенни-аукцион`;
  const description = auction.status === 'live'
    ? `Выиграй ${auction.title} прямо сейчас! Текущая цена ${formatPriceForSEO(currentPrice)} сом (экономия ${savings}%). Розничная цена ${formatPriceForSEO(retailPrice)} сом.`
    : auction.status === 'upcoming'
      ? `${auction.title} скоро на аукционе QBIDS! Розничная цена ${formatPriceForSEO(retailPrice)} сом. Сделай представку и выиграй первым!`
      : `${auction.title} был продан на аукционе QBIDS за ${formatPriceForSEO(currentPrice)} сом. Экономия ${savings}%!`;

  return {
    title: sanitizeForSEO(title, 70),
    description: sanitizeForSEO(description, 160),
    keywords: `${auction.title}, купить ${auction.title}, ${auction.title} дешево, аукцион ${auction.title}, qbids`,
    canonical: url,
    ogTitle: `${auction.title} | QBIDS Аукцион`,
    ogDescription: description,
    ogImage: auction.imageUrl || DEFAULT_OG_IMAGE,
    ogType: 'product',
    ogUrl: url,
    twitterCard: 'summary_large_image',
    twitterTitle: `${auction.title} - ${statusText}`,
    twitterDescription: description,
    twitterImage: auction.imageUrl || DEFAULT_OG_IMAGE,
    robots: 'index, follow',
    language: 'ru',
  };
}

/**
 * Generate meta tags for How It Works page
 */
export function generateHowItWorksMeta(): SEOMetaTags {
  return {
    title: 'Как работают пенни-аукционы | QBIDS - Инструкция',
    description: 'Узнайте как выиграть на пенни-аукционе QBIDS. Подробная инструкция, правила, стратегии и секреты успешного участия в онлайн аукционах.',
    keywords: 'как работают пенни аукционы, правила аукциона, стратегия аукционов, инструкция qbids, как выиграть аукцион',
    canonical: `${SITE_URL}/how-it-works`,
    ogTitle: 'Как работают пенни-аукционы QBIDS',
    ogDescription: 'Пошаговая инструкция для новичков. Узнайте секреты успешного участия в онлайн аукционах.',
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'article',
    ogUrl: `${SITE_URL}/how-it-works`,
    twitterCard: 'summary_large_image',
    robots: 'index, follow',
    language: 'ru',
  };
}

/**
 * Generate meta tags for Support page
 */
export function generateSupportMeta(): SEOMetaTags {
  return {
    title: 'Поддержка и помощь | QBIDS',
    description: 'Служба поддержки QBIDS. Ответы на частые вопросы, контакты, помощь с аукционами и платежами.',
    keywords: 'поддержка qbids, помощь, контакты, вопросы и ответы',
    canonical: `${SITE_URL}/support`,
    ogTitle: 'Поддержка | QBIDS',
    ogDescription: 'Нужна помощь? Наша служба поддержки готова ответить на ваши вопросы.',
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    ogUrl: `${SITE_URL}/support`,
    robots: 'index, follow',
    language: 'ru',
  };
}

/**
 * Generate meta tags for Auction Rules page
 */
export function generateAuctionRulesMeta(): SEOMetaTags {
  return {
    title: 'Правила аукционов | QBIDS',
    description: 'Официальные правила проведения пенни-аукционов на платформе QBIDS. Условия участия, оплаты и получения выигрыша.',
    keywords: 'правила аукциона qbids, условия участия, правила торгов',
    canonical: `${SITE_URL}/auction-rules`,
    ogTitle: 'Правила аукционов QBIDS',
    ogDescription: 'Ознакомьтесь с правилами проведения пенни-аукционов на QBIDS.',
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'article',
    ogUrl: `${SITE_URL}/auction-rules`,
    robots: 'index, follow',
    language: 'ru',
  };
}

/**
 * Generate meta tags for Privacy Policy page
 */
export function generatePrivacyPolicyMeta(): SEOMetaTags {
  return {
    title: 'Политика конфиденциальности | QBIDS',
    description: 'Политика конфиденциальности QBIDS. Узнайте как мы защищаем ваши персональные данные.',
    keywords: 'политика конфиденциальности, защита данных, персональные данные',
    canonical: `${SITE_URL}/privacy-policy`,
    ogTitle: 'Политика конфиденциальности | QBIDS',
    ogDescription: 'Политика обработки персональных данных на платформе QBIDS.',
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'article',
    ogUrl: `${SITE_URL}/privacy-policy`,
    robots: 'index, nofollow',
    language: 'ru',
  };
}

/**
 * Generate meta tags for Terms of Service page
 */
export function generateTermsOfServiceMeta(): SEOMetaTags {
  return {
    title: 'Условия использования | QBIDS',
    description: 'Пользовательское соглашение QBIDS. Условия использования платформы пенни-аукционов.',
    keywords: 'условия использования, пользовательское соглашение, правила сервиса',
    canonical: `${SITE_URL}/terms-of-service`,
    ogTitle: 'Условия использования | QBIDS',
    ogDescription: 'Пользовательское соглашение платформы QBIDS.',
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'article',
    ogUrl: `${SITE_URL}/terms-of-service`,
    robots: 'index, nofollow',
    language: 'ru',
  };
}

/**
 * Generate meta tags for Top Up page
 */
export function generateTopUpMeta(): SEOMetaTags {
  return {
    title: 'Купить ставки | QBIDS - Пакеты ставок',
    description: 'Купите пакеты ставок для участия в пенни-аукционах QBIDS. Выгодные цены, моментальное зачисление.',
    keywords: 'купить ставки, пакеты ставок, пополнить баланс qbids',
    canonical: `${SITE_URL}/topup`,
    ogTitle: 'Купить ставки | QBIDS',
    ogDescription: 'Пополните баланс ставок и участвуйте в выгодных аукционах!',
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    ogUrl: `${SITE_URL}/topup`,
    robots: 'noindex, nofollow', // User-specific page
    language: 'ru',
  };
}

export { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE };
