/**
 * Photo Routes
 * Handles photo upload, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const AdmZip = require('adm-zip');
const pool = require('../config/database');
const { authenticateAdminOrPhotographer } = require('../middleware/auth');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/photos');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Configure multer for ZIP file uploads
const zipStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'zip-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadZip = multer({
  storage: zipStorage,
  limits: {
    fileSize: 1024 * 1024 * 1024 * 5, // 5GB limit for ZIP files
  },
  fileFilter: (req, file, cb) => {
    const isZip = file.mimetype === 'application/zip' || 
                  file.mimetype === 'application/x-zip-compressed' ||
                  path.extname(file.originalname).toLowerCase() === '.zip';
    if (isZip) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed!'));
    }
  }
});

// Ensure photos table has user_phone column (for legacy databases)
// Also ensure it's nullable to allow photographer uploads without phone
const ensurePhotosHasUserPhone = async () => {
  try {
    await pool.execute('SELECT user_phone FROM photos LIMIT 1');
    // Try to make it nullable (ignore error if already nullable or doesn't work)
    try {
      await pool.execute('ALTER TABLE photos MODIFY COLUMN user_phone VARCHAR(50) NULL');
      console.log('[Photos] Made user_phone column nullable');
    } catch (alterErr) {
      // Ignore errors - column might already be nullable or alter might not be needed
      console.log('[Photos] user_phone column nullability check skipped:', alterErr.message);
    }
  } catch (e) {
    try {
      await pool.execute(
        'ALTER TABLE photos ADD COLUMN user_phone VARCHAR(50) NULL AFTER user_name'
      );
      console.log('[Photos] Added user_phone column to photos table');
    } catch (err) {
      console.error('[Photos] Failed to add user_phone column:', err.message || err);
      // Let the original error surface so we notice it
      throw err;
    }
  }
};

// Get all photos (paginated)
router.get('/', async (req, res) => {
  try {
    await ensurePhotosHasUserPhone();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get photos with like and comment counts
    // Use string interpolation for LIMIT/OFFSET to avoid prepared statement issues
    // Sanitize limit and offset to prevent SQL injection
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 20, 100));
    const safeOffset = Math.max(0, parseInt(offset) || 0);
    
    const query = `SELECT 
        p.id,
        p.user_name,
        p.user_phone,
        p.image_url,
        p.caption,
        p.created_at,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count
      FROM photos p
      LEFT JOIN likes l ON l.photo_id = p.id
      LEFT JOIN comments c ON c.photo_id = p.id
      GROUP BY p.id, p.user_name, p.user_phone, p.image_url, p.caption, p.created_at
      ORDER BY p.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`;
    
    console.log('[Photos] Executing query with limit:', safeLimit, 'offset:', safeOffset);
    const [photos] = await pool.query(query);
    console.log('[Photos] Query returned', photos.length, 'photos');

    // Get tags for each photo
    for (let photo of photos) {
      const [tags] = await pool.execute(
        `SELECT t.id, t.name
        FROM tags t
        INNER JOIN photo_tags pt ON pt.tag_id = t.id
        WHERE pt.photo_id = ?`,
        [photo.id]
      );
      photo.tags = tags;

      // Check if user liked this photo (if user_phone provided)
      if (req.query.user_phone) {
        const [liked] = await pool.execute(
          'SELECT id FROM likes WHERE photo_id = ? AND user_phone = ?',
          [photo.id, req.query.user_phone]
        );
        photo.liked = liked.length > 0;
      } else {
        photo.liked = false;
      }
    }

    // Get total count
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM photos');
    const total = countResult[0].total;

    res.json({
      success: true,
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + photos.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch photos', error: error.message });
  }
});

// Get photographer photos (from photographer_photo table)
router.get('/photographer', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const offset = (page - 1) * limit;
    const category = req.query.category; // Optional category filter

    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 1000, 1000));
    const safeOffset = Math.max(0, parseInt(offset) || 0);

    // Build query with optional category filter
    let query = `SELECT 
        id,
        image_url,
        category,
        photographer_email,
        created_at
      FROM photographer_photo`;
    
    const params = [];
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ` ORDER BY created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const [photos] = await pool.query(query, params);

    // Transform to match gallery format - add category as tag for filtering
    const transformedPhotos = photos.map(photo => ({
      id: photo.id,
      image_url: photo.image_url,
      user_name: photo.photographer_email || 'Photographer',
      photographer_email: photo.photographer_email, // Include for filtering in manage photos
      user_phone: null,
      caption: null,
      created_at: photo.created_at,
      category: photo.category,
      tags: [{ id: 0, name: photo.category }], // Add category as tag for gallery filtering
      likes_count: 0,
      comments_count: 0,
      liked: false
    }));

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM photographer_photo';
    const countParams = [];
    if (category) {
      countQuery += ' WHERE category = ?';
      countParams.push(category);
    }
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      photos: transformedPhotos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + photos.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching photographer photos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch photographer photos', error: error.message });
  }
});

// Get single photo with details
router.get('/:id', async (req, res) => {
  try {
    await ensurePhotosHasUserPhone();
    const { id } = req.params;

    const [photos] = await pool.execute(
      `SELECT 
        p.id,
        p.user_name,
        p.user_phone,
        p.image_url,
        p.caption,
        p.created_at,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count
      FROM photos p
      LEFT JOIN likes l ON l.photo_id = p.id
      LEFT JOIN comments c ON c.photo_id = p.id
      WHERE p.id = ?
      GROUP BY p.id`,
      [id]
    );

    if (photos.length === 0) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    const photo = photos[0];

    // Get tags
    const [tags] = await pool.execute(
      `SELECT t.id, t.name
      FROM tags t
      INNER JOIN photo_tags pt ON pt.tag_id = t.id
      WHERE pt.photo_id = ?`,
      [id]
    );
    photo.tags = tags;

    // Check if user liked
    if (req.query.user_phone) {
      const [liked] = await pool.execute(
        'SELECT id FROM likes WHERE photo_id = ? AND user_phone = ?',
        [id, req.query.user_phone]
      );
      photo.liked = liked.length > 0;
    }

    res.json({ success: true, photo });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch photo', error: error.message });
  }
});

// Upload photo (allows both admin and photographer)
router.post('/upload', authenticateAdminOrPhotographer, upload.single('photo'), async (req, res) => {
  try {
    // Admin/photographer uploads use photographer_photo table, so no need to check photos table
    console.log('[Photo Upload] Request received:', {
      hasFile: !!req.file,
      fileName: req.file?.filename,
      body: req.body,
      headers: Object.keys(req.headers),
      userRole: req.admin?.role
    });

    const { user_name, user_phone, caption, tags, category } = req.body;
    
    // Log category for debugging
    console.log('[Photo Upload] Category:', category);

    if (!req.file) {
      console.error('[Photo Upload] No file received');
      return res.status(400).json({ success: false, message: 'No photo file provided' });
    }

    // Generate image URL (relative path)
    const imageUrl = `/uploads/photos/${req.file.filename}`;

    // For admin/photographer uploads: insert into photographer_photo table only
    // Validate category is provided
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const validCategories = ['pre-wedding', 'brides-dinner', 'morning-wedding', 'grooms-dinner'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category. Must be one of: pre-wedding, brides-dinner, morning-wedding, grooms-dinner' });
    }

    // Insert into photographer_photo table
    try {
      const [result] = await pool.execute(
        'INSERT INTO photographer_photo (image_url, category, photographer_email) VALUES (?, ?, ?)',
        [imageUrl, category, req.admin.email]
      );
      
      const photoId = result.insertId;
      console.log('[Photo Upload] Successfully inserted into photographer_photo table:', photoId);

      res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully',
        photo: {
          id: photoId,
          image_url: imageUrl,
          category: category,
          photographer_email: req.admin.email,
          created_at: new Date()
        }
      });
      return; // Exit after upload
    } catch (err) {
      console.error('Error inserting into photographer_photo table:', err);
      console.error('Error details:', {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage
      });
      throw err; // Re-throw to be caught by outer catch block
    }

    // Note: All admin/photographer uploads go to photographer_photo table only
    // Regular user uploads (from mobile app) would go to photos table, but that's handled separately
  } catch (error) {
    console.error('Error uploading photo:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload photo', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      } : undefined
    });
  }
});

// Upload ZIP file and extract images (allows both admin and photographer)
router.post('/upload-zip', authenticateAdminOrPhotographer, uploadZip.single('zipfile'), async (req, res) => {
  let zipFilePath = null;
  
  try {
    const { category } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No ZIP file provided' });
    }

    zipFilePath = req.file.path;

    // Validate category is provided
    if (!category) {
      // Clean up uploaded ZIP file
      await fs.unlink(zipFilePath).catch(() => {});
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const validCategories = ['pre-wedding', 'brides-dinner', 'morning-wedding', 'grooms-dinner'];
    if (!validCategories.includes(category)) {
      // Clean up uploaded ZIP file
      await fs.unlink(zipFilePath).catch(() => {});
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category. Must be one of: pre-wedding, brides-dinner, morning-wedding, grooms-dinner' 
      });
    }

    console.log('[ZIP Upload] Starting processing:', zipFilePath);

    // Extract ZIP file
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();
    
    console.log('[ZIP Upload] ZIP file contains', zipEntries.length, 'entries');

    // Filter for image files only
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageEntries = zipEntries.filter(entry => {
      if (entry.isDirectory) return false;
      const ext = path.extname(entry.entryName).toLowerCase();
      return imageExtensions.includes(ext);
    });

    console.log('[ZIP Upload] Found', imageEntries.length, 'image files');

    if (imageEntries.length === 0) {
      // Clean up
      await fs.unlink(zipFilePath).catch(() => {});
      return res.status(400).json({ 
        success: false, 
        message: 'No image files found in ZIP archive. Supported formats: JPG, PNG, GIF, WebP' 
      });
    }

    const results = {
      total: imageEntries.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    const photosDir = path.join(__dirname, '../../uploads/photos');
    await fs.mkdir(photosDir, { recursive: true });

    // Process each image from ZIP (using buffer directly, no need to extract to disk first)
    for (let i = 0; i < imageEntries.length; i++) {
      const entry = imageEntries[i];
      
      try {
        // Get file buffer directly from ZIP entry
        const fileBuffer = zip.readFile(entry);
        
        if (!fileBuffer) {
          throw new Error('Failed to read file from ZIP');
        }
        
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + i + '-' + Math.round(Math.random() * 1E9);
        const originalExt = path.extname(entry.entryName);
        const newFilename = 'photo-' + uniqueSuffix + originalExt;
        const destPath = path.join(photosDir, newFilename);

        // Write to photos directory
        await fs.writeFile(destPath, fileBuffer);

        // Generate image URL
        const imageUrl = `/uploads/photos/${newFilename}`;

        // Insert into photographer_photo table
        await pool.execute(
          'INSERT INTO photographer_photo (image_url, category, photographer_email) VALUES (?, ?, ?)',
          [imageUrl, category, req.admin.email]
        );

        results.successful++;
        console.log(`[ZIP Upload] Successfully processed image ${i + 1}/${imageEntries.length}: ${entry.entryName}`);
      } catch (err) {
        results.failed++;
        results.errors.push({
          filename: entry.entryName,
          error: err.message
        });
        console.error(`[ZIP Upload] Error processing ${entry.entryName}:`, err.message);
      }
    }

    // Clean up ZIP file
    await fs.unlink(zipFilePath).catch(() => {});

    console.log('[ZIP Upload] Completed:', results);

    res.status(201).json({
      success: true,
      message: `Processed ${results.successful} of ${results.total} images successfully`,
      results: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined
      }
    });
  } catch (error) {
    console.error('[ZIP Upload] Error:', error);
    
    // Clean up on error
    if (zipFilePath) {
      await fs.unlink(zipFilePath).catch(() => {});
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to process ZIP file', 
      error: error.message
    });
  }
});

// Delete photo (owner or admin/photographer)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_phone } = req.body;

    const adminEmail = req.headers['x-admin-email'];
    const adminId = req.headers['x-admin-id'];

    // First check if it's in photographer_photo table
    const [photographerPhotos] = await pool.execute(
      'SELECT image_url, photographer_email FROM photographer_photo WHERE id = ?',
      [id]
    );

    if (photographerPhotos.length > 0) {
      // It's a photographer photo
      const photo = photographerPhotos[0];
      
      // Check if user is admin or the photographer who uploaded it
      if (!adminEmail || !adminId) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this photo' });
      }

      try {
        const [users] = await pool.execute(
          'SELECT role FROM admin_users WHERE email = ? AND id = ? LIMIT 1',
          [adminEmail, adminId]
        );
        if (users.length === 0) {
          return res.status(403).json({ success: false, message: 'Not authorized to delete this photo' });
        }
        const role = users[0].role || 'admin';
        const isAdmin = role === 'admin';
        const isOwner = photo.photographer_email === adminEmail;

        if (!isAdmin && !isOwner) {
          return res.status(403).json({ success: false, message: 'Not authorized to delete this photo' });
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        return res.status(500).json({ success: false, message: 'Error checking authorization' });
      }

      // Delete photo file
      const filePath = path.join(__dirname, '../..', photo.image_url);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
        // Continue even if file deletion fails
      }

      // Delete from photographer_photo table
      await pool.execute('DELETE FROM photographer_photo WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Photo deleted successfully' });
    }

    // If not in photographer_photo, check photos table (for regular user photos)
    const [photos] = await pool.execute(
      'SELECT user_phone, image_url FROM photos WHERE id = ?',
      [id]
    );

    if (photos.length === 0) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    const photo = photos[0];

    // Check if user is owner, admin, or photographer
    const isOwner = photo.user_phone === user_phone;
    
    // Check if user is photographer or admin
    let isPhotographerOrAdmin = false;
    if (adminEmail && adminId) {
      try {
        const [users] = await pool.execute(
          'SELECT role FROM admin_users WHERE email = ? AND id = ? LIMIT 1',
          [adminEmail, adminId]
        );
        if (users.length > 0) {
          const role = users[0].role || 'admin';
          isPhotographerOrAdmin = role === 'admin' || role === 'photographer';
        }
      } catch (err) {
        console.error('Error checking user role:', err);
      }
    }

    if (!isOwner && !isPhotographerOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this photo' });
    }

    // Delete photo file
    const filePath = path.join(__dirname, '../..', photo.image_url);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
      // Continue even if file deletion fails
    }

    // Delete photo from database (cascade will delete tags, comments, likes)
    await pool.execute('DELETE FROM photos WHERE id = ?', [id]);

    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ success: false, message: 'Failed to delete photo', error: error.message });
  }
});

// Get all tags
router.get('/tags/all', async (req, res) => {
  try {
    const [tags] = await pool.execute(
      'SELECT id, name, usage_count FROM tags ORDER BY usage_count DESC, name ASC'
    );

    res.json({ success: true, tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tags', error: error.message });
  }
});

module.exports = router;

