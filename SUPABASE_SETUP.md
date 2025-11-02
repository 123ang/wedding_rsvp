# Supabase Setup Guide

This guide will help you set up your wedding RSVP database on Supabase.

## Step 1: Create Tables in Supabase

1. Go to your Supabase project: https://gixbazstflmpsjksstjc.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Copy and paste the contents of `database/supabase_schema.sql`
4. Click **Run** to execute the SQL

This will create:
- `admin_users` table with your admin credentials
- `rsvps` table for storing wedding RSVPs
- Proper indexes for performance
- Row Level Security (RLS) policies

## Step 2: Verify Tables

1. Go to **Table Editor** in Supabase
2. You should see two tables:
   - `admin_users` (with 2 admin users)
   - `rsvps` (empty, ready for submissions)

## Step 3: Test the Connection

### Build and Deploy

```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages or Firebase
firebase deploy --only hosting
# OR
wrangler pages deploy dist --project-name=wedding-rsvp
```

### Test RSVP Submission

1. Visit your deployed site
2. Fill out the RSVP form on the Bride or Groom page
3. Submit the form
4. Check Supabase Table Editor to see if the RSVP was saved

### Test Admin Dashboard

1. Go to `/admin/login`
2. Login with:
   - Email: `angjinsheng@gmail.com`
   - Password: `920214`
   
   OR
   
   - Email: `psong32@hotmail.com`
   - Password: `921119`

3. You should see all submitted RSVPs

## Configuration Details

### Supabase Connection
- **URL**: https://gixbazstflmpsjksstjc.supabase.co
- **Anon Key**: (stored in `src/config/supabase.js`)
- **API Endpoint**: `https://gixbazstflmpsjksstjc.supabase.co/rest/v1`

### Row Level Security (RLS)

The database has RLS enabled with these policies:
- **Public RSVP submissions**: Anyone can insert RSVPs (for the public form)
- **Read own RSVPs**: Anyone can read RSVPs (needed for duplicate checking)
- **Admin access**: Authenticated users can read and update all RSVPs

## Benefits of Supabase

✅ **No PHP required**: Direct REST API calls from frontend  
✅ **Global CDN**: Fast database access worldwide  
✅ **Real-time**: Can add real-time updates later  
✅ **Automatic backups**: Built-in backup system  
✅ **Free tier**: Generous free tier for personal projects  
✅ **Scalable**: Handles traffic spikes automatically  

## Troubleshooting

### RSVP Submission Fails
- Check browser console for errors
- Verify Supabase URL and API key in `src/config/supabase.js`
- Check RLS policies in Supabase dashboard

### Admin Login Fails
- Verify admin credentials in `admin_users` table
- Check browser localStorage for admin session

### Can't See RSVPs in Dashboard
- Make sure you're logged in as admin
- Check browser console for API errors
- Verify RLS policies allow reading RSVPs

## Migration from MySQL

The old PHP API files in the `api/` folder are no longer needed. The frontend now connects directly to Supabase using REST API.

You can keep the PHP files for reference, but they won't be used in production.

## Next Steps

1. ✅ Run the SQL schema in Supabase
2. ✅ Build and deploy your site
3. ✅ Test RSVP submission
4. ✅ Test admin dashboard
5. 🎉 Your wedding RSVP site is live!

