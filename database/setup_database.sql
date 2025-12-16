-- Complete Database Setup Script
-- Run this to create tables and import data in one go

-- Create database
CREATE DATABASE IF NOT EXISTS wedding_rsvp;
USE wedding_rsvp;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS rsvps;
DROP TABLE IF EXISTS admin_users;

-- Admin users table
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unified RSVP table
CREATE TABLE rsvps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    organization VARCHAR(255) NULL,
    attending BOOLEAN NOT NULL,
    number_of_guests INT DEFAULT 1,
    wedding_type ENUM('bride', 'groom') NOT NULL,
    payment_amount DECIMAL(10, 2) DEFAULT 0.00,
    seat_table VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email_wedding (email, wedding_type)
);

-- Set SQL mode for import
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

-- Import data from supabase_export.sql
-- (The INSERT statements will be added here or run separately)

