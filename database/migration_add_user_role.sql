-- Migration: Add role column to admin_users table
-- This allows distinguishing between admin and photographer users
-- Run this on your VPS database
--
-- Usage:
--   mysql -u wedding_user -p wedding_rsvp < migration_add_user_role.sql
--   Or connect to MySQL and run: SOURCE /path/to/migration_add_user_role.sql;

USE wedding_rsvp;

-- Add role column with default 'admin' (super admin)
-- 'admin' = full admin access (default)
-- 'photographer' = can only upload photos
ALTER TABLE admin_users 
ADD COLUMN role ENUM('admin', 'photographer') NOT NULL DEFAULT 'admin' 
AFTER password;

-- Verify the changes
SELECT 'Migration completed successfully!' AS status;
DESCRIBE admin_users;

-- Show current users and their roles
SELECT id, email, role, created_at FROM admin_users;

