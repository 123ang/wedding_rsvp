#!/bin/bash

# Nginx Setup Script for jsang-psong-wedding.com
# Run this script on your VPS as root or with sudo

set -e  # Exit on error

echo "========================================="
echo "Nginx Setup for jsang-psong-wedding.com"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
apt update -y

# Step 2: Install Nginx
echo -e "${YELLOW}[2/8] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}Nginx installed and started${NC}"
else
    echo -e "${GREEN}Nginx already installed${NC}"
fi

# Step 3: Skip PHP (using Supabase)
echo -e "${YELLOW}[3/8] Skipping PHP installation (using Supabase)...${NC}"
echo -e "${GREEN}No PHP needed - frontend connects directly to Supabase${NC}"

# Step 4: Create website directory
echo -e "${YELLOW}[4/8] Creating website directory...${NC}"
mkdir -p /var/www/jsang-psong-wedding.com
chown -R www-data:www-data /var/www/jsang-psong-wedding.com
chmod -R 755 /var/www/jsang-psong-wedding.com
echo -e "${GREEN}Directory created: /var/www/jsang-psong-wedding.com${NC}"

# Step 5: Create Nginx configuration
echo -e "${YELLOW}[5/8] Creating Nginx configuration...${NC}"
cat > /etc/nginx/sites-available/jsang-psong-wedding.com <<EOF
server {
    listen 80;
    listen [::]:80;
    
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    
    root /var/www/jsang-psong-wedding.com;
    index index.html;
    
    access_log /var/log/nginx/jsang-psong-wedding.com.access.log;
    error_log /var/log/nginx/jsang-psong-wedding.com.error.log;
    
    # Frontend - React Router (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Note: No PHP/API needed - frontend connects directly to Supabase
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp3|pdf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo -e "${GREEN}Nginx configuration created${NC}"

# Step 6: Enable site
echo -e "${YELLOW}[6/8] Enabling Nginx site...${NC}"
if [ -L /etc/nginx/sites-enabled/jsang-psong-wedding.com ]; then
    echo -e "${YELLOW}Site already enabled${NC}"
else
    ln -s /etc/nginx/sites-available/jsang-psong-wedding.com /etc/nginx/sites-enabled/
    echo -e "${GREEN}Site enabled${NC}"
fi

# Remove default site (optional)
if [ -L /etc/nginx/sites-enabled/default ]; then
    read -p "Remove default nginx site? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm /etc/nginx/sites-enabled/default
        echo -e "${GREEN}Default site removed${NC}"
    fi
fi

# Step 7: Test and reload Nginx
echo -e "${YELLOW}[7/8] Testing Nginx configuration...${NC}"
if nginx -t; then
    systemctl reload nginx
    echo -e "${GREEN}Nginx configuration is valid and reloaded${NC}"
else
    echo -e "${RED}Nginx configuration test failed!${NC}"
    exit 1
fi

# Step 8: Install Certbot (optional)
echo -e "${YELLOW}[8/8] Installing Certbot for SSL...${NC}"
read -p "Install Certbot for SSL certificate? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    apt install certbot python3-certbot-nginx -y
    echo -e "${GREEN}Certbot installed${NC}"
    echo -e "${YELLOW}Run this command to get SSL certificate:${NC}"
    echo -e "${GREEN}sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com${NC}"
else
    echo -e "${YELLOW}Skipping Certbot installation${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Upload your website files to /var/www/jsang-psong-wedding.com"
echo "2. Configure your database (see NGINX_DOMAIN_SETUP.md)"
echo "3. Update api/config/database.php with database credentials"
echo "4. Set up DNS A record pointing to your VPS IP"
echo "5. Get SSL certificate: sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com"
echo ""
echo "PHP Version: ${PHP_VERSION}"
echo "PHP-FPM Socket: ${PHP_FPM_SOCKET}"
echo ""
echo -e "${YELLOW}Test your setup:${NC}"
echo "curl http://localhost"
echo ""

