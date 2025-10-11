import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { createSlug } from "@/lib/utils";
import type { Auction } from "@/types/auction";

interface UpcomingAuctionCardProps {
  auction: Auction;
  startsIn: number;
  prebidsCount: number;
}

export function UpcomingAuctionCard({ auction, startsIn, prebidsCount }: UpcomingAuctionCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();

  const prebidMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/auctions/${auction.id}/prebid`);
    },
    onSuccess: () => {
      toast({
        title: t("prebidSuccess"),
        description: t("prebidNotification"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    },
    onError: (error: any) => {
      // Extract error message from JSON response
      let errorMessage = t("prebidError");
      
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
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePrebid = () => {
    if (!isAuthenticated) {
      toast({
        title: t("authRequired"),
        description: t("loginToPrebid"),
        variant: "destructive",
      });
      return;
    }

    prebidMutation.mutate();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-yellow-400 hover:shadow-xl transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
            <i className="fas fa-clock mr-1"></i>
            {t("coming")}
          </span>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: {auction.displayId}</div>
        </div>

        <Link href={`/auction/${createSlug(auction.title, auction.displayId)}`} className="block">
          <div className="flex items-start space-x-4 mb-4 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer">
            <div className="flex-shrink-0">
              <img
                src={auction.imageUrl}
                alt={auction.title}
                className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-lg mb-1 truncate hover:text-blue-600 transition-colors">{auction.title}</h4>
              <p className="text-sm text-gray-600 mb-2 truncate">{auction.description}</p>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-lg font-bold">{formatCurrency(auction.retailPrice)}</span>
                <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">{t("retail")}</span>
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4 border border-yellow-200">
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-2 font-medium">
              <i className="fas fa-hourglass-start mr-1 text-yellow-600"></i>
              {t("startsIn")}
            </p>
            <p className="text-2xl font-bold text-yellow-700 font-mono tracking-wider">
              {formatTime(startsIn)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg py-2 px-3">
          <i className="fas fa-users mr-2 text-blue-500"></i>
          <span>{t("prebidsCount")}: </span>
          <span className="font-bold text-blue-600 ml-1">{prebidsCount}</span>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl text-sm font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          onClick={handlePrebid}
          disabled={prebidMutation.isPending || !isAuthenticated}
        >
          {prebidMutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {t("placing")}
            </>
          ) : (
            <>
              <i className="fas fa-bookmark mr-2"></i>
              {t("prebid")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
