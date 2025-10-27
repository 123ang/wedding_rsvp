-- Migration: Consolidate bride_rsvps and groom_rsvps into a single rsvps table
-- This migrates existing data from the old tables to the new unified table

USE wedding_rsvp;

-- Step 1: Create new unified rsvps table if it doesn't exist
CREATE TABLE IF NOT EXISTS rsvps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    attending BOOLEAN NOT NULL,
    number_of_guests INT DEFAULT 1,
    wedding_type ENUM('bride', 'groom') NOT NULL,
    payment_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email_wedding (email, wedding_type)
);

-- Step 2: Migrate data from bride_rsvps
INSERT INTO rsvps (name, email, attending, number_of_guests, wedding_type, payment_amount, created_at)
SELECT name, email, attending, number_of_guests, 'bride' as wedding_type, payment_amount, created_at
FROM bride_rsvps
ON DUPLICATE KEY UPDATE id=id;

-- Step 3: Migrate data from groom_rsvps
INSERT INTO rsvps (name, email, attending, number_of_guests, wedding_type, payment_amount, created_at)
SELECT name, email, attending, number_of_guests, 'groom' as wedding_type, payment_amount, created_at
FROM groom_rsvps
ON DUPLICATE KEY UPDATE id=id;

-- Step 4: Verify the migration
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS total_rsvps FROM rsvps;
SELECT wedding_type, COUNT(*) AS count FROM rsvps GROUP BY wedding_type;

-- Optional: Uncomment the following lines to drop the old tables after verifying the data
-- DROP TABLE IF EXISTS bride_rsvps;
-- DROP TABLE IF EXISTS groom_rsvps;
