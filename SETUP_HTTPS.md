# How to Fix SSL Certificate Error and Enable HTTPS

You're seeing the error because your domain doesn't have an SSL certificate yet. Here's how to fix it:

## Quick Fix: Install SSL Certificate with Let's Encrypt

### Step 1: Install Certbot

**On your VPS:**
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Get SSL Certificate

```bash
sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com
```

**What will happen:**
1. Certbot will ask for your email address
2. You'll agree to terms of service
3. Choose whether to share email with EFF (optional)
4. **Important:** Choose option to redirect HTTP to HTTPS (recommended: Yes)

### Step 3: Verify It Works

Visit: `https://jsang-psong-wedding.com`

Should now show the padlock 🔒 without any warnings!

---

## Step-by-Step Process

### 1. Install Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Verify DNS is Correct

**Before getting SSL certificate, make sure DNS is working:**

```bash
# On VPS
nslookup jsang-psong-wedding.com
```

Should show: `110.4.47.197`

**Or check online:**
- Visit: https://dnschecker.org
- Enter: `jsang-psong-wedding.com`
- Should show `110.4.47.197`

⚠️ **Important:** SSL certificate will fail if DNS is not pointing to your VPS!

### 3. Get SSL Certificate

```bash
sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com
```

**Follow the prompts:**

1. **Email address:** Enter your email (for renewal notifications)
2. **Terms of service:** Type `A` to agree
3. **Share email with EFF:** Your choice (Y or N)
4. **Redirect HTTP to HTTPS:** Type `2` (Yes, recommended)

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/jsang-psong-wedding.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/jsang-psong-wedding.com/privkey.pem
```

### 4. Certbot Automatically Updates Nginx

Certbot will automatically modify your nginx config to:
- Listen on port 443 (HTTPS)
- Redirect HTTP to HTTPS
- Use the SSL certificate

**Your nginx config will look like this after:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    
    root /var/www/jsang-psong-wedding.com;
    index index.html;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/jsang-psong-wedding.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jsang-psong-wedding.com/privkey.pem;
    
    # ... rest of your config
}
```

### 5. Test Your Website

```bash
# Test HTTPS locally
curl https://localhost

# Or visit in browser
# https://jsang-psong-wedding.com
```

---

## Verify SSL Certificate

### Check Certificate Status

```bash
sudo certbot certificates
```

### Test Certificate Renewal

```bash
sudo certbot renew --dry-run
```

---

## Auto-Renewal Setup

Let's Encrypt certificates expire every 90 days. Certbot sets up auto-renewal automatically, but verify:

```bash
# Check renewal timer
sudo systemctl status certbot.timer

# List timers
sudo systemctl list-timers | grep certbot
```

Auto-renewal should be active. Certbot will renew certificates automatically.

---

## Troubleshooting

### Error: "Failed to obtain certificate"

**Common causes:**

1. **DNS not pointing to VPS:**
   ```bash
   nslookup jsang-psong-wedding.com
   ```
   Should show `110.4.47.197`

2. **Port 80 not accessible:**
   ```bash
   # Check if port 80 is open
   sudo ufw allow 'Nginx Full'
   sudo ufw status
   ```

3. **Domain not accessible:**
   - Visit: `http://jsang-psong-wedding.com`
   - Should show your website (even without HTTPS)

### Error: "Invalid response from domain"

- Make sure nginx is running: `sudo systemctl status nginx`
- Check nginx config: `sudo nginx -t`
- Verify domain is accessible: `curl http://jsang-psong-wedding.com`

### Certificate installed but still showing error

1. **Clear browser cache:**
   - Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
   - Or try incognito/private browsing

2. **Check certificate:**
   ```bash
   sudo certbot certificates
   ```

3. **Verify nginx config:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Check SSL config in nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/jsang-psong-wedding.com
   ```
   Make sure SSL certificate paths are correct

### Still having issues?

**Check nginx error logs:**
```bash
sudo tail -f /var/log/nginx/jsang-psong-wedding.com.error.log
```

**Check Certbot logs:**
```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## Manual SSL Configuration (If Certbot Doesn't Work)

If Certbot fails, you can manually configure:

### 1. Get Certificate Only (Without nginx plugin)

```bash
sudo certbot certonly --standalone -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com
```

### 2. Update Nginx Config Manually

```bash
sudo nano /etc/nginx/sites-available/jsang-psong-wedding.com
```

**Add SSL configuration:**

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    
    ssl_certificate /etc/letsencrypt/live/jsang-psong-wedding.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jsang-psong-wedding.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /var/www/jsang-psong-wedding.com;
    index index.html;
    
    # ... rest of your config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name jsang-psong-wedding.com www.jsang-psong-wedding.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Test and Reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Verify HTTPS is Working

### Method 1: Browser Check

Visit: `https://jsang-psong-wedding.com`
- Should show padlock 🔒 icon
- No "Not Secure" warning
- Click padlock to see certificate details

### Method 2: Command Line Check

```bash
# Check SSL certificate
openssl s_client -connect jsang-psong-wedding.com:443 -servername jsang-psong-wedding.com

# Or use curl
curl -I https://jsang-psong-wedding.com
```

### Method 3: Online SSL Checker

Visit: https://www.ssllabs.com/ssltest/
Enter your domain to check SSL configuration

---

## Quick Reference Commands

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com

# Check certificates
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Renew certificate manually
sudo certbot renew

# Reload nginx after changes
sudo systemctl reload nginx
```

---

## Summary

**To fix SSL error and enable HTTPS:**

1. ✅ Install Certbot: `sudo apt install certbot python3-certbot-nginx -y`
2. ✅ Get certificate: `sudo certbot --nginx -d jsang-psong-wedding.com -d www.jsang-psong-wedding.com`
3. ✅ Follow prompts (agree, redirect HTTP to HTTPS)
4. ✅ Visit: `https://jsang-psong-wedding.com`

**That's it!** Certbot handles everything automatically. 🎉

---

## Important Notes

- **Let's Encrypt certificates are FREE** and valid for 90 days
- **Auto-renewal is set up automatically** by Certbot
- **DNS must be pointing to your VPS** before getting certificate
- **Port 80 and 443 must be accessible** from internet
- **Certificate covers both** `jsang-psong-wedding.com` and `www.jsang-psong-wedding.com`

