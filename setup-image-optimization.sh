#!/bin/bash
# Quick setup script for image optimization system
#
# Run from project root:
#   - Local:  cd wedding_rsvp && ./setup-image-optimization.sh
#   - VPS:    cd /root/projects/wedding_rsvp && ./setup-image-optimization.sh
#
# VPS (jsang-psong-wedding.com): API is on port 3002 behind nginx; uploads at /root/projects/wedding_rsvp/uploads

echo "=================================================="
echo "  Image Optimization System Setup"
echo "=================================================="
echo ""

# Resolve project root (directory containing api/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/api" ]; then
    PROJECT_ROOT="$SCRIPT_DIR"
else
    PROJECT_ROOT="$(pwd)"
fi

if [ ! -d "$PROJECT_ROOT/api" ]; then
    echo "❌ Error: Please run this script from the project root (wedding_rsvp)"
    echo "   Current directory: $(pwd)"
    echo "   Or run from script dir: $SCRIPT_DIR"
    exit 1
fi

echo "📂 Project root: $PROJECT_ROOT"
echo ""
cd "$PROJECT_ROOT" || exit 1

# Step 1: Install Python dependencies
echo "📦 Step 1: Installing Python dependencies..."
cd "$PROJECT_ROOT/api/scripts" || exit 1
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies"
    echo "   Try: python3 -m pip install -r requirements.txt"
    exit 1
fi
cd "$PROJECT_ROOT" || exit 1
echo "✅ Python dependencies installed"
echo ""

# Step 2: Run database migration
echo "🗄️  Step 2: Running database migration..."
echo "   Please enter your MySQL root password when prompted"
mysql -u root -p wedding_rsvp < "$PROJECT_ROOT/database/migration_add_thumbnails.sql"
if [ $? -ne 0 ]; then
    echo "⚠️  Database migration may have failed"
    echo "   You can run it manually: mysql -u root -p wedding_rsvp < database/migration_add_thumbnails.sql"
else
    echo "✅ Database migration complete"
fi
echo ""

# Step 3: Create thumbnails directory (must match nginx uploads path on VPS)
echo "📁 Step 3: Creating thumbnails directory..."
mkdir -p "$PROJECT_ROOT/uploads/photos/thumbnails"
chmod 755 "$PROJECT_ROOT/uploads/photos/thumbnails"
echo "✅ Thumbnails directory ready: $PROJECT_ROOT/uploads/photos/thumbnails"
echo ""

# Step 4: Optimize existing images
echo "🖼️  Step 4: Would you like to optimize existing images now?"
echo "   This may take a while if you have many images."
read -p "   Optimize now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$PROJECT_ROOT/api" || exit 1
    python3 scripts/optimize-images.py --all
    cd "$PROJECT_ROOT" || exit 1
    echo "✅ Image optimization complete!"
else
    echo "⏭️  Skipped image optimization"
    echo "   You can run it later with: cd $PROJECT_ROOT/api && python3 scripts/optimize-images.py --all"
fi
echo ""

# Step 5: Setup complete
echo "=================================================="
echo "  ✅ Setup Complete!"
echo "=================================================="
echo ""
echo "📋 Next steps:"
echo ""
echo "--- Local development (Vite on port 5173) ---"
echo "1. Start dev server:  cd website && npm run dev"
echo "2. Gallery:           http://localhost:5173/gallery/pre-wedding"
echo "3. Photographer:      http://localhost:5173/photographer/upload"
echo ""
echo "--- VPS (jsang-psong-wedding.com, API on port 3002 behind nginx) ---"
echo "4. Gallery:           https://jsang-psong-wedding.com/gallery/pre-wedding"
echo "5. Photographer:      https://jsang-psong-wedding.com/photographer/upload"
echo "6. API runs on port 3002; nginx proxies /api/ and /uploads/."
echo "7. Uploads path on VPS: $PROJECT_ROOT/uploads (nginx alias: /root/projects/wedding_rsvp/uploads)"
echo ""
echo "--- Optimization (runs automatically after upload; optional manual/cron) ---"
echo "8. Manual (new only): cd $PROJECT_ROOT/api && python3 scripts/optimize-images.py --new"
echo "9. Cron (VPS):        crontab -e"
echo "   Add: 0 * * * * cd $PROJECT_ROOT/api && python3 scripts/optimize-images.py --new"
echo ""
echo "📚 For more information, see:"
echo "   api/scripts/IMAGE_OPTIMIZATION_GUIDE.md"
echo "   VPS_IMAGE_OPTIMIZATION_SETUP.md"
echo ""
