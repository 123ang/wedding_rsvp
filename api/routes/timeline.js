/**
 * Timeline Routes
 * Handles wedding timeline/schedule events
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Get all timeline events
router.get('/', async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT 
        id,
        time,
        title,
        description,
        location,
        icon,
        event_order,
        created_at
      FROM timeline_events
      ORDER BY event_order ASC, time ASC`
    );

    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timeline events', error: error.message });
  }
});

// Get single timeline event
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [events] = await pool.execute(
      `SELECT 
        id,
        time,
        title,
        description,
        location,
        icon,
        event_order,
        created_at
      FROM timeline_events
      WHERE id = ?`,
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Timeline event not found' });
    }

    res.json({ success: true, event: events[0] });
  } catch (error) {
    console.error('Error fetching timeline event:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timeline event', error: error.message });
  }
});

// Create timeline event (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { time, title, description, location, icon, event_order } = req.body;

    if (!time || !title) {
      return res.status(400).json({ success: false, message: 'Time and title are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO timeline_events (time, title, description, location, icon, event_order) VALUES (?, ?, ?, ?, ?, ?)',
      [time, title, description || null, location || null, icon || null, event_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Timeline event created successfully',
      event: {
        id: result.insertId,
        time,
        title,
        description,
        location,
        icon,
        event_order
      }
    });
  } catch (error) {
    console.error('Error creating timeline event:', error);
    res.status(500).json({ success: false, message: 'Failed to create timeline event', error: error.message });
  }
});

// Update timeline event (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { time, title, description, location, icon, event_order } = req.body;

    const [events] = await pool.execute('SELECT id FROM timeline_events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Timeline event not found' });
    }

    await pool.execute(
      `UPDATE timeline_events 
      SET time = ?, title = ?, description = ?, location = ?, icon = ?, event_order = ?
      WHERE id = ?`,
      [time, title, description, location, icon, event_order, id]
    );

    res.json({ success: true, message: 'Timeline event updated successfully' });
  } catch (error) {
    console.error('Error updating timeline event:', error);
    res.status(500).json({ success: false, message: 'Failed to update timeline event', error: error.message });
  }
});

// Delete timeline event (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [events] = await pool.execute('SELECT id FROM timeline_events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Timeline event not found' });
    }

    await pool.execute('DELETE FROM timeline_events WHERE id = ?', [id]);

    res.json({ success: true, message: 'Timeline event deleted successfully' });
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    res.status(500).json({ success: false, message: 'Failed to delete timeline event', error: error.message });
  }
});

module.exports = router;

