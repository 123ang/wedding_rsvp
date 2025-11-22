#!/bin/bash
# Deployment script for wedding RSVP website
# Run this from /root/projects/wedding_rsvp on your VPS

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deploying Wedding RSVP Website${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found!${NC}"
    echo -e "${YELLOW}Please run this script from /root/projects/wedding_rsvp${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules not found. Installing dependencies...${NC}"
    npm install
fi

# Pull latest changes (optional - comment out if not using git)
echo -e "${YELLOW}[1/5] Pulling latest changes from git...${NC}"
if git rev-parse --git-dir > /dev/null 2>&1; then
    git pull || echo -e "${YELLOW}Git pull failed or not a git repo, continuing...${NC}"
else
    echo -e "${YELLOW}Not a git repository, skipping pull...${NC}"
fi

# Build frontend
echo -e "${YELLOW}[2/5] Building frontend for production...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist folder not found after build!${NC}"
    exit 1
fi

# Copy files to web directory
echo -e "${YELLOW}[3/5] Copying files to web directory...${NC}"
sudo cp -r dist/* /var/www/jsang-psong-wedding.com/

# Note: No API folder needed - using Supabase

# Set permissions
echo -e "${YELLOW}[4/5] Setting file permissions...${NC}"
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com

# Note: No API folder - using Supabase for backend

# Reload nginx
echo -e "${YELLOW}[5/5] Reloading nginx...${NC}"
if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl reload nginx
    echo -e "${GREEN}Nginx reloaded successfully${NC}"
else
    echo -e "${RED}Nginx configuration test failed!${NC}"
    echo -e "${YELLOW}Run: sudo nginx -t${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test your website: https://jsang-psong-wedding.com"
echo "2. Check logs if needed: sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log"
echo ""

