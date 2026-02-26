-- Add thumbnail_url column to photographer_photo table
-- This stores the optimized thumbnail image for faster gallery loading
-- Idempotent: safe to run multiple times (skips if column/index already exists)

USE wedding_rsvp;

-- Add thumbnail_url column only if it doesn't exist (MySQL has no ADD COLUMN IF NOT EXISTS)
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'photographer_photo' AND COLUMN_NAME = 'thumbnail_url'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE photographer_photo ADD COLUMN thumbnail_url VARCHAR(512) NULL AFTER image_url',
  'SELECT 1 AS noop'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index only if it doesn't exist (MySQL has no CREATE INDEX IF NOT EXISTS in older versions)
SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'photographer_photo' AND INDEX_NAME = 'idx_thumbnail_url'
);

SET @sql2 = IF(@idx_exists = 0,
  'CREATE INDEX idx_thumbnail_url ON photographer_photo(thumbnail_url)',
  'SELECT 1 AS noop'
);

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Show current status
SELECT
    COUNT(*) AS total_photos,
    SUM(CASE WHEN thumbnail_url IS NOT NULL AND thumbnail_url != '' THEN 1 ELSE 0 END) AS photos_with_thumbnails,
    SUM(CASE WHEN thumbnail_url IS NULL OR thumbnail_url = '' THEN 1 ELSE 0 END) AS photos_without_thumbnails
FROM photographer_photo;
