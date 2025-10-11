import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Auction, Bid } from "@/types/auction";

export default function AuctionDetail() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();
  const [timer, setTimer] = useState<number>(0);
  const [upcomingTimer, setUpcomingTimer] = useState<number>(0);

  // Fetch auction details
  const { data: auction, isLoading } = useQuery<Auction>({
    queryKey: [`/api/auctions/slug/${slug}`],
    enabled: !!slug,
  });

  // Fetch bid history (limited to recent bids for display)
  const { data: bids = [] } = useQuery<Bid[]>({
    queryKey: ["/api/auctions", auction?.id, "bids"],
    enabled: !!auction?.id,
  });

  // Fetch complete auction statistics
  const { data: stats } = useQuery<{totalBids: number, uniqueParticipants: number, priceIncrease: string}>({
    queryKey: ["/api/auctions", auction?.id, "stats"],
    enabled: !!auction?.id,
  });

  // Fetch timers
  const { data: timers = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/timers"],
    refetchInterval: 1000,
  });

  // Update timer from timers data
  useEffect(() => {
    if (auction && timers[auction.id] !== undefined) {
      setTimer(timers[auction.id]);
    }
  }, [timers, auction]);

  // Socket connection for real-time updates
  const { socket } = useSocket();
  
  useEffect(() => {
    if (socket && auction) {
      socket.emit("joinAuction", auction.id);
      
      const handleAuctionUpdate = (data: any) => {
        // Handle timer updates
        if (data.type === 'timer' && data.auctionId === auction.id) {
          setTimer(data.timeLeft);
          return;
        }
        
        // Handle auction updates
        if (data.auction?.id === auction.id) {
          queryClient.setQueryData([`/api/auctions/slug/${slug}`], data.auction);
          queryClient.setQueryData(["/api/auctions", auction.id, "bids"], data.bids || []);
          // Invalidate stats to get fresh total bid count
          queryClient.invalidateQueries({ queryKey: ["/api/auctions", auction.id, "stats"] });
        }
      };

      const handleTimerUpdate = (data: any) => {
        if (data[auction.id] !== undefined) {
          setTimer(data[auction.id]);
        }
      };

      socket.on("auctionUpdate", handleAuctionUpdate);
      socket.on("timerUpdate", handleTimerUpdate);

      return () => {
        socket.emit("leaveAuction", auction.id);
        socket.off("auctionUpdate", handleAuctionUpdate);
        socket.off("timerUpdate", handleTimerUpdate);
      };
    }
  }, [socket, auction, queryClient, slug]);

  // Bid mutation
  const bidMutation = useMutation({
    mutationFn: async () => {
      if (!auction) throw new Error("Auction not found");
      await apiRequest("POST", `/api/auctions/${auction.id}/bid`);
    },
    onSuccess: () => {
      toast({
        title: t("bidPlaced"),
        description: t("bidPlacedDesc"),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/slug/${slug}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions", auction?.id, "bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions", auction?.id, "stats"] });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("bidPlaceError"),
        variant: "destructive",
      });
    },
  });

  // Prebid mutation for upcoming auctions
  const prebidMutation = useMutation({
    mutationFn: async () => {
      if (!auction) throw new Error("Auction not found");
      await apiRequest("POST", `/api/auctions/${auction.id}/prebid`);
    },
    onSuccess: () => {
      toast({
        title: "Предварительная ставка размещена!",
        description: "Вы будете уведомлены когда аукцион начнется",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/slug/${slug}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions", auction?.id, "bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    },
    onError: (error: any) => {
      // Extract error message from JSON response
      let errorMessage = "Не удалось разместить предварительную ставку";
      
      if (error.message) {
        try {
          // Parse error message like "400: {"error":"message"}"
          const match = error.message.match(/\d+: (.+)/);
          if (match) {
            const jsonPart = match[1];
            const errorObj = JSON.parse(jsonPart);
            errorMessage = errorObj.error || errorMessage;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleBid = () => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для участия в аукционе",
        variant: "destructive",
      });
      return;
    }

    if (!user || user.bidBalance < 1) {
      toast({
        title: "Недостаточно бидов",
        description: "Пополните баланс бидов для участия в аукционе",
        variant: "destructive",
      });
      return;
    }

    bidMutation.mutate();
  };

  const handlePrebid = () => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для размещения предварительных ставок",
        variant: "destructive",
      });
      return;
    }

    prebidMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate time until auction starts for upcoming auctions
  const calculateTimeToStart = (startTime: string): number => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((start - now) / 1000));
  };

  // Update upcoming timer every second
  useEffect(() => {
    if (auction && auction.status === "upcoming") {
      const interval = setInterval(() => {
        const timeToStart = calculateTimeToStart(auction.startTime);
        setUpcomingTimer(timeToStart);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [auction]);

  // Get the appropriate timer value
  const getTimerValue = () => {
    if (!auction) return 0;
    
    if (auction.status === "upcoming") {
      return upcomingTimer;
    } else if (auction.status === "live") {
      return timer; // Use the live auction timer
    }
    return 0;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-yellow-500 text-white">{t("upcoming")}</Badge>;
      case "live":
        return <Badge className="bg-red-500 text-white animate-pulse">{t("live")}</Badge>;
      case "finished":
        return <Badge className="bg-gray-500 text-white">{t("finished")}</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-[1504px] mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">{t("loading")} {t("auction").toLowerCase()}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-[1504px] mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("auction")} not found</h1>
            <p className="text-gray-600 mb-6">The auction may have been deleted or doesn't exist</p>
            <Button onClick={() => setLocation("/")}>
              <i className="fas fa-arrow-left mr-2"></i>
              {t("home")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1504px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="flex items-center space-x-2 flex-shrink-0"
                size="sm"
              >
                <i className="fas fa-arrow-left"></i>
                <span className="hidden sm:inline">{t("back")}</span>
              </Button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{auction.title}</h1>
              </div>
            </div>
            
            {/* Auction ID Badge - Right Side */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(auction.displayId);
                toast({
                  title: "Скопировано!",
                  description: `ID аукциона ${auction.displayId} скопирован в буфер обмена`,
                });
              }}
              className="flex items-center space-x-2 hover:bg-blue-50 border-blue-200 flex-shrink-0"
            >
              <i className="fas fa-tag text-blue-600"></i>
              <span className="font-mono text-blue-600 text-xs sm:text-sm">{auction.displayId}</span>
              <i className="fas fa-copy text-xs text-blue-400"></i>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1504px] mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Auction Details */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Modern Auction Card */}
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px] md:min-h-[500px]">
                  {/* Modern Image Section */}
                  <div className="relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 z-10"></div>
                    <img
                      src={auction.imageUrl}
                      alt={auction.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                    />
                    
                    {/* Modern Status Badge */}
                    <div className="absolute top-6 left-6 z-20">
                      <div className="backdrop-blur-xl bg-white/30 rounded-2xl p-2 border border-white/40">
                        {getStatusBadge(auction.status)}
                      </div>
                    </div>
                    
                    {/* Auction ID Badge */}
                    <div className="absolute top-6 right-6 z-20">
                      <div className="backdrop-blur-xl bg-black/40 text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/20">
                        <i className="fas fa-tag mr-2"></i>
                        {auction.displayId}
                      </div>
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
                    
                    {/* Price Cards - Floating Over Image */}
                    <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-20">
                      <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-3 md:p-4 border border-white/30">
                        <div className="flex items-center justify-between text-white">
                          <div>
                            <p className="text-xs font-medium opacity-80">{t("currentPrice")}</p>
                            <p className="text-lg md:text-xl font-bold">{formatCurrency(auction.currentPrice)}</p>
                          </div>
                          <i className="fas fa-chart-line text-xl md:text-2xl opacity-60"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-4 md:p-8 flex flex-col justify-between bg-gradient-to-br from-white to-slate-50">
                    <div className="space-y-4 md:space-y-6">
                      <div>
                        <p className="text-gray-600 leading-relaxed text-base md:text-lg">{auction.description}</p>
                      </div>

                      {/* Timer and Status Section */}
                      {auction.status === "live" && (
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 md:p-6 border border-red-200 shadow-lg">
                          <div className="text-center">
                            <p className="text-red-600 font-semibold mb-2 md:mb-3 flex items-center justify-center text-sm md:text-base">
                              <i className="fas fa-fire mr-2 animate-pulse"></i>
{t("auctionActive")}
                            </p>
                            <div className="text-3xl md:text-5xl font-bold text-red-700 font-mono mb-2 tracking-wide">
                              {formatTime(getTimerValue())}
                            </div>
                            <p className="text-xs md:text-sm text-red-600 uppercase tracking-wide">{t("untilCompletion")}</p>
                          </div>
                        </div>
                      )}

                      {auction.status === "upcoming" && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 md:p-6 border border-yellow-200 shadow-lg">
                          <div className="text-center">
                            <p className="text-yellow-600 font-semibold mb-2 md:mb-3 flex items-center justify-center text-sm md:text-base">
                              <i className="fas fa-clock mr-2"></i>
                              {t("startsIn")}
                            </p>
                            <div className="text-3xl md:text-5xl font-bold text-yellow-700 font-mono mb-2 tracking-wide">
                              {formatTime(getTimerValue())}
                            </div>
                          </div>
                        </div>
                      )}

                      {auction.status === "finished" && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-lg">
                          <div className="text-center">
                            <div className="flex justify-center mb-4">
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-4 shadow-xl">
                                <i className="fas fa-crown text-white text-3xl"></i>
                              </div>
                            </div>
                            <h3 className="text-2xl font-bold text-purple-800 mb-4">🎉 {t("auctionFinished")}</h3>
                            
                            {bids.length > 0 && (
                              <div className="bg-white rounded-xl p-6 mt-4 shadow-lg border">
                                <p className="text-purple-600 font-medium mb-3">{t("winner")}:</p>
                                <div className="flex items-center justify-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <i className="fas fa-user text-white"></i>
                                  </div>
                                  <div>
                                    <p className="font-bold text-xl text-purple-800">
                                      {bids[0].isBot ? bids[0].botName : bids[0].user?.username}
                                    </p>
                                    <p className="text-sm text-purple-600">
                                      {t("winner")}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-purple-200">
                                  <p className="text-purple-600 font-medium">{t("winningBid")}:</p>
                                  <p className="text-3xl font-bold text-purple-800">{formatCurrency(bids[0].amount)}</p>
                                </div>
                              </div>
                            )}
                            
                            {bids.length === 0 && (
                              <div className="bg-white rounded-xl p-6 mt-4 shadow-lg border">
                                <p className="text-purple-600">{t("noBidsNoWinner")}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4 mt-8">
                      {auction.status === "upcoming" && (
                        <Button
                          onClick={handlePrebid}
                          disabled={prebidMutation.isPending || !isAuthenticated}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-4 text-sm sm:text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                          {prebidMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              {t("placingPrebid")}
                            </>
                          ) : (
                            <>
                              <i className="fas fa-hourglass-start mr-2"></i>
                              {t("prebid")} ({t("oneBid")})
                            </>
                          )}
                        </Button>
                      )}

                      {auction.status === "live" && (
                        <Button
                          onClick={handleBid}
                          disabled={bidMutation.isPending || !isAuthenticated}
                          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-4 text-sm sm:text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                          {bidMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              {t("placingBid")}
                            </>
                          ) : (
                            <>
                              <i className="fas fa-gavel mr-2"></i>
                              {t("placeBid")} ({t("oneBid")} = +{formatCurrency(0.01)})
                            </>
                          )}
                        </Button>
                      )}

                      {!isAuthenticated && (auction.status === "live" || auction.status === "upcoming") && (
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 text-center border border-blue-200">
                          <p className="text-gray-600 mb-4 text-lg">
                            {auction.status === "upcoming" 
                              ? t("loginForPrebids")
                              : t("loginToParticipate")
                            }
                          </p>
                          <Button
                            onClick={() => window.location.href = "/login"}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <i className="fas fa-sign-in-alt mr-2"></i>
                            {t("login")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Bid History */}
          <div className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                  <i className="fas fa-history text-blue-500"></i>
                  <span>{t("bidHistory")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
                  {bids.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-gavel text-4xl mb-4 text-gray-300"></i>
                      <p>{t("noBidsYet")}</p>
                      <p className="text-sm">{t("beTheFirst")}</p>
                    </div>
                  ) : (
                    bids.map((bid, index) => (
                      <div
                        key={bid.id}
                        className={`flex items-center justify-between p-2 md:p-3 rounded-lg border ${
                          bid.isPrebid 
                            ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200"
                            : index === 0 
                              ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200" 
                              : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full text-white flex items-center justify-center flex-shrink-0 ${
                            bid.isPrebid ? "bg-orange-500" : "bg-blue-500"
                          }`}>
                            <i className={`text-xs md:text-sm ${bid.isPrebid ? "fas fa-hourglass-start" : "fas fa-user"}`}></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                              {bid.isBot ? bid.botName : bid.user?.username}
                              {bid.isPrebid && (
                                <span className="ml-1 md:ml-2 text-xs bg-orange-500 text-white px-1 md:px-2 py-0.5 md:py-1 rounded-full">
                                  {t("prebidShort")}
                                </span>
                              )}
                              {!bid.isPrebid && index === 0 && (
                                <span className="ml-1 md:ml-2 text-xs bg-yellow-500 text-white px-1 md:px-2 py-0.5 md:py-1 rounded-full">
                                  {t("leader")}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {bid.isPrebid 
                                ? t("prebid")
                                : `${t("bidNumber")}${(stats?.totalBids || 0) - bids.filter((b, i) => i < index && !b.isPrebid).length}`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold text-sm md:text-base ${bid.isPrebid ? "text-orange-600" : "text-gray-900"}`}>
                            {formatCurrency(bid.amount)}
                          </p>
                          {bid.isPrebid && (
                            <p className="text-xs text-orange-500">
                              {t("oneBid")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-[1504px] mx-auto mt-8 md:mt-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-8">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">{t("howPennyAuctionsWork")}</h2>
              <p className="text-base md:text-lg text-gray-600">{t("understandingMechanics")}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <i className="fas fa-user-plus text-white text-lg md:text-xl"></i>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">1. {t("registration")}</h3>
                <p className="text-sm md:text-base text-gray-600">{t("registrationDesc").replace("{oneBid}", t("oneBid")).replace("{currency}", formatCurrency(0.01))}</p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <i className="fas fa-gavel text-white text-lg md:text-xl"></i>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">2. {t("placeBidsTitle")}</h3>
                <p className="text-sm md:text-base text-gray-600">{t("placeBidsDesc")}</p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <i className="fas fa-trophy text-white text-lg md:text-xl"></i>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">3. {t("winTitle")}</h3>
                <p className="text-sm md:text-base text-gray-600">{t("winDesc")}</p>
              </div>
            </div>

            {/* Key Features */}
            <div className="border-t border-gray-200 pt-6 md:pt-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">{t("keyFeatures")}</h3>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-clock text-blue-600 text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">{t("timerResets")}</h4>
                    <p className="text-gray-600 text-sm md:text-base">{t("timerResetsDesc")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-coins text-green-600 text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">{t("lowBidCost")}</h4>
                    <p className="text-gray-600 text-sm md:text-base">{t("lowBidCostDesc")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-users text-purple-600 text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">{t("realCompetition")}</h4>
                    <p className="text-gray-600 text-sm md:text-base">{t("realCompetitionDesc")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-bolt text-red-600 text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">{t("fastResults")}</h4>
                    <p className="text-gray-600 text-sm md:text-base">{t("fastResultsDesc")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="border-t border-gray-200 pt-6 md:pt-8 mt-6 md:mt-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">{t("successTips")}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-blue-50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="fas fa-lightbulb text-blue-600 text-sm"></i>
                    <span className="font-semibold text-gray-900 text-sm md:text-base">{t("timingStrategy")}</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">{t("timingStrategyDesc")}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="fas fa-chart-line text-green-600 text-sm"></i>
                    <span className="font-semibold text-gray-900 text-sm md:text-base">{t("studyHistory")}</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">{t("studyHistoryDesc")}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="fas fa-wallet text-purple-600 text-sm"></i>
                    <span className="font-semibold text-gray-900 text-sm md:text-base">{t("manageBudget")}</span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">{t("manageBudgetDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Participant Badge */}
      {stats?.uniqueParticipants && stats.uniqueParticipants > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 md:bottom-6 z-50">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full px-3 py-2 md:px-4 md:py-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div className="text-white">
                <span className="text-base md:text-lg font-bold">{stats.uniqueParticipants}</span>
                <span className="ml-1 md:ml-2 text-xs md:text-sm">{t("participants")}</span>
              </div>
              <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fas fa-users text-white text-xs md:text-sm"></i>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}