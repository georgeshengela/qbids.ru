export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  balance: string;
  role: "admin" | "user";
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  retailPrice: string;
  currentPrice: string;
  bidIncrement: string;
  status: "upcoming" | "live" | "finished";
  startTime: string;
  endTime?: string;
  timerSeconds: number;
  winnerId?: string;
  createdAt: string;
  displayId: string;
  winner?: User;
  prebidsCount?: number;
  isBidPackage: boolean;
}

export interface Bid {
  id: string;
  auctionId: string;
  userId?: string;
  amount: string;
  isBot: boolean;
  botName?: string;
  createdAt: string;
  isPrebid?: boolean;
  user?: {
    id: string;
    username: string;
  };
}

export interface UserStats {
  activeBids: number;
  wonAuctions: number;
  totalSpent: string;
  activePrebids: number;
}

export interface Bot {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AuctionBot {
  id: string;
  auctionId: string;
  botId: string;
  bidLimit: number;
  currentBids: number;
  isActive: boolean;
  createdAt: Date;
  bot: Bot;
}

export interface BotSettings {
  id: string;
  enabled: boolean;
  minDelay: number;
  maxDelay: number;
  activeBots: number;
  updatedAt: string;
}
