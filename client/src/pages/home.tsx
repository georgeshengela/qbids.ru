import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { AuctionCard } from "@/components/auction-card";
import { UpcomingAuctionCard } from "@/components/upcoming-auction-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { socketService } from "@/lib/socket";
import { createSlug } from "@/lib/utils";
import type { Auction, Bid } from "@/types/auction";

// Samsung Galaxy Z Fold 7 Hero Countdown Component
function SamsungHeroCountdown({ formatCurrency, auctionsData }: { 
  formatCurrency: (amount: number) => string;
  auctionsData?: { live: Auction[]; upcoming: Auction[]; finished: Auction[] };
}) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasLoadedData, setHasLoadedData] = useState(false);

  useEffect(() => {
    // Find the QB/1113 Samsung auction
    const samsungAuction = auctionsData?.upcoming?.find(auction => 
      auction.title.toLowerCase().includes('samsung galaxy z fold 7') ||
      auction.title.toLowerCase().includes('qb/1113')
    );
    
    const updateCountdown = () => {
      const now = Date.now();
      let difference = 0;
      
      if (samsungAuction) {
        // Mark that we have real data and use real auction start time
        setHasLoadedData(true);
        const auctionStart = new Date(samsungAuction.startTime).getTime();
        difference = auctionStart - now;
      } else if (hasLoadedData) {
        // If we previously had data but don't now, use fallback
        const auctionStart = Date.now() + (48 * 60 * 60 * 1000);
        difference = auctionStart - now;
      } else {
        // Show zeros while loading real data
        difference = 0;
      }
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        // Show zeros when no valid time difference
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [auctionsData, hasLoadedData]);

  return (
    <section className="relative min-h-screen bg-white overflow-hidden">
      {/* Clean background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-200 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start min-h-screen pt-8 sm:pt-16 pb-4">
          
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-10 flex flex-col justify-start order-1 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full mr-2 sm:mr-3 animate-pulse"></div>
              <span className="text-xs sm:text-sm font-semibold tracking-wide">ЭКСКЛЮЗИВНАЯ ПРЕМЬЕРА</span>
            </div>
            
            {/* Main headline */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-gray-900 leading-none tracking-tight">
                Samsung Galaxy
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Z Fold 7
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 leading-relaxed font-light max-w-lg">
                Первый в мире аукцион революционного складного смартфона
              </p>
              
              <div className="flex items-center space-x-2 sm:space-x-3 text-gray-500">
                <i className="fas fa-star text-yellow-500 text-sm sm:text-base"></i>
                <span className="text-sm sm:text-base">Официальная модель • Гарантия Samsung • Новый в упаковке</span>
                <i className="fas fa-star text-yellow-500 text-sm sm:text-base"></i>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="space-y-4 sm:space-y-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                Аукцион начинается через
              </h2>
              
              <div className="flex space-x-2 sm:space-x-4">
                {[
                  { value: timeLeft.days, label: 'дней' },
                  { value: timeLeft.hours, label: 'часов' },
                  { value: timeLeft.minutes, label: 'минут' },
                  { value: timeLeft.seconds, label: 'секунд' }
                ].map((unit, index) => (
                  <div key={unit.label} className="flex items-center space-x-2 sm:space-x-4">
                    <div className="text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 transform hover:scale-105 transition-transform duration-300">
                        <span className="text-lg sm:text-2xl lg:text-3xl font-black text-gray-800">
                          {unit.value.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <span className="block text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 uppercase tracking-wide font-medium">
                        {unit.label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div className="text-lg sm:text-2xl text-gray-400 font-light">:</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Call to action */}
            <div className="space-y-3 sm:space-y-4">
              <button 
                onClick={() => window.location.href = '/auction/samsung-galaxy-z-fold-7-qb-1113'}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg sm:text-xl font-bold py-4 sm:py-6 px-6 sm:px-8 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300"
              >
                <i className="fas fa-bell mr-2 sm:mr-3"></i>
                Уведомить о старте аукциона
              </button>
              
              <button className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white text-base sm:text-lg font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all duration-300">
                <i className="fas fa-user-plus mr-2"></i>
                Создать аккаунт
              </button>
            </div>
          </div>

          {/* Right Content - Product & Pricing */}
          <div className="space-y-6 sm:space-y-8 flex flex-col justify-start order-2 lg:order-2">
            
            {/* Product showcase */}
            <div className="relative max-w-sm sm:max-w-lg mx-auto">
              <div className="aspect-square bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-100">
                <div className="relative h-full">
                  <img 
                    src="https://www.spark.co.nz/content/dam/spark/images/product-images/devices/phones/samsung/z-series/z-fold7/zfold7-blue-shadow-1.png" 
                    alt="Samsung Galaxy Z Fold 7" 
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-lg">
                <i className="fas fa-crown mr-1 sm:mr-2"></i>
                Premium Edition
              </div>
            </div>

            {/* Pricing comparison */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <span className="text-gray-600 text-base sm:text-lg">Розничная цена</span>
                  <span className="text-red-500 line-through text-2xl sm:text-3xl font-bold">{formatCurrency(179900)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-semibold text-base sm:text-lg">Стартовая цена аукциона</span>
                  <span className="text-green-600 text-3xl sm:text-4xl font-black">{formatCurrency(0.01)}</span>
                </div>
              </div>
              
              <div className="text-center py-4 sm:py-6">
                <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl shadow-lg">
                  Экономия до 99.9%
                </span>
              </div>
            </div>


          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useDocumentTitle("QBIDS.KG - №1 Пенни-аукционы в Кыргызстане | Выиграй iPhone за копейки");
  
  const { connected } = useSocket();
  const { user, isAuthenticated } = useAuth();
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [auctionBids, setAuctionBids] = useState<Record<string, Bid[]>>({});
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(9);

  const { data: auctionsData } = useQuery<{
    live: Auction[];
    upcoming: Auction[];
    finished: Auction[];
  }>({
    queryKey: ["/api/auctions"],
  });

  const { data: timerData } = useQuery<Record<string, number>>({
    queryKey: ["/api/timers"],
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (timerData) {
      setTimers(timerData);
    }
  }, [timerData]);

  useEffect(() => {
    if (connected) {
      socketService.onTimerUpdate((newTimers) => {
        setTimers(newTimers);
      });

      socketService.onAuctionUpdate((data) => {
        if (data.auction && data.bids) {
          setAuctionBids(prev => ({
            ...prev,
            [data.auction.id]: data.bids,
          }));
        }
        if (data.timers) {
          setTimers(data.timers);
        }
      });

      return () => {
        socketService.offTimerUpdate();
        socketService.offAuctionUpdate();
      };
    }
  }, [connected]);

  const calculateTimeToStart = (startTime: string): number => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((start - now) / 1000));
  };

  const handleLoadMore = () => {
    setVisibleUpcomingCount(prev => prev + 3);
  };

  const sortedUpcomingAuctions = auctionsData?.upcoming
    ?.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];
  
  const visibleUpcomingAuctions = sortedUpcomingAuctions.slice(0, visibleUpcomingCount);
  const hasMoreAuctions = sortedUpcomingAuctions.length > visibleUpcomingCount;

  return (
    <div className="bg-gray-50">
      <Header />
      
      {/* Samsung Galaxy Z Fold 7 Hero Section */}
      <SamsungHeroCountdown formatCurrency={formatCurrency} auctionsData={auctionsData} />

      
      <main className="max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Bid Package Auctions Section */}
            {(() => {
              const bidPackageAuctions = auctionsData?.upcoming?.filter(auction => auction.isBidPackage) || [];
              
              if (bidPackageAuctions.length === 0) {
                return null;
              }

              return (
                <div className="mb-12">
                  {/* Section Header */}
                  <div className="relative mb-8">
                    <div className="text-center">
                      <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-full font-bold text-lg shadow-lg mb-4">
                        <i className="fas fa-gift mr-2 text-xl"></i>
                        Специальные предложения
                        <i className="fas fa-star ml-2 animate-pulse"></i>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Пакеты ставок с супер скидками!
                      </h2>
                      <p className="text-gray-600 text-lg">
                        Получите больше ставок за меньшие деньги. Ограниченное время!
                      </p>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-10 w-8 h-8 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
                    <div className="absolute top-8 right-20 w-6 h-6 bg-orange-500 rounded-full opacity-30 animate-bounce"></div>
                    <div className="absolute bottom-4 left-1/4 w-4 h-4 bg-yellow-300 rounded-full opacity-25 animate-pulse"></div>
                  </div>

                  {/* Bid Package Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {bidPackageAuctions.slice(0, 4).map((auction) => (
                      <Link 
                        key={auction.id}
                        href={`/auction/${createSlug(auction.title, auction.displayId)}`}
                      >
                        <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 md:p-6 border-2 border-yellow-200 shadow-lg overflow-hidden cursor-pointer">
                          {/* Special offer badge */}
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20">
                            ГОРЯЧО!
                          </div>

                          {/* Sparkle effects */}
                          <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                          <div className="absolute bottom-4 right-4 w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>

                          {/* Card Content */}
                          <div className="relative z-10">
                            {/* Product Image */}
                            <div className="w-full h-24 md:h-32 mb-3 md:mb-4 rounded-xl overflow-hidden bg-white shadow-md">
                              <img
                                src={auction.imageUrl}
                                alt={auction.title}
                                className="w-full h-full object-contain p-2"
                              />
                            </div>

                            {/* Package Info */}
                            <div className="text-center space-y-2 md:space-y-3">
                              <h3 className="font-bold text-sm md:text-lg text-gray-900 leading-tight">
                                {auction.title}
                              </h3>
                              
                              {/* Price Display */}
                              <div className="space-y-2">
                                <div className="bg-white rounded-lg p-2 md:p-3 shadow-sm">
                                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Стоимость пакета</div>
                                  <div className="text-lg md:text-2xl font-bold text-green-600">
                                    {formatCurrency(auction.retailPrice)}
                                  </div>
                                </div>

                                {/* Start Time */}
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-2">
                                  <div className="text-xs uppercase tracking-wide mb-1">Аукцион начинается</div>
                                  <div className="text-xs md:text-sm font-semibold">
                                    {new Date(auction.startTime).toLocaleDateString('ru-RU', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Prebids Count */}
                              {auction.prebidsCount && auction.prebidsCount > 0 && (
                                <div className="flex items-center justify-center space-x-2 bg-yellow-100 rounded-lg p-2">
                                  <i className="fas fa-users text-yellow-600"></i>
                                  <span className="text-sm font-semibold text-yellow-800">
                                    {auction.prebidsCount} участников готовы
                                  </span>
                                </div>
                              )}

                              {/* View Details Text */}
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-2 md:py-3 px-3 md:px-4 rounded-xl shadow-lg text-sm md:text-base">
                                <i className="fas fa-gift mr-2"></i>
                                Участвовать
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* View All Button */}
                  {bidPackageAuctions.length > 4 && (
                    <div className="text-center mt-8">
                      <Link href="/auctions">
                        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                          <i className="fas fa-eye mr-2"></i>
                          Посмотреть все пакеты ({bidPackageAuctions.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Live Auctions Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  <i className="fas fa-circle text-red-500 mr-2 animate-pulse"></i>
                  {t("liveAuctions")}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{connected ? t("connected") : t("disconnected")}</span>
                </div>
              </div>

              {auctionsData?.live?.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-gavel text-gray-300 text-6xl mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t("noLiveAuctions")}</h3>
                  <p className="text-gray-600">{t("liveAuctionsWillAppear")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {auctionsData?.live?.map((auction) => (
                    <AuctionCard
                      key={auction.id}
                      auction={auction}
                      bids={auctionBids[auction.id] || []}
                      timeLeft={timers[auction.id] || 0}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Auctions Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                <i className="fas fa-clock text-yellow-500 mr-2"></i>
                {t("upcomingAuctions")}
              </h2>

              {sortedUpcomingAuctions.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-clock text-gray-300 text-6xl mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t("noUpcomingAuctions")}</h3>
                  <p className="text-gray-600">{t("upcomingAuctionsWillAppearHere")}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {visibleUpcomingAuctions.map((auction) => (
                      <UpcomingAuctionCard
                        key={auction.id}
                        auction={auction}
                        startsIn={calculateTimeToStart(auction.startTime)}
                        prebidsCount={auction.prebidsCount || 0}

                      />
                    ))}
                  </div>
                  
                  {hasMoreAuctions && (
                    <div className="flex justify-center">
                      <Button
                        onClick={handleLoadMore}
                        className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0"
                      >
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-plus-circle text-lg group-hover:rotate-90 transition-transform duration-300"></i>
                          <span>{t("showMore")}</span>
                          <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-sm font-bold">
                            +3
                          </div>
                        </div>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Today's Winners Section */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                <i className="fas fa-trophy text-yellow-500 mr-2"></i>
                {t("winnersOfTheDay")}
              </h2>

              <div className="bg-white rounded-xl shadow-md">
                <div className="p-6">
                  {auctionsData?.finished?.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="fas fa-trophy text-gray-300 text-4xl mb-4"></i>
                      <p className="text-gray-600">{t("noWinnersToday")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {auctionsData?.finished?.slice(0, 5).map((auction) => (
                        <div key={auction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-4">
                            <img
                              src={auction.imageUrl}
                              alt={auction.title}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {auction.winner ? 
                                  auction.winner.username : 
                                  t("unknown")
                                }
                              </p>
                              <p className="text-sm text-gray-600">{t("won")} {auction.title}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatCurrency(auction.currentPrice)}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(auction.endTime!).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>
    </div>
  );
}
