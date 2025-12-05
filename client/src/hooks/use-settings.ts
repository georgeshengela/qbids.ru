import { useQuery } from "@tanstack/react-query";
import type { Settings } from "@shared/schema";

export function useSettings() {
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const currency = settings?.currencySymbol || "сом";
    return `${numAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  const defaultSettings = { 
    currency: "сом", 
    currencySymbol: "сом", 
    siteName: "QBIDS.ru", 
    language: "ru",
    headerTagline: "Пенни-аукционы в Росии",
    footerDescription: "Первая пенни-аукционная платформа в Росии. Выигрывайте премиальные товары за копейки с нашей честной и прозрачной системой аукционов."
  };
  const currentSettings = settings || defaultSettings;

  return {
    settings: currentSettings,
    isLoading,
    formatCurrency,
    siteName: currentSettings.siteName,
    currency: currentSettings.currency,
    currencySymbol: currentSettings.currencySymbol,
    language: currentSettings.language,
    headerTagline: currentSettings.headerTagline,
    footerDescription: currentSettings.footerDescription,
  };
}