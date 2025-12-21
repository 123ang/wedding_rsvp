-- Wedding RSVP Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS wedding_rsvp;
USE wedding_rsvp;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin users
INSERT INTO admin_users (email, password) VALUES
('angjinsheng@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'), -- password: 920214
('psong32@hotmail.com', '$2y$10$dXJ3SW6G7P50lGmMkkmz8ea5P3mYa4WXV0OuHDELbZ4w6T3KJfZYW'), -- password: 921119
('jasonang1668@gmail.com', '123456'); -- password: 123456

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

