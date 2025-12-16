# Supabase to MySQL Export Script

This Python script exports data from Supabase (PostgreSQL) database to MySQL-compatible SQL format.

## Prerequisites

1. **Python 3.7+** installed on your system
2. **Supabase Database Password** - You'll need the direct database password (not the API key)

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

Or install individually:
```bash
pip install psycopg2-binary python-dotenv
```

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your Supabase database credentials:
   ```env
   SUPABASE_DB_HOST=db.xxxxx.supabase.co
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your_actual_password_here
   ```

### 3. Get Your Supabase Database Password

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string**
5. Copy the password from the connection string (it's the part after `postgres://postgres:` and before `@`)

   Example connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

## Usage

### Run the Export Script

```bash
python export_supabase_to_mysql.py
```

The script will:
1. Connect to your Supabase database
2. Export data from `admin_users` and `rsvps` tables
3. Generate a MySQL-compatible SQL file: `supabase_export.sql`

### Output

The script generates `supabase_export.sql` with:
- MySQL-compatible INSERT statements
- Data type conversions (PostgreSQL → MySQL)
- Proper escaping for special characters
- `INSERT IGNORE` to handle duplicates

## Importing to MySQL

### Option 1: Command Line

```bash
mysql -u your_username -p wedding_rsvp < supabase_export.sql
```

### Option 2: phpMyAdmin

1. Log in to phpMyAdmin
2. Select your `wedding_rsvp` database
3. Go to **Import** tab
4. Choose the `supabase_export.sql` file
5. Click **Go**

### Option 3: MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database
3. Go to **Server** → **Data Import**
4. Select **Import from Self-Contained File**
5. Choose `supabase_export.sql`
6. Select target schema: `wedding_rsvp`
7. Click **Start Import**

## Tables Exported

- **admin_users** - Admin user accounts
- **rsvps** - All RSVP submissions (bride and groom)

## Data Type Conversions

The script automatically handles:
- PostgreSQL `BOOLEAN` → MySQL `TINYINT(1)`
- PostgreSQL `TIMESTAMP WITH TIME ZONE` → MySQL `TIMESTAMP`
- PostgreSQL `BIGSERIAL` → MySQL `INT` (preserves values)
- String escaping for special characters
- NULL value handling

## Troubleshooting

### Connection Error

**Error:** `Connection failed: password authentication failed`

**Solution:** 
- Verify your Supabase database password in `.env`
- Make sure you're using the database password, not the API key
- Check that your IP is allowed in Supabase (Settings → Database → Connection pooling)

### Table Not Found

**Error:** `Table xxx not found`

**Solution:**
- Verify table names exist in your Supabase database
- Check that you're connected to the correct database

### Import Errors

**Error:** `Duplicate entry` or `Foreign key constraint`

**Solution:**
- The script uses `INSERT IGNORE` to skip duplicates
- Make sure your MySQL tables match the schema in `database/schema.sql`
- Run the schema creation script first if tables don't exist

## Notes

- The script preserves original IDs from Supabase
- Uses `INSERT IGNORE` to prevent duplicate key errors
- All timestamps are converted to MySQL format
- The export file is UTF-8 encoded

## Security

⚠️ **Important:** 
- Never commit `.env` file to version control
- Keep your Supabase database password secure
- The `.env` file is already in `.gitignore`

## Example Output

```
============================================================
Supabase to MySQL Export Script
============================================================

Connecting to Supabase...
  Host: db.xxxxx.supabase.co
  Database: postgres
  User: postgres
✓ Connected successfully!

Exporting table: admin_users -> admin_users
  Exported 3 rows
Exporting table: rsvps -> rsvps
  Exported 150 rows

============================================================
✓ Export completed successfully!
  Output file: supabase_export.sql
============================================================
```

