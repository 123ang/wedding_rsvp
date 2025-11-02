# Quick Start Guide - Supabase Migration Complete! 🎉

## ✅ What's Done

1. **Database migrated to Supabase** (PostgreSQL)
2. **Frontend updated** to use Supabase REST API
3. **Image caching optimized** for faster loading
4. **Cloudflare Pages ready** for deployment
5. **Build completed** successfully

## 🚀 Deploy Now (3 Steps)

### Step 1: Set Up Supabase Database (5 minutes)

1. Go to https://gixbazstflmpsjksstjc.supabase.co
2. Click **SQL Editor** in sidebar
3. Copy the entire contents of `database/supabase_schema.sql`
4. Paste and click **Run**
5. Verify in **Table Editor**: You should see `admin_users` and `rsvps` tables

### Step 2: Deploy to Cloudflare Pages (2 minutes)

**Option A: Via Wrangler CLI (Fastest)**
```bash
wrangler pages deploy dist --project-name=wedding-rsvp
```

**Option B: Via Cloudflare Dashboard**
1. Go to https://dash.cloudflare.com/
2. Navigate to **Workers & Pages** → **Pages**
3. Click **Upload assets**
4. Drag and drop the entire `dist` folder
5. Click **Deploy**

### Step 3: Test Everything (5 minutes)

Visit your deployed site and test:
- ✅ Submit RSVP for bride's wedding
- ✅ Submit RSVP for groom's wedding
- ✅ Login to admin dashboard (`/admin/login`)
  - Email: `angjinsheng@gmail.com` / Password: `920214`
- ✅ View RSVPs in dashboard
- ✅ Update payment amounts
- ✅ Download invitation PDFs

## 📊 What Changed

### Before (MySQL + PHP)
- Required PHP server
- MySQL database
- Complex deployment
- Manual server management

### After (Supabase)
- No server needed
- PostgreSQL (Supabase)
- Simple deployment (just upload `dist` folder)
- Automatic scaling and backups

## 🔑 Important Info

### Supabase
- **URL**: https://gixbazstflmpsjksstjc.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/gixbazstflmpsjksstjc

### Admin Credentials
- **Email 1**: angjinsheng@gmail.com / **Password**: 920214
- **Email 2**: psong32@hotmail.com / **Password**: 921119

## 📁 Key Files

- `database/supabase_schema.sql` - Run this in Supabase SQL Editor
- `src/config/supabase.js` - Supabase configuration
- `src/services/api.js` - API calls to Supabase
- `dist/` - Built files ready to deploy

## 🎯 Performance Optimizations

✅ **Image Caching**: 1 year cache for photos  
✅ **Preloading**: Critical images load first  
✅ **Lazy Loading**: Off-screen images load on scroll  
✅ **CDN**: Cloudflare global network  
✅ **Database**: Supabase global CDN  

## 🆘 Troubleshooting

### "RSVP submission failed"
- Check Supabase SQL Editor - did you run the schema?
- Check browser console for errors
- Verify API key in `src/config/supabase.js`

### "Admin login failed"
- Check `admin_users` table in Supabase
- Clear browser localStorage
- Use correct credentials

### "Can't see RSVPs"
- Make sure you're logged in as admin
- Check RLS policies in Supabase (should be enabled)

## 🎉 You're Done!

Your wedding RSVP site is now:
- ✅ Using modern serverless architecture
- ✅ Globally distributed via CDN
- ✅ Automatically scaling
- ✅ Backed up automatically
- ✅ Ready for your wedding!

**Next**: Share the URL with your guests! 💒

