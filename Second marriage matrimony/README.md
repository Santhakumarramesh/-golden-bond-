# 💍 Golden Bond - Global Marriage Platform

A modern, international matrimony website connecting people across borders, cultures, and communities.

## 🌟 Features

- **🌍 Global Reach**: Support for all countries with detailed location filters
- **🌐 Multi-Language UI**: English, Hindi, Tamil, and more
- **🎨 Beautiful Themes**: 4 wedding-themed color schemes
- **🤖 AI Matchmaking**: Intelligent compatibility scoring
- **💳 Premium Memberships**: Gold, Diamond, and Elite tiers
- **💬 Real-time Messaging**: Chat with matches (Premium)
- **✅ Profile Verification**: Trust score system
- **🔒 Secure Payments**: Stripe & Razorpay integration
- **📱 Mobile Responsive**: Works perfectly on all devices

## 🚀 Quick Start

### Frontend (Static Site)

```bash
# Serve locally
python3 -m http.server 8080

# Or use any static server
npx serve .
```

Visit: `http://localhost:8080`

### Backend (Full Stack)

```bash
cd backend

# Install dependencies
npm install

# Setup database
cp .env.example .env
# Edit .env with your database URL

# Run migrations
npm run prisma:generate
npm run prisma:migrate

# Seed demo data
npm run seed

# Start server
npm run dev
```

Backend runs on: `http://localhost:4000`

## 📁 Project Structure

```
goldenbond/
├── index.html              # Landing page
├── signup.html            # Registration
├── login.html             # Login
├── dashboard.html         # User dashboard
├── search.html            # Profile search
├── profile.html           # User profile
├── membership.html        # Premium plans
├── messages.html          # Chat system
├── payment-success.html   # Payment confirmation
│
├── assets/
│   ├── css/              # Stylesheets
│   └── js/               # JavaScript
│
├── data/                  # JSON data files
│   ├── religions.json
│   ├── countries.json
│   ├── languages.json
│   └── sample_profiles.json
│
└── backend/               # Node.js backend
    ├── src/
    │   ├── routes/       # API routes
    │   ├── services/     # Business logic
    │   └── middleware/   # Auth, etc.
    └── prisma/           # Database schema
```

## 🛠 Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Responsive design
- Multi-language support
- Theme switching

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + Prisma
- JWT Authentication
- Stripe & Razorpay payments

## 📦 Deployment

### GitHub Pages (Frontend Only)

1. Push to GitHub
2. Go to Settings → Pages
3. Select branch: `main`
4. Your site: `https://username.github.io/goldenbond`

### Full Stack Deployment

**Backend:**
- Railway, Render, or AWS
- Set environment variables
- Run migrations

**Frontend:**
- Vercel, Netlify, or GitHub Pages
- Point API URL to backend

## 🔐 Environment Variables

See `backend/.env.example` for required variables.

## 📄 License

MIT License

## 💝 Made with ❤️ for finding love

---

**Status**: ✅ Production Ready

