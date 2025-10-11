import { useState } from "react";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Settings } from "@shared/schema";

const settingsSchema = z.object({
  currency: z.string().min(1, "Валюта обязательна"),
  currencySymbol: z.string().min(1, "Символ валюты обязателен"),
  siteName: z.string().min(1, "Название сайта обязательно"),
  language: z.string().min(1, "Язык обязателен"),
  headerTagline: z.string().optional(),
  footerDescription: z.string().optional(),
  contactAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Неверный email").optional().or(z.literal("")),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const CURRENCY_OPTIONS = [
  { value: "сом", label: "Киргизский сом", symbol: "сом" },
  { value: "тенге", label: "Казахский тенге", symbol: "₸" },
  { value: "рубль", label: "Российский рубль", symbol: "₽" },
  { value: "доллар", label: "Доллар США", symbol: "$" },
  { value: "евро", label: "Евро", symbol: "€" },
  { value: "лари", label: "Грузинский лари", symbol: "₾" },
  { value: "гривна", label: "Украинская гривна", symbol: "₴" },
];

const LANGUAGE_OPTIONS = [
  { value: "ru", label: "Русский", flag: "🇷🇺" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "ka", label: "ქართული", flag: "🇬🇪" },
];

export default function AdminSettings() {
  const { isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      setLocation("/");
    }
  }, [isAdmin, isLoading, setLocation]);

  const { data: settings, isLoading: isLoadingSettings } = useQuery<Settings>({
    queryKey: ["/api/admin/settings"],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currency: settings?.currency || "сом",
      currencySymbol: settings?.currencySymbol || "сом",
      siteName: settings?.siteName || "QBIDS.KG",
      language: settings?.language || "ru",
      headerTagline: settings?.headerTagline || "Пенни-аукционы в Кыргызстане",
      footerDescription: settings?.footerDescription || "Первая пенни-аукционная платформа в Кыргызстане. Выигрывайте премиальные товары за копейки с нашей честной и прозрачной системой аукционов.",
      contactAddress: settings?.contactAddress || "г. Бишкек, ул. Чуй 154",
      contactPhone: settings?.contactPhone || "+996 (555) 123-456",
      contactEmail: settings?.contactEmail || "info@qbids.kg",
    },
  });

  // Update form when settings data loads
  useEffect(() => {
    if (settings) {
      form.reset({
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
        siteName: settings.siteName,
        language: settings.language,
        contactAddress: settings.contactAddress || "г. Бишкек, ул. Чуй 154",
        contactPhone: settings.contactPhone || "+996 (555) 123-456",
        contactEmail: settings.contactEmail || "info@qbids.kg",
      });
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      return apiRequest("PUT", "/api/admin/settings", data);
    },
    onSuccess: () => {
      toast({
        title: t("settingsUpdated"),
        description: t("settingsSaved"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("updateSettingsError"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const handleCurrencyChange = (currency: string) => {
    const currencyOption = CURRENCY_OPTIONS.find(opt => opt.value === currency);
    if (currencyOption) {
      form.setValue("currency", currency);
      form.setValue("currencySymbol", currencyOption.symbol);
    }
  };

  if (isLoading || isLoadingSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/admin")}
              className="text-slate-600 hover:text-slate-900"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Назад к панели администратора
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900">
            <i className="fas fa-cog text-blue-600 mr-3"></i>
            Настройки системы
          </h1>
          <p className="text-slate-600 mt-2">
            Управление основными настройками платформы
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* System Settings */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <CardTitle className="flex items-center text-slate-900">
                <i className="fas fa-cogs text-blue-600 mr-3"></i>
                Системные настройки
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium text-slate-700">
                    Валюта системы
                  </Label>
                  <Select 
                    value={form.watch("currency")} 
                    onValueChange={handleCurrencyChange}
                  >
                    <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Выберите валюту" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                              {option.symbol}
                            </span>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.currency && (
                    <p className="text-sm text-red-500">{form.formState.errors.currency.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currencySymbol" className="text-sm font-medium text-slate-700">
                    Символ валюты
                  </Label>
                  <Input
                    id="currencySymbol"
                    {...form.register("currencySymbol")}
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="₽, $, €, сом"
                  />
                  {form.formState.errors.currencySymbol && (
                    <p className="text-sm text-red-500">{form.formState.errors.currencySymbol.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteName" className="text-sm font-medium text-slate-700">
                    Название сайта
                  </Label>
                  <Input
                    id="siteName"
                    {...form.register("siteName")}
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="QBIDS.KG"
                  />
                  {form.formState.errors.siteName && (
                    <p className="text-sm text-red-500">{form.formState.errors.siteName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium text-slate-700">
                    Язык системы
                  </Label>
                  <Select 
                    value={form.watch("language")} 
                    onValueChange={(value) => form.setValue("language", value)}
                  >
                    <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Выберите язык" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{option.flag}</span>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.language && (
                    <p className="text-sm text-red-500">{form.formState.errors.language.message}</p>
                  )}
                </div>

                {/* Branding Section */}
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    <i className="fas fa-palette text-blue-600 mr-2"></i>
                    Брендинг и тексты
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="headerTagline" className="text-sm font-medium text-slate-700">
                        Подзаголовок в шапке
                      </Label>
                      <Input
                        id="headerTagline"
                        {...form.register("headerTagline")}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                        placeholder="Пенни-аукционы в Кыргызстане"
                      />
                      <p className="text-xs text-slate-500">Текст, который отображается под логотипом в шапке сайта</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="footerDescription" className="text-sm font-medium text-slate-700">
                        Описание в подвале
                      </Label>
                      <textarea
                        id="footerDescription"
                        {...form.register("footerDescription")}
                        className="min-h-[80px] w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Первая пенни-аукционная платформа в Кыргызстане. Выигрывайте премиальные товары за копейки с нашей честной и прозрачной системой аукционов."
                        rows={3}
                      />
                      <p className="text-xs text-slate-500">Описание компании, которое отображается в подвале сайта</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    <i className="fas fa-address-card text-blue-600 mr-2"></i>
                    {t("contactSettings")}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactAddress" className="text-sm font-medium text-slate-700">
                        {t("contactAddress")}
                      </Label>
                      <Input
                        id="contactAddress"
                        {...form.register("contactAddress")}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                        placeholder="г. Бишкек, ул. Чуй 154"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">
                        {t("contactPhone")}
                      </Label>
                      <Input
                        id="contactPhone"
                        {...form.register("contactPhone")}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                        placeholder="+996 (555) 123-456"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="contactEmail" className="text-sm font-medium text-slate-700">
                        {t("contactEmail")}
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        {...form.register("contactEmail")}
                        className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                        placeholder="info@qbids.kg"
                      />
                      {form.formState.errors.contactEmail && (
                        <p className="text-sm text-red-500">{form.formState.errors.contactEmail.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    <i className="fas fa-info-circle mr-2"></i>
                    Изменения применятся ко всей системе
                  </div>
                  <Button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Сохранить настройки
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Current Settings Preview */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <CardTitle className="flex items-center text-slate-900">
                <i className="fas fa-eye text-blue-600 mr-3"></i>
                Текущие настройки
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <div className="font-medium text-green-900">Валюта</div>
                    <div className="text-sm text-green-700">{settings?.currency || "сом"}</div>
                  </div>
                  <div className="text-2xl font-mono text-green-600">
                    {settings?.currencySymbol || "сом"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <div className="font-medium text-blue-900">Название сайта</div>
                    <div className="text-sm text-blue-700">{settings?.siteName || "QBIDS.KG"}</div>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    <i className="fas fa-globe mr-2"></i>
                    {settings?.siteName || "QBIDS.KG"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div>
                    <div className="font-medium text-purple-900">Язык системы</div>
                    <div className="text-sm text-purple-700">{LANGUAGE_OPTIONS.find(lang => lang.value === (settings?.language || "ru"))?.label || "Русский"}</div>
                  </div>
                  <div className="text-2xl">
                    {LANGUAGE_OPTIONS.find(lang => lang.value === (settings?.language || "ru"))?.flag || "🇷🇺"}
                  </div>
                </div>

                {/* Contact Information Preview */}
                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <div className="font-medium text-orange-900">Контактная информация</div>
                    <div className="text-sm text-orange-700 space-y-1">
                      <div><i className="fas fa-map-marker-alt mr-2"></i>{settings?.contactAddress || "г. Бишкек, ул. Чуй 154"}</div>
                      <div><i className="fas fa-phone mr-2"></i>{settings?.contactPhone || "+996 (555) 123-456"}</div>
                      <div><i className="fas fa-envelope mr-2"></i>{settings?.contactEmail || "info@qbids.kg"}</div>
                    </div>
                  </div>
                  <div className="text-2xl text-orange-600">
                    <i className="fas fa-address-card"></i>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Примеры отображения:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-3 bg-slate-50 rounded">
                      <span>Цена товара:</span>
                      <span className="font-semibold">1,500.00 {form.watch("currencySymbol")}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded">
                      <span>Стоимость ставки:</span>
                      <span className="font-semibold">0.01 {form.watch("currencySymbol")}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded">
                      <span>Сэкономлено:</span>
                      <span className="font-semibold text-green-600">1,200.00 {form.watch("currencySymbol")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}