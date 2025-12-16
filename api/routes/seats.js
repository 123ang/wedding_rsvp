/**
 * Seats Routes
 * Handles seat management
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Get all seats
router.get('/', async (req, res) => {
  try {
    const [seats] = await pool.execute(
      `SELECT 
        id,
        table_number,
        seat_number,
        guest_name,
        guest_phone,
        rsvp_id,
        status,
        created_at
      FROM seats
      ORDER BY table_number ASC, seat_number ASC`
    );

    res.json({ success: true, seats });
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seats', error: error.message });
  }
});

// Get seat by guest phone
router.get('/my-seat/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    const [seats] = await pool.execute(
      `SELECT 
        id,
        table_number,
        seat_number,
        guest_name,
        guest_phone,
        status
      FROM seats
      WHERE guest_phone = ?`,
      [phone]
    );

    if (seats.length === 0) {
      return res.status(404).json({ success: false, message: 'No seat assigned yet' });
    }

    res.json({ success: true, seat: seats[0] });
  } catch (error) {
    console.error('Error fetching seat:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seat', error: error.message });
  }
});

// Assign seat (admin only)
router.post('/assign', authenticateAdmin, async (req, res) => {
  try {
    const { table_number, seat_number, guest_name, guest_phone, rsvp_id } = req.body;

    if (!table_number || !seat_number) {
      return res.status(400).json({ success: false, message: 'Table and seat numbers are required' });
    }

    // Check if seat exists
    const [existing] = await pool.execute(
      'SELECT id, status FROM seats WHERE table_number = ? AND seat_number = ?',
      [table_number, seat_number]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Seat not found' });
    }

    // Update seat
    await pool.execute(
      `UPDATE seats 
      SET guest_name = ?, guest_phone = ?, rsvp_id = ?, status = 'occupied'
      WHERE table_number = ? AND seat_number = ?`,
      [guest_name || null, guest_phone || null, rsvp_id || null, table_number, seat_number]
    );

    res.json({ success: true, message: 'Seat assigned successfully' });
  } catch (error) {
    console.error('Error assigning seat:', error);
    res.status(500).json({ success: false, message: 'Failed to assign seat', error: error.message });
  }
});

// Update seat (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { guest_name, guest_phone, rsvp_id, status } = req.body;

    const [seats] = await pool.execute('SELECT id FROM seats WHERE id = ?', [id]);
    if (seats.length === 0) {
      return res.status(404).json({ success: false, message: 'Seat not found' });
    }

    await pool.execute(
      `UPDATE seats 
      SET guest_name = ?, guest_phone = ?, rsvp_id = ?, status = ?
      WHERE id = ?`,
      [guest_name || null, guest_phone || null, rsvp_id || null, status || 'empty', id]
    );

    res.json({ success: true, message: 'Seat updated successfully' });
  } catch (error) {
    console.error('Error updating seat:', error);
    res.status(500).json({ success: false, message: 'Failed to update seat', error: error.message });
  }
});

// Clear seat (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [seats] = await pool.execute('SELECT id FROM seats WHERE id = ?', [id]);
    if (seats.length === 0) {
      return res.status(404).json({ success: false, message: 'Seat not found' });
    }

    await pool.execute(
      `UPDATE seats 
      SET guest_name = NULL, guest_phone = NULL, rsvp_id = NULL, status = 'empty'
      WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: 'Seat cleared successfully' });
  } catch (error) {
    console.error('Error clearing seat:', error);
    res.status(500).json({ success: false, message: 'Failed to clear seat', error: error.message });
  }
});

module.exports = router;

