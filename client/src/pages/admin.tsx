import { Header } from "@/components/header";
import { AdminPanel } from "@/components/admin-panel";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";

export default function Admin() {
  const { isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      setLocation("/");
    }
  }, [isAdmin, isLoading, setLocation]);

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-slate-900">
            <i className="fas fa-shield-alt text-blue-600 mr-3"></i>
            Панель администратора
          </h1>
          <p className="text-slate-600 mt-2">
            Управление аукционами, ботами и системой
          </p>
          
          {/* Navigation */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200">
              <i className="fas fa-chart-line mr-2"></i>
              <span className="font-medium">Аукционы и боты</span>
            </div>
            <Link href="/admin/settings">
              <div className="flex items-center bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg border border-slate-200 transition-colors cursor-pointer">
                <i className="fas fa-cog mr-2"></i>
                <span className="font-medium">Настройки</span>
              </div>
            </Link>
          </div>
        </div>

        <AdminPanel />
      </main>
    </div>
  );
}
