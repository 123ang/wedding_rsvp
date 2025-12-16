# Quick Database Setup Guide

## Option 1: Create Tables Only (Recommended)

If you want to create tables first, then import data:

```bash
# Step 1: Create tables
mysql -u root < database/create_tables.sql

# Step 2: Import data
mysql -u root wedding_rsvp < migration_database/supabase_export.sql
```

## Option 2: One Command Setup

If you want to do everything at once:

```bash
# Create tables and import data
mysql -u root < database/create_tables.sql
mysql -u root wedding_rsvp < migration_database/supabase_export.sql
```

## Option 3: Using MySQL Command Line

```sql
-- Connect to MySQL
mysql -u root

-- Then run:
source database/create_tables.sql;
source migration_database/supabase_export.sql;
```

## Verify Setup

After setup, verify the tables:

```sql
USE wedding_rsvp;

-- Check tables exist
SHOW TABLES;

-- Check admin_users
SELECT COUNT(*) FROM admin_users;
-- Should show 3

-- Check rsvps
SELECT COUNT(*) FROM rsvps;
-- Should show 53

-- View sample data
SELECT * FROM admin_users;
SELECT * FROM rsvps LIMIT 5;
```

## Table Structure

### admin_users
- `id` - Primary key (INT)
- `email` - Unique email (VARCHAR 255)
- `password` - Hashed password (VARCHAR 255)
- `created_at` - Timestamp

### rsvps
- `id` - Primary key (INT)
- `name` - Guest name (VARCHAR 255)
- `email` - Guest email (VARCHAR 255)
- `phone` - Phone number (VARCHAR 50)
- `organization` - Organization (VARCHAR 255, nullable)
- `attending` - Boolean
- `number_of_guests` - Integer
- `wedding_type` - ENUM('bride', 'groom')
- `payment_amount` - Decimal(10,2)
- `seat_table` - Seat/table assignment (VARCHAR 50, nullable)
- `created_at` - Timestamp
- Unique constraint on (email, wedding_type)

## Troubleshooting

### Error: Table already exists
```sql
DROP TABLE IF EXISTS rsvps;
DROP TABLE IF EXISTS admin_users;
```
Then run create_tables.sql again.

### Error: Duplicate entry
The export uses `INSERT IGNORE`, so duplicates will be skipped safely.

### Error: Unknown database
Make sure the database is created first:
```sql
CREATE DATABASE IF NOT EXISTS wedding_rsvp;
```

