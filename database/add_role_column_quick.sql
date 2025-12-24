-- Quick SQL to add role column to admin_users table
-- Run this in your MySQL database

USE wedding_rsvp;

-- Add role column with default 'admin'
ALTER TABLE admin_users 
ADD COLUMN role ENUM('admin', 'photographer') NOT NULL DEFAULT 'admin' 
AFTER password;

-- Verify it was added
DESCRIBE admin_users;

