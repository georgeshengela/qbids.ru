# QBIDS.RU Penny Auction System - Complete Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Bug Fixes Applied](#bug-fixes-applied)
3. [Architecture](#architecture)
4. [Auction Lifecycle](#auction-lifecycle)
5. [Bidding System](#bidding-system)
6. [Timer System](#timer-system)
7. [Bot System](#bot-system)
8. [Real-Time Updates](#real-time-updates)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)
11. [Troubleshooting](#troubleshooting)

---

## System Overview

QBIDS.RU is a penny auction platform where users can win products at prices significantly below retail value. The system uses a countdown timer that resets with each bid, creating an exciting competition environment.

### Key Concepts:
- **Penny Auction**: Each bid increases the price by a small increment (0.01 by default)
- **Timer Reset**: Every bid resets the countdown timer
- **Last Bidder Wins**: When the timer hits zero, the last bidder wins
- **Bid Balance**: Users spend "bids" (not money) to place bids
- **Prebids**: Users can place bids before an auction starts

---

## Bug Fixes Applied

### 🐛 **BUG #1: Timer Not Using Auction's Custom Duration**

**Problem:**
The timer service was hardcoded to always use 10 seconds, ignoring the `timerSeconds` field stored in the auction database record.

**Location:** `server/services/timer-service.ts`

**What Was Wrong:**
```typescript
// OLD CODE (BROKEN)
startAuctionTimer(auctionId: string, seconds = 10) {
  // Always used 10 seconds default
}
```

**How It Was Fixed:**
```typescript
// NEW CODE (FIXED)
async startAuctionTimer(auctionId: string, seconds?: number) {
  // Fetch auction's actual timerSeconds from database if not provided
  let timerDuration = seconds;
  if (timerDuration === undefined) {
    const auction = await storage.getAuction(auctionId);
    if (!auction) {
      console.error(`Cannot start timer: Auction ${auctionId} not found`);
      return;
    }
    timerDuration = auction.timerSeconds;
    console.log(`Starting auction ${auctionId} with ${timerDuration}s timer (from database)`);
  }
  // ... rest of code uses timerDuration
}
```

**Impact:**
- ✅ Auctions now respect their custom timer durations (10s, 30s, 60s, etc.)
- ✅ Different auction types can have different timer lengths
- ✅ Timer resets to the correct duration after each bid

**Files Modified:**
- `server/services/timer-service.ts` - Made `startAuctionTimer()` and `resetAuctionTimer()` async and fetch from DB
- `server/services/auction-service.ts` - Added `await` to all timer service calls

---

### 🐛 **BUG #2: Auctions Starting Immediately When Set to "Today"**

**Problem:**
When creating an auction with today's date (e.g., "2025-11-18"), the system interpreted this as midnight (00:00:00). Since the current time is later in the day, the comparison `auction.startTime <= now` was immediately true, causing the auction to start instantly with only 10 seconds remaining.

**Example:**
```
Admin creates auction: "2025-11-18"
System stores: "2025-11-18T00:00:00Z"
Current time: "2025-11-18T14:30:00Z"
Check: 00:00 <= 14:30 → TRUE → Auction starts immediately!
```

**How It Was Fixed:**

#### Backend Validation (`server/routes.ts`)
```typescript
// Validate that startTime is not in the past
const now = new Date();
const startTime = processedData.startTime;

// Allow a small grace period (30 seconds) for immediate auctions
const gracePeriod = 30 * 1000; // 30 seconds in milliseconds
if (startTime.getTime() < (now.getTime() - gracePeriod)) {
  return res.status(400).json({ 
    error: "Время начала не может быть в прошлом. Пожалуйста, выберите будущее время." 
  });
}
```

#### Frontend Improvements (`client/src/components/admin-panel.tsx`)

1. **Default Start Time Helper:**
```typescript
// Helper to get default start time (now + 10 minutes)
const getDefaultStartTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10); // Add 10 minutes
  return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
};
```

2. **Auto-Set Default Time When Dialog Opens:**
```typescript
<Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
  setIsCreateDialogOpen(open);
  if (open && !newAuction.startTime) {
    setNewAuction(prev => ({ ...prev, startTime: getDefaultStartTime() }));
  }
}}>
```

3. **Frontend Validation:**
```typescript
const handleCreateAuction = () => {
  // Check if start time is in the past
  const startTime = new Date(newAuction.startTime);
  const now = new Date();
  const gracePeriod = 30 * 1000; // 30 seconds
  
  if (startTime.getTime() < (now.getTime() - gracePeriod)) {
    toast({
      title: "Ошибка валидации",
      description: "Время начала не может быть в прошлом.",
      variant: "destructive",
    });
    return;
  }
  // ...
}
```

4. **Input Constraints:**
```typescript
<Input
  type="datetime-local"
  min={new Date().toISOString().slice(0, 16)}  // Can't select past times
/>
<p className="text-xs text-gray-500 mt-1">
  Время должно быть в будущем (рекомендуется +10 минут)
</p>
```

**Impact:**
- ✅ Admin panel now includes time picker (hour and minute)
- ✅ Default start time is automatically set to "now + 10 minutes"
- ✅ Browser prevents selecting past times using HTML5 `min` attribute
- ✅ Frontend validation with user-friendly error messages
- ✅ Backend validation as final security layer
- ✅ 30-second grace period allows for immediate auction starts if needed

**Files Modified:**
- `server/routes.ts` - Added validation to POST and PUT endpoints
- `client/src/components/admin-panel.tsx` - Added helper function, default time, validation, and UI improvements

---

## Architecture

### Technology Stack
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-Time**: Socket.IO for WebSocket connections
- **Frontend**: React + TypeScript + Vite
- **Session Management**: express-session with PostgreSQL storage

### Server Structure
```
server/
├── index.ts              # Entry point, server initialization
├── routes.ts             # API endpoints, Socket.IO setup
├── db.ts                 # Database connection
├── storage.ts            # Database operations (ORM layer)
├── session.ts            # Session middleware configuration
├── socket.ts             # WebSocket broadcast helpers
├── vite.ts               # Vite dev server integration
└── services/
    ├── auction-service.ts  # Auction lifecycle management
    ├── timer-service.ts    # Countdown timer management
    └── bot-service.ts      # Bot bidding logic
```

### Client Structure
```
client/src/
├── main.tsx              # React entry point
├── App.tsx               # Router setup
├── pages/                # Route components
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks
└── lib/
    ├── socket.ts         # Socket.IO client
    └── queryClient.ts    # React Query configuration
```

---

## Auction Lifecycle

### 1. Creation (Status: `upcoming`)
- Admin creates auction via admin panel
- Sets: title, description, image, retail price, **start time** (date + time)
- System assigns: display ID, default price (0.00), timer duration (10s default)
- Validation: Start time must be in future (30s grace period)

### 2. Pre-Start Period (Status: `upcoming`)
- Auction is visible to users
- Users can place **prebids**:
  - Cost: 1 bid from balance
  - Price increases by increment for each prebid
  - Prebids are queued in chronological order
  - Users cannot prebid twice on same auction

### 3. Auto-Start Trigger
**Location:** `server/routes.ts` (lines 1454-1486)

Every **1 second**, the server checks:
```typescript
setInterval(async () => {
  await auctionService.checkUpcomingAuctions();
}, 1000);
```

In `auction-service.ts`:
```typescript
async checkUpcomingAuctions() {
  const upcomingAuctions = await storage.getAuctionsByStatus("upcoming");
  const now = new Date();

  for (const auction of upcomingAuctions) {
    if (auction.startTime <= now) {
      await this.startAuction(auction.id);
    }
  }
}
```

### 4. Auction Start (Status: `live`)
**Location:** `server/services/auction-service.ts` (lines 8-16)

```typescript
async startAuction(auctionId: string) {
  // 1. Change status to "live"
  await storage.updateAuctionStatus(auctionId, "live");
  
  // 2. Convert prebids to actual bids
  await this.convertPrebidsToBids(auctionId);
  
  // 3. Start countdown timer (uses auction's timerSeconds)
  await timerService.startAuctionTimer(auctionId);
  
  // 4. Activate bots for this auction
  await botService.startBotsForAuction(auctionId);
}
```

**Prebid Conversion Process:**
- Prebids are converted to bids in chronological order
- First prebidder's bid = basePrice + (increment × 1)
- Second prebidder's bid = basePrice + (increment × 2)
- Final price = basePrice + (increment × prebid_count)

### 5. Live Auction (Status: `live`)
- Countdown timer runs
- Users place bids (deducts 1 bid from balance)
- Bots automatically bid at 4-5 seconds remaining
- Each bid:
  - Increases price by increment
  - Resets timer to full duration
  - Broadcasts update to all clients

### 6. Auction End (Status: `finished`)
**Triggered when:** Timer reaches 0

**Location:** `server/services/timer-service.ts` (lines 50-54)

```typescript
if (timer.timeLeft <= 0) {
  this.stopAuctionTimer(auctionId);
  await botService.stopBotsForAuction(auctionId);
  auctionService.endAuction(auctionId);
}
```

**End Process:**
```typescript
async endAuction(auctionId: string) {
  // 1. Set status to "finished"
  await storage.updateAuctionStatus(auctionId, "finished");
  
  // 2. Find last bid (winner)
  const bids = await storage.getBidsForAuction(auctionId);
  
  // 3. Set winner (user or bot)
  if (bids.length > 0) {
    if (bids[0].userId) {
      await storage.updateAuctionWinner(auctionId, bids[0].userId);
    }
  } else if (prebids.length > 0) {
    // If no bids, first prebidder wins
    await storage.updateAuctionWinner(auctionId, prebids[0].userId);
  }
  
  // 4. Stop timer and bots
  timerService.stopAuctionTimer(auctionId);
  botService.stopBotsForAuction(auctionId);
  
  // 5. Broadcast final state
  broadcastAuctionUpdate(auctionId, { auction, bids });
}
```

---

## Bidding System

### User Bid Flow

**Endpoint:** `POST /api/auctions/:id/bid`

**Requirements:**
- User must be authenticated
- Auction must be `live`
- User must have `bidBalance >= 1`

**Process:**
```typescript
async placeBid(auctionId: string, userId: string) {
  // 1. Validate auction and user
  const auction = await storage.getAuction(auctionId);
  if (!auction || auction.status !== "live") return false;
  
  const user = await storage.getUser(userId);
  if (!user || user.bidBalance < 1) return false;
  
  // 2. Calculate new price
  const newPrice = (parseFloat(auction.currentPrice) + parseFloat(auction.bidIncrement)).toFixed(2);
  
  // 3. Create bid record
  await storage.createBid({
    auctionId,
    userId,
    amount: newPrice,
    isBot: false,
  });
  
  // 4. Update auction price
  await storage.updateAuctionPrice(auctionId, newPrice);
  
  // 5. Deduct 1 bid from user balance
  await storage.updateUserBidBalance(userId, 1);
  
  // 6. Broadcast balance update
  broadcastBidBalanceUpdate(userId, user.bidBalance - 1);
  
  // 7. Reset timer to full duration
  await timerService.resetAuctionTimer(auctionId);
  
  // 8. Broadcast auction update
  const updatedBids = await storage.getBidsForAuction(auctionId);
  const updatedAuction = await storage.getAuction(auctionId);
  broadcastAuctionUpdate(auctionId, { auction: updatedAuction, bids: updatedBids.slice(0, 5) });
  
  return true;
}
```

### Prebid Flow

**Endpoint:** `POST /api/auctions/:id/prebid`

**Requirements:**
- User must be authenticated
- Auction must be `upcoming`
- User must have `bidBalance >= 1`
- User cannot have existing prebid on this auction

**Process:**
```typescript
async placePrebid(auctionId: string, userId: string) {
  // 1. Check if user already has prebid
  const existingPrebids = await storage.getPrebidsForAuction(auctionId);
  const userAlreadyHasPrebid = existingPrebids.some(prebid => prebid.userId === userId);
  if (userAlreadyHasPrebid) {
    return { success: false, error: "Вы не можете перебить собственную представку" };
  }
  
  // 2. Deduct 1 bid and create prebid
  await storage.updateUserBidBalance(userId, 1);
  await storage.createPrebid({ auctionId, userId });
  
  // 3. Update auction price
  const updatedPrebids = await storage.getPrebidsForAuction(auctionId);
  const newPrice = (0.00 + (increment * updatedPrebids.length)).toFixed(2);
  await storage.updateAuctionPrice(auctionId, newPrice);
  
  // 4. Broadcast balance update
  broadcastBidBalanceUpdate(userId, updatedUser.bidBalance);
  
  return { success: true };
}
```

---

## Timer System

**Location:** `server/services/timer-service.ts`

### Timer Mechanics

**Data Structure:**
```typescript
interface AuctionTimer {
  auctionId: string;
  timeLeft: number;       // Current seconds remaining
  interval: NodeJS.Timeout; // setInterval handle
}
```

### Start Timer
```typescript
async startAuctionTimer(auctionId: string, seconds?: number) {
  // Stop existing timer if any
  this.stopAuctionTimer(auctionId);

  // Fetch auction's timerSeconds from database
  let timerDuration = seconds;
  if (timerDuration === undefined) {
    const auction = await storage.getAuction(auctionId);
    if (!auction) return;
    timerDuration = auction.timerSeconds;
  }

  // Create timer
  const timer: AuctionTimer = {
    auctionId,
    timeLeft: timerDuration,
    interval: setInterval(async () => {
      timer.timeLeft--;
      
      // Bot bidding opportunity
      await botService.checkAndPlaceBotBid(auctionId, timer.timeLeft);
      
      // Broadcast timer update
      broadcastAuctionUpdate(auctionId, { 
        type: 'timer', 
        auctionId, 
        timeLeft: timer.timeLeft 
      });
      
      // End auction if timer hits 0
      if (timer.timeLeft <= 0) {
        this.stopAuctionTimer(auctionId);
        await botService.stopBotsForAuction(auctionId);
        auctionService.endAuction(auctionId);
      }
    }, 1000), // Tick every 1 second
  };

  this.timers.set(auctionId, timer);
}
```

### Reset Timer
```typescript
async resetAuctionTimer(auctionId: string, seconds?: number) {
  const timer = this.timers.get(auctionId);
  
  // Fetch duration from DB if not provided
  let timerDuration = seconds;
  if (timerDuration === undefined) {
    const auction = await storage.getAuction(auctionId);
    timerDuration = auction ? auction.timerSeconds : 10;
  }
  
  if (timer) {
    timer.timeLeft = timerDuration; // Reset existing timer
  } else {
    await this.startAuctionTimer(auctionId, timerDuration); // Create new timer
  }
}
```

### Stop Timer
```typescript
stopAuctionTimer(auctionId: string) {
  const timer = this.timers.get(auctionId);
  if (timer) {
    clearInterval(timer.interval);
    this.timers.delete(auctionId);
  }
}
```

### Get Current Time
```typescript
getTimeLeft(auctionId: string): number {
  const timer = this.timers.get(auctionId);
  return timer ? timer.timeLeft : 0;
}
```

---

## Bot System

**Location:** `server/services/bot-service.ts`

### Bot Purpose
Bots simulate user activity to:
- Keep auctions competitive
- Extend auction duration
- Create engagement
- Ensure auctions don't end too quickly

### Bot Configuration

**Global Settings** (`bot_settings` table):
- `enabled`: Master on/off switch
- `minDelay`: Minimum seconds before bot can bid (5s default)
- `maxDelay`: Maximum seconds before bot must bid (6s default)
- `defaultBidLimit`: Default max bids per bot per auction (0 = unlimited)

**Per-Auction Bot Assignment** (`auction_bots` table):
- `auctionId`: Which auction
- `botId`: Which bot
- `bidLimit`: Max bids this bot can place (0 = unlimited)
- `currentBids`: How many bids placed so far
- `isActive`: Whether this bot is active

### Bot Bidding Logic

**Trigger:** Called every second from timer service at line 40

```typescript
await botService.checkAndPlaceBotBid(auctionId, timer.timeLeft);
```

**Implementation:**
```typescript
async checkAndPlaceBotBid(auctionId: string, currentTimer: number) {
  // 1. Only bid at 4-5 seconds remaining (creates consistent rhythm)
  if (currentTimer !== 4 && currentTimer !== 5) return;

  // 2. Prevent duplicate bids (lock mechanism)
  if (this.auctionLocks.get(auctionId)) return;
  this.auctionLocks.set(auctionId, true);

  try {
    // 3. Prevent multiple bids within same second
    const now = Date.now();
    const lastBid = this.lastBidTime.get(auctionId) || 0;
    if (now - lastBid < 1000) return;

    // 4. Get active bots for this auction
    const auctionBots = await this.getAuctionBots(auctionId);
    const activeBots = auctionBots.filter(ab => 
      ab.isActive && 
      ab.bot.isActive && 
      (ab.bidLimit === 0 || ab.currentBids < ab.bidLimit)
    );
    
    if (activeBots.length === 0) return;

    // 5. Select bot (rotate to avoid same bot bidding consecutively)
    let selectedBot;
    const lastBotThatBid = this.lastBotId.get(auctionId);
    
    if (activeBots.length === 1) {
      selectedBot = activeBots[0]; // Only one left, use it
    } else {
      // Rotate through bots, skip last bidder
      let currentIndex = this.currentBotIndex.get(auctionId) || 0;
      do {
        selectedBot = activeBots[currentIndex % activeBots.length];
        currentIndex++;
      } while (selectedBot.botId === lastBotThatBid && activeBots.length > 1);
      
      this.currentBotIndex.set(auctionId, currentIndex);
    }
    
    // 6. Track this bot
    this.lastBotId.set(auctionId, selectedBot.botId);
    this.lastBidTime.set(auctionId, now);

    // 7. Place the bid
    await auctionService.placeBotBid(auctionId, selectedBot.botId);
  } finally {
    // 8. Always unlock
    this.auctionLocks.set(auctionId, false);
  }
}
```

### Bot Bid Placement

```typescript
async placeBotBid(auctionId: string, botId: string) {
  // 1. Calculate new price
  const auction = await storage.getAuction(auctionId);
  const newPrice = (parseFloat(auction.currentPrice) + parseFloat(auction.bidIncrement)).toFixed(2);

  // 2. Create bid
  const bid: InsertBid = {
    auctionId,
    userId: null,
    botId,
    amount: newPrice,
    isBot: true,
  };

  await storage.createBid(bid);
  
  // 3. Update price and bot counter
  await storage.updateAuctionPrice(auctionId, newPrice);
  await storage.updateAuctionBotBidCount(auctionId, botId);

  // 4. Reset timer
  await timerService.resetAuctionTimer(auctionId);

  // 5. Broadcast update
  const updatedBids = await storage.getBidsForAuction(auctionId);
  const updatedAuction = await storage.getAuction(auctionId);
  broadcastAuctionUpdate(auctionId, { auction: updatedAuction, bids: updatedBids.slice(0, 5) });
}
```

---

## Real-Time Updates

**Technology:** Socket.IO (WebSocket protocol)

### Server Setup
**Location:** `server/routes.ts` (lines 71-76)

```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setSocketIO(io); // Make available to other services
```

### Event Types

#### 1. `auctionUpdate`
**Sent when:**
- User places bid
- Bot places bid
- Auction status changes
- Timer updates

**Payload:**
```typescript
{
  auction: Auction,           // Updated auction object
  bids: Bid[],               // Last 5 bids
  timers: Record<string, number>, // All auction timers
  type?: 'timer',            // Optional type indicator
  auctionId?: string,        // For timer-only updates
  timeLeft?: number          // Current seconds remaining
}
```

#### 2. `timerUpdate`
**Sent:** Every 1 second

**Payload:**
```typescript
Record<string, number>  // Map of auctionId → timeLeft
```

#### 3. `bidBalanceUpdate`
**Sent when:** User's bid balance changes

**Payload:**
```typescript
{
  userId: string,
  newBalance: number
}
```

### Client Connection

**Location:** `client/src/lib/socket.ts`

```typescript
import { io } from "socket.io-client";

export const socket = io({
  autoConnect: true,
});

// Join auction room
export const joinAuction = (auctionId: string) => {
  socket.emit("joinAuction", auctionId);
};

// Leave auction room
export const leaveAuction = (auctionId: string) => {
  socket.emit("leaveAuction", auctionId);
};
```

### Client Hook

**Location:** `client/src/hooks/use-socket.ts`

```typescript
export function useSocket() {
  useEffect(() => {
    socket.on("auctionUpdate", handleAuctionUpdate);
    socket.on("timerUpdate", handleTimerUpdate);
    socket.on("bidBalanceUpdate", handleBalanceUpdate);

    return () => {
      socket.off("auctionUpdate", handleAuctionUpdate);
      socket.off("timerUpdate", handleTimerUpdate);
      socket.off("bidBalanceUpdate", handleBalanceUpdate);
    };
  }, []);
}
```

---

## Database Schema

**Location:** `shared/schema.ts`

### Core Tables

#### `users`
```typescript
{
  id: varchar (UUID, PK),
  firstName: text,
  lastName: text,
  username: text (unique, required),
  email: text,
  phone: text,
  password: text (hashed, required),
  dateOfBirth: timestamp,
  gender: enum("male", "female", "other"),
  bidBalance: integer (default: 0),  // Number of bids user can place
  role: enum("user", "admin") (default: "user"),
  ipAddress: text,
  createdAt: timestamp (default: now),
}
```

#### `auctions`
```typescript
{
  id: varchar (UUID, PK),
  displayId: text (unique, e.g., "QB-7029"),
  title: text (required),
  description: text (required),
  imageUrl: text (required),
  retailPrice: decimal(10,2) (required),
  currentPrice: decimal(10,2) (default: "0.00"),
  bidIncrement: decimal(10,2) (default: "0.01"),
  status: enum("upcoming", "live", "finished") (default: "upcoming"),
  startTime: timestamp (required),
  endTime: timestamp,
  timerSeconds: integer (default: 10),  // CRITICAL: Timer duration
  winnerId: varchar (FK → users.id),
  isBidPackage: boolean (default: false),
  createdAt: timestamp (default: now),
}
```

#### `bids`
```typescript
{
  id: varchar (UUID, PK),
  auctionId: varchar (FK → auctions.id, cascade delete, required),
  userId: varchar (FK → users.id),       // NULL if bot bid
  botId: varchar (FK → bots.id),         // NULL if user bid
  amount: decimal(10,2) (required),
  isBot: boolean (default: false),
  createdAt: timestamp (default: now),
}
```

#### `prebids`
```typescript
{
  id: varchar (UUID, PK),
  auctionId: varchar (FK → auctions.id, cascade delete, required),
  userId: varchar (FK → users.id, required),
  createdAt: timestamp (default: now),
}
```

#### `bots`
```typescript
{
  id: varchar (UUID, PK),
  username: text (unique, required),
  firstName: text (required),
  lastName: text (required),
  isActive: boolean (default: true),
  createdAt: timestamp (default: now),
}
```

#### `auction_bots`
```typescript
{
  id: varchar (UUID, PK),
  auctionId: varchar (FK → auctions.id, cascade delete, required),
  botId: varchar (FK → bots.id, cascade delete, required),
  bidLimit: integer (default: 0),       // 0 = unlimited
  currentBids: integer (default: 0),
  isActive: boolean (default: true),
  createdAt: timestamp (default: now),
}
```

#### `bot_settings`
```typescript
{
  id: varchar (UUID, PK),
  enabled: boolean (default: true),
  minDelay: integer (default: 5),       // Seconds
  maxDelay: integer (default: 6),       // Seconds
  defaultBidLimit: integer (default: 0), // 0 = unlimited
  updatedAt: timestamp (default: now),
}
```

---

## API Endpoints

### Authentication

#### `POST /api/auth/register`
Register new user
```typescript
Body: {
  username: string,
  email: string,
  password: string,
  phone?: string,
  firstName?: string,
  lastName?: string,
  dateOfBirth?: string,
  gender?: "male" | "female" | "other"
}
Response: { user: User }
```

#### `POST /api/auth/login`
Login user
```typescript
Body: { username: string, password: string }
Response: { user: User }
```

#### `POST /api/auth/logout`
Logout user
```typescript
Response: { success: true }
```

#### `GET /api/auth/me`
Get current user
```typescript
Response: { user: User }
```

### Auctions

#### `GET /api/auctions`
Get all auctions by status
```typescript
Response: {
  upcoming: Auction[],
  live: Auction[],
  finished: Auction[]
}
```

#### `GET /api/auctions/:id`
Get single auction
```typescript
Response: Auction
```

#### `POST /api/auctions/:id/bid`
Place bid (requires auth)
```typescript
Response: { success: true }
```

#### `POST /api/auctions/:id/prebid`
Place prebid (requires auth)
```typescript
Response: { success: true }
```

### Admin (requires admin role)

#### `POST /api/admin/auctions`
Create auction
```typescript
Body: {
  title: string,
  description: string,
  imageUrl: string,
  retailPrice: number,
  startTime: string,      // ISO datetime
  timerSeconds?: number,  // Default: 10
  isBidPackage?: boolean  // Default: false
}
Response: Auction
```

#### `PUT /api/admin/auctions/:id`
Update auction
```typescript
Body: Partial<Auction>
Response: Auction
```

#### `DELETE /api/admin/auctions/:id`
Delete auction
```typescript
Response: { success: true }
```

#### `POST /api/admin/auctions/:id/start`
Manually start auction
```typescript
Response: { success: true }
```

#### `POST /api/admin/auctions/:id/end`
Manually end auction
```typescript
Response: { success: true }
```

---

## Troubleshooting

### Issue: Auction starts immediately after creation

**Symptoms:**
- Auction appears as "live" right away
- Timer shows only a few seconds remaining
- Auction finishes before users can bid

**Cause:**
Start time was set to a time in the past (likely midnight of today)

**Solution:**
1. Always set start time to at least 10 minutes in the future
2. Use the datetime-local picker in admin panel
3. System now validates and rejects past times

### Issue: Timer doesn't match configured duration

**Symptoms:**
- Auction set to 30 seconds, but timer shows 10
- Timer resets to wrong duration after bid

**Cause:**
Bug in timer service (now FIXED)

**Solution:**
- Update to latest code (Fix #1 applied)
- Timer now fetches `timerSeconds` from database

### Issue: Bots not bidding

**Symptoms:**
- Auction timer reaches 0 without bot interference
- No bot bids in bid history

**Possible Causes:**
1. **Bots not assigned to auction**
   - Check admin panel → Auction details → Bots tab
   - Add bots using "Добавить бота" button

2. **Bots reached bid limit**
   - Check `currentBids` vs `bidLimit` in `auction_bots` table
   - Increase limit or set to 0 (unlimited)

3. **Global bot settings disabled**
   - Check admin panel → Bot settings
   - Ensure "enabled" is true

4. **All bots inactive**
   - Check `bots` table, ensure `isActive = true`

### Issue: Real-time updates not working

**Symptoms:**
- Bid history doesn't update automatically
- Timer stuck
- Need to refresh page to see changes

**Possible Causes:**
1. **WebSocket connection failed**
   - Check browser console for Socket.IO errors
   - Verify firewall allows WebSocket connections
   - Check CORS settings in `server/routes.ts`

2. **Server-side broadcast not working**
   - Check server logs for Socket.IO initialization
   - Verify `setSocketIO(io)` is called

### Issue: Users can't place bids

**Symptoms:**
- "Не удалось сделать ставку" error
- Bid button doesn't work

**Possible Causes:**
1. **Insufficient bid balance**
   - User needs at least 1 bid
   - Check `users.bidBalance`

2. **Auction not live**
   - Can only bid on `live` auctions
   - Check `auctions.status`

3. **Session expired**
   - User needs to log in again
   - Check browser cookies

### Issue: Server crashes on startup

**Symptoms:**
```
Error checking upcoming auctions
Cannot read property 'getAuctionsByStatus' of undefined
```

**Cause:**
Database connection not ready when periodic checks start

**Solution:**
- Already implemented: 3-second delay before starting auction services
- Check DATABASE_URL environment variable
- Verify PostgreSQL is running

---

## Summary

### What Makes This System Work

1. **Penny Auction Model**: Small price increments (0.01) make products affordable
2. **Timer Reset**: Each bid extends the auction, creating competition
3. **Bid Balance**: Users buy "bids" in packages, not direct money
4. **Prebids**: Allow early commitment before auction starts
5. **Bots**: Keep auctions competitive and engaging
6. **Real-Time**: WebSocket updates provide instant feedback

### Key Files to Know

- `server/services/auction-service.ts` - Auction lifecycle
- `server/services/timer-service.ts` - Countdown timer logic  
- `server/services/bot-service.ts` - Bot bidding logic
- `server/routes.ts` - API endpoints, WebSocket setup
- `client/src/components/admin-panel.tsx` - Admin interface

### Critical Validations

✅ Start time must be in future (30s grace period)  
✅ Timer uses auction's `timerSeconds` from database  
✅ User must have sufficient bid balance  
✅ Auction must be `live` for bidding  
✅ User cannot prebid twice on same auction  

---

## Need Help?

**Console Logs to Check:**
```typescript
// Timer starts
console.log(`Starting auction ${auctionId} with ${timerDuration}s timer`)

// Bot bids
console.log(`Bot ${botUsername} placing bid (${currentBids + 1}/${bidLimit})`)

// Auction ends
console.log(`Auction ${auctionId} ended. Winner: ${winnerId}`)
```

**Database Queries:**
```sql
-- Check auction status
SELECT id, display_id, title, status, start_time, timer_seconds FROM auctions;

-- Check bot assignments
SELECT a.title, b.username, ab.bid_limit, ab.current_bids 
FROM auction_bots ab
JOIN auctions a ON ab.auction_id = a.id
JOIN bots b ON ab.bot_id = b.id;

-- Check recent bids
SELECT b.amount, b.is_bot, b.created_at, u.username, bot.username as bot_name
FROM bids b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN bots bot ON b.bot_id = bot.id
ORDER BY b.created_at DESC
LIMIT 20;
```

---

**Last Updated:** November 18, 2025  
**Bugs Fixed:** 2 critical issues resolved  
**System Status:** ✅ Operational

