-- Migration: Add relationship and remark columns to rsvps table
-- Run this after the initial schema is created
-- Note: If columns already exist, you'll get an error - that's okay, just ignore it

USE wedding_rsvp;

-- Add relationship column (if it doesn't exist)
-- MySQL doesn't support IF NOT EXISTS for ALTER TABLE, so check manually or ignore errors
ALTER TABLE rsvps 
ADD COLUMN relationship VARCHAR(100) NULL 
AFTER organization;

-- Add remark column (if it doesn't exist)
ALTER TABLE rsvps 
ADD COLUMN remark TEXT NULL 
AFTER seat_table;

-- Verify the changes
SELECT 'Migration completed successfully!' AS status;
DESCRIBE rsvps;

