import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { createSlug } from "@/lib/utils";
import type { Auction, Bid } from "@/types/auction";

interface AuctionCardProps {
  auction: Auction;
  bids: Bid[];
  timeLeft: number;
}

export function AuctionCard({ auction, bids, timeLeft }: AuctionCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t } = useLanguage();

  const bidMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/auctions/${auction.id}/bid`);
    },
    onSuccess: () => {
      toast({
        title: t("bidSuccess"),
        description: t("bidSuccessDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("bidError"),
        variant: "destructive",
      });
    },
  });

  const lastBid = bids[0];
  const isUserLeading = !!(user && lastBid && !lastBid.isBot && lastBid.user?.id === user.id);
  const nextBidAmount = (parseFloat(auction.currentPrice) + parseFloat(auction.bidIncrement)).toFixed(2);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlaceBid = () => {
    if (!isAuthenticated) {
      toast({
        title: t("authRequired"),
        description: t("loginToBid"),
        variant: "destructive",
      });
      return;
    }

    if (user && user.bidBalance < 1) {
      toast({
        title: t("insufficientFunds"),
        description: t("insufficientBids"),
        variant: "destructive",
      });
      return;
    }

    bidMutation.mutate();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-red-500 animate-pulse-border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <i className="fas fa-circle mr-1"></i>{t("live")}
          </span>
          <div className="text-sm text-gray-500">{auction.displayId}</div>
        </div>

        <Link href={`/auction/${createSlug(auction.title, auction.displayId)}`} className="block">
          <div className="flex items-center space-x-4 mb-4 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer">
            <img
              src={auction.imageUrl}
              alt={auction.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-bold text-lg text-gray-900 hover:text-blue-600 transition-colors">{auction.title}</h3>
              <p className="text-gray-600 text-sm">{auction.description}</p>
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-center">
            <p className="text-xs mb-1">{t("timeLeft")}</p>
            <p className="text-2xl font-bold font-mono">{formatTime(timeLeft)}</p>
          </div>
        </div>

        <Button
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105"
          onClick={handlePlaceBid}
          disabled={bidMutation.isPending || !isAuthenticated || isUserLeading}
        >
          <i className="fas fa-hand-paper mr-2"></i>
          {`${t("placeBid")} (+${formatCurrency(auction.bidIncrement)})`}
        </Button>

        {lastBid && (
          <div className="flex items-center justify-between text-sm mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <i className="fas fa-user text-xs"></i>
              </div>
              <span className="text-gray-600">
                {t("lastBid")}:{" "}
                <span className="font-medium text-gray-900">
                  {lastBid.isBot ? lastBid.botName : lastBid.user?.username}
                </span>
              </span>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
