-- Quick Database Setup Script
-- Run this as MySQL root user to set up everything at once
-- Replace 'YOUR_SECURE_PASSWORD_HERE' with a strong password!

-- 1. Create database
CREATE DATABASE IF NOT EXISTS wedding_rsvp 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 2. Create user (CHANGE THE PASSWORD!)
CREATE USER IF NOT EXISTS 'wedding_user'@'localhost' 
  IDENTIFIED BY '920214@Ang';

-- 3. Grant all privileges on wedding_rsvp database
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';

-- 4. Apply changes
FLUSH PRIVILEGES;

-- 5. Verify setup
SELECT 'Database and user created successfully!' AS status;
SHOW DATABASES LIKE 'wedding_rsvp';
SELECT user, host FROM mysql.user WHERE user = 'wedding_user';
SHOW GRANTS FOR 'wedding_user'@'localhost';

-- Next steps:
-- 1. Update API .env file with:
--    DB_USER=wedding_user
--    DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
-- 2. Run create_tables.sql to create tables
-- 3. Run phase2_schema.sql to add Phase 2 tables

