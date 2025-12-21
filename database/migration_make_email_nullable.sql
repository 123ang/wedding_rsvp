-- Migration: Make email column nullable in rsvps table
-- This allows RSVP submissions without an email address
-- Run this on your VPS database
--
-- Usage:
--   mysql -u wedding_user -p wedding_rsvp < migration_make_email_nullable.sql
--   Or connect to MySQL and run: SOURCE /path/to/migration_make_email_nullable.sql;

USE wedding_rsvp;

-- Alter the email column to allow NULL values
-- Note: The unique constraint unique_email_wedding (email, wedding_type) will remain
-- MySQL allows multiple NULL values in unique constraints (each NULL is considered distinct)
ALTER TABLE rsvps 
MODIFY COLUMN email VARCHAR(255) NULL;

-- Verify the changes
SELECT 'Migration completed successfully!' AS status;
DESCRIBE rsvps;

-- Optional: Check existing data to see NULL emails
SELECT 
    wedding_type,
    COUNT(*) as total,
    COUNT(email) as with_email,
    COUNT(*) - COUNT(email) as without_email
FROM rsvps 
GROUP BY wedding_type;

