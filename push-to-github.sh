#!/bin/bash
# ============================================================
# push-to-github.sh
# Run this once to initialize git and push to GitHub
# Usage: chmod +x push-to-github.sh && ./push-to-github.sh
# ============================================================

set -e

echo ""
echo "🎙️  VoiceAI — GitHub Setup Script"
echo "=================================="
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USER
read -p "Enter repo name (default: voice-ai-human): " REPO_NAME
REPO_NAME=${REPO_NAME:-voice-ai-human}

echo ""
echo "📦 Initializing git..."
git init
git add .
git commit -m "🎙️ Initial commit — VoiceAI human-like voice AI"

echo ""
echo "🔗 Setting up remote..."
git remote add origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git

echo ""
echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Done! Your repo is live at:"
echo "   https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo ""
echo "📋 Next steps:"
echo "   1. cd backend && npm install"
echo "   2. cp backend/.env.example backend/.env  (fill in your API keys)"
echo "   3. cd frontend && npm install"
echo "   4. Run backend: cd backend && npm run dev"
echo "   5. Run frontend: cd frontend && npm run dev"
echo "   6. Open http://localhost:5173"
echo ""
