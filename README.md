# qbids.kg - Live Penny Auction Platform

A real-time penny auction platform built for the Kyrgyzstan market with React, Node.js, and PostgreSQL.

## Features

- **Real-time Bidding**: WebSocket-powered live auction updates
- **Bot Integration**: Automated bot participation for active auctions
- **User Authentication**: Secure session-based authentication
- **Admin Panel**: Complete auction and bot management
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Wouter
- **Backend**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.IO for live updates
- **Authentication**: Express Session with PostgreSQL store

## Environment Variables

Required environment variables for production:

```
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-secure-session-secret
NODE_ENV=production
PORT=10000
```

## Deployment to Render.com

1. **Connect Repository**: Connect your GitHub repository to Render.com
2. **Database Setup**: The `render.yaml` file will automatically create a PostgreSQL database
3. **Environment Variables**: Render will auto-generate `SESSION_SECRET` and `DATABASE_URL`
4. **Build Process**: 
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   ```bash
   export DATABASE_URL="your_postgres_connection_string"
   export SESSION_SECRET="your_dev_secret"
   ```

3. **Push Database Schema**:
   ```bash
   npm run db:push
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Build Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push schema changes to database

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
├── server/               # Express backend
│   ├── services/         # Business logic
│   └── routes.ts         # API routes
├── shared/               # Shared types/schemas
└── render.yaml           # Render.com deployment config
```

## Database Schema

The application uses Drizzle ORM with the following main tables:
- `users` - User accounts and authentication
- `auctions` - Auction items and status
- `bids` - Bid history and tracking
- `sessions` - Session storage
- `bot_settings` - Bot configuration

## Features

### Auction System
- Live auctions with countdown timers
- Automatic winner determination
- Real-time price updates
- Bid history tracking

### Bot Management
- Configurable bot participation
- Realistic bidding patterns
- Admin-controlled bot settings

### User Interface
- Modern, responsive design
- Real-time updates via WebSocket
- Russian localization
- Mobile-optimized layout

## License

MIT License