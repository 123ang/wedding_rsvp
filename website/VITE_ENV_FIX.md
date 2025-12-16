# Vite Environment Variables Fix

## Issue
Vite doesn't support `process.env` in the browser. It uses `import.meta.env` instead.

## Changes Made

### 1. Updated `website/src/config/api.js`
**Before:**
```javascript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
```

**After:**
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

### 2. Updated `website/src/utils/errorHandler.js`
**Before:**
```javascript
if (process.env.NODE_ENV === 'production') {
```

**After:**
```javascript
if (import.meta.env.PROD) {
```

### 3. Updated `website/.env`
**Before:**
```env
REACT_APP_API_URL=http://localhost:3001/api
```

**After:**
```env
VITE_API_URL=http://localhost:3001/api
```

## Vite Environment Variables

### Important Rules:
1. **Prefix:** Must use `VITE_` prefix (not `REACT_APP_`)
2. **Access:** Use `import.meta.env.VITE_*` (not `process.env`)
3. **Mode:** Use `import.meta.env.MODE` or `import.meta.env.PROD` (not `process.env.NODE_ENV`)

### Available Variables:
- `import.meta.env.MODE` - Current mode (development/production)
- `import.meta.env.PROD` - Boolean, true in production
- `import.meta.env.DEV` - Boolean, true in development
- `import.meta.env.VITE_*` - Your custom variables

## Restart Required

After changing `.env` files, you must:
1. **Stop** the dev server (Ctrl+C)
2. **Restart** the dev server:
   ```bash
   cd website
   npm run dev
   ```

Vite reads environment variables at build time, so changes require a restart.

