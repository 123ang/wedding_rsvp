-- Wedding RSVP Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS wedding_rsvp;
USE wedding_rsvp;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'photographer') NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the first admin with a bcrypt hash generated outside the repo.
-- Example only:
-- INSERT INTO admin_users (email, password, role)
-- VALUES ('admin@example.com', '<bcrypt_hash_from_secure_password>', 'admin');

-- Unified RSVP table (replaces separate bride and groom tables)
CREATE TABLE IF NOT EXISTS rsvps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50),
    organization VARCHAR(255) NULL,
    relationship VARCHAR(100) NULL,
    attending BOOLEAN NOT NULL,
    number_of_guests INT DEFAULT 1,
    wedding_type ENUM('bride', 'groom') NOT NULL,
    payment_amount DECIMAL(10, 2) DEFAULT 0.00,
    seat_table VARCHAR(50) NULL,
    remark TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email_wedding (email, wedding_type)
);
