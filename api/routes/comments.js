/**
 * Comments Routes
 * Handles comments CRUD operations
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get comments for a photo
router.get('/photo/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const [comments] = await pool.execute(
      `SELECT 
        c.id,
        c.photo_id,
        c.user_name,
        c.user_phone,
        c.text,
        c.created_at,
        COUNT(DISTINCT l.id) as likes_count
      FROM comments c
      LEFT JOIN likes l ON l.comment_id = c.id
      WHERE c.photo_id = ?
      GROUP BY c.id
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?`,
      [photoId, limit, offset]
    );

    // Check if user liked each comment
    if (req.query.user_phone) {
      for (let comment of comments) {
        const [liked] = await pool.execute(
          'SELECT id FROM likes WHERE comment_id = ? AND user_phone = ?',
          [comment.id, req.query.user_phone]
        );
        comment.liked = liked.length > 0;
      }
    }

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM comments WHERE photo_id = ?',
      [photoId]
    );
    const total = countResult[0].total;

    res.json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + comments.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments', error: error.message });
  }
});

// Add comment to photo
router.post('/', async (req, res) => {
  try {
    const { photo_id, user_name, user_phone, text } = req.body;

    if (!photo_id || !user_name || !user_phone || !text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Photo ID, user name, user phone, and text are required' 
      });
    }

    // Check if photo exists
    const [photos] = await pool.execute('SELECT id FROM photos WHERE id = ?', [photo_id]);
    if (photos.length === 0) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Insert comment
    const [result] = await pool.execute(
      'INSERT INTO comments (photo_id, user_name, user_phone, text) VALUES (?, ?, ?, ?)',
      [photo_id, user_name, user_phone, text]
    );

    const commentId = result.insertId;

    // Get the created comment
    const [comments] = await pool.execute(
      `SELECT 
        id,
        photo_id,
        user_name,
        user_phone,
        text,
        created_at
      FROM comments
      WHERE id = ?`,
      [commentId]
    );

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: comments[0]
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
});

// Update comment (owner only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_phone, text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    // Get comment
    const [comments] = await pool.execute(
      'SELECT user_phone FROM comments WHERE id = ?',
      [id]
    );

    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is owner
    if (comments[0].user_phone !== user_phone) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this comment' });
    }

    // Update comment
    await pool.execute(
      'UPDATE comments SET text = ? WHERE id = ?',
      [text, id]
    );

    res.json({ success: true, message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment', error: error.message });
  }
});

// Delete comment (owner or admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_phone } = req.body;

    // Get comment
    const [comments] = await pool.execute(
      'SELECT user_phone FROM comments WHERE id = ?',
      [id]
    );

    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is owner or admin
    const isOwner = comments[0].user_phone === user_phone;
    const isAdmin = req.headers['x-admin-email'];

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    // Delete comment (cascade will delete likes)
    await pool.execute('DELETE FROM comments WHERE id = ?', [id]);

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment', error: error.message });
  }
});

module.exports = router;

