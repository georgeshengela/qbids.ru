import { storage } from "../storage";
import type { Bot, InsertBot, InsertAuctionBot } from "@shared/schema";

export class BotService {
  // Bot CRUD operations
  async getAllBots(): Promise<Bot[]> {
    return await storage.getAllBots();
  }

  async getBot(id: string): Promise<Bot | null> {
    const bot = await storage.getBot(id);
    return bot || null;
  }

  async createBot(botData: InsertBot): Promise<Bot> {
    return await storage.createBot(botData);
  }

  async updateBot(id: string, botData: Partial<InsertBot>): Promise<Bot> {
    return await storage.updateBot(id, botData);
  }

  async deleteBot(id: string): Promise<void> {
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
  }

  async removeBotFromAuction(auctionId: string, botId: string): Promise<void> {
    await storage.removeBotFromAuction(auctionId, botId);
  }

  async getAuctionBots(auctionId: string) {
    return await storage.getAuctionBots(auctionId);
  }

  async getBotsWithAuctionStatus() {
    const bots = await storage.getAllBots();
    const result = [];
    
    for (const bot of bots) {
      const auctionBots = await storage.getBotAuctions(bot.id);
      const activeAuctions = auctionBots.filter(ab => ab.isActive);
      
      result.push({
        id: bot.id,
        firstName: bot.firstName,
        lastName: bot.lastName,
        isEnabled: bot.isActive,
        activeAuctions: activeAuctions.length,
        auctionIds: activeAuctions.map(ab => ab.auctionId)
      });
    }
    
    return result;
  }

  // Bot bidding logic with simple rotation
  private currentBotIndex = new Map<string, number>();
  private lastBidTime = new Map<string, number>();
  private auctionLocks = new Map<string, boolean>();

  async checkAndPlaceBotBid(auctionId: string, currentTimer: number): Promise<void> {
    // Add some randomization to prevent predictable bidding loops
    // Only bid at 4 seconds with 70% chance, or at 2 seconds with 50% chance
    const shouldBidAt4 = currentTimer === 4 && Math.random() < 0.7;
    const shouldBidAt2 = currentTimer === 2 && Math.random() < 0.5;
    
    if (!shouldBidAt4 && !shouldBidAt2) {
      return;
    }

    // Check if this auction is already processing a bot bid
    if (this.auctionLocks.get(auctionId)) {
      return;
    }

    // Lock this auction to prevent multiple simultaneous bot bids
    this.auctionLocks.set(auctionId, true);

    try {
      // Prevent multiple bids within the same second (using timestamp)
      const now = Date.now();
      const lastBid = this.lastBidTime.get(auctionId) || 0;
      if (now - lastBid < 1000) { // Less than 1 second since last bid
        return;
      }

      const auctionBots = await this.getAuctionBots(auctionId);
      const activeBots = auctionBots.filter(ab => 
        ab.isActive && 
        ab.bot.isActive && 
        (ab.bidLimit === 0 || ab.currentBids < ab.bidLimit)
      ).sort((a, b) => a.bidLimit - b.bidLimit); // Sort by bid limit ascending for predictable rotation
      
      const totalPossibleBids = activeBots.reduce((sum, bot) => sum + (bot.bidLimit - bot.currentBids), 0);
      console.log(`Auction ${auctionId}: ${activeBots.length} active bots remaining with ${totalPossibleBids} total bids left: ${activeBots.map(ab => `${ab.bot.username}(${ab.currentBids}/${ab.bidLimit})`).join(', ')}`);
      
      if (activeBots.length === 0) {
        console.log(`No active bots for auction ${auctionId}`);
        return;
      }

      // If only one bot remains, let them win - don't bid against yourself!
      if (activeBots.length === 1) {
        console.log(`Only one bot (${activeBots[0].bot.username}) remains active with ${activeBots[0].bidLimit - activeBots[0].currentBids} bids left. Letting them win instead of bidding against themselves.`);
        return;
      }

      // Multiple bots competing - continue the battle  
      // If timer is at 2 seconds and multiple bots are active, force a bid to keep competition alive
      if (currentTimer === 2 && activeBots.length > 1) {
        console.log(`Timer at 2 seconds with ${activeBots.length} active bots - forcing bid to continue competition`);
      }

      // Get current bot index for this auction (carousel rotation)
      let currentIndex = this.currentBotIndex.get(auctionId) || 0;
      const selectedBot = activeBots[currentIndex % activeBots.length];
      
      // Update index for next time and track this bid
      this.currentBotIndex.set(auctionId, (currentIndex + 1) % activeBots.length);
      this.lastBidTime.set(auctionId, now);

      console.log(`Bot ${selectedBot.bot.username} placing bid (${selectedBot.currentBids + 1}/${selectedBot.bidLimit}) at timer ${currentTimer}`);

      // Place the bid via auction service
      const { auctionService } = await import("./auction-service");
      await auctionService.placeBotBid(auctionId, selectedBot.botId);
    } finally {
      // Always unlock the auction, even if bid placement fails
      this.auctionLocks.set(auctionId, false);
    }
  }

  async startBotsForAuction(auctionId: string): Promise<void> {
    // Initialize bot rotation for this auction
    this.currentBotIndex.set(auctionId, 0);
    this.lastBidTime.set(auctionId, 0);
    this.auctionLocks.set(auctionId, false);
  }

  async stopBotsForAuction(auctionId: string): Promise<void> {
    // Clean up bot rotation state
    this.currentBotIndex.delete(auctionId);
    this.lastBidTime.delete(auctionId);
    this.auctionLocks.delete(auctionId);
  }
}

export const botService = new BotService();