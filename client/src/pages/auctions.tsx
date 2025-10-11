import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useLanguage } from "@/hooks/use-language";
import { useSocket } from "@/hooks/use-socket";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { UpcomingAuctionCard } from "@/components/upcoming-auction-card";
import { Button } from "@/components/ui/button";
import { socketService } from "@/lib/socket";
import type { Auction } from "@/types/auction";

export default function Auctions() {
  const { t } = useLanguage();
  useDocumentTitle(`${t("upcomingAuctions")} - QBIDS.KG | Скоро начнутся новые торги`);
  const { connected } = useSocket();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const auctionsPerPage = 12;
  
  const { data: auctionsData, isLoading } = useQuery<{
    live: Auction[];
    upcoming: Auction[];
    finished: Auction[];
  }>({
    queryKey: ["/api/auctions"],
  });

  const calculateTimeToStart = (startTime: string): number => {
    const start = new Date(startTime).getTime();
    return Math.max(0, Math.floor((start - currentTime) / 1000));
  };

  // Update current time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Socket connection for real-time updates
  useEffect(() => {
    if (connected) {
      socketService.onAuctionUpdate(() => {
        // Trigger rerender for any auction updates
        setCurrentTime(Date.now());
      });

      return () => {
        socketService.offAuctionUpdate();
      };
    }
  }, [connected]);

  // Pagination logic
  const upcomingAuctions = auctionsData?.upcoming || [];
  const sortedAuctions = upcomingAuctions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  const totalPages = Math.ceil(sortedAuctions.length / auctionsPerPage);
  const startIndex = (currentPage - 1) * auctionsPerPage;
  const endIndex = startIndex + auctionsPerPage;
  const currentAuctions = sortedAuctions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">{t("loadingAuctions")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-[1504px] mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-600 text-lg"></i>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{t("upcomingAuctions")}</h1>
                  <p className="text-gray-600">
                    {sortedAuctions.length} {t("auctionsAwaitingStart")}
                    {totalPages > 1 && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({t("pageOf")} {currentPage} {t("of")} {totalPages})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Upcoming Auctions Grid */}
            {!sortedAuctions.length ? (
              <div className="text-center py-20">
                <i className="fas fa-clock text-gray-300 text-6xl mb-6"></i>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">{t("noUpcomingAuctions")}</h3>
                <p className="text-gray-600 text-lg">{t("newAuctionsWillAppear")}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentAuctions.map((auction) => (
                    <UpcomingAuctionCard
                      key={auction.id}
                      auction={auction}
                      startsIn={calculateTimeToStart(auction.startTime)}
                      prebidsCount={0} // TODO: Fetch prebids count
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-12 space-x-2">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-angle-double-left"></i>
                    </Button>

                    {/* Previous Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-angle-left"></i>
                    </Button>

                    {/* Page Numbers */}
                    {(() => {
                      const pages = [];
                      const showPages = 5; // Show max 5 page numbers
                      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                      let endPage = Math.min(totalPages, startPage + showPages - 1);
                      
                      if (endPage - startPage + 1 < showPages) {
                        startPage = Math.max(1, endPage - showPages + 1);
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(i)}
                            className="min-w-[40px]"
                          >
                            {i}
                          </Button>
                        );
                      }
                      return pages;
                    })()}

                    {/* Next Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fas fa-angle-right"></i>
                    </Button>

                    {/* Last Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fas fa-angle-double-right"></i>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>
    </div>
  );
}