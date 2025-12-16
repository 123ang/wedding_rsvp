# Quick API Deployment Steps

## 1. Prepare API folder for upload

```bash
# On your local machine (Windows PowerShell)
cd C:\Users\User\Desktop\Website\wedding_rsvp

# Create a clean copy without node_modules
New-Item -ItemType Directory -Path "api_deploy" -Force
Copy-Item -Path "api\*" -Destination "api_deploy\" -Recurse -Exclude "node_modules"

# Compress
Compress-Archive -Path "api_deploy\*" -DestinationPath "api_deploy.zip" -Force
```

## 2. Upload to VPS

Use WinSCP, FileZilla, or SCP:
```powershell
# Using SCP (if you have it)
scp api_deploy.zip root@your_vps_ip:/root/
```

## 3. On VPS - Setup

```bash
# SSH into VPS
ssh root@your_vps_ip

# Install Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Extract and setup
cd /var/www
unzip /root/api_deploy.zip -d api
cd api
npm install

# Create .env file
cat > .env << 'EOF'
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=wedding_rsvp
PORT=3002
NODE_ENV=production
EOF

# Test it
node server.js
# Press Ctrl+C after confirming it works

# Start with PM2
pm2 start server.js --name wedding-api
pm2 startup
pm2 save
```

## 4. Update Nginx

```bash
# Backup current config
sudo cp /etc/nginx/sites-available/jsang-psong-wedding.com /etc/nginx/sites-available/jsang-psong-wedding.com.backup

# Edit config
sudo nano /etc/nginx/sites-available/jsang-psong-wedding.com
```

Add this BEFORE the `location /` block:

```nginx
    # API Proxy (Node.js on port 3002)
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, x-admin-email, x-admin-id' always;
        
        # Handle OPTIONS requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, x-admin-email, x-admin-id';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
```

Save and exit (Ctrl+X, Y, Enter)

```bash
# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Test

```bash
# Test API health
curl https://jsang-psong-wedding.com/api/health

# Should return: {"status":"OK","message":"Wedding RSVP API is running"}

# Test login
curl -X POST https://jsang-psong-wedding.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"angjinsheng@gmail.com","password":"920214"}'
```

## 6. Update Website

```bash
# On VPS
cd /var/www/jsang-psong-wedding.com

# The website should already work since it's on the same domain
# Just test it in browser
```

## Troubleshooting

**API not starting:**
```bash
pm2 logs wedding-api
```

**Nginx error:**
```bash
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log
```

**Check if API is running:**
```bash
pm2 status
curl http://localhost:3002/api/health
```

**Restart everything:**
```bash
pm2 restart wedding-api
sudo systemctl reload nginx
```

## Done!

✅ API deployed on port 3002
✅ Nginx proxying /api/ requests
✅ Website can use the API
✅ Ready for mobile app connection

