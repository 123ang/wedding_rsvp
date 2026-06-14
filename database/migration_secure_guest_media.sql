-- Apply once before deploying the signed guest-session and private-video release.
USE wedding_rsvp;

ALTER TABLE photos
  MODIFY COLUMN user_phone VARCHAR(50) NULL;

SET @videos_has_user_phone = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'videos'
    AND COLUMN_NAME = 'user_phone'
);
SET @videos_user_phone_sql = IF(
  @videos_has_user_phone = 0,
  'ALTER TABLE videos ADD COLUMN user_phone VARCHAR(50) NULL AFTER description',
  'SELECT 1'
);
PREPARE videos_user_phone_statement FROM @videos_user_phone_sql;
EXECUTE videos_user_phone_statement;
DEALLOCATE PREPARE videos_user_phone_statement;

CREATE TABLE IF NOT EXISTS collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  photo_id INT NOT NULL,
  user_phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_photo_user (photo_id, user_phone),
  KEY idx_user_phone (user_phone),
  CONSTRAINT fk_collections_photo
    FOREIGN KEY (photo_id) REFERENCES photos(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
