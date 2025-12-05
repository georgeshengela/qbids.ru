import { Header } from "@/components/header";
import { PageSEO } from "@/components/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Support() {

  const supportMethods = [
    {
      icon: "fas fa-envelope",
      title: "Электронная почта",
      description: "Напишите нам на email для получения подробной помощи",
      contact: "support@qbids.ru",
      responseTime: "В течение 24 часов",
      color: "blue"
    },
    {
      icon: "fab fa-whatsapp",
      title: "WhatsApp",
      description: "Быстрая помощь через мессенджер WhatsApp",
      contact: "+996 XXX XXX XXX",
      responseTime: "В рабочее время",
      color: "green"
    },
    {
      icon: "fab fa-telegram",
      title: "Telegram",
      description: "Свяжитесь с нами через Telegram для оперативной поддержки",
      contact: "@qbids_support",
      responseTime: "В рабочее время",
      color: "blue"
    }
  ];

  const faqItems = [
    {
      question: "Как начать участвовать в аукционах?",
      answer: "Зарегистрируйтесь на сайте, пополните баланс бидов и выберите интересующий вас аукцион. Каждая ставка стоит один бид."
    },
    {
      question: "Что такое пенни-аукцион?",
      answer: "Пенни-аукцион - это тип аукциона, где цена товара увеличивается на небольшую сумму с каждой ставкой, а время аукциона продлевается."
    },
    {
      question: "Как пополнить баланс бидов?",
      answer: "Перейдите в свой профиль и выберите 'Пополнить баланс'. Доступны различные способы оплаты: банковские карты, электронные кошельки."
    },
    {
      question: "Что происходит, если я выиграл аукцион?",
      answer: "Поздравляем! После победы с вами свяжется наша служба поддержки для организации доставки товара или его получения."
    },
    {
      question: "Можно ли вернуть потраченные биды?",
      answer: "Биды, потраченные в ходе аукциона, не возвращаются. Это стандартное правило пенни-аукционов."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageSEO page="support" />
      <Header />

      <main className="max-w-[1504px] mx-auto py-8 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-headset text-white text-3xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Служба поддержки</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Мы готовы помочь вам в любое время. Выберите удобный способ связи или найдите ответы на часто задаваемые вопросы.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {supportMethods.map((method, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-16 h-16 bg-${method.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <i className={`${method.icon} text-${method.color}-600 text-2xl`}></i>
                </div>
                <CardTitle className="text-xl">{method.title}</CardTitle>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{method.contact}</p>
                  <p className="text-sm text-gray-600">{method.responseTime}</p>
                  <Button className="w-full mt-4" variant="outline">
                    Связаться
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <i className="fas fa-question-circle text-blue-600 mr-3"></i>
              Часто задаваемые вопросы
            </CardTitle>
            <CardDescription>
              Ответы на самые популярные вопросы о работе QBIDS.ru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.answer}
                  </p>
                  {index < faqItems.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-clock text-blue-600 mr-3"></i>
              Режим работы поддержки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Онлайн поддержка</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Понедельник - Пятница:</span>
                    <span className="font-medium">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Суббота:</span>
                    <span className="font-medium">10:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Воскресенье:</span>
                    <span className="font-medium">Выходной</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Email поддержка</h3>
                <div className="space-y-2 text-gray-600">
                  <p>Работает круглосуточно</p>
                  <p>Ответ в течение 24 часов</p>
                  <p>Все дни недели</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}