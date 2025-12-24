-- Check and fix user roles in admin_users table
-- Run this to see current roles and fix any NULL values

USE wedding_rsvp;

-- Check if role column exists
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'wedding_rsvp'
AND TABLE_NAME = 'admin_users'
AND COLUMN_NAME = 'role';

-- Show all users and their roles
SELECT id, email, role, created_at FROM admin_users;

-- Fix NULL roles (set to 'admin' for existing users)
UPDATE admin_users 
SET role = 'admin' 
WHERE role IS NULL OR role = '';

-- Verify the fix
SELECT id, email, role, created_at FROM admin_users;

