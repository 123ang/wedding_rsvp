#!/bin/bash
#
# Deploy wedding website to VPS
# Builds the frontend and syncs dist/ to the server.
#
# First-time setup:
#   1. Set VPS_USER and VPS_HOST below (or export them)
#   2. Ensure you can SSH: ssh $VPS_USER@$VPS_HOST
#   3. chmod +x deploy.sh && ./deploy.sh
#
# Usage:
#   ./deploy.sh              # build + deploy (from your PC, via SSH/rsync)
#   ./deploy.sh --local      # build + deploy on THIS machine (when you're already on the VPS)
#   ./deploy.sh --build      # build only (no deploy)
#   ./deploy.sh --deploy     # deploy only (no build; use existing dist/)

set -e

# --- Configure (override with env vars) ---
VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-jsang-psong-wedding.com}"
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
DEPLOY_LOCAL=false
for arg in "$@"; do
    case "$arg" in
        --build)   BUILD_ONLY=true ;;
        --deploy)  DEPLOY_ONLY=true ;;
        --local)   DEPLOY_LOCAL=true ;;
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
echo "  Deploying to VPS"
echo "=================================================="

if [ "$DEPLOY_LOCAL" = true ]; then
    # Already on the VPS: copy dist to web root on this machine (no SSH)
    echo "  Mode: local (copy on this machine)"
    echo "  Target: $REMOTE_PATH"
    echo ""
    mkdir -p "$REMOTE_PATH"
    if command -v rsync &>/dev/null; then
        rsync -a --delete "$PROJECT_ROOT/website/dist/" "$REMOTE_PATH/"
    else
        cp -r "$PROJECT_ROOT/website/dist/"* "$REMOTE_PATH/"
    fi
    echo "Setting permissions..."
    chown -R www-data:www-data "$REMOTE_PATH"
    chmod -R 755 "$REMOTE_PATH"
else
    # Deploy from your PC to VPS via SSH
    echo "  Target: $VPS_USER@$VPS_HOST:$REMOTE_PATH"
    echo ""
    if command -v rsync &>/dev/null; then
        echo "Using rsync..."
        rsync -avz --delete "$PROJECT_ROOT/website/dist/" "$VPS_USER@$VPS_HOST:$REMOTE_PATH/"
    else
        echo "Using scp (install rsync for faster updates)..."
        ssh "$VPS_USER@$VPS_HOST" "mkdir -p $REMOTE_PATH"
        scp -r "$PROJECT_ROOT/website/dist/"* "$VPS_USER@$VPS_HOST:$REMOTE_PATH/"
    fi
    echo ""
    echo "Setting permissions on server..."
    ssh "$VPS_USER@$VPS_HOST" "chown -R www-data:www-data $REMOTE_PATH && chmod -R 755 $REMOTE_PATH"
fi

echo ""
echo "=================================================="
echo "  ✅ Deploy complete"
echo "=================================================="
echo "  Site: https://${VPS_HOST:-jsang-psong-wedding.com}"
echo ""
