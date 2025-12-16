# Setting Up MySQL Database on VPS

This guide will help you create a new database and user for the wedding RSVP project on your VPS.

---

## Prerequisites

- ✅ SSH access to your VPS
- ✅ MySQL/MariaDB installed on VPS
- ✅ Root or sudo access

---

## Step 1: Connect to Your VPS

```bash
ssh user@your-vps-ip
# Or
ssh user@jsang-psong-wedding.com
```

Replace `user` with your actual username and the IP/domain with your VPS details.

---

## Step 2: Connect to MySQL

```bash
# If MySQL is installed
mysql -u root -p

# Or if using MariaDB
mariadb -u root -p

# Or with sudo (if root access is restricted)
sudo mysql -u root
```

Enter your MySQL root password when prompted.

---

## Step 3: Create the Database

Once connected to MySQL, run:

```sql
-- Create the database
CREATE DATABASE wedding_rsvp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify it was created
SHOW DATABASES;
```

You should see `wedding_rsvp` in the list.

---

## Step 4: Create a New MySQL User

**Option A: User with password (Recommended for remote access)**

```sql
-- Create user with password
CREATE USER 'wedding_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- For remote connections (if needed)
CREATE USER 'wedding_user'@'%' IDENTIFIED BY 'your_secure_password_here';
```

**Option B: User without password (Less secure, only for localhost)**

```sql
CREATE USER 'wedding_user'@'localhost';
```

**Important**: Replace `'your_secure_password_here'` with a strong password!

**Password Requirements:**
- At least 12 characters
- Mix of uppercase, lowercase, numbers, and special characters
- Example: `W3dd!ng@2024#RSVP`

---

## Step 5: Grant Permissions

Grant all privileges on the `wedding_rsvp` database to the new user:

```sql
-- Grant all privileges on wedding_rsvp database
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';

-- If you created user for remote access
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'%';

-- Apply the changes
FLUSH PRIVILEGES;
```

**What this does:**
- `ALL PRIVILEGES` - User can create, read, update, delete tables and data
- `wedding_rsvp.*` - Only on the wedding_rsvp database (not other databases)
- `FLUSH PRIVILEGES` - Reloads the grant tables so changes take effect

---

## Step 6: Verify User and Permissions

```sql
-- Check user was created
SELECT user, host FROM mysql.user WHERE user = 'wedding_user';

-- Check permissions
SHOW GRANTS FOR 'wedding_user'@'localhost';
```

You should see:
```
GRANT ALL PRIVILEGES ON `wedding_rsvp`.* TO `wedding_user`@`localhost`
```

---

## Step 7: Test the Connection

Exit MySQL:
```sql
EXIT;
```

Test connection with new user:
```bash
mysql -u wedding_user -p wedding_rsvp
```

Enter the password you set. If successful, you'll be connected to the `wedding_rsvp` database.

Test creating a table:
```sql
CREATE TABLE test_table (id INT);
DROP TABLE test_table;
EXIT;
```

If this works, your user has the correct permissions!

---

## Step 8: Create Database Tables

Now create all the tables for the wedding RSVP system:

```bash
# Connect to MySQL with the new user
mysql -u wedding_user -p wedding_rsvp

# Run the schema files
```

**Option A: Run from command line**

```bash
# From your local machine, upload schema files first
scp database/create_tables.sql user@your-vps:/tmp/
scp database/phase2_schema.sql user@your-vps:/tmp/

# Then on VPS
mysql -u wedding_user -p wedding_rsvp < /tmp/create_tables.sql
mysql -u wedding_user -p wedding_rsvp < /tmp/phase2_schema.sql
```

**Option B: Run from MySQL prompt**

```sql
-- Connect
mysql -u wedding_user -p wedding_rsvp

-- Copy and paste the contents of create_tables.sql
-- Then copy and paste the contents of phase2_schema.sql
```

**Option C: Use source command**

```sql
-- Connect
mysql -u wedding_user -p wedding_rsvp

-- If files are on VPS
SOURCE /path/to/create_tables.sql;
SOURCE /path/to/phase2_schema.sql;
```

---

## Step 9: Verify Tables Were Created

```sql
USE wedding_rsvp;
SHOW TABLES;
```

You should see:
```
+----------------------+
| Tables_in_wedding_rsvp|
+----------------------+
| admin_users          |
| rsvps                |
| photos               |
| tags                 |
| photo_tags           |
| comments             |
| likes                |
| videos               |
| timeline_events      |
| seats                |
+----------------------+
```

---

## Step 10: Update API Configuration

Update your API `.env` file on the VPS:

```bash
cd /var/www/wedding_rsvp/api
nano .env
```

Update with your new credentials:

```env
PORT=3002
DB_HOST=localhost
DB_USER=wedding_user
DB_PASSWORD=your_secure_password_here
DB_NAME=wedding_rsvp
NODE_ENV=production
```

Save and exit (Ctrl+X, then Y, then Enter).

---

## Step 11: Test API Connection

```bash
# Restart the API
pm2 restart wedding-api

# Check logs
pm2 logs wedding-api

# Test from command line
curl http://localhost:3002/health
```

---

## Security Best Practices

### 1. Use Strong Passwords
- Minimum 12 characters
- Mix of character types
- Don't use dictionary words

### 2. Limit User Access
- Only grant privileges on `wedding_rsvp` database
- Don't grant privileges on other databases
- Use `localhost` instead of `%` if possible

### 3. Remove Remote Access (if not needed)
If you only need local access:

```sql
-- Remove remote user
DROP USER 'wedding_user'@'%';
FLUSH PRIVILEGES;
```

### 4. Create Backup User (Optional)
For backups, create a read-only user:

```sql
CREATE USER 'wedding_backup'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT ON wedding_rsvp.* TO 'wedding_backup'@'localhost';
FLUSH PRIVILEGES;
```

---

## Troubleshooting

### Error: "Access denied for user"

**Check:**
1. Username is correct
2. Password is correct
3. User has permissions on the database
4. User is allowed to connect from the host

**Fix:**
```sql
-- Check user exists
SELECT user, host FROM mysql.user WHERE user = 'wedding_user';

-- Re-grant permissions
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';
FLUSH PRIVILEGES;
```

### Error: "Can't connect to MySQL server"

**Check:**
1. MySQL service is running: `sudo systemctl status mysql`
2. Firewall allows MySQL port (3306)
3. MySQL is configured to listen on localhost

**Fix:**
```bash
# Start MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Error: "Database doesn't exist"

**Fix:**
```sql
-- Create database
CREATE DATABASE wedding_rsvp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions again
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## Quick Reference Commands

### Connect to MySQL
```bash
mysql -u wedding_user -p wedding_rsvp
```

### Create Database
```sql
CREATE DATABASE wedding_rsvp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Create User
```sql
CREATE USER 'wedding_user'@'localhost' IDENTIFIED BY 'password';
```

### Grant Permissions
```sql
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';
FLUSH PRIVILEGES;
```

### Check Tables
```sql
USE wedding_rsvp;
SHOW TABLES;
```

### Check User Permissions
```sql
SHOW GRANTS FOR 'wedding_user'@'localhost';
```

### Delete User (if needed)
```sql
DROP USER 'wedding_user'@'localhost';
FLUSH PRIVILEGES;
```

### Delete Database (if needed)
```sql
DROP DATABASE wedding_rsvp;
```

---

## Complete Setup Script

Here's a complete script you can run:

```sql
-- 1. Create database
CREATE DATABASE IF NOT EXISTS wedding_rsvp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Create user (replace password!)
CREATE USER IF NOT EXISTS 'wedding_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD_HERE';

-- 3. Grant permissions
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';

-- 4. Apply changes
FLUSH PRIVILEGES;

-- 5. Verify
SHOW DATABASES LIKE 'wedding_rsvp';
SELECT user, host FROM mysql.user WHERE user = 'wedding_user';
SHOW GRANTS FOR 'wedding_user'@'localhost';
```

---

## Next Steps

After setting up the database:

1. ✅ **Import schema**: Run `create_tables.sql` and `phase2_schema.sql`
2. ✅ **Update API .env**: Set DB_USER and DB_PASSWORD
3. ✅ **Test connection**: Restart API and check logs
4. ✅ **Import data**: If you have existing data, import it
5. ✅ **Set up backups**: Configure automatic database backups

---

## Backup Script Example

Create a backup script:

```bash
#!/bin/bash
# /root/backup-wedding-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

mysqldump -u wedding_user -p'YOUR_PASSWORD' wedding_rsvp > $BACKUP_DIR/wedding_rsvp_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "wedding_rsvp_*.sql" -mtime +7 -delete

echo "Backup completed: wedding_rsvp_$DATE.sql"
```

Make it executable:
```bash
chmod +x /root/backup-wedding-db.sh
```

Add to crontab (daily at 2 AM):
```bash
crontab -e
# Add: 0 2 * * * /root/backup-wedding-db.sh
```

---

**Status**: Ready to set up
**Estimated Time**: 10-15 minutes
**Difficulty**: Easy

