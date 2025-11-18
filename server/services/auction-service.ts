import { storage } from "../storage";
import { timerService } from "./timer-service";
import { botService } from "./bot-service";
import { broadcastAuctionUpdate, broadcastBidBalanceUpdate } from "../socket";
import type { Auction, InsertBid } from "@shared/schema";

export class AuctionService {
  async startAuction(auctionId: string) {
    await storage.updateAuctionStatus(auctionId, "live");
    
    // Convert prebids to actual bids when auction starts
    await this.convertPrebidsToBids(auctionId);
    
    // **FIX #1: startAuctionTimer is now async**
    await timerService.startAuctionTimer(auctionId);
    await botService.startBotsForAuction(auctionId);
  }

  async endAuction(auctionId: string) {
    const auction = await storage.getAuction(auctionId);
    if (!auction) return;

    await storage.updateAuctionStatus(auctionId, "finished");
    
    // Find the last bid to determine winner
    const bids = await storage.getBidsForAuction(auctionId);
    if (bids.length > 0) {
      // Set winner - could be user or bot
      if (bids[0].userId) {
        await storage.updateAuctionWinner(auctionId, bids[0].userId);
      }
      // Note: Bot winners are tracked via the last bid record
      console.log(`Auction ${auctionId} ended. Winner: ${bids[0].userId ? 'User' : 'Bot'} with bid ${bids[0].amount}`);
    } else {
      // If no bids, check if there were prebids and award to the first prebidder
      const prebids = await storage.getPrebidsForAuction(auctionId);
      if (prebids.length > 0) {
        const firstPrebidder = prebids[0]; // First prebid wins
        await storage.updateAuctionWinner(auctionId, firstPrebidder.userId);
        console.log(`Auction ${auctionId} ended with no bids. Winner: Prebidder ${firstPrebidder.userId}`);
      }
    }

    timerService.stopAuctionTimer(auctionId);
    botService.stopBotsForAuction(auctionId);

    // Get updated auction data and broadcast to all clients
    const updatedAuction = await storage.getAuction(auctionId);
    if (updatedAuction) {
      broadcastAuctionUpdate(auctionId, { 
        auction: updatedAuction, 
        bids: bids.slice(0, 5) 
      });
    }
  }

  async placeBid(auctionId: string, userId: string): Promise<boolean> {
    const auction = await storage.getAuction(auctionId);
    if (!auction || auction.status !== "live") return false;

    const user = await storage.getUser(userId);
    if (!user) return false;

    const newPrice = (parseFloat(auction.currentPrice) + parseFloat(auction.bidIncrement)).toFixed(2);
    
    // Check if user has sufficient bid balance
    if (user.bidBalance < 1) {
      return false;
    }

    // Create bid
    const bid: InsertBid = {
      auctionId,
      userId,
      amount: newPrice,
      isBot: false,
    };

    await storage.createBid(bid);
    await storage.updateAuctionPrice(auctionId, newPrice);
    await storage.updateUserBidBalance(userId, 1);

    // Get updated user balance and broadcast the change
    const updatedUser = await storage.getUser(userId);
    if (updatedUser) {
      broadcastBidBalanceUpdate(userId, updatedUser.bidBalance);
    }

    // **FIX #1: resetAuctionTimer is now async**
    await timerService.resetAuctionTimer(auctionId);

    // Broadcast real-time update
    const updatedBids = await storage.getBidsForAuction(auctionId);
    const updatedAuction = await storage.getAuction(auctionId);
    if (updatedAuction) {
      broadcastAuctionUpdate(auctionId, { 
        auction: updatedAuction, 
        bids: updatedBids.slice(0, 5) 
      });
    }

    return true;
  }

  async placeBotBid(auctionId: string, botId: string): Promise<boolean> {
    const auction = await storage.getAuction(auctionId);
    if (!auction || auction.status !== "live") return false;

    const newPrice = (parseFloat(auction.currentPrice) + parseFloat(auction.bidIncrement)).toFixed(2);

    const bid: InsertBid = {
      auctionId,
      userId: null,
      botId,
      amount: newPrice,
      isBot: true,
    };

    await storage.createBid(bid);
    await storage.updateAuctionPrice(auctionId, newPrice);
    await storage.updateAuctionBotBidCount(auctionId, botId);

    // **FIX #1: resetAuctionTimer is now async**
    await timerService.resetAuctionTimer(auctionId);

    // Broadcast real-time update for bot bid
    const updatedBids = await storage.getBidsForAuction(auctionId);
    const updatedAuction = await storage.getAuction(auctionId);
    if (updatedAuction) {
      broadcastAuctionUpdate(auctionId, { 
        auction: updatedAuction, 
        bids: updatedBids.slice(0, 5) 
      });
    }

    return true;
  }

  async placePrebid(auctionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const auction = await storage.getAuction(auctionId);
    if (!auction || auction.status !== "upcoming") {
      return { success: false, error: "Аукцион не найден или уже не готовится к старту" };
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return { success: false, error: "Пользователь не найден" };
    }

    // Check if user has sufficient bid balance (1 bid required for prebid)
    if (user.bidBalance < 1) {
      return { success: false, error: "Недостаточно ставок для размещения представки" };
    }

    // Check if user already has a prebid for this auction
    const existingPrebids = await storage.getPrebidsForAuction(auctionId);
    const userAlreadyHasPrebid = existingPrebids.some(prebid => prebid.userId === userId);
    if (userAlreadyHasPrebid) {
      return { success: false, error: "Вы не можете перебить собственную представку" };
    }

    // Deduct 1 bid from user's balance and create prebid
    await storage.updateUserBidBalance(userId, 1);
    await storage.createPrebid({ auctionId, userId });
    
    // Get updated user balance and broadcast the change
    const updatedUser = await storage.getUser(userId);
    if (updatedUser) {
      broadcastBidBalanceUpdate(userId, updatedUser.bidBalance);
    }
    
    // Update auction current price to reflect the new prebid
    const updatedPrebids = await storage.getPrebidsForAuction(auctionId);
    // Get the original base price (0.00 for new auctions)
    const originalBasePrice = 0.00; // Auctions start at 0.00
    const increment = parseFloat(auction.bidIncrement);
    const newPrice = (originalBasePrice + (increment * updatedPrebids.length)).toFixed(2);
    await storage.updateAuctionPrice(auctionId, newPrice);
    
    return { success: true };
  }

  async checkUpcomingAuctions() {
    const upcomingAuctions = await storage.getAuctionsByStatus("upcoming");
    const now = new Date();

    for (const auction of upcomingAuctions) {
      if (auction.startTime <= now) {
        await this.startAuction(auction.id);
      }
    }
  }

  // Restart all live auctions after server restart
  async restartLiveAuctions() {
    const liveAuctions = await storage.getAuctionsByStatus("live");
    
    for (const auction of liveAuctions) {
      console.log(`Restarting live auction: ${auction.title} (${auction.id})`);
      // **FIX #1: startAuctionTimer is now async**
      await timerService.startAuctionTimer(auction.id);
      await botService.startBotsForAuction(auction.id);
    }
    
    console.log(`Restarted ${liveAuctions.length} live auctions`);
  }

  async convertPrebidsToBids(auctionId: string) {
    const auction = await storage.getAuction(auctionId);
    if (!auction) return;

    const prebids = await storage.getPrebidsForAuction(auctionId);
    
    if (prebids.length > 0) {
      // Convert all prebids to actual bids in chronological order
      const basePrice = parseFloat(auction.currentPrice);
      const increment = parseFloat(auction.bidIncrement);
      
      for (let i = 0; i < prebids.length; i++) {
        const prebid = prebids[i];
        const bidAmount = (basePrice + (increment * (i + 1))).toFixed(2);
        
        const bid: InsertBid = {
          auctionId,
          userId: prebid.userId,
          amount: bidAmount,
          isBot: false,
        };

        await storage.createBid(bid);
      }
      
      // Update auction price to the highest prebid amount
      const finalPrice = (basePrice + (increment * prebids.length)).toFixed(2);
      await storage.updateAuctionPrice(auctionId, finalPrice);
      
      console.log(`Converted ${prebids.length} prebids to bids for auction ${auctionId}. Final price: ${finalPrice}`);
    }
  }
}

export const auctionService = new AuctionService();
