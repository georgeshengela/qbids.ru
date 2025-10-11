import { auctionService } from "./auction-service";
import { botService } from "./bot-service";
import { broadcastAuctionUpdate } from "../socket";

interface AuctionTimer {
  auctionId: string;
  timeLeft: number;
  interval: NodeJS.Timeout;
}

export class TimerService {
  private timers = new Map<string, AuctionTimer>();

  startAuctionTimer(auctionId: string, seconds = 10) {
    this.stopAuctionTimer(auctionId);

    const timer: AuctionTimer = {
      auctionId,
      timeLeft: seconds,
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

  resetAuctionTimer(auctionId: string, seconds = 10) {
    const timer = this.timers.get(auctionId);
    if (timer) {
      timer.timeLeft = seconds;
    } else {
      // If no timer exists, start a new one
      this.startAuctionTimer(auctionId, seconds);
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
