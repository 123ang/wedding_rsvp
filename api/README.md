# Wedding RSVP API

Node.js/Express backend API for the Wedding RSVP system.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update if needed:

```bash
cp .env.example .env
```

Default configuration:
- Database: `localhost` (MySQL)
- User: `root`
- Password: (empty)
- Database Name: `wedding_rsvp`
- Port: **`3002`** (matches nginx `proxy_pass` for jsang-psong-wedding.com)

### 3. Start Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Before starting a deployment upgraded from an older schema, run:

```bash
mysql -u root -p wedding_rsvp < ../database/migration_secure_guest_media.sql
```

Set `PRIVATE_VIDEO_DIR` to a persistent directory outside the public web root.
Uploaded videos are delivered through authenticated `/api/videos/:id/content`
requests and must not be exposed by nginx as static files.

## API Endpoints

### RSVP Endpoints

- **POST** `/api/bride-rsvp` - Submit bride wedding RSVP
- **POST** `/api/groom-rsvp` - Submit groom wedding RSVP

### Admin Endpoints

- **POST** `/api/admin/login` - Admin login
- **GET** `/api/admin/check-auth` - Check authentication
- **GET** `/api/admin/rsvps` - Get all RSVPs (requires auth)
- **POST** `/api/admin/update-payment` - Update payment amount (requires auth)
- **POST** `/api/admin/update-seat` - Update seat table (requires auth)
- **POST** `/api/admin/logout` - Logout

## Authentication

Admin endpoints require bearer token authentication:
- `Authorization: Bearer <token-from-admin-login>`

This is set by the frontend after successful login.

Verified guests receive a separate signed bearer token from
`GET /api/verify-phone/:phone`. Guest-owned comments, likes, collections,
uploads, and deletes derive identity from this token rather than request data.

## Database

The API connects to MySQL database `wedding_rsvp` with the following tables:
- `admin_users` - Admin user accounts
- `rsvps` - RSVP submissions

Make sure to import the database schema and data before running the API.
