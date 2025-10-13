import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useSettings } from "@/hooks/use-settings";
import { trackRegistration } from "@/lib/analytics";

// Schema factories to use with translations
const createLoginSchema = (t: any) => z.object({
  username: z.string().min(1, t("enterLogin")),
  password: z.string().min(1, t("enterPassword")),
});

const createRegisterSchema = (t: any) => z.object({
  username: z.string().min(3, t("loginMinLength")),
  email: z.string().email(t("invalidEmailFormat")),
  password: z.string().min(6, t("passwordMinLength")),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t("passwordsDoNotMatch"),
  path: ["confirmPassword"],
});

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState("login");
  const [validationState, setValidationState] = useState({
    username: { valid: null, message: "" },
    email: { valid: null, message: "" }
  });
  const [validatingField, setValidatingField] = useState<string | null>(null);
  const { toast } = useToast();
  const { login, register, loginPending, registerPending } = useAuth();
  const { t } = useLanguage();
  const { siteName } = useSettings();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(createRegisterSchema(t)),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Live validation functions
  const validateField = async (field: 'username' | 'email', value: string) => {
    if (!value || value.length < 3) {
      setValidationState(prev => ({
        ...prev,
        [field]: { valid: null, message: "" }
      }));
      return;
    }
    
    setValidatingField(field);
    try {
      const response = await fetch(`/api/auth/validate-${field}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      
      const data = await response.json();
      
      setValidationState(prev => ({
        ...prev,
        [field]: { valid: data.valid, message: data.message }
      }));
    } catch (error) {
      setValidationState(prev => ({
        ...prev,
        [field]: { valid: false, message: "Ошибка проверки" }
      }));
    } finally {
      setValidatingField(null);
    }
  };

  // Debounced validation
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const debouncedValidateUsername = debounce((value: string) => validateField('username', value), 500);
  const debouncedValidateEmail = debounce((value: string) => validateField('email', value), 500);

  const handleLogin = async (data: LoginData) => {
    try {
      await login(data);
      toast({
        title: t("welcome"),
        description: t("loginSuccess"),
      });
      onLoginSuccess();
      onClose();
      loginForm.reset();
    } catch (error: any) {
      toast({
        title: t("loginError"),
        description: error.message || t("invalidCredentials"),
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (data: RegisterData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
      
      // Track successful registration
      trackRegistration();
      
      toast({
        title: t("registrationSuccess"),
        description: t("registrationSuccessDesc"),
      });
      onLoginSuccess();
      onClose();
      registerForm.reset();
      // Welcome modal will automatically show from useAuth hook
    } catch (error: any) {
      toast({
        title: t("registrationError"),
        description: error.message || t("registrationFailed"),
        variant: "destructive",
      });
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 rounded-none md:w-[95vw] md:max-w-lg md:mx-auto md:h-auto md:max-h-[90vh] md:rounded-xl md:p-0 bg-white border-0 shadow-2xl overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-8 md:px-8 md:py-6">
            <DialogHeader className="space-y-4 text-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-gavel text-white text-lg"></i>
                </div>
                <DialogTitle className="text-2xl md:text-xl font-bold text-slate-900">
                  {siteName}
                </DialogTitle>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
                {t("joinExcitingWorld")}
              </p>
            </DialogHeader>
          </div>

          {/* Content Section */}
          <div className="flex-1 px-6 py-6 md:px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl h-12 mb-8">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-lg transition-all duration-200"
                >
                  <i className="fas fa-sign-in-alt mr-2 text-sm"></i>
                  {t("login")}
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-lg transition-all duration-200"
                >
                  <i className="fas fa-user-plus mr-2 text-sm"></i>
                  {t("register")}
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-6">
                <div className="space-y-1 text-center">
                  <h3 className="text-lg font-semibold text-slate-900">{t("welcome")}</h3>
                  <p className="text-sm text-slate-600">{t("loginToYourAccount")}</p>
                </div>

                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-sm font-medium text-slate-700 flex items-center">
                      <i className="fas fa-user mr-2 text-slate-400 text-xs"></i>
                      {t("username")}
                    </Label>
                    <Input
                      id="login-username"
                      placeholder={t("enterLogin")}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white"
                      {...loginForm.register("username")}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-red-500 flex items-center">
                        <i className="fas fa-exclamation-circle mr-1 text-xs"></i>
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-slate-700 flex items-center">
                      <i className="fas fa-lock mr-2 text-slate-400 text-xs"></i>
                      {t("password")}
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder={t("enterPassword")}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500 flex items-center">
                        <i className="fas fa-exclamation-circle mr-1 text-xs"></i>
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    disabled={loginPending}
                  >
                    {loginPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {t("loggingIn")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt mr-2"></i>
                        {t("loginToAccount")}
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-6">
                <div className="space-y-1 text-center">
                  <h3 className="text-lg font-semibold text-slate-900">{t("createAccount")}</h3>
                  <p className="text-sm text-slate-600">{t("registerAndGetBids")}</p>
                </div>

                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-sm font-medium text-slate-700 flex items-center">
                      <i className="fas fa-user mr-2 text-slate-400 text-xs"></i>
                      {t("username")} *
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-username"
                        placeholder={t("chooseUniqueUsername")}
                        className={`h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white pr-10 ${
                          validationState.username?.valid === true ? 'border-green-500' :
                          validationState.username?.valid === false ? 'border-red-500' : ''
                        }`}
                        {...registerForm.register("username", {
                          onChange: (e) => {
                            setValidationState(prev => ({
                              ...prev,
                              username: { valid: null, message: "" }
                            }));
                            debouncedValidateUsername(e.target.value);
                          }
                        })}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {validatingField === 'username' && (
                          <i className="fas fa-spinner fa-spin text-slate-400 text-sm"></i>
                        )}
                        {validatingField !== 'username' && validationState.username?.valid === true && (
                          <i className="fas fa-check-circle text-green-500 text-sm"></i>
                        )}
                        {validatingField !== 'username' && validationState.username?.valid === false && (
                          <i className="fas fa-times-circle text-red-500 text-sm"></i>
                        )}
                      </div>
                    </div>
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-red-500 flex items-center">
                        <i className="fas fa-exclamation-circle mr-1 text-xs"></i>
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                    {validationState.username?.message && !registerForm.formState.errors.username && (
                      <p className={`text-sm flex items-center ${validationState.username.valid ? 'text-green-600' : 'text-red-500'}`}>
                        <i className={`fas ${validationState.username.valid ? 'fa-check' : 'fa-times'} mr-1 text-xs`}></i>
                        {validationState.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center">
                      <i className="fas fa-envelope mr-2 text-slate-400 text-xs"></i>
                      Email *
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        className={`h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white pr-10 ${
                          validationState.email?.valid === true ? 'border-green-500' :
                          validationState.email?.valid === false ? 'border-red-500' : ''
                        }`}
                        {...registerForm.register("email", {
                          onChange: (e) => {
                            setValidationState(prev => ({
                              ...prev,
                              email: { valid: null, message: "" }
                            }));
                            debouncedValidateEmail(e.target.value);
                          }
                        })}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {validatingField === 'email' && (
                          <i className="fas fa-spinner fa-spin text-slate-400 text-sm"></i>
                        )}
                        {validatingField !== 'email' && validationState.email?.valid === true && (
                          <i className="fas fa-check-circle text-green-500 text-sm"></i>
                        )}
                        {validatingField !== 'email' && validationState.email?.valid === false && (
                          <i className="fas fa-times-circle text-red-500 text-sm"></i>
                        )}
                      </div>
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                    )}
                    {validationState.email?.message && !registerForm.formState.errors.email && (
                      <p className={`text-sm flex items-center ${validationState.email.valid ? 'text-green-600' : 'text-red-500'}`}>
                        <i className={`fas ${validationState.email.valid ? 'fa-check' : 'fa-times'} mr-1 text-xs`}></i>
                        {validationState.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-medium text-slate-700 flex items-center">
                      <i className="fas fa-lock mr-2 text-slate-400 text-xs"></i>
                      {t("password")} *
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder={t("passwordMinLength")}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-500 flex items-center">
                        <i className="fas fa-exclamation-circle mr-1 text-xs"></i>
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 flex items-center">
                      <i className="fas fa-lock mr-2 text-slate-400 text-xs"></i>
                      {t("confirmPassword")} *
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t("repeatPassword")}
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg bg-white"
                      {...registerForm.register("confirmPassword")}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center">
                        <i className="fas fa-exclamation-circle mr-1 text-xs"></i>
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md mt-6"
                    disabled={registerPending}
                  >
                    {registerPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {t("registering")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus mr-2"></i>
                        {t("createAccount")}
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-center space-x-2 text-sm text-slate-600">
                    <i className="fas fa-info-circle text-blue-500"></i>
                    <span>{t("registerAndGetBidsInfo")}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer with Terms */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500 mb-2">{t("byRegisteringYouAgree")}</p>
              <div className="flex items-center justify-center space-x-1 text-xs">
                <Link href="/terms-of-service" onClick={onClose} className="text-blue-600 hover:text-blue-700 hover:underline">
                  {t("termsOfService")}
                </Link>
                <span className="text-slate-400">{t("and")}</span>
                <Link href="/privacy-policy" onClick={onClose} className="text-blue-600 hover:text-blue-700 hover:underline">
                  {t("privacyPolicy")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}