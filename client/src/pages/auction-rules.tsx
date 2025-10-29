import { useDocumentTitle } from "@/hooks/use-document-title";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AuctionRules() {
  useDocumentTitle("Правила аукционов - QBIDS.RU | Условия участия в пенни-аукционах");
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();

  const rulesSections = [
    {
      icon: "fas fa-play-circle",
      title: "Как начать участие",
      color: "green",
      rules: [
        "Зарегистрируйтесь на сайте QBIDS.RU",
        "Пополните баланс бидов через удобный способ оплаты",
        "Выберите интересующий вас аукцион",
        "Дождитесь начала аукциона и начинайте делать ставки"
      ]
    },
    {
      icon: "fas fa-gavel",
      title: "Правила ставок",
      color: "blue",
      rules: [
        `Каждая ставка стоит ${t("oneBid")} из вашего баланса`,
        `Ставка увеличивает цену товара на ${formatCurrency(0.01)}`,
        "Время аукциона продлевается на 10-15 секунд после каждой ставки",
        "Ставки нельзя отменить после их размещения",
        "Минимальный интервал между ставками одного пользователя - 1 секунда"
      ]
    },
    {
      icon: "fas fa-trophy",
      title: "Определение победителя",
      color: "yellow",
      rules: [
        "Побеждает пользователь, сделавший последнюю ставку",
        "Аукцион завершается, когда таймер достигает 0",
        "Победитель оплачивает финальную цену товара",
        "Товар резервируется за победителем на 48 часов",
        "При отказе от покупки товар переходит к предыдущему участнику"
      ]
    },
    {
      icon: "fas fa-coins",
      title: "Биды и оплата",
      color: "orange",
      rules: [
        "Биды списываются сразу при размещении ставки",
        "Потраченные биды не возвращаются независимо от результата",
        "Минимальная покупка - 10 бидов",
        "Биды действительны в течение 365 дней с момента покупки",
        "Неиспользованные биды не подлежат возврату в денежном эквиваленте"
      ]
    }
  ];

  const prohibitedActions = [
    "Использование автоматических программ и ботов",
    "Создание множественных аккаунтов одним пользователем",
    "Попытки взлома или нарушения работы сайта",
    "Оскорбительное поведение в отношении других участников",
    "Попытки мошенничества или обмана системы",
    "Продажа или передача аккаунта третьим лицам"
  ];

  const deliveryRules = [
    {
      title: "Самовывоз",
      description: "Бесплатно из офиса в Москве",
      time: "В рабочие дни с 9:00 до 18:00"
    },
    {
      title: "Доставка по Москве",
      description: "Курьерская доставка",
      time: "500 руб, 1-2 рабочих дня"
    },
    {
      title: "Доставка по России",
      description: "Почтовая служба или транспортные компании",
      time: "По тарифам перевозчика, 3-7 дней"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-[1504px] mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-balance-scale text-white text-3xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Правила аукционов</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ознакомьтесь с правилами участия в пенни-аукционах QBIDS.RU для честной и безопасной игры.
          </p>
        </div>

        {/* Main Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {rulesSections.map((section, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className={`w-12 h-12 bg-${section.color}-100 rounded-lg flex items-center justify-center mr-4`}>
                    <i className={`${section.icon} text-${section.color}-600 text-xl`}></i>
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.rules.map((rule, ruleIndex) => (
                    <li key={ruleIndex} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mr-3 mt-1 flex-shrink-0"></i>
                      <span className="text-gray-700">{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Prohibited Actions */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <i className="fas fa-ban mr-3"></i>
              Запрещенные действия
            </CardTitle>
            <CardDescription>
              Нарушение этих правил приведет к блокировке аккаунта без возмещения средств
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prohibitedActions.map((action, index) => (
                <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg border border-red-100">
                  <i className="fas fa-times-circle text-red-500 mr-3 mt-1 flex-shrink-0"></i>
                  <span className="text-red-700">{action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Rules */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-shipping-fast text-blue-600 mr-3"></i>
              Правила доставки
            </CardTitle>
            <CardDescription>
              Условия получения выигранных товаров
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {deliveryRules.map((delivery, index) => (
                <div key={index} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{delivery.title}</h3>
                  <p className="text-gray-600 mb-2">{delivery.description}</p>
                  <Badge variant="outline" className="text-sm">
                    {delivery.time}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-exclamation-triangle text-yellow-600 mr-3"></i>
              Важные замечания
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Ответственность участника</h3>
                <p className="text-yellow-700">
                  Участвуя в аукционах, вы соглашаетесь с тем, что понимаете принцип работы пенни-аукционов и принимаете возможные риски.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Техническая поддержка</h3>
                <p className="text-blue-700">
                  При технических проблемах во время аукциона немедленно обратитесь в службу поддержки. Компенсация возможна только при подтвержденных технических неполадках.
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Честная игра</h3>
                <p className="text-green-700">
                  QBIDS.RU стремится обеспечить честные и прозрачные аукционы для всех участников. Мы постоянно мониторим систему для предотвращения мошенничества.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}