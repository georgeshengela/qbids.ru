import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X, Settings } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if user has already consented to cookies
    const hasConsented = localStorage.getItem("cookie-consent");
    if (!hasConsented) {
      // Show banner after a brief delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-preferences", JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    }));
    setIsVisible(false);
    window.location.reload(); // Reload to apply analytics
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem("cookie-consent", "necessary-only");
    localStorage.setItem("cookie-preferences", JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    }));
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    localStorage.setItem("cookie-preferences", JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4">
      <Card className="max-w-7xl mx-auto bg-white border-2 border-yellow-400 shadow-2xl">
        <div className="p-3 sm:p-4">
          {!showSettings ? (
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <Cookie className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm flex-1 min-w-0">
                  <p className="font-medium text-gray-900 mb-1">{t("weUseCookies")}</p>
                  <p className="text-gray-600">
                    {t("cookieDescription")}
                    <Link href="/privacy-policy" className="text-blue-600 hover:underline ml-1">
                      {t("learnMore")}
                    </Link>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReject}
                  className="p-1.5 sm:hidden flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="text-xs sm:text-sm justify-center sm:justify-start whitespace-nowrap"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  {t("settings")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptNecessary}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  {t("onlyNecessary")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-yellow-500 hover:bg-yellow-600 text-xs sm:text-sm whitespace-nowrap"
                >
                  {t("acceptAll")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReject}
                  className="p-2 hidden sm:flex"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                  <Cookie className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                  <span className="truncate">{t("cookieSettings")}</span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
                <div className="bg-green-50 p-2 sm:p-3 rounded border-l-2 border-green-500">
                  <div className="font-medium text-green-800">{t("necessary")}</div>
                  <div className="text-green-600 mt-1">{t("basicSiteWork")}</div>
                </div>
                <div className="bg-blue-50 p-2 sm:p-3 rounded border-l-2 border-blue-500">
                  <div className="font-medium text-blue-800">{t("analytical")}</div>
                  <div className="text-blue-600 mt-1">{t("siteImprovement")}</div>
                </div>
                <div className="bg-purple-50 p-2 sm:p-3 rounded border-l-2 border-purple-500">
                  <div className="font-medium text-purple-800">{t("functional")}</div>
                  <div className="text-purple-600 mt-1">{t("rememberSettings")}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptNecessary}
                  className="text-xs sm:text-sm whitespace-nowrap"
                >
                  {t("onlyNecessary")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-yellow-500 hover:bg-yellow-600 text-xs sm:text-sm whitespace-nowrap"
                >
                  {t("acceptAll")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}