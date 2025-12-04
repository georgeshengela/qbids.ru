import { Header } from "@/components/header";
import { PageSEO } from "@/components/seo";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";

export default function HowItWorks() {
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gray-50">
      <PageSEO page="how-it-works" />
      <Header />
      
      <main className="max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {t("howPennyAuctionsWorkTitle")}
            </h1>
            <p className="text-gray-600 text-lg">
              {t("simpleGuideSubtitle")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("step1Title")}</h3>
              <p className="text-gray-600">
                {t("step1Desc")}
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("step2Title")}</h3>
              <p className="text-gray-600">
                {t("step2Desc")}
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("step3Title")}</h3>
              <p className="text-gray-600">
                {t("step3Desc")}
              </p>
            </div>
          </div>
        </div>

        {/* How Penny Auctions Work */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            <i className="fas fa-lightbulb text-yellow-500 mr-3"></i>
            {t("howItWorksTitle")}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("basicRules")}</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <i className="fas fa-check text-blue-600 text-xs"></i>
                  </div>
                  <span className="text-gray-700">{t("bidIncreasesPrice").replace("{currency}", formatCurrency(0.01))}</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <i className="fas fa-clock text-green-600 text-xs"></i>
                  </div>
                  <span className="text-gray-700">{t("timerResets10Seconds")}</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                    <i className="fas fa-trophy text-purple-600 text-xs"></i>
                  </div>
                  <span className="text-gray-700">{t("lastParticipantWins")}</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                    <i className="fas fa-coins text-red-600 text-xs"></i>
                  </div>
                  <span className="text-gray-700">{t("fixedBidCost")}</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("auctionExample")}</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t("startingPrice")}</span>
                  <span className="font-semibold">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t("after50Bids").replace("{currency}", formatCurrency(0.01))}</span>
                  <span className="font-semibold">{formatCurrency(0.50)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t("retailPrice")}</span>
                  <span className="text-red-600 line-through">{formatCurrency(150000)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-semibold text-gray-900">{t("winnerPrice")}</span>
                  <span className="font-bold text-green-600 text-lg">{formatCurrency(0.50)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            <i className="fas fa-star text-yellow-500 mr-3"></i>
            {t("successfulParticipationTips")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-eye text-blue-600 text-sm"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t("observeBeforeParticipating")}</h4>
                  <p className="text-sm text-gray-600">{t("observeDesc")}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-clock text-green-600 text-sm"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t("chooseTimingTitle")}</h4>
                  <p className="text-sm text-gray-600">{t("chooseTimingDesc")}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-target text-purple-600 text-sm"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t("setLimits")}</h4>
                  <p className="text-sm text-gray-600">{t("setLimitsDesc")}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-users text-yellow-600 text-sm"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t("studyCompetitors")}</h4>
                  <p className="text-sm text-gray-600">{t("studyCompetitorsDesc")}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-chart-line text-red-600 text-sm"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t("followStatistics")}</h4>
                  <p className="text-sm text-gray-600">{t("followStatisticsDesc")}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-indigo-600 text-sm"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{t("practice")}</h4>
                  <p className="text-sm text-gray-600">{t("practiceDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            <i className="fas fa-question-circle text-blue-500 mr-3"></i>
            {t("faq")}
          </h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {t("faqQuestion1")}
              </h4>
              <p className="text-gray-600">
                {t("faqAnswer1")}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {t("faqQuestion2")}
              </h4>
              <p className="text-gray-600">
                {t("faqAnswer2")}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {t("faqQuestion3")}
              </h4>
              <p className="text-gray-600">
                {t("faqAnswer3")}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {t("faqQuestion4")}
              </h4>
              <p className="text-gray-600">
                {t("faqAnswer4")}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}