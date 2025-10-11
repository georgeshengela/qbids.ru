import { useDocumentTitle } from "@/hooks/use-document-title";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  useDocumentTitle("Политика конфиденциальности - QBIDS.KG | Защита персональных данных");

  const privacySections = [
    {
      title: "1. Общие положения",
      content: [
        "Настоящая Политика конфиденциальности определяет порядок обработки персональных данных пользователей сервиса QBIDS.KG.",
        "Администрация сайта обязуется соблюдать конфиденциальность персональных данных пользователей в соответствии с законодательством Кыргызской Республики.",
        "Политика применяется ко всей информации, которую QBIDS.KG может получить о пользователе во время использования сайта.",
        "Продолжая использование сайта, вы даете согласие на обработку персональных данных в соответствии с настоящей Политикой."
      ]
    },
    {
      title: "2. Персональные данные пользователей",
      content: [
        "Персональные данные - любая информация, относящаяся к прямо или косвенно определенному физическому лицу.",
        "QBIDS.KG обрабатывает следующие категории персональных данных: имя пользователя, адрес электронной почты, номер телефона, IP-адрес.",
        "Персональные данные обрабатываются на основании согласия пользователя, полученного при регистрации на сайте.",
        "Пользователь имеет право отозвать согласие на обработку персональных данных в любое время."
      ]
    },
    {
      title: "3. Цели обработки данных",
      content: [
        "Персональные данные обрабатываются в следующих целях:",
        "• Регистрация и авторизация пользователей на сайте",
        "• Обеспечение участия в аукционах и проведение расчетов",
        "• Связь с пользователем для решения технических и спорных вопросов",
        "• Предоставление информации о новых аукционах и акциях",
        "• Обеспечение безопасности и предотвращение мошенничества",
        "• Анализ использования сайта для улучшения качества услуг"
      ]
    },
    {
      title: "4. Способы и сроки обработки",
      content: [
        "Обработка персональных данных осуществляется с использованием средств автоматизации и без таковых.",
        "Персональные данные хранятся на серверах, расположенных на территории стран с адекватным уровнем защиты данных.",
        "Персональные данные обрабатываются в течение срока, необходимого для достижения целей обработки.",
        "После достижения целей обработки или при отзыве согласия данные подлежат уничтожению в течение 30 дней."
      ]
    },
    {
      title: "5. Передача данных третьим лицам",
      content: [
        "QBIDS.KG не передает персональные данные третьим лицам, за исключением случаев:",
        "• Получения явного согласия пользователя на передачу данных",
        "• Требования правоохранительных органов в рамках процедур, предусмотренных законодательством",
        "• Передачи партнерам для выполнения технических функций (с соблюдением конфиденциальности)",
        "• При реорганизации или продаже бизнеса (с уведомлением пользователей)"
      ]
    },
    {
      title: "6. Защита персональных данных",
      content: [
        "QBIDS.KG принимает необходимые технические и организационные меры для защиты персональных данных:",
        "• Шифрование данных при передаче и хранении",
        "• Ограничение доступа к персональным данным только уполномоченным сотрудникам",
        "• Регулярное обновление систем безопасности",
        "• Мониторинг несанкционированного доступа к данным",
        "• Обучение персонала правилам обработки персональных данных"
      ]
    },
    {
      title: "7. Использование файлов cookie",
      content: [
        "Наш сайт использует файлы cookie и аналогичные технологии для улучшения пользовательского опыта.",
        "Cookie - это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении сайта.",
        "Мы используем следующие типы cookie:",
        "• Необходимые cookie - обеспечивают базовую функциональность сайта (сессии, авторизация)",
        "• Аналитические cookie - помогают анализировать использование сайта для его улучшения",
        "• Функциональные cookie - запоминают ваши предпочтения и настройки",
        "Вы можете управлять настройками cookie через браузер или используя кнопку 'Настройки cookie' в футере сайта.",
        "Отключение необходимых cookie может ограничить функциональность сайта."
      ]
    }
  ];

  const userRights = [
    {
      title: "Право на доступ",
      description: "Получение информации о том, какие персональные данные обрабатываются"
    },
    {
      title: "Право на исправление",
      description: "Внесение изменений в неточные или неполные персональные данные"
    },
    {
      title: "Право на удаление",
      description: "Требование удаления персональных данных при отсутствии законных оснований для обработки"
    },
    {
      title: "Право на ограничение",
      description: "Ограничение обработки данных в определенных случаях"
    },
    {
      title: "Право на переносимость",
      description: "Получение персональных данных в структурированном, машиночитаемом формате"
    },
    {
      title: "Право на возражение",
      description: "Возражение против обработки персональных данных"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-[1504px] mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-shield-alt text-white text-3xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Политика конфиденциальности</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Мы серьезно относимся к защите ваших персональных данных и соблюдаем все требования законодательства о конфиденциальности.
          </p>
          <div className="mt-6 text-sm text-gray-500">
            Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-8 mb-12">
          {privacySections.map((section, index) => (
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

        {/* User Rights */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-user-check text-blue-600 mr-3"></i>
              Права пользователей
            </CardTitle>
            <CardDescription>
              В соответствии с законодательством о защите персональных данных вы имеете следующие права
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userRights.map((right, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{right.title}</h3>
                  <p className="text-sm text-gray-600">{right.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cookies and Tracking */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-cookie-bite text-orange-600 mr-3"></i>
              Использование cookies и технологий отслеживания
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Необходимые cookies</h3>
                <p className="text-blue-700 text-sm">
                  Используются для обеспечения базовой функциональности сайта, включая авторизацию и безопасность сессий.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Аналитические cookies</h3>
                <p className="text-green-700 text-sm">
                  Помогают нам понимать, как пользователи взаимодействуют с сайтом, для улучшения пользовательского опыта.
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Функциональные cookies</h3>
                <p className="text-purple-700 text-sm">
                  Запоминают ваши предпочтения и настройки для персонализации взаимодействия с сайтом.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-envelope text-blue-600 mr-3"></i>
              Контактная информация
            </CardTitle>
            <CardDescription>
              По вопросам обработки персональных данных обращайтесь к нам
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Контакты для запросов</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center">
                    <i className="fas fa-envelope w-5 mr-3"></i>
                    <span>privacy@qbids.kg</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-phone w-5 mr-3"></i>
                    <span>+996 XXX XXX XXX</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-map-marker-alt w-5 mr-3"></i>
                    <span>г. Бишкек, Кыргызская Республика</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Время ответа</h3>
                <div className="space-y-2 text-gray-600">
                  <p>Стандартные запросы: в течение 7 рабочих дней</p>
                  <p>Срочные вопросы: в течение 2 рабочих дней</p>
                  <p>Технические проблемы: в течение 24 часов</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}