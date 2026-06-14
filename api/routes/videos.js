/**
 * Videos Routes
 * Handles video management
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const {
  authenticateAdmin,
  authenticateGuestOrAdmin,
  requireAdmin,
} = require('../middleware/auth');
const { isAllowedUpload, sanitizeText } = require('../utils/security');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const MAX_VIDEO_UPLOAD_BYTES = Number(process.env.MAX_VIDEO_UPLOAD_MB || 100) * 1024 * 1024;
const PRIVATE_VIDEO_DIR = path.resolve(
  process.env.PRIVATE_VIDEO_DIR ||
    path.join(__dirname, '../../private_uploads/videos')
);
const VIDEO_UPLOAD_OPTIONS = {
  allowedExtensions: ['.mp4', '.mov', '.webm'],
  allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
  maxBytes: MAX_VIDEO_UPLOAD_BYTES,
};

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(PRIVATE_VIDEO_DIR, { recursive: true });
      cb(null, PRIVATE_VIDEO_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const extensionByMime = {
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/webm': '.webm',
    };
    cb(null, `video-${crypto.randomUUID()}${extensionByMime[file.mimetype]}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_VIDEO_UPLOAD_BYTES,
  },
  fileFilter: (req, file, cb) => {
    if (isAllowedUpload(file, VIDEO_UPLOAD_OPTIONS)) {
      return cb(null, true);
    }
    return cb(new Error('Only MP4, MOV, or WEBM video files are allowed'));
  },
});

function serializeVideo(video) {
  const { user_phone, ...publicVideo } = video;
  if (
    String(publicVideo.video_url || '').startsWith('private:') ||
    String(publicVideo.video_url || '').startsWith('/uploads/videos/')
  ) {
    return {
      ...publicVideo,
      video_url: `/api/videos/${publicVideo.id}/content`,
    };
  }
  return publicVideo;
}

function storedVideoPath(videoUrl) {
  const value = String(videoUrl || '');
  if (value.startsWith('private:')) {
    return path.join(PRIVATE_VIDEO_DIR, path.basename(value.slice('private:'.length)));
  }
  if (value.startsWith('/uploads/videos/')) {
    return path.join(
      __dirname,
      '../../uploads/videos',
      path.basename(value)
    );
  }
  return null;
}

// Get all videos
router.get('/', async (req, res) => {
  try {
    const [videos] = await pool.execute(
      `SELECT 
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        duration,
        created_at
      FROM videos
      ORDER BY created_at DESC`
    );

    res.json({ success: true, videos: videos.map(serializeVideo) });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos', error: error.message });
  }
});

// Get single video
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [videos] = await pool.execute(
      `SELECT 
        id,
        title,
        description,
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

    res.json({ success: true, video: serializeVideo(videos[0]) });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch video', error: error.message });
  }
});

// Create video (admin only)
router.post('/', authenticateAdmin, requireAdmin, async (req, res) => {
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

// Upload endpoint for a verified guest, admin, or photographer.
router.post('/upload', authenticateGuestOrAdmin, upload.single('video'), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const videoUrl = `private:${req.file.filename}`;
    const ownerPhone = req.guest ? req.guest.phone : null;
    const cleanTitle = sanitizeText(title || 'Uploaded Video', 120) || 'Uploaded Video';
    const cleanDescription = sanitizeText(description || '', 500) || null;

    const [result] = await pool.execute(
      'INSERT INTO videos (title, description, user_phone, video_url, thumbnail_url, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [cleanTitle, cleanDescription, ownerPhone, videoUrl, null, 0]
    );

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video: {
        id: result.insertId,
        title: cleanTitle,
        description: cleanDescription,
        video_url: `/api/videos/${result.insertId}/content`,
        thumbnail_url: null,
        duration: 0,
      },
    });
  } catch (error) {
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error('Error uploading video:', error);
    res.status(500).json({ success: false, message: 'Failed to upload video' });
  }
});

// Stream uploaded video only to an authenticated guest/admin/photographer.
router.get('/:id/content', authenticateGuestOrAdmin, async (req, res) => {
  try {
    const [videos] = await pool.execute(
      'SELECT video_url FROM videos WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    if (videos.length === 0) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const filePath = storedVideoPath(videos[0].video_url);
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'Stored video file is not available',
      });
    }

    await fs.access(filePath);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    return res.sendFile(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, message: 'Video file not found' });
    }
    console.error('Error streaming video:', error);
    return res.status(500).json({ success: false, message: 'Failed to stream video' });
  }
});

// Update video (admin only)
router.put('/:id', authenticateAdmin, requireAdmin, async (req, res) => {
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
router.delete('/:id', authenticateGuestOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [videos] = await pool.execute(
      'SELECT user_phone, video_url FROM videos WHERE id = ?',
      [id]
    );
    if (videos.length === 0) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const video = videos[0];
    const isOwner =
      req.guest &&
      video.user_phone &&
      video.user_phone === req.guest.phone;
    const isAdmin = req.admin && req.admin.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this video' });
    }

    // Delete video file
    const filePath = storedVideoPath(video.video_url);
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Error deleting video file:', err);
        }
      }
    }

    await pool.execute('DELETE FROM videos WHERE id = ?', [id]);

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ success: false, message: 'Failed to delete video', error: error.message });
  }
});

module.exports = router;
