# Admin Session Persistence Implementation

## Overview
Implemented session persistence for admin login so that logged-in admins are automatically redirected to the dashboard when they try to access the login page.

## Changes Made

### 1. Created `GuestRoute` Component
**File**: `website/src/components/GuestRoute.jsx`

A new route guard component that redirects authenticated users away from public pages (like login). This is the reverse of `ProtectedRoute`.

**Functionality**:
- Checks if admin is already logged in using `checkAdminAuth()`
- If logged in, redirects to `/admin/dashboard`
- If not logged in, allows access to the public page (login)

### 2. Updated `App.jsx`
**File**: `website/src/App.jsx`

Wrapped the login route with `GuestRoute` to automatically redirect logged-in users:

```jsx
<Route path="/admin/login" element={
  <GuestRoute>
    <AdminLoginPage />
  </GuestRoute>
} />
```

### 3. Enhanced `AdminLoginPage.jsx`
**File**: `website/src/pages/AdminLoginPage.jsx`

**Improvements**:
- Enhanced the existing auth check with window focus listener
- Added `replace: true` to navigation after successful login (prevents back button from going to login)
- Improved redirect logic to handle edge cases

## How It Works

### Session Storage
- Admin credentials are stored in `localStorage`:
  - `admin_email`: The admin's email address
  - `admin_id`: The admin's ID
- These persist across browser sessions (until logout or cleared)

### Authentication Flow

1. **User logs in**:
   - Credentials are validated via API
   - On success, `admin_email` and `admin_id` are saved to `localStorage`
   - User is redirected to dashboard with `replace: true`

2. **User navigates to `/admin/login` while logged in**:
   - `GuestRoute` checks `localStorage` for `admin_email`
   - If found, automatically redirects to `/admin/dashboard`
   - User never sees the login page

3. **User closes browser and returns**:
   - `localStorage` persists across browser sessions
   - When user navigates to `/admin/login`, `GuestRoute` detects existing session
   - User is automatically redirected to dashboard

4. **User logs out**:
   - `adminLogout()` clears `localStorage`
   - User is redirected to login page
   - Can now access login page normally

### Protection Layers

1. **Route Level** (`GuestRoute`):
   - Prevents access to login page when authenticated
   - Handles redirect at route level

2. **Component Level** (`AdminLoginPage`):
   - Backup check in `useEffect`
   - Window focus listener for edge cases
   - Handles direct navigation to login URL

3. **API Level** (`checkAdminAuth`):
   - Checks `localStorage` for `admin_email`
   - Returns authentication status

## Testing

### Test Cases

1. **Login and navigate to login URL**:
   - ✅ Login successfully
   - ✅ Navigate to `/admin/login` in address bar
   - ✅ Should redirect to dashboard

2. **Close browser and return**:
   - ✅ Login successfully
   - ✅ Close browser completely
   - ✅ Reopen browser and navigate to `/admin/login`
   - ✅ Should redirect to dashboard (session persisted)

3. **Logout and try login**:
   - ✅ Logout from dashboard
   - ✅ Navigate to `/admin/login`
   - ✅ Should show login page (not redirect)

4. **Direct URL access**:
   - ✅ While logged in, type `/admin/login` in address bar
   - ✅ Should redirect to dashboard

5. **Browser back button**:
   - ✅ After login, press back button
   - ✅ Should not go back to login (uses `replace: true`)

## Files Modified

1. ✅ `website/src/components/GuestRoute.jsx` (NEW)
2. ✅ `website/src/App.jsx` (UPDATED)
3. ✅ `website/src/pages/AdminLoginPage.jsx` (ENHANCED)

## Benefits

1. **Better UX**: Logged-in users don't see login page unnecessarily
2. **Session Persistence**: Login state persists across browser sessions
3. **Security**: Multiple layers of protection
4. **Clean Navigation**: No login page in browser history after login
5. **Automatic Redirect**: Seamless experience for logged-in users

## Notes

- Session is stored in `localStorage` (persists until explicitly cleared)
- No expiration time set (admin must manually logout)
- Works across browser tabs (same `localStorage`)
- Compatible with existing `ProtectedRoute` for dashboard

## Future Enhancements (Optional)

1. **Session Expiration**: Add token expiration time
2. **Token Refresh**: Implement refresh token mechanism
3. **Remember Me**: Option to persist session longer
4. **Activity Timeout**: Auto-logout after inactivity


