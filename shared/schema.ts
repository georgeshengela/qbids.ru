import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const auctionStatusEnum = pgEnum("auction_status", ["upcoming", "live", "finished"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "cancelled"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name"),
  lastName: text("last_name"),
  username: text("username").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  password: text("password").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: genderEnum("gender"),
  bidBalance: integer("bid_balance").notNull().default(0), // Changed from money balance to bid count
  role: userRoleEnum("role").notNull().default("user"),
  ipAddress: text("ip_address"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auctions = pgTable("auctions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayId: text("display_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  bidIncrement: decimal("bid_increment", { precision: 10, scale: 2 }).notNull().default("0.01"),
  status: auctionStatusEnum("status").notNull().default("upcoming"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  timerSeconds: integer("timer_seconds").notNull().default(10),
  winnerId: varchar("winner_id").references(() => users.id),
  isBidPackage: boolean("is_bid_package").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auctionId: varchar("auction_id").notNull().references(() => auctions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  botId: varchar("bot_id").references(() => bots.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  isBot: boolean("is_bot").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const prebids = pgTable("prebids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auctionId: varchar("auction_id").notNull().references(() => auctions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const botSettings = pgTable("bot_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enabled: boolean("enabled").notNull().default(true),
  minDelay: integer("min_delay").notNull().default(5),
  maxDelay: integer("max_delay").notNull().default(6),
  defaultBidLimit: integer("default_bid_limit").notNull().default(0), // 0 = unlimited
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bots = pgTable("bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auctionBots = pgTable("auction_bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auctionId: varchar("auction_id").notNull().references(() => auctions.id, { onDelete: "cascade" }),
  botId: varchar("bot_id").notNull().references(() => bots.id, { onDelete: "cascade" }),
  bidLimit: integer("bid_limit").notNull().default(0), // 0 = unlimited
  currentBids: integer("current_bids").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Settings table for system configuration
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currency: text("currency").notNull().default("сом"),
  currencySymbol: text("currency_symbol").notNull().default("сом"),
  siteName: text("site_name").notNull().default("QBIDS.KG"),
  language: text("language").notNull().default("ru"),
  headerTagline: text("header_tagline").default("Пенни-аукционы в Кыргызстане"),
  footerDescription: text("footer_description").default("Первая пенни-аукционная платформа в Кыргызстане. Выигрывайте премиальные товары за копейки с нашей честной и прозрачной системой аукционов."),
  contactAddress: text("contact_address").default("г. Бишкек, ул. Чуй 154"),
  contactPhone: text("contact_phone").default("+996 (555) 123-456"),
  contactEmail: text("contact_email").default("info@qbids.kg"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Transactions table for payment logging
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  userEmail: text("user_email"), // Store email to match with Digiseller payment
  digisellerInvoiceId: text("digiseller_invoice_id"),
  digisellerProductId: text("digiseller_product_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("KGS"),
  bidsAmount: integer("bids_amount").notNull(), // Number of bids purchased
  status: transactionStatusEnum("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Store additional payment data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Session storage table for express-session
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bids: many(bids),
  prebids: many(prebids),
  wonAuctions: many(auctions),
}));

export const auctionsRelations = relations(auctions, ({ one, many }) => ({
  winner: one(users, {
    fields: [auctions.winnerId],
    references: [users.id],
  }),
  bids: many(bids),
  prebids: many(prebids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  auction: one(auctions, {
    fields: [bids.auctionId],
    references: [auctions.id],
  }),
  user: one(users, {
    fields: [bids.userId],
    references: [users.id],
  }),
  bot: one(bots, {
    fields: [bids.botId],
    references: [bots.id],
  }),
}));

export const botsRelations = relations(bots, ({ many }) => ({
  bids: many(bids),
  auctionBots: many(auctionBots),
}));

export const auctionBotsRelations = relations(auctionBots, ({ one }) => ({
  auction: one(auctions, {
    fields: [auctionBots.auctionId],
    references: [auctions.id],
  }),
  bot: one(bots, {
    fields: [auctionBots.botId],
    references: [bots.id],
  }),
}));

export const prebidsRelations = relations(prebids, ({ one }) => ({
  auction: one(auctions, {
    fields: [prebids.auctionId],
    references: [auctions.id],
  }),
  user: one(users, {
    fields: [prebids.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAuctionSchema = createInsertSchema(auctions).omit({
  id: true,
  createdAt: true,
  winnerId: true,
  endTime: true,
  displayId: true,
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
});

export const insertPrebidSchema = createInsertSchema(prebids).omit({
  id: true,
  createdAt: true,
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  createdAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertAuctionBotSchema = createInsertSchema(auctionBots).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Bot = typeof bots.$inferSelect;
export type InsertBot = z.infer<typeof insertBotSchema>;
export type AuctionBot = typeof auctionBots.$inferSelect;
export type InsertAuctionBot = z.infer<typeof insertAuctionBotSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Prebid = typeof prebids.$inferSelect;
export type InsertPrebid = z.infer<typeof insertPrebidSchema>;
export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
