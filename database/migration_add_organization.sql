-- Migration to add organization field for groom RSVP
-- For Supabase/PostgreSQL
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE rsvps 
ADD COLUMN IF NOT EXISTS organization VARCHAR(255);

