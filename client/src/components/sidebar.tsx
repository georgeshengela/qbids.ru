import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import type { Bid, UserStats } from "@/types/auction";

export function Sidebar() {
  const { user, isAuthenticated } = useAuth();
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();

  const { data: recentBids = [] } = useQuery<Bid[]>({
    queryKey: ["/api/bids/recent"],
    enabled: isAuthenticated,
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/users/stats"],
    enabled: isAuthenticated,
  });

  return (
    <div className="space-y-6">
      {/* Live Bidding Activity */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            <i className="fas fa-activity text-red-500 mr-2"></i>
            {t("recentBids")}
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentBids.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">{t("loading")}</p>
            ) : (
              recentBids.map((bid) => (
                <div key={bid.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <i className="fas fa-user text-xs"></i>
                    </div>
                    <span className={bid.isBot ? "text-orange-600" : "text-gray-900"}>
                      {bid.isBot ? bid.botName : bid.user?.username}
                    </span>
                  </div>
                  <span className="text-primary font-medium">{formatCurrency(bid.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Stats */}
      {isAuthenticated && userStats && (
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              <i className="fas fa-chart-bar text-primary mr-2"></i>
              {t("statistics")}
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t("activeBids")}</span>
              <span className="font-semibold text-gray-900">{userStats.activeBids}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t("prebids")}</span>
              <span className="font-semibold text-orange-600">{userStats.activePrebids}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t("wonAuctions")}</span>
              <span className="font-semibold text-success">{userStats.wonAuctions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t("totalSpent")}</span>
              <span className="font-semibold text-gray-900">{userStats.totalSpent}</span>
            </div>
          </div>
        </div>
      )}


      {/* Quick Actions */}
      {isAuthenticated && (
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              <i className="fas fa-bolt text-yellow-500 mr-2"></i>
              {t("quickLinks")}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <Button className="w-full bg-green-600 text-white py-2 mt-1 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              <i className="fas fa-plus mr-2"></i>
              {t("topUpBalance")}
            </Button>
            <Link href="/bid-history">
              <Button 
                variant="outline"
                className="w-full py-2 mt-3 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="fas fa-history mr-2"></i>
                {t("bidHistory")}
              </Button>
            </Link>
            <Link href="/profile">
              <Button 
                variant="outline"
                className="w-full py-2 mt-3 rounded-lg text-sm font-medium transition-colors"
              >
                <i className="fas fa-cog mr-2"></i>
                {t("profile")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
