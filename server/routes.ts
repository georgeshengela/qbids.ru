import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { createSessionMiddleware } from "./session";
import { storage } from "./storage";
import { auctionService } from "./services/auction-service";
import { timerService } from "./services/timer-service";
import { botService } from "./services/bot-service";
import { setSocketIO } from "./socket";
import { insertUserSchema, insertAuctionSchema, insertBotSchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";

// Multilingual error messages
const errorMessages = {
  ru: {
    invalidCredentials: "Неверные учетные данные",
    unauthorized: "Не авторизован",
    userAlreadyExists: "Пользователь уже существует",
    registrationError: "Ошибка регистрации",
    invalidData: "Неверные данные",
    userNotFound: "Пользователь не найден",
  },
  en: {
    invalidCredentials: "Invalid credentials",
    unauthorized: "Unauthorized",
    userAlreadyExists: "User already exists",
    registrationError: "Registration error",
    invalidData: "Invalid data",
    userNotFound: "User not found",
  },
  ka: {
    invalidCredentials: "არასწორი სავისე მონაცემები",
    unauthorized: "არაავტორიზებული",
    userAlreadyExists: "მომხმარებელი უკვე არსებობს",
    registrationError: "რეგისტრაციის შეცდომა",
    invalidData: "არასწორი მონაცემები",
    userNotFound: "მომხმარებელი ვერ მოიძებნა",
  },
};

// Helper function to get error message in user's preferred language
function getErrorMessage(req: any, key: keyof typeof errorMessages.ru): string {
  const acceptLanguage = req.headers['accept-language'] || '';
  let lang = 'ru'; // default to Russian
  
  if (acceptLanguage.includes('en')) {
    lang = 'en';
  } else if (acceptLanguage.includes('ka')) {
    lang = 'ka';
  }
  
  return errorMessages[lang as keyof typeof errorMessages][key];
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware with PostgreSQL storage
  app.use(createSessionMiddleware());

  const httpServer = createServer(app);

  // Socket.IO setup
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Set the io instance for other services to use
  setSocketIO(io);

  // Health check endpoint for Render.com monitoring
  app.get("/health", async (_req, res) => {
    try {
      // Quick database check
      await storage.getSettings();
      res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({ status: "error", message: "Service unavailable" });
    }
  });

  // Create payment session before redirecting to Digiseller
  app.post("/api/payment/create-session", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    try {
      const { packageId, bidsAmount, amount } = z.object({
        packageId: z.number(),
        bidsAmount: z.number(),
        amount: z.number()
      }).parse(req.body);

      // Map package IDs to Digiseller product IDs (UPDATED to match frontend URLs)
      const productIdMap: { [key: number]: string } = {
        1: "5484776",  // 50 bids
        2: "5487610",  // 100 bids (FIXED!)
        3: "5355203",  // 250 bids
        4: "5355213",  // 500 bids
        5: "5355214"   // 1000 bids
      };

      const digisellerProductId = productIdMap[packageId];
      if (!digisellerProductId) {
        return res.status(400).json({ error: "Invalid package ID" });
      }

      // Get user
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create pending transaction
      const transaction = await storage.createTransaction({
        userId: user.id,
        userEmail: user.email || undefined,
        digisellerProductId: digisellerProductId,
        amount: amount.toString(),
        currency: "KGS",
        bidsAmount: bidsAmount,
        status: "pending"
      });

      res.json({ 
        transactionId: transaction.id,
        status: "pending"
      });
    } catch (error) {
      console.error("Create payment session error:", error);
      res.status(500).json({ error: "Failed to create payment session" });
    }
  });

  // Digiseller Payment Webhook
  // This endpoint receives payment notifications from Digiseller
  app.post("/api/payment/digiseller/webhook", async (req, res) => {
    try {
      console.log("Digiseller webhook received:", req.body);
      
      // Handle actual Digiseller webhook format
      const {
        ID_I: inv_id,        // Order number (Invoice ID)
        ID_D: product_id,    // Product identifier
        Amount: amount,      // Order amount
        Currency: currency,  // Currency
        Email: email,        // Buyer email
        Date: date,          // Purchase date
        SHA256: signature,   // SHA256 hash for verification
        Through: through,    // Base64 encoded additional parameters
        IP: ip,              // Buyer IP
        Agent: agent,        // Agent identifier
        CartUID: cartUID,    // Cart ID
        IsMyProduct: isMyProduct, // Your/someone else's product flag
        Referer: referer     // HTTP referer (optional)
      } = req.body;

      // Also support legacy format for backward compatibility
      const legacyInvId = req.body.inv_id || inv_id;
      const legacyProductId = req.body.product_id || product_id;
      const legacyAmount = req.body.amount || amount;
      const legacyEmail = req.body.email || email;
      const legacySignature = req.body.sign || signature;

      // Use the format that was provided
      const finalInvId = legacyInvId;
      const finalProductId = legacyProductId;
      const finalAmount = legacyAmount;
      const finalEmail = legacyEmail;
      const finalSignature = legacySignature;

      // Convert product ID to string for consistent comparison (MOVED UP)
      const productIdStr = String(finalProductId);
      
      // Decode Through parameter to get user ID
      let userIdFromThrough: string | null = null;
      if (through) {
        try {
          // Decode base64
          const decodedThrough = Buffer.from(through, 'base64').toString('utf-8');
          console.log("🔓 Decoded Through parameter:", decodedThrough);
          
          // Parse as query string to extract userid
          const params = new URLSearchParams(decodedThrough);
          userIdFromThrough = params.get('userid');
          
          if (userIdFromThrough) {
            console.log("✅ User ID found in Through parameter:", userIdFromThrough);
          } else {
            console.log("⚠️ No userid found in Through parameter");
          }
        } catch (error) {
          console.error("❌ Failed to decode Through parameter:", error);
        }
      }
      
      console.log("📨 Processed webhook data:", {
        inv_id: finalInvId,
        product_id: finalProductId,
        product_id_type: typeof finalProductId,
        product_id_string: productIdStr,
        amount: finalAmount,
        email: finalEmail,
        user_id_from_through: userIdFromThrough,
        currency: currency,
        date: date,
        ip: ip
      });
      
      console.log("🔍 Raw request body:", JSON.stringify(req.body, null, 2));

      // Verify SHA256 signature if provided and secret key is set
      const secretKey = process.env.DIGISELLER_SECRET_KEY || "";
      
      // Skip signature verification for widget callbacks
      const isWidgetCallback = finalSignature && (
        finalSignature.startsWith('widget-callback-') || 
        finalSignature.startsWith('success-page-')
      );
      
      if (secretKey && finalSignature && !isWidgetCallback) {
        // SHA256 hash format: password(lowercased);order_number;product_id
        const dataToSign = `${secretKey.toLowerCase()};${finalInvId};${productIdStr}`;
        const calculatedSign = crypto.createHash('sha256').update(dataToSign).digest('hex');
        
        console.log("🔐 Signature verification:", {
          received: finalSignature,
          calculated: calculatedSign,
          dataToSign: dataToSign,
          secretKey_length: secretKey.length,
          secretKey_set: !!secretKey
        });
        
        if (finalSignature !== calculatedSign) {
          console.error("Invalid SHA256 signature:", { 
            received: finalSignature, 
            calculated: calculatedSign,
            dataToSign: dataToSign
          });
          return res.status(403).json({ error: "Invalid signature" });
        }
        console.log("✅ Signature verified successfully");
      }

      // Check if transaction already processed
      const existingTransaction = await storage.getTransactionByInvoiceId(finalInvId);
      if (existingTransaction && existingTransaction.status === "completed") {
        console.log("Transaction already processed:", finalInvId);
        return res.status(200).json({ status: "ok", message: "Already processed" });
      }

      // Map product IDs to bid packages (UPDATED to match frontend URLs)
      const bidPackages: { [key: string]: { bids: number; price: number } } = {
        "5484776": { bids: 50, price: 750 },    // Package 1 - 50 bids
        "5487610": { bids: 100, price: 1500 },  // Package 2 - 100 bids (FIXED!)
        "5355203": { bids: 250, price: 3750 },  // Package 3 - 250 bids 
        "5355213": { bids: 500, price: 7500 },  // Package 4 - 500 bids
        "5355214": { bids: 1000, price: 15000 } // Package 5 - 1000 bids
      };

      console.log("🗂️ Available product IDs:", Object.keys(bidPackages));
      console.log("🔍 Looking for product ID:", finalProductId, "(type:", typeof finalProductId, ")");
      console.log("🔄 Using product ID string:", productIdStr);
      
      const packageInfo = bidPackages[productIdStr];
      if (!packageInfo) {
        console.error("❌ Unknown product ID:", productIdStr, "(original:", finalProductId, ", type:", typeof finalProductId, ")");
        console.error("❌ Available products:", Object.keys(bidPackages));
        console.error("❌ Exact comparison results:");
        Object.keys(bidPackages).forEach(key => {
          console.error(`  "${key}" === "${productIdStr}": ${key === productIdStr}`);
          console.error(`  "${key}" == "${productIdStr}": ${key == productIdStr}`);
        });
        return res.status(400).json({ 
          error: "Unknown product ID: " + productIdStr,
          original_value: finalProductId,
          received_type: typeof finalProductId,
          available_products: Object.keys(bidPackages)
        });
      }

      console.log("✅ Product found:", packageInfo, "for product ID:", productIdStr);

      // Find user - prioritize Through parameter, fallback to email
      let user = null;
      
      // Method 1: Try to find user by ID from Through parameter (PRIMARY METHOD)
      if (userIdFromThrough) {
        console.log("🔍 Attempting to find user by ID from Through parameter:", userIdFromThrough);
        user = await storage.getUser(userIdFromThrough);
        if (user) {
          console.log("✅ User found by Through parameter:", user.username, "(", user.id, ")");
        } else {
          console.log("❌ No user found with ID from Through parameter:", userIdFromThrough);
        }
      }
      
      // Method 2: Fallback to email matching (BACKUP METHOD)
      if (!user && finalEmail) {
        console.log("🔍 Attempting to find user by email:", finalEmail);
        user = await storage.getUserByEmail(finalEmail);
        if (user) {
          console.log("✅ User found by email:", user.username, "(", user.id, ")");
        } else {
          console.log("❌ No user found with email:", finalEmail);
        }
      }

      // If no user found by either method, reject
      if (!user) {
        console.error("❌ Could not match payment to user:", { 
          user_id_from_through: userIdFromThrough,
          email: finalEmail, 
          product_id: productIdStr 
        });
        return res.status(400).json({ 
          error: "Could not match payment to user",
          details: "User ID not found in payment data"
        });
      }

      // Find or create transaction
      let transaction = existingTransaction;
      
      if (!transaction) {
        // Try to find pending transaction for this user
        const userTransactions = await storage.getUserTransactions(user.id, 10);
        transaction = userTransactions.find(t => 
          t.status === "pending" && 
          t.digisellerProductId === productIdStr &&
          !t.digisellerInvoiceId
        );
        
        if (transaction) {
          console.log("✅ Found matching pending transaction:", transaction.id);
        }
      }

      if (!transaction) {
        console.log("📝 Creating new transaction for user:", user.id);
        
        // Create new transaction
        transaction = await storage.createTransaction({
          userId: user.id,
          userEmail: finalEmail || user.email,
          digisellerInvoiceId: finalInvId,
          digisellerProductId: productIdStr,
          amount: finalAmount.toString(),
          currency: currency || "KGS",
          bidsAmount: packageInfo.bids,
          status: "completed",
          paymentMethod: agent ? String(agent) : "digiseller",
          metadata: req.body
        });

        // Add bids to user balance
        await storage.addBidsToUser(user.id, packageInfo.bids);
        
        console.log(`✅ Successfully processed payment: ${finalInvId}, added ${packageInfo.bids} bids to user ${user.id} (${user.username})`);
        return res.status(200).json({ status: "ok" });
      }

      // Update existing transaction
      await storage.updateTransaction(transaction.id, {
        digisellerInvoiceId: finalInvId,
        status: "completed",
        paymentMethod: agent || "digiseller",
        metadata: req.body
      });

      // Add bids to user balance
      await storage.addBidsToUser(transaction.userId, packageInfo.bids);
      
      console.log(`✅ Successfully processed payment: ${finalInvId}, added ${packageInfo.bids} bids to user ${transaction.userId}`);

      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("❌ Webhook processing error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Success redirect page (user redirected here after successful payment)
  app.get("/payment/success", (req, res) => {
    res.redirect("/#/payment-success");
  });

  // Cancel redirect page (user redirected here after canceling payment)
  app.get("/payment/cancel", (req, res) => {
    res.redirect("/#/payment-cancel");
  });

  // Manual balance refresh endpoint (for testing/support)
  app.post("/api/payment/refresh-balance", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    try {
      const { transactionId } = req.body;
      
      if (!transactionId) {
        return res.status(400).json({ error: "Transaction ID required" });
      }

      // Get the transaction
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (transaction.status === "completed") {
        return res.json({ message: "Transaction already completed", status: "completed" });
      }

      // Complete the transaction
      await storage.updateTransaction(transaction.id, {
        status: "completed",
        digisellerInvoiceId: 'manual-refresh-' + Date.now()
      });

      // Add bids to user
      await storage.addBidsToUser(transaction.userId, transaction.bidsAmount);

      console.log(`Manual balance refresh: added ${transaction.bidsAmount} bids to user ${transaction.userId}`);

      res.json({ 
        message: "Balance updated successfully", 
        bidsAdded: transaction.bidsAmount,
        status: "completed" 
      });
    } catch (error) {
      console.error("Manual balance refresh error:", error);
      res.status(500).json({ error: "Failed to refresh balance" });
    }
  });

  // Authentication routes
  // Live validation endpoints
  app.post("/api/auth/validate-username", async (req, res) => {
    try {
      const { username } = z.object({
        username: z.string().min(3, "Имя пользователя должно содержать минимум 3 символа"),
      }).parse(req.body);

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.json({ valid: false, message: "Имя пользователя уже занято" });
      }

      res.json({ valid: true, message: "Имя пользователя доступно" });
    } catch (error: any) {
      if (error.errors) {
        return res.json({ valid: false, message: error.errors[0].message });
      }
      res.json({ valid: false, message: "Неверное имя пользователя" });
    }
  });

  app.post("/api/auth/validate-email", async (req, res) => {
    try {
      const { email } = z.object({
        email: z.string().email("Неверный формат email"),
      }).parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.json({ valid: false, message: "Email уже зарегистрирован" });
      }

      res.json({ valid: true, message: "Email доступен" });
    } catch (error: any) {
      if (error.errors) {
        return res.json({ valid: false, message: error.errors[0].message });
      }
      res.json({ valid: false, message: "Неверный формат email" });
    }
  });

  app.post("/api/auth/validate-phone", async (req, res) => {
    try {
      const { phone } = z.object({
        phone: z.string().regex(/^\+996\d{9}$/, "Номер должен быть в формате +996XXXXXXXXX"),
      }).parse(req.body);

      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        return res.json({ valid: false, message: "Номер телефона уже зарегистрирован" });
      }

      res.json({ valid: true, message: "Номер телефона доступен" });
    } catch (error: any) {
      if (error.errors) {
        return res.json({ valid: false, message: error.errors[0].message });
      }
      res.json({ valid: false, message: "Неверный формат номера" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const registerData = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        username: z.string().min(3, "Имя пользователя должно содержать минимум 3 символа"),
        email: z.string().email("Неверный формат email"),
        phone: z.string().regex(/^\+996\d{9}$/, "Номер должен быть в формате +996XXXXXXXXX").optional(),
        password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
        dateOfBirth: z.string().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
      }).parse(req.body);
      
      // Check for existing users
      const existingUsername = await storage.getUserByUsername(registerData.username);
      if (existingUsername) {
        return res.status(400).json({ error: getErrorMessage(req, 'userAlreadyExists') });
      }

      const existingEmail = await storage.getUserByEmail(registerData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email уже зарегистрирован" });
      }

      // Check phone if provided
      if (registerData.phone) {
        const existingPhone = await storage.getUserByPhone(registerData.phone);
        if (existingPhone) {
          return res.status(400).json({ error: "Номер телефона уже зарегистрирован" });
        }
      }

      // Validate age if date of birth is provided
      if (registerData.dateOfBirth) {
        const birthDate = new Date(registerData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
          ? age - 1 
          : age;
        
        if (actualAge < 18) {
          return res.status(400).json({ error: "Вам должно быть минимум 18 лет для регистрации" });
        }
      }

      const hashedPassword = await bcrypt.hash(registerData.password, 10);
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection as any)?.socket?.remoteAddress;
      const user = await storage.createUser({
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        username: registerData.username,
        email: registerData.email,
        phone: registerData.phone,
        password: hashedPassword,
        dateOfBirth: registerData.dateOfBirth ? new Date(registerData.dateOfBirth) : undefined,
        gender: registerData.gender,
        bidBalance: 5, // Starting bid balance
        role: "user",
        ipAddress: ipAddress,
      });

      req.session.userId = user.id;
      req.session.userRole = user.role;

      // Explicitly save the session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Session error" });
        }
        console.log("Session saved successfully! Session ID:", req.sessionID, "User ID:", req.session.userId);
        console.log("Session cookie being set:", req.session.cookie);
        res.json({ user: { id: user.id, username: user.username, bidBalance: user.bidBalance, role: user.role } });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: getErrorMessage(req, 'registrationError') });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: getErrorMessage(req, 'invalidCredentials') });
      }

      // Update IP address on login
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection as any)?.socket?.remoteAddress;
      await storage.updateUserIpAddress(user.id, ipAddress);

      req.session.userId = user.id;
      req.session.userRole = user.role;

      // Explicitly save the session before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Session error" });
        }
        console.log("Session saved successfully! Session ID:", req.sessionID, "User ID:", req.session.userId);
        console.log("Session cookie being set:", req.session.cookie);
        res.json({ user: { id: user.id, username: user.username, bidBalance: user.bidBalance, role: user.role } });
      });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(req, 'invalidData') });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);
    console.log("User ID from session:", req.session.userId);
    
    if (!req.session.userId) {
      return res.status(401).json({ error: getErrorMessage(req, 'unauthorized') });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: getErrorMessage(req, 'userNotFound') });
    }

    res.json({ user: { id: user.id, username: user.username, bidBalance: user.bidBalance, role: user.role } });
  });

  // Auction routes
  app.get("/api/auctions", async (req, res) => {
    const { status } = req.query;
    
    if (status && typeof status === "string") {
      const auctions = await storage.getAuctionsByStatus(status as any);
      return res.json(auctions);
    }

    const upcoming = await storage.getAuctionsByStatus("upcoming");
    const live = await storage.getAuctionsByStatus("live");
    // For finished auctions, only show today's winners
    const allFinished = await storage.getAuctionsByStatus("finished");
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    const finished = allFinished.filter(auction => {
      if (!auction.endTime) return false;
      const endTime = new Date(auction.endTime);
      return endTime >= today && endTime < tomorrow;
    });

    // Add bot winner information to finished auctions
    const finishedWithBotWinners = await Promise.all(
      finished.map(async (auction) => {
        // If auction has no winner_id, check if it was won by a bot
        if (!auction.winnerId) {
          const lastBotBid = await storage.getLastBotBidForAuction(auction.id);
          if (lastBotBid && lastBotBid.botId) {
            const bot = await storage.getBot(lastBotBid.botId);
            if (bot) {
              return {
                ...auction,
                winner: {
                  id: bot.id,
                  username: bot.username,
                  firstName: bot.firstName,
                  lastName: bot.lastName
                }
              };
            }
          }
        }
        return auction;
      })
    );

    // Add prebids count to upcoming auctions
    const upcomingWithPrebids = await Promise.all(
      upcoming.map(async (auction) => {
        const prebids = await storage.getPrebidsForAuction(auction.id);
        return {
          ...auction,
          prebidsCount: prebids.length
        };
      })
    );

    res.json({ upcoming: upcomingWithPrebids, live, finished: finishedWithBotWinners });
  });

  app.get("/api/auctions/:id", async (req, res) => {
    const auction = await storage.getAuction(req.params.id);
    if (!auction) {
      return res.status(404).json({ error: "Аукцион не найден" });
    }
    res.json(auction);
  });

  app.get("/api/auctions/slug/:slug", async (req, res) => {
    const allAuctions = await storage.getAllAuctions();
    const createSlug = (title: string, displayId: string): string => {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9а-я\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 35);
      // Add displayId for uniqueness (e.g., QB-7029)
      const cleanDisplayId = displayId.replace(/[/\\]/g, '-').toLowerCase();
      return `${baseSlug}-${cleanDisplayId}`;
    };
    
    const auction = allAuctions.find(a => createSlug(a.title, a.displayId) === req.params.slug);
    if (!auction) {
      return res.status(404).json({ error: "Аукцион не найден" });
    }
    res.json(auction);
  });

  app.post("/api/auctions", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const auctionData = insertAuctionSchema.parse(req.body);
      const auction = await storage.createAuction(auctionData);
      res.json(auction);
    } catch (error) {
      res.status(400).json({ error: "Неверные данные аукциона" });
    }
  });

  app.post("/api/auctions/:id/bid", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const success = await auctionService.placeBid(req.params.id, req.session.userId);
    
    if (!success) {
      return res.status(400).json({ error: "Не удалось сделать ставку" });
    }

    // Broadcast bid update
    const auction = await storage.getAuction(req.params.id);
    const bids = await storage.getBidsForAuction(req.params.id);
    const timers = timerService.getAllTimers();

    io.emit("auctionUpdate", { auction, bids: bids.slice(0, 5), timers });

    res.json({ success: true });
  });

  app.post("/api/auctions/:id/prebid", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const result = await auctionService.placePrebid(req.params.id, req.session.userId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  });

  // Bids routes
  app.get("/api/bids/recent", async (req, res) => {
    const bids = await storage.getRecentBids(20);
    res.json(bids);
  });

  app.get("/api/bids/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const bids = await storage.getUserBids(req.session.userId, 50);
    res.json(bids);
  });

  app.get("/api/prebids/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const prebids = await storage.getUserPrebids(req.session.userId, 50);
    res.json(prebids);
  });

  app.get("/api/auctions/:id/bids", async (req, res) => {
    const bids = await storage.getBidsForAuction(req.params.id);
    res.json(bids);
  });

  app.get("/api/auctions/slug/:slug/bids", async (req, res) => {
    const allAuctions = await storage.getAllAuctions();
    const createSlug = (title: string, displayId: string): string => {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9а-я\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 35);
      // Add displayId for uniqueness (e.g., QB-7029)
      const cleanDisplayId = displayId.replace(/[/\\]/g, '-').toLowerCase();
      return `${baseSlug}-${cleanDisplayId}`;
    };
    
    const auction = allAuctions.find(a => createSlug(a.title, a.displayId) === req.params.slug);
    if (!auction) {
      return res.status(404).json({ error: "Аукцион не найден" });
    }
    
    const bids = await storage.getBidsForAuction(auction.id);
    res.json(bids);
  });

  // Auction statistics endpoint
  app.get("/api/auctions/:id/stats", async (req, res) => {
    const allBids = await storage.getBidsForAuction(req.params.id);
    // Count only actual bids, exclude prebids for bid numbering
    const actualBids = allBids.filter(bid => !bid.isPrebid);
    const uniqueParticipants = new Set(actualBids.map(bid => bid.isBot ? bid.botName : bid.user?.username)).size;
    
    const auction = await storage.getAuction(req.params.id);
    if (!auction) {
      return res.status(404).json({ error: "Аукцион не найден" });
    }

    const stats = {
      totalBids: actualBids.length, // Only count actual bids for numbering
      uniqueParticipants,
      priceIncrease: parseFloat(auction.currentPrice).toFixed(2)
    };
    
    res.json(stats);
  });

  // Public route to check auction bots (for debugging)
  app.get("/api/auctions/:id/bots", async (req, res) => {
    const auctionBots = await botService.getAuctionBots(req.params.id);
    res.json(auctionBots);
  });

  app.get("/api/auctions/slug/:slug/stats", async (req, res) => {
    const allAuctions = await storage.getAllAuctions();
    const createSlug = (title: string, displayId: string): string => {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9а-я\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 35);
      // Add displayId for uniqueness (e.g., QB-7029)
      const cleanDisplayId = displayId.replace(/[/\\]/g, '-').toLowerCase();
      return `${baseSlug}-${cleanDisplayId}`;
    };
    
    const auction = allAuctions.find(a => createSlug(a.title, a.displayId) === req.params.slug);
    if (!auction) {
      return res.status(404).json({ error: "Аукцион не найден" });
    }
    
    const allBids = await storage.getBidsForAuction(auction.id);
    const uniqueParticipants = new Set(allBids.map(bid => bid.isBot ? bid.botName : bid.user?.username)).size;

    const stats = {
      totalBids: allBids.length,
      uniqueParticipants,
      priceIncrease: parseFloat(auction.currentPrice).toFixed(2)
    };
    
    res.json(stats);
  });

  // User stats
  app.get("/api/users/stats", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const stats = await storage.getUserStats(req.session.userId);
    res.json(stats);
  });

  // User profile
  app.get("/api/users/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json(user);
  });

  app.put("/api/users/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    try {
      const inputData = z.object({
        firstName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
        lastName: z.string().min(2, "Фамилия должна содержать минимум 2 символа"),
        email: z.string().email("Введите корректный email").optional(),
        phone: z.string().regex(/^\+996\d{9}$/, "Введите номер в формате +996XXXXXXXXX").optional(),
        dateOfBirth: z.string().optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
      }).parse(req.body);

      const updateData = {
        ...inputData,
        dateOfBirth: inputData.dateOfBirth ? new Date(inputData.dateOfBirth) : undefined,
      };

      const updatedUser = await storage.updateUser(req.session.userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Profile update error:", error);
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: "Неверные данные" });
    }
  });

  // User won auctions
  app.get("/api/users/won-auctions", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const wonAuctions = await storage.getUserWonAuctions(req.session.userId);
    res.json(wonAuctions);
  });

  // User recent bids
  app.get("/api/users/recent-bids", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const recentBids = await storage.getUserRecentBids(req.session.userId);
    res.json(recentBids);
  });

  // Admin routes
  app.get("/api/admin/bot-settings", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const settings = await storage.getBotSettings();
    res.json(settings);
  });

  app.put("/api/admin/bot-settings", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const settings = await storage.updateBotSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "Неверные настройки" });
    }
  });

  // Admin auction management routes
  app.get("/api/admin/auctions", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const auctions = await storage.getAllAuctions();
    res.json(auctions);
  });

  app.get("/api/admin/finished-auctions", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const finishedAuctions = await storage.getAuctionsByStatus("finished");
    
    // Add bot winner information to finished auctions
    const finishedWithBotWinners = await Promise.all(
      finishedAuctions.map(async (auction) => {
        // If auction has no winner_id, check if it was won by a bot
        if (!auction.winnerId) {
          const lastBotBid = await storage.getLastBotBidForAuction(auction.id);
          if (lastBotBid && lastBotBid.botId) {
            const bot = await storage.getBot(lastBotBid.botId);
            if (bot) {
              return {
                ...auction,
                winner: {
                  id: bot.id,
                  username: bot.username,
                  firstName: bot.firstName,
                  lastName: bot.lastName
                }
              };
            }
          }
        }
        return auction;
      })
    );

    res.json(finishedWithBotWinners);
  });

  app.get("/api/admin/auction-stats/:id", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const stats = await storage.getAuctionDetailedStats(req.params.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching auction stats:", error);
      res.status(500).json({ error: "Ошибка при получении статистики аукциона" });
    }
  });

  app.delete("/api/admin/auctions/:id", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      console.log("Attempting to delete auction:", req.params.id);
      await storage.deleteAuction(req.params.id);
      console.log("Successfully deleted auction:", req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting auction:", error);
      res.status(500).json({ error: "Ошибка при удалении аукциона" });
    }
  });

  app.post("/api/admin/auctions", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      console.log("Received auction data:", req.body);
      
      // Convert data types to match schema expectations
      const processedData = {
        ...req.body,
        retailPrice: req.body.retailPrice?.toString() || "0",
        startTime: new Date(req.body.startTime)
      };
      
      // **FIX #2: Validate that startTime is not in the past**
      const now = new Date();
      const startTime = processedData.startTime;
      
      // Allow a small grace period (30 seconds) for immediate auctions
      const gracePeriod = 30 * 1000; // 30 seconds in milliseconds
      if (startTime.getTime() < (now.getTime() - gracePeriod)) {
        return res.status(400).json({ 
          error: "Время начала не может быть в прошлом. Пожалуйста, выберите будущее время." 
        });
      }
      
      const auctionData = insertAuctionSchema.parse(processedData);
      console.log("Parsed auction data:", auctionData);
      const auction = await storage.createAuction(auctionData);
      res.json(auction);
    } catch (error) {
      console.error("Auction validation error:", error);
      res.status(400).json({ error: "Неверные данные аукциона" });
    }
  });

  app.put("/api/admin/auctions/:id", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      // Convert data types to match schema expectations
      const processedData = { ...req.body };
      if (req.body.retailPrice !== undefined) {
        processedData.retailPrice = req.body.retailPrice?.toString() || "0";
      }
      if (req.body.startTime !== undefined) {
        processedData.startTime = new Date(req.body.startTime);
        
        // **FIX #2: Validate that startTime is not in the past (for updates too)**
        const now = new Date();
        const startTime = processedData.startTime;
        
        // Allow a small grace period (30 seconds) for immediate auctions
        const gracePeriod = 30 * 1000; // 30 seconds in milliseconds
        if (startTime.getTime() < (now.getTime() - gracePeriod)) {
          return res.status(400).json({ 
            error: "Время начала не может быть в прошлом. Пожалуйста, выберите будущее время." 
          });
        }
      }
      
      const auctionData = insertAuctionSchema.partial().parse(processedData);
      const auction = await storage.updateAuction(req.params.id, auctionData);
      res.json(auction);
    } catch (error) {
      console.error("Auction update validation error:", error);
      res.status(400).json({ error: "Неверные данные аукциона" });
    }
  });

  app.delete("/api/admin/auctions/:id", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      console.log("Attempting to delete auction:", req.params.id);
      await storage.deleteAuction(req.params.id);
      console.log("Successfully deleted auction:", req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting auction:", error);
      res.status(500).json({ error: "Ошибка при удалении аукциона" });
    }
  });

  app.post("/api/admin/auctions/:id/start", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      await auctionService.startAuction(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error starting auction:", error);
      res.status(500).json({ error: "Ошибка при запуске аукциона" });
    }
  });

  app.post("/api/admin/auctions/:id/end", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    await auctionService.endAuction(req.params.id);
    res.json({ success: true });
  });

  // Bot management routes (Admin only)
  app.get("/api/admin/bots", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    
    const bots = await botService.getAllBots();
    res.json(bots);
  });

  app.post("/api/admin/bots", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const botData = insertBotSchema.parse(req.body);
      const bot = await botService.createBot(botData);
      res.json(bot);
    } catch (error) {
      console.error("Bot creation error:", error);
      res.status(400).json({ error: "Неверные данные бота" });
    }
  });

  app.put("/api/admin/bots/:id", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const botData = insertBotSchema.partial().parse(req.body);
      const bot = await botService.updateBot(req.params.id, botData);
      res.json(bot);
    } catch (error) {
      console.error("Bot update error:", error);
      res.status(400).json({ error: "Неверные данные бота" });
    }
  });

  app.delete("/api/admin/bots/:id", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    await botService.deleteBot(req.params.id);
    res.json({ success: true });
  });

  // Auction bot management routes
  app.get("/api/admin/auctions/:auctionId/bots", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    
    const auctionBots = await botService.getAuctionBots(req.params.auctionId);
    res.json(auctionBots);
  });

  app.post("/api/admin/auctions/:auctionId/bots", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const { botId, bidLimit = 0 } = req.body;
    await botService.addBotToAuction(req.params.auctionId, botId, bidLimit);
    res.json({ success: true });
  });

  app.delete("/api/admin/auctions/:auctionId/bots/:botId", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    await botService.removeBotFromAuction(req.params.auctionId, req.params.botId);
    res.json({ success: true });
  });

  // Get all bots with their current auction status
  app.get("/api/admin/bots/auction-status", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    
    try {
      const botsWithStatus = await botService.getBotsWithAuctionStatus();
      res.json(botsWithStatus);
    } catch (error) {
      console.error("Error fetching bots with auction status:", error);
      res.status(500).json({ error: "Failed to fetch bots with auction status" });
    }
  });

  // Admin user management routes
  app.get("/api/admin/users", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";

      console.log("Fetching users with params:", { page, limit, search });
      const users = await storage.getUsersWithStats(page, limit, search);
      console.log("Users fetched with stats:", JSON.stringify(users, null, 2));
      
      // Add cache-busting header to force refresh
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Ошибка при получении пользователей" });
    }
  });

  app.get("/api/admin/users/today-registrations", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const todayCount = await storage.getTodayRegistrations();
      res.json({ count: todayCount });
    } catch (error) {
      console.error("Error fetching today's registrations:", error);
      res.status(500).json({ error: "Ошибка при получении данных о регистрациях" });
    }
  });

  app.get("/api/admin/users/:id/activity", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const userId = req.params.id;
      const activity = await storage.getUserAuctionActivity(userId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ error: "Ошибка при получении активности пользователя" });
    }
  });

  // Update user
  app.patch("/api/admin/users/:userId", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const userId = req.params.userId;
      const updateData = z.object({
        username: z.string().min(3).optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        balance: z.number().optional(),
        role: z.enum(["user", "admin"]).optional(),
      }).parse(req.body);

      const updatedUser = await storage.updateUser(userId, updateData);
      res.json({ user: updatedUser });
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Ошибка при обновлении пользователя" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:userId", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const userId = req.params.userId;
      
      // Prevent admin from deleting themselves
      if (userId === req.session.userId) {
        return res.status(400).json({ error: "Нельзя удалить собственный аккаунт" });
      }

      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Ошибка при удалении пользователя" });
    }
  });

  // Admin Settings routes
  app.get("/api/admin/settings", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Ошибка при получении настроек" });
    }
  });

  app.put("/api/admin/settings", async (req, res) => {
    if (req.session.userRole !== "admin") {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    try {
      const updateData = insertSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateSettings(updateData);
      res.json(updatedSettings);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      if (error.errors) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Ошибка при обновлении настроек" });
    }
  });

  // Public Settings route (for all users)
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching public settings:", error);
      res.status(500).json({ error: "Ошибка при получении настроек" });
    }
  });

  // Real-time timer updates
  app.get("/api/timers", (req, res) => {
    const timers = timerService.getAllTimers();
    res.json(timers);
  });

  // Socket.IO real-time updates
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinAuction", (auctionId) => {
      socket.join(`auction-${auctionId}`);
    });

    socket.on("leaveAuction", (auctionId) => {
      socket.leave(`auction-${auctionId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Delay periodic updates to allow database connections to stabilize
  // This is critical for Render.com where DB connections take time to establish
  let dbReady = false;
  
  setTimeout(() => {
    dbReady = true;
    console.log("Database ready, starting periodic updates");
  }, 3000); // Wait 3 seconds for DB connections to stabilize

  // Periodic updates for timers and auction status
  setInterval(async () => {
    // Skip if database isn't ready yet
    if (!dbReady) {
      return;
    }

    const timers = timerService.getAllTimers();
    io.emit("timerUpdate", timers);

    // Also emit full auction updates every 2 seconds for real-time bid history
    try {
      const liveAuctions = await storage.getAuctionsByStatus("live");
      for (const auction of liveAuctions) {
        const bids = await storage.getBidsForAuction(auction.id);
        io.emit("auctionUpdate", { 
          auction, 
          bids: bids.slice(0, 5), 
          timers 
        });
      }
    } catch (error) {
      console.error("Error in periodic auction updates:", error);
      // Don't crash the app, just log the error
    }

    // Check for auctions that should start
    try {
      await auctionService.checkUpcomingAuctions();
    } catch (error) {
      console.error("Error checking upcoming auctions:", error);
      // Don't crash the app, just log the error
    }
  }, 1000);

  return httpServer;
}
