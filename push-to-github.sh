#!/bin/bash

# Elysium Agent - GitHub Push Script
# This script automatically pushes your code to GitHub
# No coding knowledge needed!

echo "🚀 Elysium Agent - GitHub Push Script"
echo "======================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git from https://git-scm.com"
    exit 1
fi

# Get GitHub username
echo "📝 Enter your GitHub username:"
read GITHUB_USERNAME

# Get GitHub repository name
echo "📝 Enter your GitHub repository name (e.g., elysium-agent):"
read REPO_NAME

# Get GitHub personal access token
echo "📝 Enter your GitHub personal access token:"
echo "   (Create one at: https://github.com/settings/tokens)"
echo "   (Give it 'repo' permissions)"
read GITHUB_TOKEN

# Configure git
echo ""
echo "⚙️ Configuring Git..."
git config --global user.email "your-email@example.com"
git config --global user.name "$GITHUB_USERNAME"

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
fi

# Add all files
echo "📂 Adding all files..."
git add .

# Commit
echo "💾 Creating commit..."
git commit -m "Elysium Agent Platform - Complete and Ready for Deployment" || true

# Add remote
echo "🔗 Adding GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Push to GitHub
echo "🚀 Pushing code to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Your code is now on GitHub!"
    echo ""
    echo "📍 Your repository URL:"
    echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "🎉 Next step: Deploy to Render.com"
    echo "   Follow the guide: DEPLOY_FOR_BEGINNERS.md"
else
    echo ""
    echo "❌ Error pushing to GitHub"
    echo "   Make sure your token is correct and has 'repo' permissions"
    exit 1
fi
