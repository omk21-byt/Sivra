#!/usr/bin/env bash

# ============================================================
# Production GitHub Repository Setup Script
# ============================================================

set -Eeuo pipefail

SCRIPT_NAME=$(basename "$0")

error() {
    echo ""
    echo "❌ Error: $1"
    exit 1
}

success() {
    echo "✅ $1"
}

info() {
    echo "ℹ️  $1"
}

echo ""
echo "🎙️ VoiceAI — GitHub Repository Setup"
echo "===================================="
echo ""

# Verify git exists
command -v git >/dev/null 2>&1 || error "Git is not installed."

# Verify current directory
[ -f "package.json" ] || info "No package.json found in root. Continuing..."

# GitHub username
read -rp "GitHub username: " GITHUB_USER

if [[ -z "${GITHUB_USER}" ]]; then
    error "GitHub username cannot be empty."
fi

# Repository name
read -rp "Repository name [voice-ai-human]: " REPO_NAME
REPO_NAME=${REPO_NAME:-voice-ai-human}

# Branch name
read -rp "Default branch [main]: " DEFAULT_BRANCH
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}

echo ""
info "Configuration"
echo "GitHub User : ${GITHUB_USER}"
echo "Repository  : ${REPO_NAME}"
echo "Branch      : ${DEFAULT_BRANCH}"
echo ""

read -rp "Continue? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

# Initialize git if needed
if git rev-parse --git-dir >/dev/null 2>&1; then
    info "Git repository already exists."
else
    info "Initializing Git repository..."
    git init
fi

# Create .gitignore if missing
if [[ ! -f ".gitignore" ]]; then
cat > .gitignore <<EOF
node_modules
.env
.env.*
dist
build
coverage
.next
.vite
.vercel
.DS_Store
*.log
EOF
    success ".gitignore created."
fi

# Stage files
info "Staging files..."
git add .

# Commit if changes exist
if git diff --cached --quiet; then
    info "No changes to commit."
else
    git commit -m "Initial project setup"
    success "Commit created."
fi

# Configure branch
git branch -M "${DEFAULT_BRANCH}"

# Configure remote
REMOTE_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

if git remote get-url origin >/dev/null 2>&1; then
    CURRENT_REMOTE=$(git remote get-url origin)

    if [[ "${CURRENT_REMOTE}" != "${REMOTE_URL}" ]]; then
        info "Updating existing origin remote..."
        git remote set-url origin "${REMOTE_URL}"
    fi
else
    info "Adding origin remote..."
    git remote add origin "${REMOTE_URL}"
fi

success "Remote configured."

echo ""
info "Make sure the GitHub repository already exists:"
echo "https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo ""

read -rp "Push to GitHub now? (y/N): " PUSH_CONFIRM

if [[ "$PUSH_CONFIRM" =~ ^[Yy]$ ]]; then
    info "Pushing code..."
    git push -u origin "${DEFAULT_BRANCH}"
    success "Repository pushed successfully."
fi

echo ""
echo "===================================="
echo "🚀 Repository Ready"
echo "===================================="
echo ""
echo "Repository URL:"
echo "https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo ""
echo "Suggested next steps:"
echo "1. Configure GitHub Secrets"
echo "2. Add CI/CD pipeline"
echo "3. Enable branch protection"
echo "4. Add LICENSE"
echo "5. Add SECURITY.md"
echo "6. Add CONTRIBUTING.md"
echo "7. Add Dependabot"
echo ""
