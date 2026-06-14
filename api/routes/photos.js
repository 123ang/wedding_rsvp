/**
 * Photo Routes
 * Handles photo upload, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const AdmZip = require('adm-zip');
const pool = require('../config/database');
const {
  attachOptionalGuest,
  authenticateAdminOrPhotographer,
  authenticateGuestOrAdmin,
} = require('../middleware/auth');
const { sanitizeText } = require('../utils/security');

function serializePhoto(photo) {
  const { user_phone, ...publicPhoto } = photo;
  return publicPhoto;
}

/**
 * Trigger image optimization in background (for VPS / photographer portal).
 * Runs optimize-images.py --new so only images without thumbnails are processed.
 * Uses api/.venv/bin/python3 when present (VPS/Debian PEP 668), else system python3.
 * Does not block the response; runs detached.
 */
function triggerImageOptimization() {
  const fsSync = require('fs');
  const apiDir = path.join(__dirname, '..');
  const scriptPath = path.join(apiDir, 'scripts', 'optimize-images.py');
  const venvPython = path.join(apiDir, '.venv', 'bin', 'python3');

  let pythonCmd = (process.platform === 'win32' ? 'python' : 'python3');
  if (process.platform !== 'win32' && fsSync.existsSync(venvPython)) {
    pythonCmd = venvPython;
  }

  try {
    if (!fsSync.existsSync(scriptPath)) {
      console.log('[Photo Optimize] Script not found, skipping:', scriptPath);
      return;
    }

    const scriptArg = path.join(apiDir, 'scripts', 'optimize-images.py');
    const child = spawn(pythonCmd, [scriptArg, '--new'], {
      cwd: apiDir,
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    console.log('[Photo Optimize] Triggered background optimization (optimize-images.py --new)');
  } catch (err) {
    console.error('[Photo Optimize] Failed to trigger optimization:', err.message);
  }
}

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

// Get all photos (paginated)
router.get('/', attachOptionalGuest, async (req, res) => {
  try {
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
        p.image_url,
        p.caption,
        p.created_at,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT c.id) as comments_count
      FROM photos p
      LEFT JOIN likes l ON l.photo_id = p.id
      LEFT JOIN comments c ON c.photo_id = p.id
      GROUP BY p.id, p.user_name, p.image_url, p.caption, p.created_at
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

      // Personalize like state only from a verified guest session.
      if (req.guest) {
        const [liked] = await pool.execute(
          'SELECT id FROM likes WHERE photo_id = ? AND user_phone = ?',
          [photo.id, req.guest.phone]
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
      photos: photos.map(serializePhoto),
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
        thumbnail_url,
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
      thumbnail_url: photo.thumbnail_url || photo.image_url, // Fallback to full image if no thumbnail
      user_name: photo.photographer_email || 'Photographer',
      photographer_email: photo.photographer_email, // Include for filtering in manage photos
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
router.get('/:id', attachOptionalGuest, async (req, res) => {
  try {
    const { id } = req.params;

    const [photos] = await pool.execute(
      `SELECT 
        p.id,
        p.user_name,
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

    // Personalize like state only from a verified guest session.
    if (req.guest) {
      const [liked] = await pool.execute(
        'SELECT id FROM likes WHERE photo_id = ? AND user_phone = ?',
        [id, req.guest.phone]
      );
      photo.liked = liked.length > 0;
    } else {
      photo.liked = false;
    }

    res.json({ success: true, photo: serializePhoto(photo) });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch photo', error: error.message });
  }
});

// Upload photo for a verified guest, admin, or photographer.
router.post('/upload', authenticateGuestOrAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { caption, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo file provided' });
    }

    const imageUrl = `/uploads/photos/${req.file.filename}`;

    if (req.guest) {
      const cleanCaption = sanitizeText(caption || '', 1000) || null;
      const [result] = await pool.execute(
        'INSERT INTO photos (user_name, user_phone, image_url, caption) VALUES (?, ?, ?, ?)',
        [req.guest.name || 'Guest', req.guest.phone, imageUrl, cleanCaption]
      );

      return res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully',
        photo: {
          id: result.insertId,
          user_name: req.guest.name || 'Guest',
          image_url: imageUrl,
          caption: cleanCaption,
          created_at: new Date(),
        },
      });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const validCategories = ['pre-wedding', 'brides-dinner', 'morning-wedding', 'grooms-dinner', 'rom'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category. Must be one of: pre-wedding, brides-dinner, morning-wedding, grooms-dinner, rom' });
    }

    const [result] = await pool.execute(
      'INSERT INTO photographer_photo (image_url, category, photographer_email) VALUES (?, ?, ?)',
      [imageUrl, category, req.admin.email]
    );

    triggerImageOptimization();

    return res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully',
      photo: {
        id: result.insertId,
        image_url: imageUrl,
        category,
        photographer_email: req.admin.email,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload photo'
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

    const validCategories = ['pre-wedding', 'brides-dinner', 'morning-wedding', 'grooms-dinner', 'rom'];
    if (!validCategories.includes(category)) {
      // Clean up uploaded ZIP file
      await fs.unlink(zipFilePath).catch(() => {});
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category. Must be one of: pre-wedding, brides-dinner, morning-wedding, grooms-dinner, rom' 
      });
    }

    console.log('[ZIP Upload] Starting processing:', zipFilePath);
    console.log('[ZIP Upload] File size:', req.file.size, 'bytes');

    // Extract ZIP file with error handling
    let zip;
    let zipEntries;
    try {
      zip = new AdmZip(zipFilePath);
      zipEntries = zip.getEntries();
      console.log('[ZIP Upload] ZIP file contains', zipEntries.length, 'entries');
    } catch (zipError) {
      console.error('[ZIP Upload] Error reading ZIP file:', zipError);
      await fs.unlink(zipFilePath).catch(() => {});
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to read ZIP file. Please ensure the file is a valid ZIP archive.',
        error: zipError.message
      });
    }

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

    // Process images in batches of 100 to prevent memory issues
    const BATCH_SIZE = 100;
    const totalBatches = Math.ceil(imageEntries.length / BATCH_SIZE);
    
    console.log(`[ZIP Upload] Processing ${imageEntries.length} images in ${totalBatches} batches of ${BATCH_SIZE}`);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, imageEntries.length);
      const batch = imageEntries.slice(batchStart, batchEnd);
      
      console.log(`[ZIP Upload] Processing batch ${batchIndex + 1}/${totalBatches} (images ${batchStart + 1}-${batchEnd} of ${imageEntries.length})`);
      
      // Process each image in the current batch
      for (let i = 0; i < batch.length; i++) {
        const entry = batch[i];
        const globalIndex = batchStart + i;
        
        try {
          // Get file buffer directly from ZIP entry
          let fileBuffer;
          try {
            fileBuffer = zip.readFile(entry);
          } catch (readError) {
            throw new Error(`Failed to read file from ZIP: ${readError.message}`);
          }
          
          if (!fileBuffer) {
            throw new Error('Failed to read file from ZIP: file buffer is empty');
          }
          
          // Check if file is too large (optional safety check - 100MB per image)
          if (fileBuffer.length > 100 * 1024 * 1024) {
            throw new Error(`File too large: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB (max 100MB per image)`);
          }
          
          // Generate unique filename
          const uniqueSuffix = Date.now() + '-' + globalIndex + '-' + Math.round(Math.random() * 1E9);
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
          
          // Log every 10 images or at batch boundaries
          if ((globalIndex + 1) % 10 === 0 || i === batch.length - 1) {
            console.log(`[ZIP Upload] Processed ${globalIndex + 1}/${imageEntries.length} images (${results.successful} successful, ${results.failed} failed)`);
          }
        } catch (err) {
          results.failed++;
          results.errors.push({
            filename: entry.entryName,
            error: err.message
          });
          console.error(`[ZIP Upload] Error processing ${entry.entryName}:`, err.message);
        }
      }
      
      // Clear memory between batches (force garbage collection hint)
      if (global.gc && batchIndex < totalBatches - 1) {
        global.gc();
      }
      
      // Small delay between batches to allow memory cleanup
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Clean up ZIP file
    await fs.unlink(zipFilePath).catch(() => {});

    console.log('[ZIP Upload] Completed:', results);

    // Auto-run image optimization in background (thumbnails for gallery)
    if (results.successful > 0) {
      triggerImageOptimization();
    }

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
    console.error('[ZIP Upload] Error stack:', error.stack);
    console.error('[ZIP Upload] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      errno: error.errno
    });
    
    // Clean up on error
    if (zipFilePath) {
      await fs.unlink(zipFilePath).catch(() => {});
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to process ZIP file', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        code: error.code,
        stack: error.stack
      } : undefined
    });
  }
});

// Delete photo (owner or admin/photographer)
router.delete('/:id', authenticateGuestOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // First check if it's in photographer_photo table
    const [photographerPhotos] = await pool.execute(
      'SELECT image_url, photographer_email FROM photographer_photo WHERE id = ?',
      [id]
    );

    if (photographerPhotos.length > 0) {
      // It's a photographer photo
      const photo = photographerPhotos[0];
      
      // Check if user is admin or the photographer who uploaded it
      if (!req.admin) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this photo' });
      }

      const isAdmin = req.admin.role === 'admin';
      const isOwner = photo.photographer_email === req.admin.email;

      if (!isAdmin && !isOwner) {
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
    const isOwner = req.guest && photo.user_phone === req.guest.phone;
    
    // Check if user is photographer or admin
    let isPhotographerOrAdmin = false;
    if (req.admin) {
      isPhotographerOrAdmin =
        req.admin.role === 'admin' || req.admin.role === 'photographer';
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
