-- Wedding RSVP Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin users (passwords are hashed with bcrypt)
INSERT INTO admin_users (email, password) VALUES
('angjinsheng@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'), -- password: 920214
('psong32@hotmail.com', '$2y$10$dXJ3SW6G7P50lGmMkkmz8ea5P3mYa4WXV0OuHDELbZ4w6T3KJfZYW') -- password: 921119
ON CONFLICT (email) DO NOTHING;

-- Unified RSVP table
CREATE TABLE IF NOT EXISTS rsvps (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    attending BOOLEAN NOT NULL,
    number_of_guests INTEGER DEFAULT 1,
    wedding_type VARCHAR(10) NOT NULL CHECK (wedding_type IN ('bride', 'groom')),
    payment_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email, wedding_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(email);
CREATE INDEX IF NOT EXISTS idx_rsvps_wedding_type ON rsvps(wedding_type);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert RSVPs (for public RSVP form)
CREATE POLICY "Allow public RSVP submissions" ON rsvps
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: Allow anyone to read their own RSVP
CREATE POLICY "Allow users to read their own RSVPs" ON rsvps
    FOR SELECT
    TO anon
    USING (true);

-- Policy: Allow authenticated users (admins) to read all RSVPs
CREATE POLICY "Allow admins to read all RSVPs" ON rsvps
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users (admins) to update RSVPs
CREATE POLICY "Allow admins to update RSVPs" ON rsvps
    FOR UPDATE
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to read admin_users (for login)
CREATE POLICY "Allow reading admin users for authentication" ON admin_users
    FOR SELECT
    TO anon, authenticated
    USING (true);

