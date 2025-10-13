import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/use-language";

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function CompleteProfileModal({ isOpen, onClose, onComplete }: CompleteProfileModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "+996",
    dateOfBirth: "",
    gender: "" as "male" | "female" | "other" | "",
  });

  const [validationState, setValidationState] = useState({
    phone: { valid: null as boolean | null, message: "" },
  });

  const [validatingField, setValidatingField] = useState<string | null>(null);

  // Phone number formatting
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+996')) {
      return '+996';
    }
    return cleaned.substring(0, 13);
  };

  // Phone validation with debounce
  const validatePhone = async (phone: string) => {
    if (!phone || phone === '+996') return;
    
    setValidatingField('phone');
    try {
      const response = await apiRequest("POST", "/api/auth/validate-phone", { phone });
      const result = await response.json();
      setValidationState(prev => ({
        ...prev,
        phone: { valid: result.valid, message: result.message }
      }));
    } catch (error) {
      setValidationState(prev => ({
        ...prev,
        phone: { valid: false, message: "Ошибка проверки номера" }
      }));
    } finally {
      setValidatingField(null);
    }
  };

  // Debounced phone validation
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const debouncedValidatePhone = debounce(validatePhone, 500);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PUT", "/api/users/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Профиль обновлен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      onComplete();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || "Ошибка обновления профиля",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.firstName.trim()) {
      toast({
        title: t("error"),
        description: "Имя обязательно для заполнения",
        variant: "destructive",
      });
      return;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: t("error"),
        description: "Фамилия обязательна для заполнения",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone || formData.phone === '+996') {
      toast({
        title: t("error"),
        description: "Телефон обязателен для заполнения",
        variant: "destructive",
      });
      return;
    }

    if (!formData.dateOfBirth) {
      toast({
        title: t("error"),
        description: "Дата рождения обязательна для заполнения",
        variant: "destructive",
      });
      return;
    }

    if (!formData.gender) {
      toast({
        title: t("error"),
        description: "Пол обязателен для заполнения",
        variant: "destructive",
      });
      return;
    }

    // Validate age (18+)
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
      ? age - 1 
      : age;
    
    if (actualAge < 18) {
      toast({
        title: t("error"),
        description: "Вам должно быть минимум 18 лет",
        variant: "destructive",
      });
      return;
    }

    // Check phone validation
    if (validationState.phone.valid === false) {
      toast({
        title: t("error"),
        description: validationState.phone.message,
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    setValidationState(prev => ({
      ...prev,
      phone: { valid: null, message: "" }
    }));
    debouncedValidatePhone(formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 rounded-none md:w-[95vw] md:max-w-lg md:mx-auto md:h-auto md:max-h-[90vh] md:rounded-xl md:p-0 bg-white border-0 shadow-2xl overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                <i className="fas fa-user-edit mr-2 text-blue-600"></i>
                Завершите профиль
              </h2>
              <p className="text-sm text-slate-600">Заполните данные для участия в аукционах</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-700 flex items-center">
                      <i className="fas fa-user mr-2 text-slate-400 text-xs"></i>
                      {t("firstName")} *
                    </Label>
                    <Input
                      id="firstName"
                      placeholder={t("firstName")}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-700 flex items-center">
                      <i className="fas fa-user mr-2 text-slate-400 text-xs"></i>
                      {t("lastName")} *
                    </Label>
                    <Input
                      id="lastName"
                      placeholder={t("lastName")}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700 flex items-center">
                    <i className="fas fa-phone mr-2 text-slate-400 text-xs"></i>
                    {t("phone")} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      placeholder="+996700123456"
                      className={`h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white pr-10 ${
                        validationState.phone.valid === true ? 'border-green-500' :
                        validationState.phone.valid === false ? 'border-red-500' : ''
                      }`}
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validatingField === 'phone' && (
                        <i className="fas fa-spinner fa-spin text-slate-400 text-sm"></i>
                      )}
                      {validatingField !== 'phone' && validationState.phone.valid === true && (
                        <i className="fas fa-check-circle text-green-500 text-sm"></i>
                      )}
                      {validatingField !== 'phone' && validationState.phone.valid === false && (
                        <i className="fas fa-times-circle text-red-500 text-sm"></i>
                      )}
                    </div>
                  </div>
                  {validationState.phone.message && (
                    <p className={`text-sm flex items-center ${validationState.phone.valid ? 'text-green-600' : 'text-red-500'}`}>
                      <i className={`fas ${validationState.phone.valid ? 'fa-check' : 'fa-times'} mr-1 text-xs`}></i>
                      {validationState.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700 flex items-center">
                    <i className="fas fa-calendar mr-2 text-slate-400 text-xs"></i>
                    {t("dateOfBirth")} *
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    required
                  />
                  <p className="text-xs text-slate-500">Вам должно быть минимум 18 лет</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-slate-700 flex items-center">
                    <i className="fas fa-venus-mars mr-2 text-slate-400 text-xs"></i>
                    {t("gender")} *
                  </Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value: "male" | "female" | "other") => setFormData(prev => ({ ...prev, gender: value }))}
                    required
                  >
                    <SelectTrigger className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white">
                      <SelectValue placeholder={t("selectGender")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t("male")}</SelectItem>
                      <SelectItem value="female">{t("female")}</SelectItem>
                      <SelectItem value="other">{t("other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                    onClick={onClose}
                    disabled={updateProfileMutation.isPending}
                  >
                    <i className="fas fa-times mr-2"></i>
                    Пропустить
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Завершить профиль
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Info Section */}
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div className="flex items-start space-x-3">
                  <i className="fas fa-info-circle text-amber-600 mt-0.5"></i>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-amber-800 mb-1">Зачем заполнять профиль?</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">Для участия в аукционах необходимы полные данные профиля. Это обеспечивает безопасность и соответствие требованиям.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}