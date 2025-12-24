-- Create photographer_photo table only (if it doesn't exist)
-- Run this first before uploading photos
-- 
-- Usage:
--   mysql -u wedding_user -p wedding_rsvp < create_photographer_photo_table_only.sql

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

SELECT 'photographer_photo table created successfully!' AS status;
DESCRIBE photographer_photo;

