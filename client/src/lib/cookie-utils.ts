// Utility functions for managing cookie consent

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export const getCookieConsent = (): string | null => {
  return localStorage.getItem("cookie-consent");
};

export const getCookiePreferences = (): CookiePreferences => {
  const preferences = localStorage.getItem("cookie-preferences");
  if (preferences) {
    try {
      return JSON.parse(preferences);
    } catch {
      // Return default preferences if parsing fails
    }
  }
  
  // Default preferences (only necessary cookies)
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false
  };
};

export const resetCookieConsent = () => {
  localStorage.removeItem("cookie-consent");
  localStorage.removeItem("cookie-preferences");
};

export const hasConsentedToAnalytics = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences.analytics;
};

export const hasConsentedToMarketing = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences.marketing;
};

export const hasConsentedToFunctional = (): boolean => {
  const preferences = getCookiePreferences();
  return preferences.functional;
};