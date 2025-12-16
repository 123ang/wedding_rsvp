/**
 * Photo Routes
 * Handles photo upload, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

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
    fileSize: 10 * 1024 * 1024, // 10MB limit
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

// Get all photos (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get photos with like and comment counts
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
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

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

// Get single photo with details
router.get('/:id', async (req, res) => {
  try {
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

// Upload photo
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const { user_name, user_phone, caption, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo file provided' });
    }

    if (!user_name || !user_phone) {
      return res.status(400).json({ success: false, message: 'User name and phone are required' });
    }

    // Generate image URL (relative path)
    const imageUrl = `/uploads/photos/${req.file.filename}`;

    // Insert photo
    const [result] = await pool.execute(
      'INSERT INTO photos (user_name, user_phone, image_url, caption) VALUES (?, ?, ?, ?)',
      [user_name, user_phone, imageUrl, caption || null]
    );

    const photoId = result.insertId;

    // Process tags if provided
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : JSON.parse(tags);
      
      for (let tagName of tagArray) {
        // Insert or get tag
        const [existingTag] = await pool.execute(
          'SELECT id FROM tags WHERE name = ?',
          [tagName]
        );

        let tagId;
        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
          // Increment usage count
          await pool.execute(
            'UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?',
            [tagId]
          );
        } else {
          const [newTag] = await pool.execute(
            'INSERT INTO tags (name, usage_count) VALUES (?, 1)',
            [tagName]
          );
          tagId = newTag.insertId;
        }

        // Link tag to photo
        await pool.execute(
          'INSERT INTO photo_tags (photo_id, tag_id) VALUES (?, ?)',
          [photoId, tagId]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully',
      photo: {
        id: photoId,
        user_name,
        user_phone,
        image_url: imageUrl,
        caption,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ success: false, message: 'Failed to upload photo', error: error.message });
  }
});

// Delete photo (owner or admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_phone } = req.body;

    // Get photo details
    const [photos] = await pool.execute(
      'SELECT user_phone, image_url FROM photos WHERE id = ?',
      [id]
    );

    if (photos.length === 0) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    const photo = photos[0];

    // Check if user is owner or admin
    const isOwner = photo.user_phone === user_phone;
    const isAdmin = req.headers['x-admin-email']; // Simple admin check

    if (!isOwner && !isAdmin) {
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

