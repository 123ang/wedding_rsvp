#!/bin/bash
#
# Deploy wedding website (run on the server after git pull).
# Builds the frontend and syncs dist/ to the web root.
#
# Usage on VPS:  git pull && ./deploy.sh
#
#   ./deploy.sh              # build + deploy
#   ./deploy.sh --build      # build only (no deploy)
#   ./deploy.sh --deploy     # deploy only (no build; use existing dist/)

set -e

# --- Configure (override with env) ---
REMOTE_PATH="${REMOTE_PATH:-/var/www/jsang-psong-wedding.com}"

# Project root (directory containing website/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/website" ]; then
    PROJECT_ROOT="$SCRIPT_DIR"
else
    PROJECT_ROOT="$(pwd)"
fi

if [ ! -d "$PROJECT_ROOT/website" ] || [ ! -f "$PROJECT_ROOT/website/package.json" ]; then
    echo "❌ Error: Run from project root (wedding_rsvp) or ensure website/ exists with package.json"
    exit 1
fi

BUILD_ONLY=false
DEPLOY_ONLY=false
for arg in "$@"; do
    case "$arg" in
        --build)   BUILD_ONLY=true ;;
        --deploy)  DEPLOY_ONLY=true ;;
    esac
done

# --- Build ---
if [ "$DEPLOY_ONLY" != true ]; then
    echo "=================================================="
    echo "  Building website"
    echo "=================================================="
    cd "$PROJECT_ROOT/website"
    npm run build
    cd "$PROJECT_ROOT"
    echo "✅ Build complete: website/dist/"
    echo ""
fi

if [ "$BUILD_ONLY" = true ]; then
    echo "Done (build only). Use ./deploy.sh --deploy to deploy."
    exit 0
fi

# --- Deploy ---
echo "=================================================="
echo "  Deploying to $REMOTE_PATH"
echo "=================================================="
mkdir -p "$REMOTE_PATH"
if command -v rsync &>/dev/null; then
    rsync -a --delete "$PROJECT_ROOT/website/dist/" "$REMOTE_PATH/"
else
    cp -r "$PROJECT_ROOT/website/dist/"* "$REMOTE_PATH/"
fi
echo "Setting permissions..."
chown -R www-data:www-data "$REMOTE_PATH"
chmod -R 755 "$REMOTE_PATH"
if command -v pm2 &>/dev/null && pm2 describe wedding-api &>/dev/null; then
    echo "Restarting API (pm2 restart wedding-api)..."
    pm2 restart wedding-api
fi
echo ""
echo "=================================================="
echo "  ✅ Deploy complete"
echo "=================================================="
