# Golden Bond - Backend API

A robust Node.js + Express + Prisma backend for the Golden Bond matrimony platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database URL and secrets
```

3. **Set up database:**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed demo data
npm run seed
```

4. **Start development server:**
```bash
npm run dev
```

Server runs on `http://localhost:4000`

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Demo data seeder
├── src/
│   ├── index.ts         # App entry point
│   ├── config.ts        # Configuration
│   ├── middleware/
│   │   └── auth.ts      # JWT authentication
│   ├── routes/
│   │   ├── auth.ts      # Register, Login, Logout
│   │   ├── profile.ts   # Profile CRUD
│   │   ├── search.ts    # Search & filters
│   │   ├── matches.ts   # AI matching, interests
│   │   ├── membership.ts # Plans & payments
│   │   ├── messages.ts  # Chat system
│   │   └── ai.ts        # AI chatbot
│   └── services/
│       └── matchEngine.ts # Compatibility algorithm
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Profile
- `GET /api/profile/me` - Get own profile
- `PUT /api/profile/me` - Update profile
- `PUT /api/profile/preferences` - Update partner preferences
- `GET /api/profile/:id` - View another profile
- `GET /api/profile/views/received` - Who viewed me (Premium)
- `POST /api/profile/verify/:type` - Submit verification

### Search
- `GET /api/search/profiles` - Search with filters
- `GET /api/search/quick` - Quick homepage search
- `GET /api/search/filters` - Get filter options
- `GET /api/search/suggestions` - Autocomplete

### Matches
- `GET /api/matches/recommended` - AI recommendations
- `GET /api/matches/compatibility/:id` - Detailed compatibility
- `POST /api/matches/interest/:id` - Send interest
- `PUT /api/matches/interest/:id/respond` - Accept/decline
- `GET /api/matches/interests/received` - Received interests
- `GET /api/matches/interests/sent` - Sent interests
- `GET /api/matches/mutual` - Mutual matches

### Membership
- `GET /api/membership/plans` - Get all plans
- `GET /api/membership/status` - Current membership
- `POST /api/membership/checkout` - Create checkout
- `POST /api/membership/activate` - Activate (demo)
- `POST /api/membership/cancel` - Cancel subscription
- `GET /api/membership/history` - Payment history

### Messages
- `GET /api/messages/conversations` - All conversations
- `GET /api/messages/:matchId` - Get messages
- `POST /api/messages/:matchId` - Send message
- `PUT /api/messages/:matchId/read` - Mark as read
- `GET /api/messages/unread/count` - Unread count

### AI Chatbot
- `POST /api/ai/chat` - Chat with AI
- `GET /api/ai/session/:id` - Get chat history
- `POST /api/ai/suggest-matches` - Natural language search

## 🔒 Authentication

Uses JWT tokens:
- Access token: 7 days validity
- Refresh token: 30 days validity

Include in requests:
```
Authorization: Bearer <access_token>
```

## 🤖 AI Matchmaking Algorithm

Compatibility score (0-100) based on:
- Age preference (15%)
- Religion (20%)
- Community (10%)
- Location (15%)
- Languages (15%)
- Education (10%)
- Lifestyle (15%)

## 💳 Membership Tiers

| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0 | 10 views/day, 5 interests/day |
| Gold | ₹999/mo | Unlimited views, see visitors |
| Diamond | ₹1999/mo | AI matches, messaging |
| Elite | ₹4999/mo | Personal matchmaker, VIP support |

## 🛠 Development

```bash
# Run in development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Prisma Studio (database GUI)
npm run prisma:studio
```

## 📝 Environment Variables

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="refresh-secret"
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:8080"
```

## 🚀 Deployment

1. Build: `npm run build`
2. Set production environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Start: `npm start`

Recommended platforms:
- Railway
- Render
- AWS EC2
- DigitalOcean

---

Made with ❤️ for Golden Bond

