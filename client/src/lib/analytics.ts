import { hasConsentedToAnalytics } from './cookie-utils';

// Define global tracking functions
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
  }
}

// Initialize Google Analytics only if user has consented
export const initGA = () => {
  // Check if user has consented to analytics cookies
  if (!hasConsentedToAnalytics()) {
    console.log('Analytics cookies not consented, skipping GA initialization');
    return;
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag || !hasConsentedToAnalytics()) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Track events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !hasConsentedToAnalytics()) return;
  
  // Track with Google Analytics
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
  
  // Track with Facebook Pixel
  if (window.fbq) {
    window.fbq('track', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Facebook Pixel specific tracking functions
export const trackFacebookEvent = (eventName: string, parameters?: any) => {
  if (typeof window === 'undefined' || !window.fbq || !hasConsentedToAnalytics()) return;
  
  if (parameters) {
    window.fbq('track', eventName, parameters);
  } else {
    window.fbq('track', eventName);
  }
};

// Common Facebook Pixel events for auction platform
export const trackRegistration = () => {
  trackFacebookEvent('CompleteRegistration');
  trackEvent('sign_up', 'engagement', 'user_registration');
};

export const trackBidPlaced = (value?: number, auctionId?: string) => {
  trackFacebookEvent('Purchase', { 
    value: value || 1, 
    currency: 'KGS',
    content_ids: auctionId ? [auctionId] : undefined
  });
  trackEvent('bid_placed', 'auction', 'bid_action', value);
};

export const trackAuctionView = (auctionId: string, auctionTitle?: string) => {
  trackFacebookEvent('ViewContent', {
    content_ids: [auctionId],
    content_name: auctionTitle,
    content_type: 'auction'
  });
  trackEvent('view_auction', 'auction', auctionTitle);
};

export const trackTopUp = (value: number) => {
  trackFacebookEvent('AddPaymentInfo', { value, currency: 'KGS' });
  trackEvent('add_payment_info', 'monetization', 'top_up', value);
};