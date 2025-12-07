#!/bin/bash

# Golden Bond - GitHub Deployment Script
# Run this after creating your GitHub repository

echo "🚀 Golden Bond - GitHub Deployment"
echo "=================================="
echo ""

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote 'origin' already exists!"
    echo "Current remote: $(git remote get-url origin)"
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your GitHub username: " GITHUB_USERNAME
        read -p "Enter your repository name (default: golden-bond): " REPO_NAME
        REPO_NAME=${REPO_NAME:-golden-bond}
        
        git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
        echo "✅ Remote updated!"
    else
        echo "Using existing remote..."
    fi
else
    read -p "Enter your GitHub username: " GITHUB_USERNAME
    read -p "Enter your repository name (default: golden-bond): " REPO_NAME
    REPO_NAME=${REPO_NAME:-golden-bond}
    
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "✅ Remote added!"
fi

echo ""
echo "📤 Pushing to GitHub..."
echo ""

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🌐 Next steps:"
    echo "1. Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "2. Settings → Pages"
    echo "3. Source: Deploy from branch 'main'"
    echo "4. Your site will be live at: https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. Repository exists on GitHub"
    echo "2. You have write access"
    echo "3. Your GitHub credentials are correct"
    echo ""
fi

