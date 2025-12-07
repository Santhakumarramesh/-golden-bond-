# 🚀 GitHub Deployment Guide

Your Golden Bond project is ready to deploy to GitHub!

## ✅ What's Done

- ✅ Git repository initialized
- ✅ All files committed
- ✅ `.gitignore` configured
- ✅ `README.md` created

## 📋 Next Steps

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `golden-bond` (or your preferred name)
3. Description: "Global Marriage Platform - Connecting hearts across borders"
4. Visibility: **Public** (for GitHub Pages) or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have them)
6. Click **"Create repository"**

### 2. Push to GitHub

Run these commands in your terminal:

```bash
cd "/Users/santhakumar/Desktop/Second marriage matrimony"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/golden-bond.git

# Push to GitHub
git push -u origin main
```

**Or if you prefer SSH:**

```bash
git remote add origin git@github.com:YOUR_USERNAME/golden-bond.git
git push -u origin main
```

### 3. Enable GitHub Pages (Frontend)

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main**
5. Folder: **/ (root)**
6. Click **Save**

Your site will be live at:
```
https://YOUR_USERNAME.github.io/golden-bond/
```

### 4. Update API URLs (If Using Backend)

If you deploy the backend separately, update frontend API URLs:

1. Edit `assets/js/payments.js`
2. Change API base URL from `/api/` to your backend URL
3. Example: `https://your-backend.railway.app/api/`

## 🔒 Important Notes

### Environment Variables

**DO NOT commit these files:**
- `backend/.env` (contains secrets)
- Any file with API keys or passwords

They are already in `.gitignore` ✅

### Backend Deployment

The backend needs to be deployed separately:

**Recommended Platforms:**
- **Railway** (easiest): https://railway.app
- **Render**: https://render.com
- **AWS**: https://aws.amazon.com
- **DigitalOcean**: https://digitalocean.com

**Steps:**
1. Push backend code to GitHub
2. Connect to deployment platform
3. Set environment variables
4. Deploy!

## 📁 Repository Structure

```
golden-bond/
├── .gitignore
├── README.md
├── index.html
├── signup.html
├── login.html
├── dashboard.html
├── search.html
├── profile.html
├── membership.html
├── messages.html
├── payment-success.html
├── assets/
│   ├── css/
│   └── js/
├── data/
│   ├── religions.json
│   ├── countries.json
│   ├── languages.json
│   └── sample_profiles.json
└── backend/
    ├── src/
    ├── prisma/
    └── package.json
```

## 🎯 Quick Commands

```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Your commit message"

# Push
git push origin main

# Pull latest
git pull origin main
```

## 🆘 Troubleshooting

**"Repository not found"**
- Check repository name and username
- Verify you have access

**"Authentication failed"**
- Use Personal Access Token instead of password
- Or set up SSH keys

**"GitHub Pages not working"**
- Wait 5-10 minutes after enabling
- Check repository is public (for free accounts)
- Verify branch is `main`

## ✨ You're All Set!

Once pushed, your Golden Bond platform will be live on GitHub Pages!

---

**Need help?** Check GitHub documentation: https://docs.github.com

