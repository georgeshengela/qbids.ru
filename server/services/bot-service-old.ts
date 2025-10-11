import { storage } from "../storage";
import { auctionService } from "./auction-service";
import { timerService } from "./timer-service";
import type { Bot, InsertBot, InsertAuctionBot } from "@shared/schema";

class BotService {
  private botQueues: Map<string, Bot[]> = new Map(); // auctionId -> Bot[]
  private currentBotIndex: Map<string, number> = new Map(); // auctionId -> current bot index
  private lastBotBidTime: Map<string, number> = new Map(); // auctionId -> timestamp of last bot bid

  // Bot management methods
  async getAllBots(): Promise<Bot[]> {
    return await storage.getAllBots();
  }

  async createBot(botData: InsertBot): Promise<Bot> {
    return await storage.createBot(botData);
  }

  async updateBot(id: string, botData: Partial<InsertBot>): Promise<Bot> {
    return await storage.updateBot(id, botData);
  }

  async deleteBot(id: string): Promise<void> {
    // Remove bot from all active auction queues
    for (const [auctionId, botList] of Array.from(this.botQueues.entries())) {
      const index = botList.findIndex((bot: Bot) => bot.id === id);
      if (index !== -1) {
        botList.splice(index, 1);
      }
    }
    
    await storage.deleteBot(id);
  }

  // Auction bot management
  async addBotToAuction(auctionId: string, botId: string, bidLimit: number = 0): Promise<void> {
    const auctionBot: InsertAuctionBot = {
      auctionId,
      botId,
      bidLimit,
      currentBids: 0,
      isActive: true,
    };
    
    await storage.addBotToAuction(auctionBot);
    
    // Add bot to queue if auction is live
    const auction = await storage.getAuction(auctionId);
    if (auction?.status === "live") {
      await this.initializeBotQueue(auctionId);
    }
  }

  async removeBotFromAuction(auctionId: string, botId: string): Promise<void> {
    await storage.removeBotFromAuction(auctionId, botId);
    
    // Remove bot from active queue
    const queue = this.botQueues.get(auctionId);
    if (queue) {
      const index = queue.findIndex(bot => bot.id === botId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
  }

  async getAuctionBots(auctionId: string) {
    return await storage.getAuctionBots(auctionId);
  }

  // Bot bidding logic
  async initializeBotQueue(auctionId: string): Promise<void> {
    const auctionBots = await storage.getAuctionBots(auctionId);
    const activeBots = auctionBots
      .filter(ab => ab.isActive && (ab.bidLimit === 0 || ab.currentBids < ab.bidLimit))
      .map(ab => ab.bot);
    
    this.botQueues.set(auctionId, activeBots);
    this.currentBotIndex.set(auctionId, 0); // Start with first bot
  }

  // Disabled automatic bot bidding to fix timing issues
  async checkAndPlaceBotBid(auctionId: string, currentTimer: number): Promise<void> {
    // Bot auto-bidding completely disabled
    return;

    const auction = await storage.getAuction(auctionId);
    if (!auction || auction.status !== "live") {
      return;
    }

    const settings = await storage.getBotSettings();
    if (!settings?.enabled) {
      return;
    }

    const botQueue = this.botQueues.get(auctionId);
    if (!botQueue || botQueue.length === 0) {
      return;
    }

    let currentIndex = this.currentBotIndex.get(auctionId) || 0;
    
    // Get current bot in rotation
    const currentBot = botQueue[currentIndex];
    if (!currentBot) {
      return;
    }

    try {
      // Check if bot still has bids available
      const auctionBots = await storage.getAuctionBots(auctionId);
      const botData = auctionBots.find(ab => ab.bot.id === currentBot.id);
      
      if (botData && (botData.bidLimit === 0 || botData.currentBids < botData.bidLimit)) {
        const success = await auctionService.placeBotBid(auctionId, currentBot.id);
        
        if (success) {
          console.log(`Bot ${currentBot.firstName} ${currentBot.lastName} placed bid on auction ${auctionId}`);
          
          // Record the time of this bot bid for spacing control
          this.lastBotBidTime.set(auctionId, now);
          
          // Move to next bot in carousel rotation
          currentIndex = (currentIndex + 1) % botQueue.length;
          this.currentBotIndex.set(auctionId, currentIndex);
        }
      } else {
        // Bot reached limit, remove from queue and update rotation
        botQueue.splice(currentIndex, 1);
        if (botQueue.length > 0) {
          currentIndex = currentIndex % botQueue.length;
          this.currentBotIndex.set(auctionId, currentIndex);
        } else {
          this.botQueues.delete(auctionId);
          this.currentBotIndex.delete(auctionId);
        }
      }
    } catch (error) {
      console.error(`Error placing bot bid for auction ${auctionId}:`, error);
    }
  }

  async startBotsForAuction(auctionId: string): Promise<void> {
    await this.initializeBotQueue(auctionId);
  }

  stopBotsForAuction(auctionId: string): void {
    this.botQueues.delete(auctionId);
    this.currentBotIndex.delete(auctionId);
  }

  /**
   * Get all bots with their current auction status
   */
  async getBotsWithAuctionStatus() {
    const bots = await storage.getAllBots();
    const liveAuctions = await storage.getLiveAuctions();
    
    const botsWithStatus = await Promise.all(
      bots.map(async (bot) => {
        // Get all auction-bot associations for this bot
        const auctionBots = await storage.getBotAuctions(bot.id);
        
        // Filter for live auctions
        const liveAuctionBots = auctionBots.filter(ab => 
          liveAuctions.some(auction => auction.id === ab.auctionId)
        );
        
        return {
          ...bot,
          currentAuctions: liveAuctionBots.map(ab => ({
            auctionId: ab.auctionId,
            auctionTitle: liveAuctions.find(a => a.id === ab.auctionId)?.title || 'Unknown',
            bidLimit: ab.bidLimit,
            currentBids: ab.currentBids,
            isActive: ab.isActive
          }))
        };
      })
    );
    
    return botsWithStatus;
  }

  // Generate sample bot names
  async createSampleBots(): Promise<void> {
    const sampleBots = [
      { firstName: "Алексей", lastName: "Петров" },
      { firstName: "Елена", lastName: "Сидорова" },
      { firstName: "Дмитрий", lastName: "Иванов" },
      { firstName: "Анна", lastName: "Кузнецова петров" },
      { firstName: "Сергей", lastName: "Волков" },
      { firstName: "Мария", lastName: "Соколова" },
      { firstName: "Александр", lastName: "Лебедев" },
      { firstName: "Ольга", lastName: "Козлова" },
      { firstName: "Михаил", lastName: "Новиков" },
      { firstName: "Татьяна", lastName: "Морозова" },
    ];

    for (const bot of sampleBots) {
      try {
        await this.createBot(bot);
      } catch (error) {
        // Bot might already exist, continue
        console.log(`Bot ${bot.firstName} ${bot.lastName} might already exist`);
      }
    }
  }
}

export const botService = new BotService();