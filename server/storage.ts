import { 
  users, auctions, bids, prebids, botSettings, bots, auctionBots, settings,
  type User, type InsertUser, 
  type Auction, type InsertAuction,
  type Bid, type InsertBid,
  type Prebid, type InsertPrebid,
  type BotSettings, type InsertBotSettings,
  type Bot, type InsertBot,
  type AuctionBot, type InsertAuctionBot,
  type Settings, type InsertSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateUserBidBalance(userId: string, amount: number): Promise<void>;
  updateUserIpAddress(userId: string, ipAddress: string): Promise<void>;
  getUserWonAuctions(userId: string): Promise<(Auction & { wonAt: string; finalPrice: number; slug: string })[]>;
  getUserRecentBids(userId: string, limit?: number): Promise<(Bid & { auction: Auction; createdAt: string })[]>;
  getUsersWithStats(page: number, limit: number, search: string): Promise<{
    users: (User & { 
      totalBids: number; 
      wonAuctions: number; 
      totalSpent: number; 
      lastLogin?: string;
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  
  // Auction methods
  getAuction(id: string): Promise<Auction | undefined>;
  getAllAuctions(): Promise<Auction[]>;
  getAuctionsByStatus(status: "upcoming" | "live" | "finished"): Promise<(Auction & { winner?: User })[]>;
  createAuction(auction: InsertAuction): Promise<Auction>;
  updateAuction(id: string, auction: Partial<InsertAuction>): Promise<Auction>;
  deleteAuction(id: string): Promise<void>;
  updateAuctionStatus(id: string, status: "upcoming" | "live" | "finished"): Promise<void>;
  updateAuctionPrice(id: string, price: string): Promise<void>;
  updateAuctionWinner(id: string, winnerId: string): Promise<void>;
  
  // Bid methods
  getBidsForAuction(auctionId: string): Promise<Bid[]>;
  getRecentBids(limit?: number): Promise<(Bid & { auction: Auction; user?: User })[]>;
  getUserBids(userId: string, limit?: number): Promise<(Bid & { auction: Auction })[]>;
  getUserPrebids(userId: string, limit?: number): Promise<(any & { auction: Auction })[]>;
  getLastBotBidForAuction(auctionId: string): Promise<Bid | undefined>;
  createBid(bid: InsertBid): Promise<Bid>;
  
  // Prebid methods
  getPrebidsForAuction(auctionId: string): Promise<Prebid[]>;
  createPrebid(prebid: InsertPrebid): Promise<Prebid>;
  
  // Bot settings methods
  getBotSettings(): Promise<BotSettings | undefined>;
  updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings>;
  
  // Bot management methods
  getAllBots(): Promise<Bot[]>;
  getBot(id: string): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: string, bot: Partial<InsertBot>): Promise<Bot>;
  deleteBot(id: string): Promise<void>;
  
  // Auction bot methods
  getAuctionBots(auctionId: string): Promise<(AuctionBot & { bot: Bot })[]>;
  getBotAuctions(botId: string): Promise<AuctionBot[]>;
  addBotToAuction(auctionBot: InsertAuctionBot): Promise<AuctionBot>;
  removeBotFromAuction(auctionId: string, botId: string): Promise<void>;
  updateAuctionBotBidCount(auctionId: string, botId: string): Promise<void>;
  
  // Statistics methods
  getAuctionDetailedStats(auctionId: string): Promise<{
    totalBids: number;
    botBids: number;
    userBids: number;
    adminBids: number;
    bids: Array<{
      id: string;
      userId: string;
      userName: string;
      userRole: string;
      bidAmount: string;
      createdAt: string;
      isBot: boolean;
    }>;
  }>;
  getUserStats(userId: string): Promise<{
    activeBids: number;
    wonAuctions: number;
    totalSpent: string;
    activePrebids: number;
  }>;
  
  // Settings methods
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete related data first to avoid foreign key constraint violations
    
    // Remove user as winner from any auctions
    await db.update(auctions)
      .set({ winnerId: null })
      .where(eq(auctions.winnerId, id));

    // Delete user's prebids
    await db.delete(prebids).where(eq(prebids.userId, id));
    
    // Delete user's bids
    await db.delete(bids).where(eq(bids.userId, id));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserBidBalance(userId: string, amount: number): Promise<void> {
    await db.update(users)
      .set({ bidBalance: sql`${users.bidBalance} - ${amount}` })
      .where(eq(users.id, userId));
  }

  async updateUserIpAddress(userId: string, ipAddress: string): Promise<void> {
    await db.update(users)
      .set({ ipAddress: ipAddress })
      .where(eq(users.id, userId));
  }

  async getUserWonAuctions(userId: string): Promise<(Auction & { wonAt: string; finalPrice: number; slug: string })[]> {
    const wonAuctions = await db.select().from(auctions)
      .where(and(eq(auctions.winnerId, userId), eq(auctions.status, "finished")))
      .orderBy(desc(auctions.endTime));

    const createSlug = (title: string, displayId: string): string => {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9а-я\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 35);
      const cleanDisplayId = displayId.replace(/[/\\]/g, '-').toLowerCase();
      return `${baseSlug}-${cleanDisplayId}`;
    };

    return wonAuctions.map(auction => ({
      ...auction,
      wonAt: auction.endTime ? auction.endTime.toISOString() : new Date().toISOString(),
      finalPrice: parseInt(auction.currentPrice),
      slug: createSlug(auction.title, auction.displayId)
    }));
  }

  async getUserRecentBids(userId: string, limit: number = 20): Promise<(Bid & { auction: Auction; createdAt: string })[]> {
    const userBids = await db.select({
      id: bids.id,
      amount: bids.amount,
      auctionId: bids.auctionId,
      userId: bids.userId,
      botId: bids.botId,
      isBot: bids.isBot,
      createdAt: bids.createdAt,
      auction: {
        id: auctions.id,
        title: auctions.title,
        description: auctions.description,
        imageUrl: auctions.imageUrl,
        retailPrice: auctions.retailPrice,
        currentPrice: auctions.currentPrice,
        bidIncrement: auctions.bidIncrement,
        startTime: auctions.startTime,
        endTime: auctions.endTime,
        status: auctions.status,
        winnerId: auctions.winnerId,
        createdAt: auctions.createdAt,
        displayId: auctions.displayId,
        timerSeconds: auctions.timerSeconds,
      }
    })
    .from(bids)
    .innerJoin(auctions, eq(bids.auctionId, auctions.id))
    .where(eq(bids.userId, userId))
    .orderBy(desc(bids.createdAt))
    .limit(limit);

    return userBids.map(bid => ({
      id: bid.id,
      amount: bid.amount,
      auctionId: bid.auctionId,
      userId: bid.userId,
      botId: bid.botId,
      isBot: bid.isBot,
      createdAt: bid.createdAt,
      auction: bid.auction
    })) as (Bid & { auction: Auction; createdAt: string })[];
  }

  async getAuction(id: string): Promise<Auction | undefined> {
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
    return auction || undefined;
  }

  async getAllAuctions(): Promise<Auction[]> {
    return await db.select().from(auctions).orderBy(desc(auctions.createdAt));
  }

  async getAuctionsByStatus(status: "upcoming" | "live" | "finished"): Promise<(Auction & { winner?: User })[]> {
    if (status === "finished") {
      // For finished auctions, include winner information
      const results = await db.select({
        id: auctions.id,
        title: auctions.title,
        description: auctions.description,
        imageUrl: auctions.imageUrl,
        retailPrice: auctions.retailPrice,
        currentPrice: auctions.currentPrice,
        bidIncrement: auctions.bidIncrement,
        startTime: auctions.startTime,
        endTime: auctions.endTime,
        status: auctions.status,
        winnerId: auctions.winnerId,
        createdAt: auctions.createdAt,
        displayId: auctions.displayId,
        timerSeconds: auctions.timerSeconds,
        isBidPackage: auctions.isBidPackage,
        winner: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          bidBalance: users.bidBalance,
          role: users.role,
          password: users.password,
          ipAddress: users.ipAddress,
          createdAt: users.createdAt,
          dateOfBirth: users.dateOfBirth,
          gender: users.gender,
        }
      })
      .from(auctions)
      .leftJoin(users, eq(auctions.winnerId, users.id))
      .where(eq(auctions.status, status))
      .orderBy(desc(auctions.createdAt));

      return results.map(result => ({
        ...result,
        winner: result.winner && result.winner.id ? result.winner : undefined
      }));
    }

    return await db.select().from(auctions).where(eq(auctions.status, status)).orderBy(desc(auctions.createdAt));
  }

  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    // Generate a display ID in QB/XXXX format
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
    const displayId = `QB/${randomDigits}`;
    
    const [auction] = await db.insert(auctions).values({
      ...insertAuction,
      displayId
    }).returning();
    return auction;
  }

  async updateAuction(id: string, auctionData: Partial<InsertAuction>): Promise<Auction> {
    const [auction] = await db.update(auctions)
      .set(auctionData)
      .where(eq(auctions.id, id))
      .returning();
    return auction;
  }

  async deleteAuction(id: string): Promise<void> {
    await db.delete(auctions).where(eq(auctions.id, id));
  }

  async updateAuctionStatus(id: string, status: "upcoming" | "live" | "finished"): Promise<void> {
    await db.update(auctions)
      .set({ status, ...(status === "finished" ? { endTime: new Date() } : {}) })
      .where(eq(auctions.id, id));
  }

  async updateAuctionPrice(id: string, price: string): Promise<void> {
    await db.update(auctions).set({ currentPrice: price }).where(eq(auctions.id, id));
  }

  async updateAuctionWinner(id: string, winnerId: string): Promise<void> {
    await db.update(auctions).set({ winnerId }).where(eq(auctions.id, id));
  }

  async getBidsForAuction(auctionId: string): Promise<any[]> {
    // Get actual bids
    const actualBids = await db
      .select({
        id: bids.id,
        auctionId: bids.auctionId,
        userId: bids.userId,
        botId: bids.botId,
        amount: bids.amount,
        isBot: bids.isBot,
        createdAt: bids.createdAt,
        isPrebid: sql<boolean>`false`,
        user: {
          id: users.id,
          username: users.username,
        },
        botName: sql<string>`CASE WHEN ${bids.isBot} = true THEN ${bots.username} ELSE NULL END`,
      })
      .from(bids)
      .leftJoin(users, eq(bids.userId, users.id))
      .leftJoin(bots, eq(bids.botId, bots.id))
      .where(eq(bids.auctionId, auctionId));

    // Get prebids and calculate their amounts
    const prebidsRaw = await db
      .select({
        id: prebids.id,
        auctionId: prebids.auctionId,
        userId: prebids.userId,
        createdAt: prebids.createdAt,
        user: {
          id: users.id,
          username: users.username,
        },
      })
      .from(prebids)
      .leftJoin(users, eq(prebids.userId, users.id))
      .where(eq(prebids.auctionId, auctionId))
      .orderBy(prebids.createdAt);

    // Get auction for original base price (before prebids)
    const auction = await this.getAuction(auctionId);
    // Calculate base price by subtracting existing prebids
    const currentPrice = parseFloat(auction?.currentPrice || "0.00");
    const increment = parseFloat(auction?.bidIncrement || "0.01");
    const basePrice = Math.max(0, currentPrice - (increment * prebidsRaw.length));

    // Calculate amounts for prebids based on order from original base
    const prebidsData = prebidsRaw.map((prebid, index) => ({
      id: prebid.id,
      auctionId: prebid.auctionId,
      userId: prebid.userId,
      botId: null as string | null,
      amount: (basePrice + (increment * (index + 1))).toFixed(2),
      isBot: false,
      createdAt: prebid.createdAt,
      isPrebid: true,
      user: prebid.user,
      botName: null as string | null,
    }));

    // Combine and sort by creation date
    const allBids = [...actualBids, ...prebidsData];
    return allBids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getRecentBids(limit = 10): Promise<any[]> {
    const results = await db
      .select({
        id: bids.id,
        auctionId: bids.auctionId,
        userId: bids.userId,
        botId: bids.botId,
        amount: bids.amount,
        isBot: bids.isBot,
        createdAt: bids.createdAt,
        auction: auctions,
        user: {
          id: users.id,
          username: users.username,
        },
        botName: sql<string>`CASE WHEN ${bids.isBot} = true THEN ${bots.username} ELSE NULL END`,
      })
      .from(bids)
      .innerJoin(auctions, eq(bids.auctionId, auctions.id))
      .leftJoin(users, eq(bids.userId, users.id))
      .leftJoin(bots, eq(bids.botId, bots.id))
      .orderBy(desc(bids.createdAt))
      .limit(limit);

    return results.map(result => ({
      ...result,
      user: result.user?.id ? result.user : undefined,
    }));
  }

  async getUserBids(userId: string, limit = 50): Promise<(Bid & { auction: Auction })[]> {
    const results = await db
      .select({
        id: bids.id,
        auctionId: bids.auctionId,
        userId: bids.userId,
        botId: bids.botId,
        amount: bids.amount,
        isBot: bids.isBot,
        createdAt: bids.createdAt,
        auction: auctions,
      })
      .from(bids)
      .innerJoin(auctions, eq(bids.auctionId, auctions.id))
      .where(and(eq(bids.userId, userId), eq(bids.isBot, false)))
      .orderBy(desc(bids.createdAt))
      .limit(limit);

    return results;
  }

  async getUserPrebids(userId: string, limit = 50): Promise<(any & { auction: Auction })[]> {
    const results = await db
      .select({
        id: prebids.id,
        auctionId: prebids.auctionId,
        userId: prebids.userId,
        createdAt: prebids.createdAt,
        auction: auctions,
      })
      .from(prebids)
      .innerJoin(auctions, eq(prebids.auctionId, auctions.id))
      .where(eq(prebids.userId, userId))
      .orderBy(desc(prebids.createdAt))
      .limit(limit);

    return results;
  }

  async getLastBotBidForAuction(auctionId: string): Promise<Bid | undefined> {
    const [lastBotBid] = await db
      .select()
      .from(bids)
      .where(and(eq(bids.auctionId, auctionId), eq(bids.isBot, true)))
      .orderBy(desc(bids.createdAt))
      .limit(1);
    return lastBotBid || undefined;
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const [bid] = await db.insert(bids).values(insertBid).returning();
    return bid;
  }

  async getPrebidsForAuction(auctionId: string): Promise<Prebid[]> {
    return await db.select().from(prebids).where(eq(prebids.auctionId, auctionId));
  }

  async createPrebid(insertPrebid: InsertPrebid): Promise<Prebid> {
    const [prebid] = await db.insert(prebids).values(insertPrebid).returning();
    return prebid;
  }

  async getBotSettings(): Promise<BotSettings | undefined> {
    const [settings] = await db.select().from(botSettings).limit(1);
    if (!settings) {
      // Create default settings
      const [newSettings] = await db.insert(botSettings).values({}).returning();
      return newSettings;
    }
    return settings;
  }

  async updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings> {
    const existing = await this.getBotSettings();
    if (!existing) {
      const [newSettings] = await db.insert(botSettings).values(settings).returning();
      return newSettings;
    }
    
    const [updated] = await db
      .update(botSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(botSettings.id, existing.id))
      .returning();
    return updated;
  }

  async getUserStats(userId: string): Promise<{
    activeBids: number;
    wonAuctions: number;
    totalSpent: string;
    activePrebids: number;
  }> {
    const [activeBidsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bids)
      .innerJoin(auctions, eq(bids.auctionId, auctions.id))
      .where(and(eq(bids.userId, userId), eq(auctions.status, "live")));

    const [wonAuctionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auctions)
      .where(eq(auctions.winnerId, userId));

    // Calculate total spent as: (number of bids + number of prebids) × 0.01 сом per bid
    const [totalBidsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bids)
      .where(eq(bids.userId, userId));

    const [totalPrebidsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(prebids)
      .where(eq(prebids.userId, userId));

    const totalSpent = (((totalBidsResult?.count || 0) + (totalPrebidsResult?.count || 0)) * 0.01).toFixed(2);

    const [activePrebidsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(prebids)
      .innerJoin(auctions, eq(prebids.auctionId, auctions.id))
      .where(and(eq(prebids.userId, userId), eq(auctions.status, "upcoming")));

    return {
      activeBids: activeBidsResult?.count || 0,
      wonAuctions: wonAuctionsResult?.count || 0,
      totalSpent: totalSpent,
      activePrebids: activePrebidsResult?.count || 0,
    };
  }

  async getUsersWithStats(page: number, limit: number, search: string): Promise<{
    users: (User & { 
      totalBids: number; 
      wonAuctions: number; 
      totalSpent: number; 
      lastLogin?: string;
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    // Build search condition
    let searchCondition = sql`true`;
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      searchCondition = sql`(
        LOWER(${users.username}) LIKE ${searchTerm} OR 
        LOWER(${users.firstName}) LIKE ${searchTerm} OR 
        LOWER(${users.lastName}) LIKE ${searchTerm} OR
        LOWER(${users.email}) LIKE ${searchTerm}
      )`;
    }
    
    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(searchCondition);
    
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / limit);
    
    // Get users with stats using raw SQL
    const usersWithStats = await db.execute(sql`
      SELECT 
        u.id,
        u.username,
        u.first_name as "firstName",
        u.last_name as "lastName", 
        u.email,
        u.phone,
        u.password,
        u.bid_balance as "bidBalance",
        u.role,
        u.ip_address as "ipAddress",
        u.created_at as "createdAt",
        NULL as "lastLogin",
        COALESCE((SELECT count(*)::int FROM bids WHERE user_id = u.id AND is_bot = false), 0) as "totalBids",
        COALESCE((SELECT count(*)::int FROM auctions WHERE winner_id = u.id), 0) as "wonAuctions", 
        COALESCE((SELECT (COUNT(*) * 0.01)::decimal FROM bids WHERE user_id = u.id AND is_bot = false), 0) + 
        COALESCE((SELECT (COUNT(*) * 0.01)::decimal FROM prebids WHERE user_id = u.id), 0) as "totalSpent"
      FROM users u
      WHERE ${searchCondition}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return {
      users: usersWithStats.rows as (User & { 
        totalBids: number; 
        wonAuctions: number; 
        totalSpent: number; 
        lastLogin?: string;
      })[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Get today's registration count
  async getTodayRegistrations(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        sql`${users.createdAt} >= ${startOfDay.toISOString()}`,
        sql`${users.createdAt} < ${endOfDay.toISOString()}`
      ));

    return result?.count || 0;
  }

  // Get user auction activity (bids and prebids)
  async getUserAuctionActivity(userId: string): Promise<{
    activeBids: Array<{
      id: string;
      auctionId: string;
      auctionTitle: string;
      currentPrice: string;
      bidAmount: string;
      createdAt: Date;
      status: string;
      bidCount: number;
    }>;
    prebids: Array<{
      id: string;
      auctionId: string;
      auctionTitle: string;
      amount: string;
      createdAt: Date;
      status: string;
    }>;
    wonAuctions: Array<{
      id: string;
      title: string;
      finalPrice: string;
      endTime: Date | null;
    }>;
  }> {
    // Get active bids (group by auction to avoid duplicates)
    const activeBidsResult = await db
      .select({
        id: sql<string>`MIN(${bids.id})`,
        auctionId: bids.auctionId,
        auctionTitle: auctions.title,
        currentPrice: auctions.currentPrice,
        bidAmount: sql<string>`'0.01'`, // Each bid costs 0.01 som
        createdAt: sql<Date>`MAX(${bids.createdAt})`,
        status: auctions.status,
        bidCount: sql<number>`COUNT(*)`,
      })
      .from(bids)
      .innerJoin(auctions, eq(bids.auctionId, auctions.id))
      .where(eq(bids.userId, userId))
      .groupBy(bids.auctionId, auctions.title, auctions.currentPrice, auctions.status)
      .orderBy(sql`MAX(${bids.createdAt}) DESC`)
      .limit(20);

    // Get prebids
    const prebidsResult = await db
      .select({
        id: prebids.id,
        auctionId: prebids.auctionId,
        auctionTitle: auctions.title,
        amount: sql<string>`'0.01'`, // Prebids always cost 1 bid (0.01 som)
        createdAt: prebids.createdAt,
        status: auctions.status,
      })
      .from(prebids)
      .innerJoin(auctions, eq(prebids.auctionId, auctions.id))
      .where(eq(prebids.userId, userId))
      .orderBy(desc(prebids.createdAt))
      .limit(20);

    // Get won auctions
    const wonAuctionsResult = await db
      .select({
        id: auctions.id,
        title: auctions.title,
        finalPrice: auctions.currentPrice,
        endTime: auctions.endTime,
      })
      .from(auctions)
      .where(eq(auctions.winnerId, userId))
      .orderBy(desc(auctions.endTime))
      .limit(10);

    return {
      activeBids: activeBidsResult,
      prebids: prebidsResult,
      wonAuctions: wonAuctionsResult,
    };
  }

  // Bot management methods
  async getAllBots(): Promise<Bot[]> {
    return await db.select().from(bots).orderBy(desc(bots.createdAt));
  }

  async getBot(id: string): Promise<Bot | undefined> {
    const [bot] = await db.select().from(bots).where(eq(bots.id, id));
    return bot || undefined;
  }

  async createBot(bot: InsertBot): Promise<Bot> {
    const [newBot] = await db.insert(bots).values(bot).returning();
    return newBot;
  }

  async updateBot(id: string, bot: Partial<InsertBot>): Promise<Bot> {
    const [updated] = await db
      .update(bots)
      .set(bot)
      .where(eq(bots.id, id))
      .returning();
    return updated;
  }

  async deleteBot(id: string): Promise<void> {
    await db.delete(bots).where(eq(bots.id, id));
  }

  // Auction bot methods
  async getAuctionBots(auctionId: string): Promise<(AuctionBot & { bot: Bot })[]> {
    // Get auction bots first
    const auctionBotsList = await db
      .select()
      .from(auctionBots)
      .where(eq(auctionBots.auctionId, auctionId));

    // Get corresponding bots
    const result: (AuctionBot & { bot: Bot })[] = [];
    for (const auctionBot of auctionBotsList) {
      const [bot] = await db
        .select()
        .from(bots)
        .where(eq(bots.id, auctionBot.botId));
      
      if (bot) {
        result.push({ ...auctionBot, bot });
      }
    }

    return result;
  }

  async addBotToAuction(auctionBot: InsertAuctionBot): Promise<AuctionBot> {
    const [newAuctionBot] = await db.insert(auctionBots).values(auctionBot).returning();
    return newAuctionBot;
  }

  async removeBotFromAuction(auctionId: string, botId: string): Promise<void> {
    await db.delete(auctionBots)
      .where(and(eq(auctionBots.auctionId, auctionId), eq(auctionBots.botId, botId)));
  }

  async updateAuctionBotBidCount(auctionId: string, botId: string): Promise<void> {
    await db
      .update(auctionBots)
      .set({ currentBids: sql`${auctionBots.currentBids} + 1` })
      .where(and(eq(auctionBots.auctionId, auctionId), eq(auctionBots.botId, botId)));
  }

  // Get live auctions for bot status checking
  async getLiveAuctions(): Promise<Auction[]> {
    return await db.select().from(auctions).where(eq(auctions.status, 'live'));
  }

  // Get all auction-bot associations for a specific bot
  async getBotAuctions(botId: string): Promise<AuctionBot[]> {
    return await db.select().from(auctionBots).where(eq(auctionBots.botId, botId));
  }

  // Get detailed auction statistics with bid breakdown
  async getAuctionDetailedStats(auctionId: string) {
    // Use existing method to get bids
    const allBids = await this.getBidsForAuction(auctionId);

    // Count bid types
    const totalBids = allBids.length;
    const botBidsCount = allBids.filter(bid => bid.isBot).length;
    
    // Get user data for non-bot bids to determine roles
    const nonBotBidsWithUsers: any[] = [];
    for (const bid of allBids.filter(b => !b.isBot && b.userId)) {
      const user = await this.getUser(bid.userId);
      if (user) {
        nonBotBidsWithUsers.push({ bid, user });
      }
    }
    
    const userBidsCount = nonBotBidsWithUsers.filter(item => item.user.role === 'user').length;
    const adminBidsCount = nonBotBidsWithUsers.filter(item => item.user.role === 'admin').length;

    // Build detailed bid list
    const bidDetails: any[] = [];
    for (const bid of allBids) {
      if (bid.isBot) {
        bidDetails.push({
          id: bid.id,
          userId: bid.userId || '',
          userName: bid.botName || 'Бот',
          userRole: 'bot',
          bidAmount: bid.amount,
          createdAt: bid.createdAt.toISOString(),
          isBot: true,
        });
      } else if (bid.userId) {
        const user = await this.getUser(bid.userId);
        bidDetails.push({
          id: bid.id,
          userId: bid.userId,
          userName: user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user?.username || 'Неизвестный',
          userRole: user?.role || 'user',
          bidAmount: bid.amount,
          createdAt: bid.createdAt.toISOString(),
          isBot: false,
        });
      }
    }

    return {
      totalBids,
      botBids: botBidsCount,
      userBids: userBidsCount,
      adminBids: adminBidsCount,
      bids: bidDetails, // Already in correct order (latest first from getBidsForAuction)
    };
  }

  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    const [settingsRecord] = await db.select().from(settings).limit(1);
    if (!settingsRecord) {
      // Create default settings
      const [newSettings] = await db.insert(settings).values({}).returning();
      return newSettings;
    }
    return settingsRecord;
  }

  async updateSettings(settingsUpdate: Partial<InsertSettings>): Promise<Settings> {
    const existing = await this.getSettings();
    if (!existing) {
      const [newSettings] = await db.insert(settings).values(settingsUpdate).returning();
      return newSettings;
    }
    
    const [updated] = await db
      .update(settings)
      .set({ ...settingsUpdate, updatedAt: new Date() })
      .where(eq(settings.id, existing.id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
