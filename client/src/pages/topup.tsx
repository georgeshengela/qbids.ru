import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/header';
import { trackTopUp } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import goldBagImage from '@assets/img_1755139968219.png';

// Bid packages data
const bidPackages = [
  {
    id: 1,
    title: "50 ставок",
    bids: 50,
    price: 750,
    originalPrice: 1000,
    savings: 250,
    popular: false,
    description: "Идеально для начинающих"
  },
  {
    id: 2,
    title: "100 ставок",
    bids: 100,
    price: 1500,
    originalPrice: 2000,
    savings: 500,
    popular: false,
    description: "Для активных участников"
  },
  {
    id: 3,
    title: "250 ставок",
    bids: 250,
    price: 3750,
    originalPrice: 5000,
    savings: 1250,
    popular: true,
    description: "Самый выгодный выбор"
  },
  {
    id: 4,
    title: "500 ставок",
    bids: 500,
    price: 7500,
    originalPrice: 10000,
    savings: 2500,
    popular: false,
    description: "Для профессионалов"
  },
  {
    id: 5,
    title: "1000 ставок",
    bids: 1000,
    price: 15000,
    originalPrice: 20000,
    savings: 5000,
    popular: false,
    description: "Максимальный пакет"
  }
];

export default function TopUp() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Set page title
    document.title = `${t('topUpBalance')} - QBIDS.RU`;
    
    // Set viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(meta);
    }
    
    // Set description meta tag
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', 'Пополните баланс для участия в аукционах QBIDS.KG');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Пополните баланс для участия в аукционах QBIDS.KG';
      document.head.appendChild(meta);
    }
  }, [t]);

  const handleBuyPackage = (packageId: number) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Пожалуйста, войдите в систему для пополнения баланса",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Find the package
    const selectedPackage = bidPackages.find(pkg => pkg.id === packageId);
    if (selectedPackage) {
      // Track the purchase initiation
      trackTopUp(selectedPackage.price);
    }

    // Static Digiseller payment URLs with user ID passed as parameter
    const basePaymentUrls: { [key: number]: string } = {
      1: 'https://oplata.info/asp2/pay_wm.asp?id_d=5484776&lang=ru-RU',
      2: 'https://oplata.info/asp2/pay_wm.asp?id_d=5487610&lang=ru-RU',
      3: 'https://oplata.info/asp2/pay_wm.asp?id_d=5355203&lang=ru-RU',
      4: 'https://oplata.info/asp2/pay_wm.asp?id_d=5355213&lang=ru-RU',
      5: 'https://oplata.info/asp2/pay_wm.asp?id_d=5355214&lang=ru-RU'
    };

    const baseUrl = basePaymentUrls[packageId];
    if (baseUrl) {
      // Add user ID as custom parameter - Digiseller will pass it back in Through parameter
      const paymentUrl = `${baseUrl}&userid=${user.id}`;
      
      // Open Digiseller payment page in new tab
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      
      // Show info message
      toast({
        title: "Платежная страница открыта",
        description: "После оплаты обновите баланс через профиль или обратитесь в поддержку",
        duration: 7000,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} сом`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            {t('topUpBalance')}
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Выберите пакет бидов и начните выигрывать в аукционах уже сегодня
          </p>
        </div>

        {/* Bid Packages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {bidPackages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`relative bg-white rounded-3xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                pkg.popular 
                  ? 'border-gradient-to-r from-yellow-400 to-amber-500 ring-4 ring-yellow-100' 
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center space-x-1">
                    <span>⭐</span>
                    <span>ПОПУЛЯРНЫЙ</span>
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Gold Coins Bag Image */}
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <img 
                    src={goldBagImage}
                    alt="Gold coins bag"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Package Title */}
                <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                  {pkg.title}
                </h3>

                {/* Bids Count */}
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {pkg.bids}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    {pkg.bids === 1 ? 'бид' : 'бидов'}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 text-center mb-4">
                  {pkg.description}
                </p>

                {/* Pricing */}
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {formatCurrency(pkg.price)}
                  </div>
                  <div className="text-sm text-slate-400 line-through">
                    {formatCurrency(pkg.originalPrice)}
                  </div>
                  <div className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold mt-2">
                    Экономия {formatCurrency(pkg.savings)}
                  </div>
                </div>

                {/* Buy Button */}
                <Button 
                  onClick={() => handleBuyPackage(pkg.id)}
                  className={`w-full h-12 rounded-xl font-semibold transition-all duration-200 ${
                    pkg.popular 
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white shadow-lg' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  <i className="fas fa-shopping-cart mr-2"></i>
                  Купить сейчас
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shield-alt text-green-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Безопасная оплата</h3>
            <p className="text-slate-600">Все платежи защищены SSL шифрованием и проходят через надежную платежную систему</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-bolt text-blue-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Мгновенное зачисление</h3>
            <p className="text-slate-600">Биды поступят на ваш счет автоматически сразу после успешной оплаты</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-headset text-purple-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Поддержка 24/7</h3>
            <p className="text-slate-600">Наша команда поддержки готова помочь вам в любое время дня и ночи</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            Как это работает
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Выберите пакет</h3>
              <p className="text-slate-600">Выберите подходящий пакет бидов из представленных выше</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Оплатите покупку</h3>
              <p className="text-slate-600">Безопасно оплатите выбранный пакет любым удобным способом</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Начните участвовать</h3>
              <p className="text-slate-600">Биды автоматически зачислятся и вы сможете участвовать в аукционах</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}