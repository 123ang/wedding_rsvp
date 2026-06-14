/**
 * Likes Routes
 * Handles like/unlike for photos and comments
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateGuest } = require('../middleware/auth');

// Like/unlike a photo
router.post('/photo/:photoId', authenticateGuest, async (req, res) => {
  try {
    const { photoId } = req.params;
    const userPhone = req.guest.phone;

    // Check if photo exists
    const [photos] = await pool.execute('SELECT id FROM photos WHERE id = ?', [photoId]);
    if (photos.length === 0) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Check if already liked
    const [existing] = await pool.execute(
      'SELECT id FROM likes WHERE photo_id = ? AND user_phone = ?',
      [photoId, userPhone]
    );

    if (existing.length > 0) {
      // Unlike
      await pool.execute(
        'DELETE FROM likes WHERE photo_id = ? AND user_phone = ?',
        [photoId, userPhone]
      );

      // Get updated count
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM likes WHERE photo_id = ?',
        [photoId]
      );

      res.json({
        success: true,
        message: 'Photo unliked',
        liked: false,
        likes_count: countResult[0].count
      });
    } else {
      // Like
      await pool.execute(
        'INSERT INTO likes (photo_id, user_phone) VALUES (?, ?)',
        [photoId, userPhone]
      );

      // Get updated count
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM likes WHERE photo_id = ?',
        [photoId]
      );

      res.json({
        success: true,
        message: 'Photo liked',
        liked: true,
        likes_count: countResult[0].count
      });
    }
  } catch (error) {
    console.error('Error toggling photo like:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like', error: error.message });
  }
});

// Like/unlike a comment
router.post('/comment/:commentId', authenticateGuest, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userPhone = req.guest.phone;

    // Check if comment exists
    const [comments] = await pool.execute('SELECT id FROM comments WHERE id = ?', [commentId]);
    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if already liked
    const [existing] = await pool.execute(
      'SELECT id FROM likes WHERE comment_id = ? AND user_phone = ?',
      [commentId, userPhone]
    );

    if (existing.length > 0) {
      // Unlike
      await pool.execute(
        'DELETE FROM likes WHERE comment_id = ? AND user_phone = ?',
        [commentId, userPhone]
      );

      // Get updated count
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM likes WHERE comment_id = ?',
        [commentId]
      );

      res.json({
        success: true,
        message: 'Comment unliked',
        liked: false,
        likes_count: countResult[0].count
      });
    } else {
      // Like
      await pool.execute(
        'INSERT INTO likes (comment_id, user_phone) VALUES (?, ?)',
        [commentId, userPhone]
      );

      // Get updated count
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM likes WHERE comment_id = ?',
        [commentId]
      );

      res.json({
        success: true,
        message: 'Comment liked',
        liked: true,
        likes_count: countResult[0].count
      });
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like', error: error.message });
  }
});

// Get likes for a photo
router.get('/photo/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM likes WHERE photo_id = ?',
      [photoId]
    );

    res.json({
      success: true,
      count: countResult[0].count
    });
  } catch (error) {
    console.error('Error fetching photo likes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch likes', error: error.message });
  }
});

// Get likes for a comment
router.get('/comment/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM likes WHERE comment_id = ?',
      [commentId]
    );

    res.json({
      success: true,
      count: countResult[0].count
    });
  } catch (error) {
    console.error('Error fetching comment likes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch likes', error: error.message });
  }
});

module.exports = router;
