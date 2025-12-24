-- Make user_phone nullable in photos table
-- This allows photographers to upload photos without a phone number
-- 
-- Usage:
--   mysql -u wedding_user -p wedding_rsvp < make_user_phone_nullable.sql

USE wedding_rsvp;

-- Modify user_phone column to allow NULL
ALTER TABLE photos MODIFY COLUMN user_phone VARCHAR(50) NULL;

SELECT 'user_phone column is now nullable!' AS status;
DESCRIBE photos;

