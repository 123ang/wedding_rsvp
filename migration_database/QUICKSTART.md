# Quick Start Guide

## Step 1: Install Dependencies

```bash
pip install psycopg2-binary python-dotenv
```

## Step 2: Get Supabase Database Password

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. **Settings** → **Database** → **Connection string**
4. Copy the password from the connection string

   Example: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

## Step 3: Create .env File

Create a file named `.env` in the `migration_database` folder:

```env
SUPABASE_DB_HOST=db.gixbazstflmpsjksstjc.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_password_from_step_2
```

## Step 4: Run Export

```bash
python export_supabase_to_mysql.py
```

## Step 5: Import to MySQL

```bash
mysql -u your_username -p wedding_rsvp < supabase_export.sql
```

Or use phpMyAdmin/MySQL Workbench to import the `supabase_export.sql` file.

---

**That's it!** Your Supabase data is now exported and ready to import into MySQL.

