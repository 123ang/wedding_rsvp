# Photo Upload & Viewing Guide

## 📸 Upload Photos (Photographer Access)

### Access URL:
```
https://jsang-psong-wedding.com/photographer/upload
```
Or locally:
```
http://localhost:5173/photographer/upload
```

### How to Access:

1. **Login as Photographer:**
   - Go to: `https://jsang-psong-wedding.com/admin/login`
   - Enter photographer email and password
   - After login, you'll be automatically redirected to `/photographer/upload`

2. **Features:**
   - Upload up to 10 photos at once
   - Add optional caption for all photos
   - Preview selected photos before upload
   - See upload progress and status
   - Photos are uploaded without requiring guest phone numbers

3. **Requirements:**
   - User must have `photographer` role (set by admin)
   - Must be logged in

### Setting Up a Photographer:

1. **Admin Login:**
   - Go to admin dashboard: `https://jsang-psong-wedding.com/admin/dashboard`
   - Login as admin

2. **Change User Role:**
   - Click the "👥 Users" button in the header
   - Find the user you want to make a photographer
   - Click "✏️ Change Role"
   - Select "Photographer" from dropdown
   - Click "✓" to save

3. **Or create new photographer account:**
   - You'll need to manually add to database (or create admin interface for this)
   - Set role to `'photographer'` in database

---

## 🖼️ View Photos (Public Gallery)

### Access URL:
```
https://jsang-psong-wedding.com/gallery
```
Or locally:
```
http://localhost:5173/gallery
```

### How to Access:

1. **Public Access:**
   - No login required
   - Anyone can view the gallery
   - Accessible from the main website navigation menu

2. **Features:**
   - View all uploaded photos
   - Click on photos to view full size
   - Photos are displayed in a grid layout
   - Shows photos uploaded by guests and photographers

3. **Navigation:**
   - Click "Photo Gallery" link in the main navigation menu
   - Or directly visit `/gallery` URL

---

## 🔐 Quick Reference

### URLs Summary:

| Page | URL | Access Level |
|------|-----|--------------|
| Photographer Upload | `/photographer/upload` | Photographer only (login required) |
| Photo Gallery (View) | `/gallery` | Public (no login) |
| Admin Login | `/admin/login` | Public (login page) |
| Admin Dashboard | `/admin/dashboard` | Admin only (login required) |

### User Roles:

- **Admin**: Full access to RSVP management, user management, and can upload photos
- **Photographer**: Can only upload photos (redirected to upload page after login)
- **Guest**: Can view gallery and submit RSVPs (no login)

---

## 📝 Notes:

1. **After Upload:**
   - Photos uploaded by photographers appear in the gallery immediately
   - No approval process needed
   - Photos are visible to all website visitors

2. **Photo Storage:**
   - Photos are stored in `/uploads/photos/` directory on the server
   - Maximum file size: 1GB per photo
   - Supported formats: JPG, PNG, GIF, WebP

3. **Troubleshooting:**
   - If photographer can't access upload page, check user role in database
   - If photos don't appear in gallery, check API connection
   - If upload fails, check file size and format

