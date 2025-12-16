# Quick Reference Card

## 🚀 All Phases Complete!

### What's Been Built

✅ **Phase 0**: Mobile app UI with mock data
✅ **Phase 1**: API integration and RSVP
✅ **Phase 2**: Photos, comments, likes backend
✅ **Phase 3**: Videos, seats, timeline backend
✅ **Phase 4**: Production build configuration

---

## 📝 Quick Commands

### Start Development

```bash
# Start API
cd api
npm start

# Start Mobile App
cd mobile_app
npx expo start

# Start Website
cd website
npm run dev
```

### Deploy to Production

```bash
# 1. Deploy Database
mysql -u root -p wedding_rsvp < database/phase2_schema.sql

# 2. Deploy API
scp -r api user@your-vps:/var/www/wedding_rsvp/
ssh user@your-vps
cd /var/www/wedding_rsvp/api
npm install
pm2 restart wedding-api

# 3. Build Mobile App
cd mobile_app
eas build --platform android --profile preview
```

---

## 📊 New API Endpoints

### Photos
- `GET /api/photos` - Get all photos
- `GET /api/photos/:id` - Get single photo
- `POST /api/photos/upload` - Upload photo
- `DELETE /api/photos/:id` - Delete photo
- `GET /api/photos/tags/all` - Get all tags

### Comments
- `GET /api/comments/photo/:photoId` - Get comments
- `POST /api/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Likes
- `POST /api/likes/photo/:photoId` - Like/unlike photo
- `POST /api/likes/comment/:commentId` - Like/unlike comment
- `GET /api/likes/photo/:photoId` - Get photo likes

### Videos
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get single video
- `POST /api/videos` - Create video (admin)
- `PUT /api/videos/:id` - Update video (admin)
- `DELETE /api/videos/:id` - Delete video (admin)

### Seats
- `GET /api/seats` - Get all seats
- `GET /api/seats/my-seat/:phone` - Get my seat
- `POST /api/seats/assign` - Assign seat (admin)
- `PUT /api/seats/:id` - Update seat (admin)
- `DELETE /api/seats/:id` - Clear seat (admin)

### Timeline
- `GET /api/timeline` - Get all events
- `GET /api/timeline/:id` - Get single event
- `POST /api/timeline` - Create event (admin)
- `PUT /api/timeline/:id` - Update event (admin)
- `DELETE /api/timeline/:id` - Delete event (admin)

---

## 🗄️ New Database Tables

```sql
photos          -- Photo uploads
tags            -- Hashtags
photo_tags      -- Many-to-many relationship
comments        -- Photo comments
likes           -- Likes for photos/comments
videos          -- Video library
seats           -- Seat assignments (100 seats)
timeline_events -- Wedding schedule (9 events)
```

---

## 📱 Mobile App Features

### Working with Real API:
- ✅ RSVP submission
- ✅ Photo upload
- ✅ Comments
- ✅ Likes
- ✅ Videos
- ✅ Seats
- ✅ Timeline
- ✅ Admin auth

### UI Features:
- ✅ 6 theme options
- ✅ Smooth navigation
- ✅ Pull to refresh
- ✅ Loading states
- ✅ Error handling

---

## 📚 Documentation

### Getting Started:
- `README.md` - Project overview
- `START_MOBILE_APP_TESTING.md` - Quick start
- `CURRENT_STATUS.md` - Project status

### Deployment:
- `COMPLETE_DEPLOYMENT_GUIDE.md` - Deploy everything
- `PHASE_1_DEPLOYMENT_GUIDE.md` - API deployment
- `PHASE_4_BUILD_GUIDE.md` - Build mobile app

### Reference:
- `ALL_PHASES_COMPLETE.md` - Complete summary
- `MOBILE_APP_COMPLETE_SUMMARY.md` - Mobile features
- `QUICK_REFERENCE.md` - This file

---

## 🔧 Troubleshooting

### API Not Working
```bash
pm2 logs wedding-api
pm2 restart wedding-api
```

### Database Issues
```bash
mysql -u root -p wedding_rsvp
SHOW TABLES;
```

### Mobile App Issues
```bash
cd mobile_app
npx expo start -c  # Clear cache
```

### Photo Upload Fails
```bash
# Check permissions
ls -la /var/www/wedding_rsvp/uploads/
chmod 755 /var/www/wedding_rsvp/uploads/
```

---

## 🎯 Deployment Checklist

- [ ] Run `database/phase2_schema.sql`
- [ ] Upload API code to VPS
- [ ] Install multer: `npm install`
- [ ] Create uploads directory
- [ ] Restart PM2: `pm2 restart wedding-api`
- [ ] Update Nginx config
- [ ] Test API endpoints
- [ ] Build mobile app APK
- [ ] Test on physical device
- [ ] Distribute to guests

---

## 📞 Quick Links

- **Website**: https://jsang-psong-wedding.com
- **Admin**: https://jsang-psong-wedding.com/admin/login
- **API Health**: https://jsang-psong-wedding.com/health
- **Uploads**: https://jsang-psong-wedding.com/uploads/

---

## 💡 Pro Tips

1. **Test locally first** before deploying
2. **Backup database** before running migrations
3. **Check API logs** if something doesn't work
4. **Use API Test screen** in mobile app for debugging
5. **Build preview APK** before production build

---

## 🎉 Success!

All phases complete! Ready to deploy and use for your wedding! 🎊

**Total Time to Deploy**: ~1 hour
**Total Cost**: $0 (using existing infrastructure)

---

**Last Updated**: December 16, 2024

