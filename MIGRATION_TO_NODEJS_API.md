# Migration from PHP/Supabase to Node.js/MySQL API

## Summary

Successfully migrated the backend from:
- **Old:** PHP API + Supabase (PostgreSQL)
- **New:** Node.js/Express API + MySQL

## Changes Made

### 1. Backend API (New Node.js)

**Location:** `api/`

**Structure:**
```
api/
├── config/
│   └── database.js          # MySQL connection pool
├── middleware/
│   └── auth.js              # Admin authentication middleware
├── routes/
│   ├── rsvp.js              # RSVP endpoints
│   └── admin.js             # Admin endpoints
├── server.js                # Express server
├── package.json             # Dependencies
└── README.md                # API documentation
```

**Endpoints:**
- `POST /api/bride-rsvp` - Submit bride RSVP
- `POST /api/groom-rsvp` - Submit groom RSVP
- `POST /api/admin/login` - Admin login
- `GET /api/admin/rsvps` - Get all RSVPs
- `POST /api/admin/update-payment` - Update payment
- `POST /api/admin/update-seat` - Update seat table
- `POST /api/admin/logout` - Logout

### 2. Frontend Updates

**Files Modified:**
- `website/src/services/api.js` - Replaced Supabase client with axios API client
- `website/src/config/api.js` - New API configuration (replaces supabase.js)

**Changes:**
- Removed all Supabase REST API calls
- Replaced with standard HTTP requests to Node.js API
- Authentication now uses custom headers (`x-admin-email`, `x-admin-id`)
- All API endpoints now point to `http://localhost:3001/api`

### 3. Database

**Migration:**
- Data exported from Supabase using `migration_database/export_supabase_to_mysql.py`
- Exported to `migration_database/supabase_export.sql`
- Ready to import into MySQL database `wedding_rsvp`

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd api
npm install
```

### 2. Import Database

```bash
# Import schema
mysql -u root wedding_rsvp < database/schema.sql

# Import data
mysql -u root wedding_rsvp < migration_database/supabase_export.sql
```

### 3. Start Backend Server

```bash
cd api
npm start
# or for development with auto-reload:
npm run dev
```

Server runs on `http://localhost:3001`

### 4. Configure Frontend

Create `website/.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
```

Restart the frontend dev server.

## Database Configuration

**Default (Local):**
- Host: `localhost`
- User: `root`
- Password: (empty)
- Database: `wedding_rsvp`

To change, update `api/.env` or modify `api/config/database.js`

## Authentication

**Admin Authentication:**
- Uses simple header-based authentication
- Headers: `x-admin-email` and `x-admin-id`
- Set automatically by frontend after login
- Stored in `localStorage` on frontend

**Admin Credentials:**
- `angjinsheng@gmail.com` / `920214`
- `psong32@hotmail.com` / `921119`
- `jasonang1668@gmail.com` / `123456`

## API Response Format

All endpoints return JSON in this format:
```json
{
  "success": true/false,
  "message": "Status message",
  "data": { ... }
}
```

## Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Test RSVP
```bash
curl -X POST http://localhost:3001/api/bride-rsvp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"123","attending":true,"number_of_guests":1}'
```

### Test Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"angjinsheng@gmail.com","password":"920214"}'
```

## Benefits

1. **Unified Stack:** All backend code in Node.js
2. **Local Database:** Full control over MySQL database
3. **Better Performance:** Direct database connection
4. **Easier Deployment:** Single Node.js process
5. **No External Dependencies:** No Supabase required

## Next Steps

1. ✅ Backend API created
2. ✅ Frontend updated to use new API
3. ✅ Database export script created
4. ⏳ Import database data
5. ⏳ Test all endpoints
6. ⏳ Deploy to VPS

## Notes

- The old PHP `api/` folder has been removed
- Supabase configuration files can be removed (no longer needed)
- All Supabase references removed from frontend code
- API uses MySQL connection pooling for better performance

