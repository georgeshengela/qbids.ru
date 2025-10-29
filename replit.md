# QBIDS.KG - Live Penny Auction Platform

## Overview
A real-time penny auction platform built for the Kyrgyzstan market. Users can participate in live auctions for electronics and other items, with real-time bidding powered by WebSocket technology.

## Project Type
Full-stack web application with React frontend and Express backend

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Wouter (routing)
- **Backend**: Node.js, Express, Socket.IO (real-time)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Express Session with PostgreSQL store
- **UI Components**: Radix UI, Framer Motion

## Project Structure
```
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/   # UI components (header, footer, auction cards, etc.)
│   │   ├── pages/        # Route pages (home, auctions, profile, admin, etc.)
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities (i18n, socket, analytics, etc.)
├── server/               # Express backend
│   ├── services/         # Business logic (auction, bot, timer services)
│   ├── routes.ts         # API routes
│   ├── socket.ts         # WebSocket handlers
│   └── index.ts          # Server entry point
├── shared/               # Shared TypeScript schemas
└── migrations/           # Database migrations
```

## Key Features
- Real-time bidding with WebSocket updates
- Multi-language support (Russian, English, Georgian)
- Bot integration for automated bidding
- Admin panel for auction management
- User authentication and profile management
- Countdown timers and automatic winner determination
- Bid history tracking

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `SESSION_SECRET` - Express session secret (auto-configured)
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 5000)

## Development Workflow
The project runs both frontend and backend on a single server (port 5000):
- Vite dev server provides HMR for frontend
- Express serves API endpoints and static files
- Socket.IO handles real-time bidding updates

## Database Setup
Database schema is managed with Drizzle ORM. The schema includes:
- `users` - User accounts and authentication
- `auctions` - Auction items and status
- `bids` - Bid history
- `sessions` - Session storage
- `bot_settings` - Bot configuration

## Recent Changes
- **2025-10-29**: Initial Replit setup
  - Installed all dependencies
  - Pushed database schema to PostgreSQL
  - Configured workflow for development server on port 5000
  - Set up deployment configuration for production
  - Verified application runs successfully

## Notes
- The application is configured for Kyrgyzstan timezone (Asia/Bishkek)
- Default language is Russian, with English and Georgian support
- Uses session-based authentication (no JWT)
- WebSocket for real-time features (Socket.IO)
- Vite warnings about duplicate keys in i18n file are non-critical
