-- Migration script to add admin functionality and payment tracking
-- Use this if you already have the bride_rsvps and groom_rsvps tables

USE wedding_rsvp;

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add payment_amount column to bride_rsvps if it doesn't exist
ALTER TABLE bride_rsvps 
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Add payment_amount column to groom_rsvps if it doesn't exist
ALTER TABLE groom_rsvps 
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Insert admin users (only if they don't already exist)
INSERT IGNORE INTO admin_users (email, password) VALUES
('angjinsheng@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('psong32@hotmail.com', '$2y$10$dXJ3SW6G7P50lGmMkkmz8ea5P3mYa4WXV0OuHDELbZ4w6T3KJfZYW');

-- Verify the changes
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS admin_users_count FROM admin_users;
SELECT COUNT(*) AS bride_rsvp_count FROM bride_rsvps;
SELECT COUNT(*) AS groom_rsvp_count FROM groom_rsvps;
