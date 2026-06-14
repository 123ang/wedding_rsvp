/**
 * Comments Routes
 * Handles comments CRUD operations
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const {
  attachOptionalGuest,
  authenticateGuest,
  authenticateGuestOrAdmin,
} = require('../middleware/auth');
const { sanitizeText } = require('../utils/security');

function serializeComment(comment) {
  const { user_phone, ...publicComment } = comment;
  return publicComment;
}

// Get comments for a photo
router.get('/photo/:photoId', attachOptionalGuest, async (req, res) => {
  try {
    const { photoId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Validate and sanitize inputs (photoId should be an integer)
    const photoIdInt = parseInt(photoId);
    if (isNaN(photoIdInt) || photoIdInt <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid photo ID' });
    }

    // Ensure limit and offset are safe integers (some MySQL versions don't support placeholders for LIMIT/OFFSET)
    const safeLimit = Math.max(1, Math.min(limit, 100)); // Cap at 100 for safety
    const safeOffset = Math.max(0, offset);

    // Use pool.query with properly validated integers for LIMIT/OFFSET
    // This avoids the "Incorrect arguments to mysqld_stmt_execute" error
    const [comments] = await pool.query(
      `SELECT 
        c.id,
        c.photo_id,
        c.user_name,
        c.text,
        c.created_at,
        COUNT(DISTINCT l.id) as likes_count
      FROM comments c
      LEFT JOIN likes l ON l.comment_id = c.id
      WHERE c.photo_id = ?
      GROUP BY c.id
      ORDER BY c.created_at ASC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [photoIdInt]
    );

    // Personalize like state only from a verified guest session.
    if (req.guest) {
      for (let comment of comments) {
        const [liked] = await pool.execute(
          'SELECT id FROM likes WHERE comment_id = ? AND user_phone = ?',
          [comment.id, req.guest.phone]
        );
        comment.liked = liked.length > 0;
      }
    } else {
      comments.forEach((comment) => {
        comment.liked = false;
      });
    }

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM comments WHERE photo_id = ?',
      [photoIdInt]
    );
    const total = countResult[0].total;

    res.json({
      success: true,
      comments: comments.map(serializeComment),
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
router.post('/', authenticateGuest, async (req, res) => {
  try {
    const { photo_id, text } = req.body;
    const normalizedUserPhone = req.guest.phone;
    const cleanText = sanitizeText(text, 1000);

    if (!photo_id || !cleanText) {
      return res.status(400).json({ 
        success: false, 
        message: 'Photo ID and text are required'
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
      [photo_id, req.guest.name || 'Guest', normalizedUserPhone, cleanText]
    );

    const commentId = result.insertId;

    // Get the created comment
    const [comments] = await pool.execute(
      `SELECT 
        id,
        photo_id,
        user_name,
        text,
        created_at
      FROM comments
      WHERE id = ?`,
      [commentId]
    );

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: serializeComment(comments[0])
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
});

// Update comment (owner only)
router.put('/:id', authenticateGuest, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const cleanText = sanitizeText(text, 1000);

    if (!cleanText) {
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
    if (comments[0].user_phone !== req.guest.phone) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this comment' });
    }

    // Update comment
    await pool.execute(
      'UPDATE comments SET text = ? WHERE id = ?',
      [cleanText, id]
    );

    res.json({ success: true, message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment', error: error.message });
  }
});

// Delete comment (owner or admin)
router.delete('/:id', authenticateGuestOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get comment
    const [comments] = await pool.execute(
      'SELECT user_phone FROM comments WHERE id = ?',
      [id]
    );

    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isOwner = req.guest && comments[0].user_phone === req.guest.phone;
    const isAdmin = req.admin && req.admin.role === 'admin';

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
