import { useDocumentTitle } from "@/hooks/use-document-title";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TermsOfService() {
  useDocumentTitle("Условия использования - QBIDS.KG | Пользовательское соглашение");

  const termssections = [
    {
      title: "1. Общие условия",
      content: [
        "Настоящие Условия использования регулируют порядок использования сервиса QBIDS.KG.",
        "Регистрируясь на сайте и используя наши услуги, вы соглашаетесь с данными условиями в полном объеме.",
        "Если вы не согласны с какими-либо положениями, пожалуйста, прекратите использование сервиса.",
        "Администрация оставляет за собой право изменять условия использования без предварительного уведомления."
      ]
    },
    {
      title: "2. Описание сервиса",
      content: [
        "QBIDS.KG - это платформа для проведения пенни-аукционов в Кыргызской Республике.",
        "Сервис позволяет пользователям участвовать в аукционах, делать ставки и приобретать товары по выигрышным ценам.",
        "Все аукционы проводятся в соответствии с правилами, опубликованными на сайте.",
        "Администрация не гарантирует постоянную доступность сервиса и может приостанавливать работу для технического обслуживания."
      ]
    },
    {
      title: "3. Регистрация и аккаунт пользователя",
      content: [
        "Для участия в аукционах необходима регистрация на сайте.",
        "При регистрации вы обязуетесь предоставить достоверную и актуальную информацию.",
        "Вы несете полную ответственность за сохранность данных своего аккаунта.",
        "Запрещается создание множественных аккаунтов одним пользователем.",
        "Администрация имеет право заблокировать аккаунт при нарушении правил."
      ]
    },
    {
      title: "4. Правила участия в аукционах",
      content: [
        "Участие в аукционах возможно только после пополнения баланса бидов.",
        "Каждая ставка списывает один бид с баланса пользователя.",
        "Потраченные биды не возвращаются независимо от результата аукциона.",
        "Победитель аукциона обязан оплатить финальную стоимость товара в течение 48 часов.",
        "При отказе от покупки товар может быть предложен следующему участнику."
      ]
    },
    {
      title: "5. Платежи и возвраты",
      content: [
        "Все платежи на сайте производятся в сомах Кыргызской Республики.",
        "Администрация принимает оплату банковскими картами и электронными кошельками.",
        "Биды не подлежат возврату в денежном эквиваленте.",
        "Возврат средств возможен только в случае технических ошибок системы.",
        "Все спорные вопросы по платежам рассматриваются в индивидуальном порядке."
      ]
    },
    {
      title: "6. Интеллектуальная собственность",
      content: [
        "Все материалы сайта (дизайн, тексты, логотипы) являются собственностью QBIDS.KG.",
        "Пользователям запрещается копировать, распространять или использовать материалы сайта без письменного разрешения.",
        "Торговые марки и логотипы третьих лиц используются с соответствующими разрешениями.",
        "Нарушение авторских прав влечет ответственность в соответствии с законодательством."
      ]
    }
  ];

  const prohibitions = [
    "Использование автоматических программ и скриптов",
    "Попытки взлома или нарушения работы сайта",
    "Размещение вредоносного контента",
    "Мошеннические действия и обман других пользователей",
    "Нарушение авторских прав третьих лиц",
    "Распространение спама и рекламы",
    "Оскорбительное поведение по отношению к другим пользователям",
    "Попытки обхода технических ограничений сайта"
  ];

  const liabilityItems = [
    {
      title: "Ограничение ответственности",
      description: "QBIDS.KG не несет ответственности за косвенные убытки, упущенную выгоду или моральный вред."
    },
    {
      title: "Качество товаров",
      description: "Администрация стремится предоставлять точную информацию о товарах, но не гарантирует отсутствие ошибок."
    },
    {
      title: "Технические сбои",
      description: "В случае технических проблем администрация принимает меры по их устранению в кратчайшие сроки."
    },
    {
      title: "Действия пользователей",
      description: "Каждый пользователь несет личную ответственность за свои действия на платформе."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-[1504px] mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-file-contract text-white text-3xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Условия использования</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Пользовательское соглашение определяет правила и условия использования платформы QBIDS.KG.
          </p>
          <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>Вступили в силу: 01.01.2025</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</span>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8 mb-12">
          {termssections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Prohibited Actions */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <i className="fas fa-exclamation-triangle mr-3"></i>
              Запрещенные действия
            </CardTitle>
            <CardDescription>
              Следующие действия строго запрещены и могут привести к блокировке аккаунта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prohibitions.map((prohibition, index) => (
                <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg border border-red-100">
                  <i className="fas fa-times-circle text-red-500 mr-3 mt-1 flex-shrink-0"></i>
                  <span className="text-red-700 text-sm">{prohibition}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Liability and Warranties */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-balance-scale text-blue-600 mr-3"></i>
              Ответственность и гарантии
            </CardTitle>
            <CardDescription>
              Важная информация об ограничениях ответственности и предоставляемых гарантиях
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liabilityItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dispute Resolution */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-handshake text-green-600 mr-3"></i>
              Разрешение споров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Досудебное урегулирование</h3>
                <p className="text-blue-700 text-sm">
                  Все споры рассматриваются в первую очередь путем переговоров. Обращайтесь в службу поддержки для решения конфликтных ситуаций.
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">Применимое право</h3>
                <p className="text-orange-700 text-sm">
                  Настоящие условия регулируются законодательством Кыргызской Республики. Споры подлежат рассмотрению в судах Кыргызстана.
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Сроки обращения</h3>
                <p className="text-green-700 text-sm">
                  Претензии должны быть направлены в течение 30 дней с момента возникновения спорной ситуации.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact and Changes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-envelope text-blue-600 mr-3"></i>
                Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <i className="fas fa-envelope w-5 mr-3"></i>
                  <span>legal@qbids.kg</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <i className="fas fa-phone w-5 mr-3"></i>
                  <span>+996 XXX XXX XXX</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <i className="fas fa-map-marker-alt w-5 mr-3"></i>
                  <span>г. Бишкек, Кыргызская Республика</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-edit text-purple-600 mr-3"></i>
                Изменения условий
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>Администрация имеет право изменять условия использования в любое время.</p>
                <p>Изменения вступают в силу с момента публикации на сайте.</p>
                <p>Продолжение использования сервиса означает согласие с новыми условиями.</p>
                <Badge variant="outline" className="mt-2">
                  Версия 1.0
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}