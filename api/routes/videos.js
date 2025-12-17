/**
 * Videos Routes
 * Handles video management
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/videos');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  },
});

// Ensure videos table has user_phone column
const ensureVideosHasUserPhone = async () => {
  try {
    await pool.execute('SELECT user_phone FROM videos LIMIT 1');
  } catch (e) {
    // Column doesn't exist, add it
    await pool.execute('ALTER TABLE videos ADD COLUMN user_phone VARCHAR(32) NULL AFTER description');
  }
};

// Get all videos
router.get('/', async (req, res) => {
  try {
    await ensureVideosHasUserPhone();

    const [videos] = await pool.execute(
      `SELECT 
        id,
        title,
        description,
        user_phone,
        video_url,
        thumbnail_url,
        duration,
        created_at
      FROM videos
      ORDER BY created_at DESC`
    );

    res.json({ success: true, videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos', error: error.message });
  }
});

// Get single video
router.get('/:id', async (req, res) => {
  try {
    await ensureVideosHasUserPhone();
    const { id } = req.params;

    const [videos] = await pool.execute(
      `SELECT 
        id,
        title,
        description,
        user_phone,
        video_url,
        thumbnail_url,
        duration,
        created_at
      FROM videos
      WHERE id = ?`,
      [id]
    );

    if (videos.length === 0) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    res.json({ success: true, video: videos[0] });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch video', error: error.message });
  }
});

// Create video (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, description, video_url, thumbnail_url, duration } = req.body;

    if (!title || !video_url) {
      return res.status(400).json({ success: false, message: 'Title and video URL are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO videos (title, description, video_url, thumbnail_url, duration) VALUES (?, ?, ?, ?, ?)',
      [title, description || null, video_url, thumbnail_url || null, duration || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      video: {
        id: result.insertId,
        title,
        description,
        video_url,
        thumbnail_url,
        duration
      }
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ success: false, message: 'Failed to create video', error: error.message });
  }
});

// Public upload endpoint for guests (video file)
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const { title, description, user_phone } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`;

    await ensureVideosHasUserPhone();

    const [result] = await pool.execute(
      'INSERT INTO videos (title, description, user_phone, video_url, thumbnail_url, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [title || 'Guest Video', description || null, user_phone || null, videoUrl, null, 0]
    );

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video: {
        id: result.insertId,
        title: title || 'Guest Video',
        description: description || null,
        video_url: videoUrl,
        thumbnail_url: null,
        duration: 0,
      },
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ success: false, message: 'Failed to upload video', error: error.message });
  }
});

// Update video (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, video_url, thumbnail_url, duration } = req.body;

    const [videos] = await pool.execute('SELECT id FROM videos WHERE id = ?', [id]);
    if (videos.length === 0) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    await pool.execute(
      `UPDATE videos 
      SET title = ?, description = ?, video_url = ?, thumbnail_url = ?, duration = ?
      WHERE id = ?`,
      [title, description, video_url, thumbnail_url, duration, id]
    );

    res.json({ success: true, message: 'Video updated successfully' });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ success: false, message: 'Failed to update video', error: error.message });
  }
});

// Delete video (owner or admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_phone } = req.body;

    await ensureVideosHasUserPhone();

    const [videos] = await pool.execute(
      'SELECT user_phone, video_url FROM videos WHERE id = ?',
      [id]
    );
    if (videos.length === 0) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const video = videos[0];
    const isOwner = video.user_phone && user_phone && video.user_phone === user_phone;
    const isAdmin = req.headers['x-admin-email'];

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this video' });
    }

    // Delete video file
    const filePath = path.join(__dirname, '../..', video.video_url);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Error deleting video file:', err);
      // continue even if file delete fails
    }

    await pool.execute('DELETE FROM videos WHERE id = ?', [id]);

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ success: false, message: 'Failed to delete video', error: error.message });
  }
});

module.exports = router;

