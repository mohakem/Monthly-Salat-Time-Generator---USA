#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/create-github-repo.sh [repo-name] [public|private]
REPO_NAME=${1:-prayer-time}
VISIBILITY=${2:-public}

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/ and authenticate (gh auth login)"
  exit 1
fi

echo "Initializing git repository (if not already)"
git init
git branch -M main || true
git add .
git commit -m "Prepare repo for deployment: add server, deployment docs, Excel export, and settings" || true

echo "Creating GitHub repo '$REPO_NAME' ($VISIBILITY) and pushing..."
gh repo create "$REPO_NAME" --$VISIBILITY --source . --remote origin --push

echo "Repository created and pushed to origin."
