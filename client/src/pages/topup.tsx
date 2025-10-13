import { useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Header } from '@/components/header';

export default function TopUp() {
  const { t } = useLanguage();

  useEffect(() => {
    // Set page title
    document.title = `${t('topUpBalance')} - QBIDS.KG`;
    
    // Load Digiseller widget exactly as per documentation
    const loadDigisellerWidget = () => {
      if (typeof window === 'undefined') return;
      
      // Digiseller widget code (exact copy from documentation)
      const script = document.createElement('script');
      script.innerHTML = `!function(e){var l=function(l){return e.cookie.match(new RegExp("(?:^|; )digiseller-"+l+"=([^;]*)"))},i=l("lang"),s=l("cart_uid"),t=i?"&lang="+i[1]:"",d=s?"&cart_uid="+s[1]:"",r=e.getElementsByTagName("head")[0]||e.documentElement,n=e.createElement("link"),a=e.createElement("script");n.type="text/css",n.rel="stylesheet",n.id="digiseller-css",n.href="//shop.digiseller.com/xml/store2_css.asp?seller_id=1419688",a.async=!0,a.id="digiseller-js",a.src="//digiseller.com/store2/digiseller-api.js.asp?seller_id=1419688"+t+d,!e.getElementById(n.id)&&r.appendChild(n),!e.getElementById(a.id)&&r.appendChild(a)}(document);`;
      document.head.appendChild(script);
    };

    loadDigisellerWidget();
  }, [t]);

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

        {/* Digiseller Store Widget - Exact Implementation from Documentation */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Пакеты Бидов
          </h2>
          
          {/* Digiseller Widget Script (Exact from documentation) */}
          <script 
            dangerouslySetInnerHTML={{
              __html: `!function(e){var l=function(l){return e.cookie.match(new RegExp("(?:^|; )digiseller-"+l+"=([^;]*)"))},i=l("lang"),s=l("cart_uid"),t=i?"&lang="+i[1]:"",d=s?"&cart_uid="+s[1]:"",r=e.getElementsByTagName("head")[0]||e.documentElement,n=e.createElement("link"),a=e.createElement("script");n.type="text/css",n.rel="stylesheet",n.id="digiseller-css",n.href="//shop.digiseller.com/xml/store2_css.asp?seller_id=1419688",a.async=!0,a.id="digiseller-js",a.src="//digiseller.com/store2/digiseller-api.js.asp?seller_id=1419688"+t+d,!e.getElementById(n.id)&&r.appendChild(n),!e.getElementById(a.id)&&r.appendChild(a)}(document);`
            }}
          />
          
          {/* Digiseller Store Widget (Exact from documentation) */}
          <span 
            className="digiseller-body" 
            id="digiseller-body" 
            data-partner-id="" 
            data-cat="h" 
            data-logo="1" 
            data-downmenu="1" 
            data-purchases="1" 
            data-langs="1" 
            data-cart="1" 
            data-search="1"
          ></span>
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
              <p className="text-slate-600">Выберите подходящий пакет бидов из виджета Digiseller</p>
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