-- Add thumbnail_url column to photographer_photo table
-- This stores the optimized thumbnail image for faster gallery loading

USE wedding_rsvp;

-- Add thumbnail_url column if it doesn't exist
ALTER TABLE photographer_photo 
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(512) NULL AFTER image_url;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_thumbnail_url ON photographer_photo(thumbnail_url);

-- Show current status
SELECT 
    COUNT(*) as total_photos,
    SUM(CASE WHEN thumbnail_url IS NOT NULL AND thumbnail_url != '' THEN 1 ELSE 0 END) as photos_with_thumbnails,
    SUM(CASE WHEN thumbnail_url IS NULL OR thumbnail_url = '' THEN 1 ELSE 0 END) as photos_without_thumbnails
FROM photographer_photo;

-- Instructions:
-- After running this migration:
-- 1. Install Python dependencies: cd api/scripts && pip3 install -r requirements.txt
-- 2. Run optimization script: python3 scripts/optimize-images.py --all
-- 3. Or for new images only: python3 scripts/optimize-images.py --new
