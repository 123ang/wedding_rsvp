# Image Optimization System

This system optimizes gallery images for faster loading by creating thumbnails while keeping original high-quality images.

## Features

✅ **Thumbnails for Gallery** - 1200x800px @ 90% quality for fast loading  
✅ **Full Images for Lightbox** - Original high-quality images when user clicks  
✅ **Batch Processing** - Process all existing images  
✅ **Auto-Optimization** - New uploads are automatically optimized  
✅ **Separate Routes** - Each category has its own URL (`/gallery/pre-wedding`, etc.)  
✅ **Pausable Slideshow** - Slideshow can be paused/resumed and remembers position  
✅ **Space Saving** - Typically 60-80% file size reduction for gallery display

## Quick Start

### 1. Install Dependencies

```bash
cd api/scripts
pip3 install -r requirements.txt
```

This installs:
- `Pillow` - Image processing library
- `mysql-connector-python` - Database connection

### 2. Run Database Migration

```bash
mysql -u root -p wedding_rsvp < database/migration_add_thumbnails.sql
```

This adds a `thumbnail_url` column to the `photographer_photo` table.

### 3. Optimize Existing Images

```bash
cd api
python3 scripts/optimize-images.py --all
```

This will:
- Process all images in the database
- Create thumbnails in `uploads/photos/thumbnails/`
- Update database with thumbnail paths
- Show progress and statistics

## Usage

### Optimize All Images

Process every image, even those with existing thumbnails:

```bash
python3 scripts/optimize-images.py --all
```

### Optimize Only New Images

Process only images without thumbnails (faster, recommended for regular use):

```bash
python3 scripts/optimize-images.py --new
```

### Optimize Specific Category

```bash
python3 scripts/optimize-images.py --new --category pre-wedding
```

Categories: `pre-wedding`, `brides-dinner`, `morning-wedding`, `grooms-dinner`

### Dry Run (Preview)

See what would be processed without making changes:

```bash
python3 scripts/optimize-images.py --all --dry-run
```

## Automatic Optimization

### Option 1: Manual Trigger After Upload

After uploading photos via photographer portal, run:

```bash
cd api
node scripts/auto-optimize.js
```

### Option 2: Cron Job (Recommended)

Set up a cron job to automatically optimize new images every hour:

```bash
crontab -e
```

Add this line:

```
0 * * * * cd /path/to/wedding_rsvp/api && python3 scripts/optimize-images.py --new >> /var/log/image-optimization.log 2>&1
```

### Option 3: Integrate with Upload API (Advanced)

Add this to your upload endpoint after successful upload:

```javascript
const { spawn } = require('child_process');

// After photo upload succeeds...
spawn('python3', ['scripts/optimize-images.py', '--new'], {
  cwd: __dirname,
  detached: true,
  stdio: 'ignore'
}).unref();
```

## How It Works

### Upload Flow

1. **User uploads image** → Original saved to `uploads/photos/`
2. **Database record created** → `photographer_photo` table, `thumbnail_url` = NULL
3. **Optimization script runs** → Creates thumbnail in `uploads/photos/thumbnails/`
4. **Database updated** → `thumbnail_url` points to thumbnail

### Gallery Display Flow

1. **Gallery page loads** → Fetches photos from API
2. **Thumbnails shown in grid** → Fast loading, small file sizes
3. **User clicks photo** → Lightbox opens with full-resolution original
4. **Slideshow mode** → Uses full-resolution images, pausable/resumable

### File Structure

```
uploads/
├── photos/
│   ├── photo-1234567890-abc.jpg          (Original: 5MB)
│   └── thumbnails/
│       └── thumb_photo-1234567890-abc.jpg (Thumbnail: 300KB)
```

### Database Schema

```sql
photographer_photo (
  id INT,
  image_url VARCHAR(512),      -- /uploads/photos/photo-xxx.jpg
  thumbnail_url VARCHAR(512),  -- /uploads/photos/thumbnails/thumb_photo-xxx.jpg
  category VARCHAR(50),
  photographer_email VARCHAR(255),
  created_at TIMESTAMP
)
```

## Configuration

Edit `api/scripts/optimize-images.py` to change settings:

```python
THUMBNAIL_WIDTH = 1200   # Max width
THUMBNAIL_HEIGHT = 800   # Max height
QUALITY = 90             # JPEG quality (0-100)
```

## Troubleshooting

### "Pillow not installed"

```bash
pip3 install Pillow
# or
python3 -m pip install Pillow
```

### "Permission denied"

```bash
chmod +x api/scripts/optimize-images.py
chmod +x api/scripts/auto-optimize.js
```

### "Source file not found"

Images must exist in `uploads/photos/` directory. Check:

```bash
ls -la uploads/photos/
```

### "Database connection failed"

Ensure `.env` file exists in `api/` directory with correct database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=wedding_rsvp
```

### Thumbnails not showing in gallery

1. Check if thumbnails were created:
   ```bash
   ls -la uploads/photos/thumbnails/
   ```

2. Check database records:
   ```sql
   SELECT id, image_url, thumbnail_url FROM photographer_photo LIMIT 5;
   ```

3. Clear browser cache and refresh gallery page

## Performance

### Before Optimization
- Grid loads 30 photos × 5MB = 150MB
- Page load time: 15-30 seconds
- Poor experience on mobile/slow connections

### After Optimization
- Grid loads 30 thumbnails × 300KB = 9MB
- Page load time: 2-4 seconds
- Full images loaded only when clicked
- 94% reduction in initial page load data

## Gallery Routes

The gallery now uses separate routes for each category:

- `/gallery/pre-wedding` - Pre-wedding photos
- `/gallery/brides-dinner` - Bride's dinner photos
- `/gallery/morning-wedding` - Morning wedding photos
- `/gallery/grooms-dinner` - Groom's dinner photos
- `/gallery` - Redirects to `/gallery/pre-wedding`

Each route is bookmarkable and shareable.

## Slideshow Controls

- **Start Slideshow** - Enters fullscreen and auto-advances every 5 seconds
- **Pause** - Stops auto-advance, keeps position
- **Resume** - Continues from current position
- **Stop** - Exits fullscreen and closes slideshow
- Slideshow remembers position even when pausing

## Maintenance

### Regular Tasks

**Weekly:** Check optimization status
```bash
mysql -u root -p wedding_rsvp -e "
  SELECT 
    COUNT(*) as total,
    SUM(thumbnail_url IS NOT NULL) as optimized,
    SUM(thumbnail_url IS NULL) as pending
  FROM photographer_photo;
"
```

**Monthly:** Re-optimize all images (if settings changed)
```bash
python3 scripts/optimize-images.py --all
```

### Disk Space Management

Thumbnails use ~5-10% of original file space. Monitor disk usage:

```bash
du -sh uploads/photos/
du -sh uploads/photos/thumbnails/
```

To reclaim space (if needed), delete original files and keep only thumbnails (not recommended unless storage is critical).

## Support

For issues or questions:
1. Check logs: `python3 scripts/optimize-images.py --dry-run`
2. Verify database: Check `photographer_photo.thumbnail_url` column
3. Test single image: Upload one photo and run optimization
4. Check file permissions: Ensure `uploads/photos/thumbnails/` is writable

## Future Enhancements

- [ ] WebP format support for even smaller sizes
- [ ] Progressive JPEG loading
- [ ] CDN integration
- [ ] Multiple thumbnail sizes (small, medium, large)
- [ ] Lazy loading improvements
- [ ] Image compression quality auto-adjustment
