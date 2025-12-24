-- Fix pre-wedding photos: Insert missing photos and tags
-- Run this if photos don't appear in the gallery
-- This will check for existing photos and only insert missing ones

USE wedding_rsvp;

-- Ensure photographer_photo table exists
CREATE TABLE IF NOT EXISTS photographer_photo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    category ENUM('pre-wedding', 'brides-dinner', 'morning-wedding', 'grooms-dinner') NOT NULL,
    photographer_email VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure "pre-wedding" tag exists
INSERT IGNORE INTO tags (name, usage_count) VALUES ('pre-wedding', 0);
SET @pre_wedding_tag_id = (SELECT id FROM tags WHERE name = 'pre-wedding' LIMIT 1);

-- Insert photos into photos table (only if they don't exist)
INSERT INTO photos (user_name, user_phone, image_url, caption, created_at)
SELECT 'Photographer', NULL, CONCAT('/uploads/photos/pre_wedding/', n, '.jpg'), NULL, NOW()
FROM (
    SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION
    SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION
    SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18
) numbers
WHERE NOT EXISTS (
    SELECT 1 FROM photos WHERE image_url = CONCAT('/uploads/photos/pre_wedding/', numbers.n, '.jpg')
);

-- Insert into photographer_photo table (only if they don't exist)
INSERT INTO photographer_photo (image_url, category, photographer_email)
SELECT p.image_url, 'pre-wedding', NULL
FROM photos p
WHERE p.image_url LIKE '/uploads/photos/pre_wedding/%'
AND NOT EXISTS (
    SELECT 1 FROM photographer_photo pp WHERE pp.image_url = p.image_url
);

-- Link "pre-wedding" tag to photos (only if not already linked)
INSERT INTO photo_tags (photo_id, tag_id)
SELECT p.id, @pre_wedding_tag_id
FROM photos p
WHERE p.image_url LIKE '/uploads/photos/pre_wedding/%'
AND NOT EXISTS (
    SELECT 1 FROM photo_tags pt 
    WHERE pt.photo_id = p.id AND pt.tag_id = @pre_wedding_tag_id
);

-- Update tag usage count
UPDATE tags SET usage_count = (
    SELECT COUNT(*) FROM photo_tags WHERE tag_id = @pre_wedding_tag_id
) WHERE id = @pre_wedding_tag_id;

-- Verify the changes
SELECT 'Fix completed successfully!' AS status;
SELECT COUNT(*) AS total_photos_in_photos_table FROM photos WHERE image_url LIKE '/uploads/photos/pre_wedding/%';
SELECT COUNT(*) AS total_photos_in_photographer_photo_table FROM photographer_photo WHERE category = 'pre-wedding';
SELECT COUNT(*) AS total_tagged_photos FROM photo_tags WHERE tag_id = @pre_wedding_tag_id;

