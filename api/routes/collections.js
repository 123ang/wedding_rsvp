/**
 * Collections Routes
 * Allows users to save/unsave photos to their personal collection
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Ensure collections table exists
const ensureCollectionsTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS collections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      photo_id INT NOT NULL,
      user_phone VARCHAR(32) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_photo_user (photo_id, user_phone),
      KEY idx_user_phone (user_phone),
      CONSTRAINT fk_collections_photo
        FOREIGN KEY (photo_id) REFERENCES photos(id)
        ON DELETE CASCADE
    )
  `);
};

// Toggle save/unsave a photo for a user
router.post('/photo/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const { user_phone } = req.body;

    if (!user_phone) {
      return res.status(400).json({ success: false, message: 'User phone is required' });
    }

    // Ensure table exists
    await ensureCollectionsTable();

    // Ensure photo exists
    const [photos] = await pool.execute('SELECT id FROM photos WHERE id = ?', [photoId]);
    if (photos.length === 0) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Check if already saved
    const [existing] = await pool.execute(
      'SELECT id FROM collections WHERE photo_id = ? AND user_phone = ?',
      [photoId, user_phone]
    );

    if (existing.length > 0) {
      // Unsave
      await pool.execute('DELETE FROM collections WHERE photo_id = ? AND user_phone = ?', [
        photoId,
        user_phone,
      ]);

      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM collections WHERE photo_id = ?',
        [photoId]
      );

      return res.json({
        success: true,
        message: 'Photo removed from collection',
        saved: false,
        saves_count: countResult[0].count,
      });
    }

    // Save
    await pool.execute('INSERT INTO collections (photo_id, user_phone) VALUES (?, ?)', [
      photoId,
      user_phone,
    ]);

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM collections WHERE photo_id = ?',
      [photoId]
    );

    res.json({
      success: true,
      message: 'Photo saved to collection',
      saved: true,
      saves_count: countResult[0].count,
    });
  } catch (error) {
    console.error('Error toggling collection:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to update collection', error: error.message });
  }
});

// Get all saved photos for a user
router.get('/my', async (req, res) => {
  try {
    const { user_phone } = req.query;

    if (!user_phone) {
      return res.status(400).json({ success: false, message: 'User phone is required' });
    }

    await ensureCollectionsTable();

    const [rows] = await pool.execute(
      `SELECT 
        p.id,
        p.user_name,
        p.user_phone,
        p.image_url,
        p.caption,
        p.created_at
      FROM collections c
      INNER JOIN photos p ON p.id = c.photo_id
      WHERE c.user_phone = ?
      ORDER BY c.created_at DESC`,
      [user_phone]
    );

    res.json({ success: true, photos: rows });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch collections', error: error.message });
  }
});

module.exports = router;


