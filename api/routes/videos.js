/**
 * Videos Routes
 * Handles video management
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

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

    res.json({ success: true, videos });
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

// Delete video (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [videos] = await pool.execute('SELECT id FROM videos WHERE id = ?', [id]);
    if (videos.length === 0) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    await pool.execute('DELETE FROM videos WHERE id = ?', [id]);

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ success: false, message: 'Failed to delete video', error: error.message });
  }
});

module.exports = router;

