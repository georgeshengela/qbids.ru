import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = `${t('paymentSuccessful')} - QBIDS.KG`;
  }, [t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Оплата успешна!
          </h1>

          {/* Message */}
          <p className="text-lg text-slate-600 mb-8">
            Ваш платеж был успешно обработан. Биды будут зачислены на ваш счет в течение нескольких минут.
          </p>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <i className="fas fa-info-circle text-blue-600 text-xl mt-1"></i>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900 mb-2">Что дальше?</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>✓ Биды автоматически зачислены на ваш счет</li>
                  <li>✓ Проверьте ваш новый баланс в правом верхнем углу</li>
                  <li>✓ Начните участвовать в активных аукционах</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/auctions')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
            >
              <i className="fas fa-gavel mr-2"></i>
              Перейти к аукционам
            </Button>
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              className="px-8 py-3 rounded-xl font-semibold"
            >
              <i className="fas fa-user mr-2"></i>
              Мой профиль
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

