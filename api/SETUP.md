# API Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Database Setup

Make sure your MySQL database is set up:

1. Create the database (if not exists):
   ```sql
   CREATE DATABASE IF NOT EXISTS wedding_rsvp;
   ```

2. Import the schema and data:
   ```bash
   mysql -u root wedding_rsvp < ../database/schema.sql
   mysql -u root wedding_rsvp < ../migration_database/supabase_export.sql
   ```

### 3. Configure Environment

The default `.env` is already set for local development:
- Host: `localhost`
- User: `root`
- Password: (empty)
- Database: `wedding_rsvp`

If you need to change these, create a `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=wedding_rsvp
PORT=3001
```

### 4. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The API will run on `http://localhost:3001`

## Frontend Configuration

Update the website frontend to point to the API:

1. Create/update `website/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   ```

2. Restart the frontend dev server

## Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Test RSVP Submission
```bash
curl -X POST http://localhost:3001/api/bride-rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "0123456789",
    "attending": true,
    "number_of_guests": 2
  }'
```

### Test Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "angjinsheng@gmail.com",
    "password": "920214"
  }'
```

## API Endpoints

### Public Endpoints
- `POST /api/bride-rsvp` - Submit bride wedding RSVP
- `POST /api/groom-rsvp` - Submit groom wedding RSVP

### Admin Endpoints (require auth headers)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/check-auth` - Check authentication
- `GET /api/admin/rsvps` - Get all RSVPs
- `POST /api/admin/update-payment` - Update payment amount
- `POST /api/admin/update-seat` - Update seat table
- `POST /api/admin/logout` - Logout

## Authentication

Admin endpoints require these headers:
- `x-admin-email`: Admin email
- `x-admin-id`: Admin ID

These are automatically added by the frontend after login.

## Troubleshooting

### Database Connection Error
- Check MySQL is running
- Verify database exists: `SHOW DATABASES;`
- Check credentials in `.env`

### Port Already in Use
- Change `PORT` in `.env` or `server.js`
- Or stop the process using port 3001

### CORS Issues
- CORS is enabled for all origins in development
- For production, update CORS settings in `server.js`

