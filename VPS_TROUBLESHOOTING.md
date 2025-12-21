# VPS RSVP 503 Error Troubleshooting Guide

If you're getting a **503 error** when trying to submit RSVPs, it means the backend API is receiving the request but the database connection is failing.

## Quick Diagnostic Steps

### 1. Check if the API Server is Running

SSH into your VPS and check:

```bash
# Check if Node.js process is running
pm2 list

# Or check if port is listening
netstat -tlnp | grep 3002
# Or
ss -tlnp | grep 3002

# Check API logs
pm2 logs wedding-api
# Or if using systemd
journalctl -u wedding-api -f
```

**If server is not running:**
```bash
cd /path/to/wedding_rsvp/api
pm2 start server.js --name wedding-api
# Or
npm start
```

### 2. Test API Health Endpoint

```bash
# From VPS
curl http://localhost:3002/health

# From your local machine (if firewall allows)
curl https://jsang-psong-wedding.com/health
```

Expected response:
```json
{"status":"OK","message":"Wedding RSVP API is running"}
```

### 3. Check Database Connection

The most common cause of 503 errors is a database connection failure.

#### Check if MySQL is running:
```bash
sudo systemctl status mysql
# Or
sudo systemctl status mariadb
```

If not running:
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Test database connection manually:
```bash
mysql -u root -p
# Or with your database user
mysql -u wedding_user -p wedding_rsvp
```

### 4. Verify .env Configuration

Check if `.env` file exists and has correct credentials:

```bash
cd /path/to/wedding_rsvp/api
cat .env
```

Should contain:
```env
PORT=3002
DB_HOST=localhost
DB_USER=wedding_user
DB_PASSWORD=your_password_here
DB_NAME=wedding_rsvp
NODE_ENV=production
```

**If .env is missing, create it:**
```bash
nano .env
# Paste the content above with your actual credentials
# Save: Ctrl+X, Y, Enter
```

### 5. Verify Database Exists

```bash
mysql -u root -p
```

Then in MySQL:
```sql
SHOW DATABASES;
-- Should see 'wedding_rsvp' in the list

USE wedding_rsvp;
SHOW TABLES;
-- Should see tables like 'rsvps', 'admin_users', etc.
```

If database doesn't exist:
```sql
CREATE DATABASE wedding_rsvp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then import schema:
```bash
mysql -u root -p wedding_rsvp < /path/to/database/schema.sql
```

### 6. Verify Database User and Permissions

```sql
-- Check if user exists
SELECT user, host FROM mysql.user WHERE user = 'wedding_user';

-- Check user permissions
SHOW GRANTS FOR 'wedding_user'@'localhost';
```

Should see:
```
GRANT ALL PRIVILEGES ON `wedding_rsvp`.* TO `wedding_user`@`localhost`
```

If user doesn't exist or lacks permissions:
```sql
-- Create user (replace password!)
CREATE USER 'wedding_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON wedding_rsvp.* TO 'wedding_user'@'localhost';
FLUSH PRIVILEGES;
```

### 7. Test Database Connection from Node.js

Create a test file:

```bash
cd /path/to/wedding_rsvp/api
node -e "require('dotenv').config(); const pool = require('./config/database'); pool.getConnection().then(c => { console.log('✓ Database connected'); c.release(); process.exit(0); }).catch(e => { console.error('✗ Database error:', e.message); process.exit(1); });"
```

This will show the exact error if connection fails.

### 8. Check API Logs for Detailed Errors

After improving error logging, check the server logs:

```bash
pm2 logs wedding-api --lines 50
```

Look for error messages that show:
- Database connection errors
- Authentication failures
- Missing tables/columns
- SQL syntax errors

### 9. Common Issues and Solutions

#### Issue: "Access denied for user"
**Solution:** Password in `.env` doesn't match MySQL user password
- Verify password in `.env` matches MySQL user password
- Reset password: `ALTER USER 'wedding_user'@'localhost' IDENTIFIED BY 'new_password';`

#### Issue: "Can't connect to MySQL server"
**Solution:** MySQL service is not running
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Issue: "Unknown database 'wedding_rsvp'"
**Solution:** Database doesn't exist
```sql
CREATE DATABASE wedding_rsvp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Issue: "Table 'wedding_rsvp.rsvps' doesn't exist"
**Solution:** Tables haven't been created
```bash
mysql -u wedding_user -p wedding_rsvp < /path/to/database/schema.sql
```

#### Issue: Server responds but returns 503
**Solution:** Database connection is failing
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Test connection manually: `mysql -u wedding_user -p wedding_rsvp`
- Check logs for specific error messages

### 10. Restart Services

After making changes:

```bash
# Restart MySQL
sudo systemctl restart mysql

# Restart API server
pm2 restart wedding-api

# Or if using npm directly
cd /path/to/wedding_rsvp/api
pkill -f "node.*server.js"
npm start
```

### 11. Test RSVP Submission

Test the endpoint directly:

```bash
curl -X POST https://jsang-psong-wedding.com/api/groom-rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "0123456789",
    "attending": true,
    "number_of_guests": 1
  }'
```

Expected success response:
```json
{"message":"RSVP submitted successfully.","success":true}
```

### 12. Check Firewall and Reverse Proxy

If using nginx as reverse proxy, verify configuration:

```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx config
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

Verify nginx is proxying `/api` requests to `http://localhost:3002`

## Summary Checklist

- [ ] API server is running (check `pm2 list` or process list)
- [ ] Health endpoint responds (`curl http://localhost:3002/health`)
- [ ] MySQL service is running (`sudo systemctl status mysql`)
- [ ] `.env` file exists with correct credentials
- [ ] Database `wedding_rsvp` exists
- [ ] Database user `wedding_user` exists and has permissions
- [ ] Tables are created (check `SHOW TABLES;`)
- [ ] Database connection test passes (use test script above)
- [ ] API logs show no connection errors
- [ ] Reverse proxy (nginx) is configured correctly (if used)

## Next Steps After Fixing

1. Monitor logs: `pm2 logs wedding-api --lines 100`
2. Test RSVP submission from mobile app
3. Check that data appears in database:
   ```sql
   USE wedding_rsvp;
   SELECT * FROM rsvps ORDER BY id DESC LIMIT 5;
   ```

## Getting Help

If issue persists, collect this information:

1. API logs: `pm2 logs wedding-api --lines 100 > api_logs.txt`
2. MySQL status: `sudo systemctl status mysql > mysql_status.txt`
3. .env file (without password): `cat api/.env | grep -v PASSWORD`
4. Database connection test output
5. Error message from mobile app console

