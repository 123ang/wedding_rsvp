# 🚀 Image Optimization - Deployment Checklist

Use this checklist when deploying the image optimization system to production.

## Pre-Deployment

### Local Testing
- [ ] Run `python3 api/scripts/test-setup.py` - all checks pass
- [ ] Test gallery routes work (`/gallery/pre-wedding`, etc.)
- [ ] Test slideshow pause/resume functionality
- [ ] Test thumbnail loading in gallery grid
- [ ] Test full-image loading in lightbox
- [ ] Verify thumbnails are smaller than originals (check Network tab)
- [ ] Test on mobile device/viewport

### Code Review
- [ ] All files committed to git
- [ ] `.env` file NOT committed (contains credentials)
- [ ] `uploads/` directory in `.gitignore`
- [ ] All dependencies listed in `requirements.txt`
- [ ] Database migration script tested locally

## Deployment Steps

### 1. Server Preparation

**Install Python Dependencies**
```bash
cd /path/to/wedding_rsvp/api/scripts
pip3 install -r requirements.txt
```
- [ ] Pillow installed successfully
- [ ] mysql-connector-python installed successfully

**Create Directories**
```bash
mkdir -p /path/to/wedding_rsvp/uploads/photos/thumbnails
chmod -R 755 /path/to/wedding_rsvp/uploads/photos
```
- [ ] Thumbnails directory created
- [ ] Permissions set correctly

### 2. Database Migration

**Backup Database First**
```bash
mysqldump -u root -p wedding_rsvp > backup_$(date +%Y%m%d).sql
```
- [ ] Database backed up

**Run Migration**
```bash
mysql -u root -p wedding_rsvp < database/migration_add_thumbnails.sql
```
- [ ] Migration completed without errors
- [ ] `thumbnail_url` column exists in `photographer_photo` table

**Verify Migration**
```sql
SHOW COLUMNS FROM photographer_photo LIKE 'thumbnail_url';
```
- [ ] Column exists and is VARCHAR(512) NULL

### 3. Initial Optimization

**Test with Dry Run**
```bash
cd /path/to/wedding_rsvp/api
python3 scripts/optimize-images.py --all --dry-run
```
- [ ] Script runs without errors
- [ ] Shows correct count of images

**Run Full Optimization**
```bash
python3 scripts/optimize-images.py --all
```
- [ ] All images processed successfully
- [ ] Thumbnails created in `uploads/photos/thumbnails/`
- [ ] Database updated with thumbnail URLs
- [ ] Check disk space usage

**Verify Optimization**
```bash
ls -lh uploads/photos/thumbnails/ | head -5
```
- [ ] Thumbnail files exist
- [ ] File sizes are smaller than originals (~300KB vs ~5MB)

### 4. Web Application Deployment

**Frontend Build**
```bash
cd website
npm install
npm run build
```
- [ ] Build completes successfully
- [ ] No errors or warnings

**Deploy Frontend**
```bash
# Copy dist/ to web server or Firebase
npm run deploy  # or your deployment command
```
- [ ] Frontend deployed
- [ ] Gallery routes accessible

**Test Production URLs**
- [ ] `https://yourdomain.com/gallery/pre-wedding` works
- [ ] `https://yourdomain.com/gallery/brides-dinner` works
- [ ] `https://yourdomain.com/gallery/morning-wedding` works
- [ ] `https://yourdomain.com/gallery/grooms-dinner` works

### 5. API Server

**Start/Restart API Server**
```bash
cd api
npm install
pm2 restart wedding-api  # or your process manager
```
- [ ] API server running
- [ ] No errors in logs
- [ ] `/api/photos/photographer` endpoint returns `thumbnail_url`

### 6. Automatic Optimization (Optional but Recommended)

**Set up Cron Job**

Linux/Mac:
```bash
crontab -e
```
Add:
```
0 * * * * cd /path/to/wedding_rsvp/api && python3 scripts/optimize-images.py --new >> /var/log/image-optimization.log 2>&1
```
- [ ] Cron job added
- [ ] Correct path specified
- [ ] Log file writable

Windows Task Scheduler:
- [ ] Task created
- [ ] Set to run hourly
- [ ] Program: `python3`
- [ ] Arguments: `scripts/optimize-images.py --new`
- [ ] Start in: `[path]/api`
- [ ] Task runs successfully

### 7. Performance Testing

**Test Gallery Loading**
- [ ] Open DevTools Network tab
- [ ] Load gallery page
- [ ] Verify thumbnails load (check size ~300KB each)
- [ ] Verify page loads in <5 seconds
- [ ] Check total data transfer (~9MB for 30 photos)

**Test Lightbox**
- [ ] Click on thumbnail
- [ ] Lightbox opens with full-resolution image
- [ ] Full image size ~5MB (original quality)

**Test Slideshow**
- [ ] Start slideshow - enters fullscreen
- [ ] Auto-advances every 5 seconds
- [ ] Pause button works
- [ ] Resume button works
- [ ] Stop button exits fullscreen

### 8. Mobile Testing

- [ ] Gallery loads quickly on mobile
- [ ] Thumbnails display correctly
- [ ] Lightbox works on mobile
- [ ] Slideshow controls accessible
- [ ] Images scale properly

## Post-Deployment

### Monitoring

**Check Logs**
```bash
tail -f /var/log/image-optimization.log  # if using cron
pm2 logs wedding-api                      # API logs
```
- [ ] No errors in optimization logs
- [ ] API logs show successful requests

**Database Check**
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN thumbnail_url IS NOT NULL THEN 1 ELSE 0 END) as optimized,
  SUM(CASE WHEN thumbnail_url IS NULL THEN 1 ELSE 0 END) as pending
FROM photographer_photo;
```
- [ ] All photos have thumbnails (pending = 0)

**Disk Space**
```bash
df -h /path/to/uploads
du -sh /path/to/uploads/photos/thumbnails/
```
- [ ] Sufficient disk space available
- [ ] Thumbnails directory size reasonable

### User Communication

- [ ] Notify photographers upload process unchanged
- [ ] Share new gallery URLs if needed
- [ ] Inform users about improved performance

### Documentation

- [ ] Update internal docs with optimization workflow
- [ ] Document cron job location/schedule
- [ ] Note backup/restore procedures
- [ ] Save this checklist for future reference

## Rollback Plan (If Needed)

If issues occur:

1. **Restore Database**
```bash
mysql -u root -p wedding_rsvp < backup_YYYYMMDD.sql
```

2. **Remove Thumbnail Column**
```sql
ALTER TABLE photographer_photo DROP COLUMN thumbnail_url;
```

3. **Redeploy Previous Frontend**
```bash
git checkout [previous-commit]
cd website && npm run build && npm run deploy
```

4. **Remove Cron Job**
```bash
crontab -e  # Remove optimization line
```

## Success Criteria

✅ All deployment steps completed  
✅ Gallery loads in <5 seconds  
✅ Thumbnails display correctly  
✅ Full images load in lightbox  
✅ Slideshow works with pause/resume  
✅ All category routes accessible  
✅ No errors in logs  
✅ Mobile experience excellent  
✅ Automatic optimization running (if configured)

---

## Support & Troubleshooting

**Documentation:**
- `IMAGE_OPTIMIZATION_SUMMARY.md` - Complete overview
- `api/scripts/IMAGE_OPTIMIZATION_GUIDE.md` - Detailed guide
- `QUICK_REFERENCE.md` - Quick commands

**Test Script:**
```bash
python3 api/scripts/test-setup.py
```

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Thumbnails not showing | Check `thumbnail_url` in database, verify files exist |
| Optimization fails | Check Pillow installed, verify file permissions |
| Slow gallery load | Verify thumbnails are being served, not originals |
| Cron job not running | Check crontab syntax, verify paths, check logs |

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Production URL:** _______________  
**Notes:** 

_______________________________________________
_______________________________________________
_______________________________________________
