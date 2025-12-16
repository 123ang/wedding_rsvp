# Environment Variables Guide

## Created .env Files

I've created two `.env` files for you:

### 1. API Backend (`api/.env`)

**Location:** `api/.env`

**Contents:**
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=wedding_rsvp

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Configuration:**
- `DB_HOST` - MySQL host (default: localhost)
- `DB_USER` - MySQL username (default: root)
- `DB_PASSWORD` - MySQL password (empty for local)
- `DB_NAME` - Database name (wedding_rsvp)
- `PORT` - API server port (3001)
- `NODE_ENV` - Environment (development/production)

### 2. Website Frontend (`website/.env`)

**Location:** `website/.env`

**Contents:**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api
```

**Configuration:**
- `REACT_APP_API_URL` - Backend API URL (points to Node.js API)

## Usage

### For Local Development

The default values are set for local development:
- MySQL on localhost
- Root user with no password
- API on port 3001

### For Production/VPS

Update the `.env` files with your production values:

**API (`api/.env`):**
```env
DB_HOST=your_vps_ip_or_domain
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=wedding_rsvp
PORT=3001
NODE_ENV=production
```

**Website (`website/.env`):**
```env
REACT_APP_API_URL=https://yourdomain.com/api
# or
REACT_APP_API_URL=http://your_vps_ip:3001/api
```

## Important Notes

1. **Never commit .env files** - They're already in `.gitignore`
2. **Restart servers** after changing .env files
3. **Frontend** - React apps need to be rebuilt to pick up new env vars
4. **Backend** - Node.js picks up .env changes on restart

## Testing

After creating the .env files:

1. **Start API server:**
   ```bash
   cd api
   npm start
   ```

2. **Start website (in new terminal):**
   ```bash
   cd website
   npm run dev
   ```

The API will connect to MySQL using the credentials in `api/.env`, and the website will connect to the API using the URL in `website/.env`.

