import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Bid, Auction } from "@/types/auction";

interface BidWithAuction extends Bid {
  auction: Auction;
  user?: {
    id: string;
    username: string;
  };
}

interface PrebidWithAuction {
  id: string;
  auctionId: string;
  userId: string;
  createdAt: string;
  auction: Auction;
}

export default function BidHistory() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();

  // Fetch user's bid history from database
  const { data: bids = [], isLoading } = useQuery<BidWithAuction[]>({
    queryKey: ["/api/bids/user"],
    enabled: isAuthenticated,
  });

  // Fetch user's prebids from database
  const { data: prebids = [], isLoading: isPrebidsLoading } = useQuery<PrebidWithAuction[]>({
    queryKey: ["/api/prebids/user"],
    enabled: isAuthenticated,
  });

  // Socket connection for real-time updates
  useEffect(() => {
    if (socket) {
      const handleAuctionUpdate = (data: any) => {
        // Refresh user's bid history when they place new bids
        queryClient.invalidateQueries({ queryKey: ["/api/bids/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/prebids/user"] });
      };

      socket.on("auctionUpdate", handleAuctionUpdate);

      return () => {
        socket.off("auctionUpdate", handleAuctionUpdate);
      };
    }
  }, [socket, queryClient]);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-[1504px] mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("error")}</h1>
            <p className="text-gray-600 mb-6">{t("loginRequired")}</p>
            <Button onClick={() => window.history.back()}>
              <i className="fas fa-arrow-left mr-2"></i>
              {t("back")}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="flex items-center space-x-2"
              >
                <i className="fas fa-arrow-left"></i>
                <span>{t("back")}</span>
              </Button>
              <div className="text-sm text-gray-500">
                <span>{t("home")}</span>
                <i className="fas fa-chevron-right mx-2"></i>
                <span className="text-gray-900 font-medium">{t("myBidHistory")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1504px] mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <i className="fas fa-history text-blue-500 mr-3"></i>
            {t("myBidHistory")}
          </h1>
          <p className="text-gray-600">{t("bidHistoryDescription")}</p>
        </div>

        {/* Bid History Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <i className="fas fa-gavel text-blue-500"></i>
                <span>{t("activeBids")}</span>
              </div>
              <Badge variant="outline" className="text-sm">
                <i className="fas fa-user mr-1"></i>
                {bids.length} {t("bids")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-40"></div>
                          <div className="h-3 bg-gray-300 rounded w-32"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-5 bg-gray-300 rounded w-20"></div>
                        <div className="h-8 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : bids.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-gavel text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">У вас пока нет ставок</h3>
                <p className="text-gray-500">Участвуйте в аукционах, чтобы ваши ставки появились здесь</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Auction Icon */}
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <i className="fas fa-gavel text-white"></i>
                      </div>
                      
                      {/* Bid Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">
                            {bid.auction.title}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-600">
                            <i className="fas fa-coins mr-1"></i>
                            {t("bidNumber")}{index + 1}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bid Amount and Auction Status */}
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-3">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(bid.amount)}
                        </p>
                        {getStatusBadge(bid.auction.status)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/auction/${bid.auction.id}`}
                        className="text-xs"
                      >
                        <i className="fas fa-external-link-alt mr-1"></i>
                        {t("goToAuction")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prebids History Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <i className="fas fa-clock text-orange-500"></i>
                <span>{t("myPrebids")}</span>
              </div>
              <Badge variant="outline" className="text-sm bg-orange-50 text-orange-600 border-orange-200">
                <i className="fas fa-user mr-1"></i>
                {prebids.length} {t("prebidsCount").toLowerCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPrebidsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-40"></div>
                          <div className="h-3 bg-gray-300 rounded w-32"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-8 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : prebids.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-clock text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">У вас пока нет представок</h3>
                <p className="text-gray-500">Сделайте представки на предстоящие аукционы, чтобы они появились здесь</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prebids.map((prebid, index) => (
                  <div
                    key={prebid.id}
                    className="flex items-center justify-between p-4 bg-white border border-orange-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Prebid Icon */}
                      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                        <i className="fas fa-clock text-white"></i>
                      </div>
                      
                      {/* Prebid Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">
                            {prebid.auction.title}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-600">
                            <i className="fas fa-clock mr-1"></i>
                            {t("prebidsCount")} #{index + 1}
                          </p>
                          <p className="text-xs text-orange-600">
                            {t("activatesOnStart")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Auction Status and Action */}
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(prebid.auction.status)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/auction/${prebid.auction.id}`}
                        className="text-xs"
                      >
                        <i className="fas fa-external-link-alt mr-1"></i>
                        {t("goToAuction")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-chart-bar text-green-500"></i>
              <span>{t("statistics")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{bids.length}</div>
                <div className="text-sm text-gray-600">{t("totalBids")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{prebids.length}</div>
                <div className="text-sm text-gray-600">{t("prebidsCount")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(bids.map(bid => bid.isBot ? bid.botName : bid.user?.username)).size}
                </div>
                <div className="text-sm text-gray-600">{t("participants")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {bids.filter(bid => !bid.isBot).length}
                </div>
                <div className="text-sm text-gray-600">{t("userBids")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}