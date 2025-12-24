-- Create photographer_photo table and insert pre-wedding photos
-- This table stores photographer-uploaded photos with category information
-- Run this on your VPS database
--
-- Usage:
--   mysql -u wedding_user -p wedding_rsvp < create_photographer_photo_table.sql
--   Or connect to MySQL and run: SOURCE /path/to/create_photographer_photo_table.sql;

USE wedding_rsvp;

-- Create photographer_photo table
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

-- Insert pre-wedding photos (1-18.jpg) into photos table and photographer_photo table
-- Note: These photos should be moved to /uploads/photos/pre_wedding/ folder
-- Also add "pre-wedding" tag for gallery filtering

-- First, ensure "pre-wedding" tag exists
INSERT IGNORE INTO tags (name, usage_count) VALUES ('pre-wedding', 0);

-- Get the tag ID
SET @pre_wedding_tag_id = (SELECT id FROM tags WHERE name = 'pre-wedding' LIMIT 1);

-- Insert photos into photos table
INSERT INTO photos (user_name, user_phone, image_url, caption, created_at) VALUES
('Photographer', NULL, '/uploads/photos/pre_wedding/1.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/2.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/3.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/4.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/5.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/6.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/7.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/8.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/9.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/10.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/11.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/12.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/13.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/14.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/15.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/16.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/17.jpg', NULL, NOW()),
('Photographer', NULL, '/uploads/photos/pre_wedding/18.jpg', NULL, NOW());

-- Get the last inserted ID to calculate the range
SET @first_photo_id = LAST_INSERT_ID();
SET @last_photo_id = @first_photo_id + 17;

-- Insert into photographer_photo table
INSERT INTO photographer_photo (image_url, category, photographer_email)
SELECT image_url, 'pre-wedding', NULL
FROM photos
WHERE id BETWEEN @first_photo_id AND @last_photo_id;

-- Link "pre-wedding" tag to all inserted photos
INSERT INTO photo_tags (photo_id, tag_id)
SELECT id, @pre_wedding_tag_id
FROM photos
WHERE id BETWEEN @first_photo_id AND @last_photo_id
AND NOT EXISTS (
  SELECT 1 FROM photo_tags pt 
  WHERE pt.photo_id = photos.id AND pt.tag_id = @pre_wedding_tag_id
);

-- Update tag usage count
UPDATE tags SET usage_count = usage_count + 18 WHERE id = @pre_wedding_tag_id;

-- Verify the changes
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS total_pre_wedding_photos FROM photographer_photo WHERE category = 'pre-wedding';
DESCRIBE photographer_photo;

