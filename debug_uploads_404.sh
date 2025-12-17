#!/bin/bash
# Debug script for uploads 404 issue
# Run this on your VPS server

echo "=== Checking Uploads Directory ==="
echo ""

# 1. Check if the path exists
UPLOADS_PATH="/root/projects/wedding_rsvp/uploads"
echo "1. Checking if path exists: $UPLOADS_PATH"
if [ -d "$UPLOADS_PATH" ]; then
    echo "   ✅ Directory exists"
    ls -la "$UPLOADS_PATH" | head -5
else
    echo "   ❌ Directory does NOT exist!"
    echo "   Looking for uploads in common locations..."
    find /root -name "uploads" -type d 2>/dev/null | head -5
    find /home -name "uploads" -type d 2>/dev/null | head -5
fi

echo ""
echo "2. Checking photos subdirectory:"
if [ -d "$UPLOADS_PATH/photos" ]; then
    echo "   ✅ photos/ directory exists"
    echo "   Files in photos/:"
    ls -la "$UPLOADS_PATH/photos" | head -10
else
    echo "   ❌ photos/ directory does NOT exist!"
fi

echo ""
echo "3. Checking permissions:"
if [ -r "$UPLOADS_PATH" ]; then
    echo "   ✅ Directory is readable"
else
    echo "   ❌ Directory is NOT readable"
fi

echo ""
echo "4. Checking nginx user (www-data) access:"
sudo -u www-data test -r "$UPLOADS_PATH" && echo "   ✅ www-data CAN read" || echo "   ❌ www-data CANNOT read"

echo ""
echo "5. Checking actual file permissions:"
stat -c "%a %U:%G %n" "$UPLOADS_PATH" 2>/dev/null || echo "   Cannot stat directory"

echo ""
echo "6. Testing nginx alias path:"
echo "   Nginx config says: alias /root/projects/wedding_rsvp/uploads/;"
echo "   Testing if nginx can access:"
sudo -u www-data ls "$UPLOADS_PATH/photos" 2>&1 | head -5

echo ""
echo "=== Common Issues ==="
echo "If www-data cannot read, run:"
echo "  sudo chown -R www-data:www-data $UPLOADS_PATH"
echo "  sudo chmod -R 755 $UPLOADS_PATH"
echo ""
echo "If directory doesn't exist, check your actual uploads path:"
echo "  find /root -type d -name 'uploads' 2>/dev/null"

