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
- Port: `3001`

### 3. Start Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

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

Admin endpoints require authentication headers:
- `x-admin-email`: Admin email address
- `x-admin-id`: Admin ID

These are set by the frontend after successful login.

## Database

The API connects to MySQL database `wedding_rsvp` with the following tables:
- `admin_users` - Admin user accounts
- `rsvps` - RSVP submissions

Make sure to import the database schema and data before running the API.

