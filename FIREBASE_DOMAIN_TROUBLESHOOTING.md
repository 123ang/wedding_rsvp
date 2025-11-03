# Firebase Custom Domain Troubleshooting Guide

## Common Issues When Custom Domain Not Working

### Issue: Domain Connected But Not Working
If your Firebase default URL works but `jsang-psong-wedding.com` doesn't, follow these steps:

## Step 1: Verify Domain Configuration in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `wedding-rsvp-1c7db`
3. Go to **Hosting** → **Custom domains**
4. Check if `jsang-psong-wedding.com` is listed and shows **Verified** status

## Step 2: Check DNS Configuration

### For Firebase Hosting, you need TWO DNS records:

1. **A Record** (IPv4):
   ```
   Type: A
   Name: @ (or leave blank for root domain)
   Value: 151.101.1.195
   TTL: 3600 (or auto)
   ```

2. **A Record** (IPv4 - Secondary):
   ```
   Type: A
   Name: @ (or leave blank for root domain)
   Value: 151.101.65.195
   TTL: 3600 (or auto)
   ```

   **OR** use CNAME record:
   ```
   Type: CNAME
   Name: @
   Value: wedding-rsvp-1c7db.web.app
   TTL: 3600
   ```

   **Note**: Some DNS providers don't support CNAME for root domain (@). If yours doesn't, use A records.

3. **CNAME Record for www**:
   ```
   Type: CNAME
   Name: www
   Value: jsang-psong-wedding.com
   TTL: 3600
   ```

### Important:
- Firebase will show you the exact DNS records needed in the console
- DNS propagation can take 24-48 hours
- Use DNS checker tools to verify propagation

## Step 3: SSL Certificate Provisioning

After adding your domain, Firebase automatically provisions SSL certificates:

1. **Wait 24-72 hours** for SSL certificate to be issued
2. Check status in Firebase Console under **Hosting** → **Custom domains**
3. Status should show: "SSL certificate active"

If SSL is still provisioning:
- Don't remove the domain
- Don't change DNS records
- Wait for Firebase to complete the process

## Step 4: Domain Verification

Firebase needs to verify domain ownership. You'll need to:

1. Add a TXT record to your DNS:
   ```
   Type: TXT
   Name: @
   Value: [Firebase will provide this value]
   ```

2. Or verify via HTML file upload (if available)

## Step 5: Check Firebase Hosting Configuration

Make sure your `firebase.json` includes proper configuration:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Step 6: Redeploy After Adding Domain

After adding the domain in Firebase console:

```bash
# Build your project
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

## Step 7: Verify DNS Propagation

Use these tools to check if DNS records are propagated:

- [dnschecker.org](https://dnschecker.org)
- [whatsmydns.net](https://www.whatsmydns.net)
- [mxtoolbox.com](https://mxtoolbox.com/DNSLookup.aspx)

Enter `jsang-psong-wedding.com` and check if A records point to Firebase IPs.

## Step 8: Check Browser Cache

After DNS propagates:

1. Clear browser cache
2. Try incognito/private mode
3. Try different browser
4. Wait a few minutes and retry

## Step 9: Common DNS Provider Instructions

### Namecheap:
1. Go to **Domain List** → Select domain → **Advanced DNS**
2. Add A records (remove any existing A records pointing elsewhere)
3. Add CNAME for www

### GoDaddy:
1. Go to **DNS Management**
2. Add A records
3. Add CNAME for www

### Cloudflare:
1. Go to **DNS** tab
2. Set DNS proxy to **DNS only** (gray cloud) initially
3. Add A records
4. After SSL is active, you can enable proxy (orange cloud)

**Important for Cloudflare**: 
- If you're using Cloudflare proxy, you might need to:
  - Either disable proxy and use DNS-only mode
  - Or add a Cloudflare Page Rule for SSL/TLS settings
  - Firebase SSL might conflict with Cloudflare SSL

## Step 10: Verify Domain Status

Run this command to check Firebase hosting status:

```bash
firebase hosting:sites:list
firebase hosting:domains:list
```

## Quick Diagnostic Checklist

- [ ] Domain added in Firebase Console
- [ ] Domain status shows "Verified"
- [ ] DNS A records added (or CNAME)
- [ ] DNS propagated (check with dnschecker.org)
- [ ] SSL certificate status shows "Active"
- [ ] Redeployed after adding domain
- [ ] Waited 24-48 hours for propagation
- [ ] Cleared browser cache
- [ ] Tried different browser/incognito mode

## If Still Not Working

1. **Check Firebase Console Logs**: Look for any error messages
2. **Contact Firebase Support**: If domain is verified but not working
3. **Check Domain Registrar**: Ensure domain is not expired
4. **Verify DNS Records**: Double-check values in DNS provider

## Alternative: Use Cloudflare Pages

If Firebase custom domain continues to have issues, consider using Cloudflare Pages instead (see `CLOUDFLARE_DEPLOY.md`).

## Common Error Messages

### "Domain verification failed"
- Check TXT record is correctly added
- Wait for DNS propagation
- Try HTML file verification method

### "SSL certificate provisioning"
- Wait 24-72 hours
- Don't remove domain
- Check DNS records are correct

### "DNS not found"
- Verify DNS records are added correctly
- Wait for propagation (can take 48 hours)
- Use DNS checker tools

## Firebase Hosting IP Addresses (Current)

If using A records, use these IPs:
- `151.101.1.195`
- `151.101.65.195`

**Note**: Firebase IPs may change. Always check Firebase Console for current IPs.

