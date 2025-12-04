import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { AuctionCard } from "@/components/auction-card";
import { UpcomingAuctionCard } from "@/components/upcoming-auction-card";
import { PageSEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { socketService } from "@/lib/socket";
import { createSlug } from "@/lib/utils";
import type { Auction, Bid } from "@/types/auction";

// Hero Section Component
function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { t } = useLanguage();
  
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Main Content */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Выигрывайте премиум товары
              <span className="text-yellow-300"> за копейки!</span>
            </h1>
            <p className="text-lg text-blue-100">
              Пенни-аукционы №1 в России. Экономьте до 99% на iPhone, MacBook и других гаджетах
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {!isAuthenticated ? (
                <>
                  <Link href="/login">
                    <Button className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-all duration-300 border-0">
                      <i className="fas fa-rocket mr-2"></i>
                      Начать выигрывать
                    </Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button className="bg-white/10 hover:bg-white/20 backdrop-blur-lg text-white font-semibold px-6 py-3 rounded-lg border border-white/30 transition-all duration-300">
                      Как это работает?
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/auctions">
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-all duration-300 border-0">
                    <i className="fas fa-eye mr-2"></i>
                    Посмотреть аукционы
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right Side - Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mb-3">
                <i className="fas fa-gavel text-xl text-blue-900"></i>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Честные аукционы</h3>
              <p className="text-blue-100 text-sm">Прозрачная система торгов</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center mb-3">
                <i className="fas fa-bolt text-xl text-blue-900"></i>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Мгновенные результаты</h3>
              <p className="text-blue-100 text-sm">Реал-тайм обновления</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center mb-3">
                <i className="fas fa-shield-alt text-xl text-blue-900"></i>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Гарантия качества</h3>
              <p className="text-blue-100 text-sm">100% оригинальная продукция</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center mb-3">
                <i className="fas fa-percentage text-xl text-blue-900"></i>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Экономия до 99%</h3>
              <p className="text-blue-100 text-sm">Выигрывайте по минимальной цене</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { connected } = useSocket();
  const { user, isAuthenticated } = useAuth();
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
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
        // **FIX: Refetch auctions when status changes (upcoming → live → finished)**
        if (data.type === 'auction_started' || data.auction?.status) {
          console.log('🔄 Auction status changed, refetching auctions list');
          queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
        }
        
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
  }, [connected, queryClient]);

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
      <PageSEO page="home" />
      <Header />

      {/* Hero Section */}
      <HeroSection isAuthenticated={isAuthenticated} />

      
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
