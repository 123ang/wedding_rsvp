# 🚀 Quick Reference Card - Image Optimization

## Setup (One-Time)

### Windows
```bash
setup-image-optimization.bat
```

### Linux/Mac
```bash
chmod +x setup-image-optimization.sh
./setup-image-optimization.sh
```

---

## Daily Operations

### After Uploading Photos
```bash
cd api
python3 scripts/optimize-images.py --new
```

### Optimize All Images (Re-process)
```bash
cd api
python3 scripts/optimize-images.py --all
```

### Optimize Specific Category
```bash
cd api
python3 scripts/optimize-images.py --new --category pre-wedding
```

---

## Check Status

### Database Status
```bash
mysql -u root -p wedding_rsvp -e "
  SELECT 
    COUNT(*) as total,
    SUM(thumbnail_url IS NOT NULL) as optimized
  FROM photographer_photo;
"
```

### Disk Usage
```bash
du -sh uploads/photos/
du -sh uploads/photos/thumbnails/
```

---

## Gallery URLs

- Pre-Wedding: `http://localhost:5173/gallery/pre-wedding`
- Bride's Dinner: `http://localhost:5173/gallery/brides-dinner`
- Morning Wedding: `http://localhost:5173/gallery/morning-wedding`
- Groom's Dinner: `http://localhost:5173/gallery/grooms-dinner`

---

## Slideshow Controls

| Button | Action |
|--------|--------|
| ▶️ Slideshow | Start fullscreen slideshow (5s intervals) |
| ⏸️ Pause | Stop auto-advance, keep position |
| ▶️ Resume | Continue from current photo |
| ⏹️ Stop | Exit fullscreen and close |

---

## Troubleshooting

### Pillow Not Installed
```bash
pip3 install Pillow
```

### Thumbnails Not Showing
```bash
# Clear browser cache
# Check database: SELECT thumbnail_url FROM photographer_photo LIMIT 5;
# Check files: ls uploads/photos/thumbnails/
```

### Permission Issues
```bash
chmod -R 755 uploads/photos/
chmod +x api/scripts/optimize-images.py
```

---

## Performance

| Metric | Before | After |
|--------|--------|-------|
| 30 Photos Load | ~150MB | ~9MB |
| Page Load Time | 15-30s | 2-4s |
| Data Reduction | - | 94% |

---

## Automatic Optimization (Optional)

### Cron Job (Linux/Mac)
```bash
crontab -e
# Add:
0 * * * * cd /path/to/wedding_rsvp/api && python3 scripts/optimize-images.py --new
```

### Task Scheduler (Windows)
- Open Task Scheduler
- Create Basic Task
- Trigger: Hourly
- Action: Start Program
- Program: `python3`
- Arguments: `scripts/optimize-images.py --new`
- Start in: `C:\path\to\wedding_rsvp\api`

---

## Files Reference

| File | Purpose |
|------|---------|
| `api/scripts/optimize-images.py` | Main optimization script |
| `api/scripts/IMAGE_OPTIMIZATION_GUIDE.md` | Detailed guide |
| `IMAGE_OPTIMIZATION_SUMMARY.md` | Complete implementation details |
| `database/migration_add_thumbnails.sql` | Database migration |

---

## Support

📚 Full Guide: `api/scripts/IMAGE_OPTIMIZATION_GUIDE.md`  
📋 Summary: `IMAGE_OPTIMIZATION_SUMMARY.md`  
🐛 Issues: Check logs in optimization script output
