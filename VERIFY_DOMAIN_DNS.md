# How to Verify Your Domain Points to Your VPS

## Quick Check Methods

### Method 1: Check DNS Records (Most Reliable)

**On Windows (PowerShell):**
```powershell
nslookup jsang-psong-wedding.com
```

**On Linux/Mac:**
```bash
nslookup jsang-psong-wedding.com
# or
dig jsang-psong-wedding.com
```

**Expected Result:**
```
Name:    jsang-psong-wedding.com
Address: 110.4.47.197
```

✅ **If you see `110.4.47.197`** = Domain is pointing to your VPS  
❌ **If you see a different IP** = Still pointing to Firebase/old server

---

### Method 2: Online DNS Checker Tools

Visit these websites and enter your domain:

1. **https://dnschecker.org**
   - Enter: `jsang-psong-wedding.com`
   - Select record type: `A`
   - Click "Search"
   - Should show `110.4.47.197` globally

2. **https://www.whatsmydns.net**
   - Enter: `jsang-psong-wedding.com`
   - Select: `A Record`
   - Should show `110.4.47.197`

3. **https://mxtoolbox.com/DNSLookup.aspx**
   - Enter your domain
   - Check A record

---

### Method 3: Test Direct IP Access

**Visit in browser:**
```
http://110.4.47.197
```

✅ **If you see your website** = VPS is working  
❌ **If you see nginx default page or error** = Need to deploy files

---

### Method 4: Check Domain Response Headers

**In browser DevTools (F12):**
1. Visit: `https://jsang-psong-wedding.com`
2. Open Network tab
3. Click on the main request
4. Check "Response Headers"

**Look for:**
- `server: nginx` = ✅ Serving from your VPS
- `server: firebase` or `x-firebase-*` = ❌ Still on Firebase

---

### Method 5: Check from VPS

**SSH into your VPS:**
```bash
ssh root@110.4.47.197
```

**Then check:**
```bash
# Check what IP your domain resolves to
nslookup jsang-psong-wedding.com

# Or
dig jsang-psong-wedding.com +short
```

Should return: `110.4.47.197`

---

## How to Change DNS (If Still Pointing to Firebase)

### Step 1: Find Your Domain Registrar

Where did you buy `jsang-psong-wedding.com`?
- GoDaddy
- Namecheap
- Cloudflare
- Google Domains
- etc.

### Step 2: Access DNS Management

1. Log into your domain registrar
2. Find "DNS Management" or "DNS Settings"
3. Look for "A Records" or "DNS Records"

### Step 3: Update A Record

**Find the A record for:**
- Name: `@` (or `jsang-psong-wedding.com` or leave blank)
- Type: `A`
- Value: Currently might show Firebase IP

**Change to:**
- Name: `@` (or blank)
- Type: `A`
- Value: `110.4.47.197`
- TTL: `3600` (or Auto)

**Also update www subdomain:**
- Name: `www`
- Type: `A`
- Value: `110.4.47.197`
- TTL: `3600`

### Step 4: Save and Wait

- DNS changes can take 5 minutes to 48 hours
- Usually takes 5-60 minutes
- Use https://dnschecker.org to monitor propagation

---

## Verify Firebase is Disconnected

### Check Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Hosting
4. Check if your domain is still connected

**If domain is still connected:**
- Remove it from Firebase Hosting
- Or disconnect the custom domain

---

## Complete Verification Checklist

- [ ] DNS A record points to `110.4.47.197`
- [ ] `nslookup jsang-psong-wedding.com` returns `110.4.47.197`
- [ ] Online DNS checker shows `110.4.47.197`
- [ ] `http://110.4.47.197` shows your website
- [ ] `https://jsang-psong-wedding.com` shows your website (not Firebase)
- [ ] Browser DevTools shows `server: nginx` in headers
- [ ] Firebase domain is disconnected (if applicable)

---

## Common Issues

### Issue: Domain still shows Firebase

**Solution:**
1. Check DNS records are updated
2. Wait for DNS propagation (can take time)
3. Clear browser cache
4. Try incognito/private browsing
5. Check from different network/device

### Issue: Domain shows old IP

**Solution:**
1. Verify DNS records are saved correctly
2. Check TTL value (lower = faster update)
3. Wait for propagation
4. Check if multiple A records exist (remove old ones)

### Issue: Domain not resolving

**Solution:**
1. Check DNS records are correct
2. Verify domain registrar DNS is active
3. Check for typos in domain name
4. Wait longer for propagation

---

## Quick Test Commands

```bash
# Windows PowerShell
nslookup jsang-psong-wedding.com

# Linux/Mac
dig jsang-psong-wedding.com
nslookup jsang-psong-wedding.com

# From VPS
curl -I http://jsang-psong-wedding.com
# Should show nginx headers
```

---

## Expected Results

### ✅ Correctly Pointing to VPS:
```
$ nslookup jsang-psong-wedding.com
Server:  ...
Address: ...

Name:    jsang-psong-wedding.com
Address:  110.4.47.197
```

### ❌ Still Pointing to Firebase:
```
$ nslookup jsang-psong-wedding.com
Server:  ...
Address: ...

Name:    jsang-psong-wedding.com
Address:  151.101.x.x  (or other IP, not 110.4.47.197)
```

---

## Summary

**To verify your domain points to VPS:**

1. **Quick check:** `nslookup jsang-psong-wedding.com` → Should show `110.4.47.197`
2. **Online check:** https://dnschecker.org → Enter domain → Should show `110.4.47.197`
3. **Browser check:** Visit domain → Check DevTools Network tab → Should show `server: nginx`

If all show `110.4.47.197` or `nginx`, you're good! ✅



