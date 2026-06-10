@echo off
REM Elysium Agent - GitHub Push Script for Windows
REM This script automatically pushes your code to GitHub
REM No coding knowledge needed!

echo.
echo 🚀 Elysium Agent - GitHub Push Script
echo ======================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git from https://git-scm.com
    pause
    exit /b 1
)

REM Get GitHub username
set /p GITHUB_USERNAME="📝 Enter your GitHub username: "

REM Get GitHub repository name
set /p REPO_NAME="📝 Enter your GitHub repository name (e.g., elysium-agent): "

REM Get GitHub personal access token
set /p GITHUB_TOKEN="📝 Enter your GitHub personal access token: "

REM Configure git
echo.
echo ⚙️ Configuring Git...
git config --global user.email "your-email@example.com"
git config --global user.name "%GITHUB_USERNAME%"

REM Initialize git if not already done
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git branch -M main
)

REM Add all files
echo 📂 Adding all files...
git add .

REM Commit
echo 💾 Creating commit...
git commit -m "Elysium Agent Platform - Complete and Ready for Deployment"

REM Add remote
echo 🔗 Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin "https://%GITHUB_USERNAME%:%GITHUB_TOKEN%@github.com/%GITHUB_USERNAME%/%REPO_NAME%.git"

REM Push to GitHub
echo 🚀 Pushing code to GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ Error pushing to GitHub
    echo    Make sure your token is correct and has 'repo' permissions
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Your code is now on GitHub!
echo.
echo 📍 Your repository URL:
echo    https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
echo.
echo 🎉 Next step: Deploy to Render.com
echo    Follow the guide: DEPLOY_FOR_BEGINNERS.md
echo.
pause
