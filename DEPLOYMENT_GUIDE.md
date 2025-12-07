# 🚀 Golden Bond - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### Security
- [ ] All environment variables configured
- [ ] Strong JWT secrets generated (64+ characters)
- [ ] Encryption key generated (64 hex characters)
- [ ] HTTPS/SSL certificate obtained
- [ ] Payment gateway webhooks configured
- [ ] Database backups enabled
- [ ] Security headers enabled
- [ ] Rate limiting configured

### Infrastructure
- [ ] Domain name purchased
- [ ] DNS configured
- [ ] Server/hosting provider chosen
- [ ] Database provisioned (PostgreSQL)
- [ ] Redis provisioned (optional, for sessions)
- [ ] CDN configured (Cloudflare recommended)
- [ ] Monitoring set up

---

## 🌐 Deployment Options

### Option 1: Railway (Recommended - Easiest)

**Backend:**
1. Sign up at https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables (from `.env.example`)
5. Add PostgreSQL service
6. Deploy!

**Frontend:**
1. Deploy to Vercel/Netlify
2. Set environment variable: `API_BASE_URL=https://your-backend.railway.app`
3. Deploy!

---

### Option 2: Render

**Backend:**
1. Sign up at https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Build command: `cd backend && npm install && npm run build`
5. Start command: `cd backend && npm start`
6. Add PostgreSQL database
7. Add environment variables
8. Deploy!

**Frontend:**
1. New → Static Site
2. Connect repository
3. Build command: `(none - static files)`
4. Publish directory: `/`
5. Deploy!

---

### Option 3: AWS EC2 (Advanced)

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium (minimum)
   - Security group: Allow HTTP (80), HTTPS (443), SSH (22)

2. **Setup Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib -y
   
   # Install Nginx
   sudo apt install nginx -y
   
   # Install PM2
   sudo npm install -g pm2
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/golden-bond.git
   cd golden-bond/backend
   npm install
   ```

4. **Setup Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

5. **Setup Database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE goldenbond;
   CREATE USER goldenbond WITH PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE goldenbond TO goldenbond;
   \q
   
   # Run migrations
   npm run prisma:migrate
   npm run seed
   ```

6. **Build & Start**
   ```bash
   npm run build
   pm2 start dist/index.js --name goldenbond-api
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/goldenbond
   ```

   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/goldenbond /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Setup SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

### Option 4: DigitalOcean App Platform

1. Sign up at https://www.digitalocean.com
2. Create App → GitHub
3. Select repository
4. Configure:
   - **Backend**: Node.js, build command: `cd backend && npm install && npm run build`, run command: `cd backend && npm start`
   - **Frontend**: Static site, build: `none`, publish: `/`
5. Add database (Managed PostgreSQL)
6. Add environment variables
7. Deploy!

---

## 🔒 Security Configuration

### 1. Generate Secure Keys

```bash
# JWT Secret (32+ characters)
openssl rand -hex 32

# Encryption Key (64 hex characters)
openssl rand -hex 32

# Session Secret (32+ characters)
openssl rand -hex 32
```

### 2. Configure Firewall (if using VPS)

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Setup SSL Certificate

**Using Let's Encrypt (Free):**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Automatic renewal:**
```bash
sudo certbot renew --dry-run
```

### 4. Configure Payment Webhooks

**Stripe:**
- URL: `https://api.yourdomain.com/api/payments/stripe/webhook`
- Events: `checkout.session.completed`, `payment_intent.succeeded`

**Razorpay:**
- URL: `https://api.yourdomain.com/api/payments/razorpay/webhook`
- Events: `payment.captured`, `payment.authorized`

---

## 📊 Monitoring & Logging

### Recommended Services

1. **Sentry** - Error tracking
   ```bash
   npm install @sentry/node
   ```

2. **Logtail** - Log aggregation
   - Connect via environment variables

3. **Uptime Robot** - Uptime monitoring
   - Monitor: `https://api.yourdomain.com/health`

### PM2 Monitoring (if using EC2)

```bash
pm2 monit
pm2 logs goldenbond-api
```

---

## 🗄️ Database Setup

### PostgreSQL on Cloud Providers

**Railway/Render:**
- Automatically provisioned
- Connection string provided

**AWS RDS:**
1. Create RDS PostgreSQL instance
2. Security group: Allow from app server
3. Use connection string in `DATABASE_URL`

**DigitalOcean:**
1. Create Managed Database
2. Use connection string provided

### Run Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

---

## 🎨 Frontend Deployment

### Option 1: Vercel

1. Sign up at https://vercel.com
2. Import Git repository
3. Framework Preset: **Other**
4. Build Command: (none - static files)
5. Output Directory: `/`
6. Environment Variables:
   - `API_BASE_URL=https://api.yourdomain.com`
7. Deploy!

### Option 2: Netlify

1. Sign up at https://netlify.com
2. New site from Git
3. Build command: (none)
4. Publish directory: `/`
5. Environment Variables: Same as Vercel
6. Deploy!

### Option 3: GitHub Pages

1. Go to repository Settings → Pages
2. Source: Deploy from branch `main`
3. Update API URLs in frontend code
4. Deploy!

---

## ✅ Post-Deployment Checklist

- [ ] Test all endpoints (`/health` returns OK)
- [ ] Test registration and login
- [ ] Test payment flow (use test cards)
- [ ] Verify SSL certificate (HTTPS)
- [ ] Check security headers (https://securityheaders.com)
- [ ] Test rate limiting
- [ ] Verify CORS configuration
- [ ] Test webhooks (Stripe/Razorpay)
- [ ] Setup monitoring alerts
- [ ] Enable database backups
- [ ] Document deployment process

---

## 🔄 Continuous Deployment

### GitHub Actions (Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd backend && npm install && npm run build
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 🆘 Troubleshooting

### Backend won't start
- Check environment variables
- Check database connection
- Check logs: `pm2 logs` or hosting logs

### Payment webhooks not working
- Verify webhook URLs
- Check webhook signatures
- Review webhook logs

### CORS errors
- Check `ALLOWED_ORIGINS` environment variable
- Verify frontend URL matches

### Database connection failed
- Check `DATABASE_URL`
- Verify database is accessible
- Check firewall rules

---

## 📞 Support

For deployment help:
- Check logs: `pm2 logs` or hosting dashboard
- Review environment variables
- Test with Postman/curl
- Contact: support@goldenbond.com

---

**Status**: ✅ Production Ready  
**Last Updated**: December 7, 2025

