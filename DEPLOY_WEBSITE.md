# How to Deploy Website to VPS

## Overview
After running `npm run build` in the `website` directory, the built files are in the `website/dist` folder. These need to be copied to `/var/www/jsang-psong-wedding.com` on your VPS.

## Option 1: Build Locally and Copy to VPS (Recommended)

### Step 1: Build the website locally
```bash
cd website
npm run build
```

This creates the production build in `website/dist/`

### Step 2: Copy files to VPS using SCP

From your local machine (Windows PowerShell or Command Prompt):
```bash
# Copy entire dist folder to VPS
scp -r website/dist/* user@your-vps-ip:/var/www/jsang-psong-wedding.com/

# Or if you're already in the website directory:
scp -r dist/* /var/www/jsang-psong-wedding.com/
```

Replace:
- `user` with your VPS username
- `your-vps-ip` with your VPS IP address or domain

### Step 3: Set proper permissions on VPS

SSH into your VPS and set permissions:
```bash
ssh user@your-vps-ip
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

## Option 2: Build on VPS Directly

### Step 1: Copy entire website folder to VPS
```bash
# From local machine
scp -r website user@your-vps-ip:/home/user/
```

### Step 2: SSH into VPS and build
```bash
ssh user@your-vps-ip
cd /home/user/website
npm install
npm run build
```

### Step 3: Copy dist to web directory
```bash
sudo cp -r dist/* /var/www/jsang-psong-wedding.com/
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

## Option 3: Using Rsync (Best for Updates)

### From local machine:
```bash
cd website
npm run build
rsync -avz --delete dist/ user@your-vps-ip:/var/www/jsang-psong-wedding.com/
```

The `--delete` flag removes files on the server that don't exist in the local dist folder, keeping everything in sync.

## Option 4: One-liner Script (Windows PowerShell)

Create a deploy script `deploy.ps1`:
```powershell
# Build the website
Set-Location website
npm run build
Set-Location ..

# Deploy to VPS
scp -r website/dist/* user@your-vps-ip:/var/www/jsang-psong-wedding.com/
```

Run it:
```powershell
.\deploy.ps1
```

## Quick Reference Commands

### Build only:
```bash
cd website && npm run build
```

### Copy to VPS (replace with your details):
```bash
scp -r website/dist/* username@vps-ip:/var/www/jsang-psong-wedding.com/
```

### SSH and set permissions:
```bash
ssh username@vps-ip
sudo chown -R www-data:www-data /var/www/jsang-psong-wedding.com
sudo chmod -R 755 /var/www/jsang-psong-wedding.com
```

## Notes

1. **Backup**: Always backup the existing files before deploying:
   ```bash
   ssh user@vps-ip
   sudo cp -r /var/www/jsang-psong-wedding.com /var/www/jsang-psong-wedding.com.backup
   ```

2. **Nginx Configuration**: Make sure your Nginx is configured to serve from `/var/www/jsang-psong-wedding.com`:
   ```nginx
   server {
       listen 80;
       server_name jsang-psong-wedding.com;
       root /var/www/jsang-psong-wedding.com;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

3. **Test after deployment**: Visit your website to ensure everything works correctly.

