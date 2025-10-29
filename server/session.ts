import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgSession = connectPgSimple(session);

export function createSessionMiddleware() {
  console.log('Creating session middleware with config:', {
    nodeEnv: process.env.NODE_ENV,
    cookieSecure: process.env.COOKIE_SECURE,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL
  });

  return session({
    store: new PgSession({
      pool: pool,
      tableName: "sessions",
      createTableIfMissing: true, // Let it create the table if needed
    }),
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev-only",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // REQUIRED when sameSite is "none" - Replit proxy handles HTTPS
      httpOnly: true,
      maxAge: 30 * 60 * 1000, // 30 minutes (banking standard)
      sameSite: "none", // Required for Replit proxy/iframe environment
    },
  });
}