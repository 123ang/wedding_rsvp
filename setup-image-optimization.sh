#!/bin/bash
# Quick setup script for image optimization system

echo "=================================================="
echo "  Image Optimization System Setup"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -d "api" ]; then
    echo "❌ Error: Please run this script from the project root directory (wedding_rsvp)"
    exit 1
fi

# Step 1: Install Python dependencies
echo "📦 Step 1: Installing Python dependencies..."
cd api/scripts
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies"
    echo "   Try: python3 -m pip install -r requirements.txt"
    exit 1
fi
cd ../..
echo "✅ Python dependencies installed"
echo ""

# Step 2: Run database migration
echo "🗄️  Step 2: Running database migration..."
echo "   Please enter your MySQL root password when prompted"
mysql -u root -p wedding_rsvp < database/migration_add_thumbnails.sql
if [ $? -ne 0 ]; then
    echo "⚠️  Database migration may have failed"
    echo "   You can run it manually: mysql -u root -p wedding_rsvp < database/migration_add_thumbnails.sql"
else
    echo "✅ Database migration complete"
fi
echo ""

# Step 3: Create thumbnails directory
echo "📁 Step 3: Creating thumbnails directory..."
mkdir -p uploads/photos/thumbnails
chmod 755 uploads/photos/thumbnails
echo "✅ Thumbnails directory ready"
echo ""

# Step 4: Optimize existing images
echo "🖼️  Step 4: Would you like to optimize existing images now?"
echo "   This may take a while if you have many images."
read -p "   Optimize now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd api
    python3 scripts/optimize-images.py --all
    cd ..
    echo "✅ Image optimization complete!"
else
    echo "⏭️  Skipped image optimization"
    echo "   You can run it later with: cd api && python3 scripts/optimize-images.py --all"
fi
echo ""

# Step 5: Setup complete
echo "=================================================="
echo "  ✅ Setup Complete!"
echo "=================================================="
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Start your development server:"
echo "   cd website && npm run dev"
echo ""
echo "2. Test the gallery at:"
echo "   http://localhost:5173/gallery/pre-wedding"
echo ""
echo "3. Upload new photos via photographer portal:"
echo "   http://localhost:5173/photographer/upload"
echo ""
echo "4. After uploading, optimize new images:"
echo "   cd api && python3 scripts/optimize-images.py --new"
echo ""
echo "5. Or set up a cron job for automatic optimization:"
echo "   crontab -e"
echo "   Add: 0 * * * * cd /path/to/wedding_rsvp/api && python3 scripts/optimize-images.py --new"
echo ""
echo "📚 For more information, see:"
echo "   api/scripts/IMAGE_OPTIMIZATION_GUIDE.md"
echo ""
