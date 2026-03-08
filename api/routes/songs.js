const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const SONG_DIR = path.join(UPLOADS_ROOT, 'song');
const ALLOWED_EXT = ['.mp3', '.m4a', '.ogg', '.wav'];

/**
 * GET /api/songs
 * Returns list of song URLs in uploads/song (alphabetically).
 * Add or remove files in uploads/song on the server; no code change needed.
 */
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(SONG_DIR)) {
      return res.json({ songs: [] });
    }
    const names = fs.readdirSync(SONG_DIR);
    const songs = names
      .filter((name) => {
        const ext = path.extname(name).toLowerCase();
        return ALLOWED_EXT.includes(ext);
      })
      .sort()
      .map((name) => `/uploads/song/${encodeURIComponent(name)}`);
    res.json({ songs });
  } catch (err) {
    console.error('Error listing songs:', err);
    res.status(500).json({ success: false, message: 'Failed to list songs', songs: [] });
  }
});

module.exports = router;
