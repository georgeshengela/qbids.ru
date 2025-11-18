import { auctionService } from "./auction-service";
import { botService } from "./bot-service";
import { broadcastAuctionUpdate } from "../socket";
import { storage } from "../storage";

interface AuctionTimer {
  auctionId: string;
  timeLeft: number;
  interval: NodeJS.Timeout;
}

export class TimerService {
  private timers = new Map<string, AuctionTimer>();

  async startAuctionTimer(auctionId: string, seconds?: number) {
    this.stopAuctionTimer(auctionId);

    // **FIX #1: Fetch auction's actual timerSeconds from database**
    // If seconds not provided, get it from the auction record
    let timerDuration = seconds;
    if (timerDuration === undefined) {
      const auction = await storage.getAuction(auctionId);
      if (!auction) {
        console.error(`Cannot start timer: Auction ${auctionId} not found`);
        return;
      }
      timerDuration = auction.timerSeconds;
      console.log(`Starting auction ${auctionId} with ${timerDuration}s timer (from database)`);
    } else {
      console.log(`Starting auction ${auctionId} with ${timerDuration}s timer (override)`);
    }

    const timer: AuctionTimer = {
      auctionId,
      timeLeft: timerDuration,
      interval: setInterval(async () => {
        timer.timeLeft--;
        
        // Check for bot bidding opportunity
        await botService.checkAndPlaceBotBid(auctionId, timer.timeLeft);
        
        // Broadcast timer update to all clients
        broadcastAuctionUpdate(auctionId, { 
          type: 'timer', 
          auctionId, 
          timeLeft: timer.timeLeft 
        });
        
        // If timer reaches 0, finish auction
        if (timer.timeLeft <= 0) {
          this.stopAuctionTimer(auctionId);
          await botService.stopBotsForAuction(auctionId);
          auctionService.endAuction(auctionId);
        }
      }, 1000),
    };

    this.timers.set(auctionId, timer);
  }

  async resetAuctionTimer(auctionId: string, seconds?: number) {
    const timer = this.timers.get(auctionId);
    
    // **FIX #1 (continued): Use auction's timerSeconds when resetting**
    let timerDuration = seconds;
    if (timerDuration === undefined) {
      const auction = await storage.getAuction(auctionId);
      if (auction) {
        timerDuration = auction.timerSeconds;
      } else {
        timerDuration = 10; // Fallback to 10 if auction not found
      }
    }
    
    if (timer) {
      timer.timeLeft = timerDuration;
    } else {
      // If no timer exists, start a new one
      await this.startAuctionTimer(auctionId, timerDuration);
    }
  }

  stopAuctionTimer(auctionId: string) {
    const timer = this.timers.get(auctionId);
    if (timer) {
      clearInterval(timer.interval);
      this.timers.delete(auctionId);
    }
  }

  getTimeLeft(auctionId: string): number {
    const timer = this.timers.get(auctionId);
    return timer ? timer.timeLeft : 0;
  }

  getAllTimers(): Record<string, number> {
    const result: Record<string, number> = {};
    this.timers.forEach((timer, auctionId) => {
      result[auctionId] = timer.timeLeft;
    });
    return result;
  }
}

export const timerService = new TimerService();
