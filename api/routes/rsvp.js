const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Submit Bride RSVP
router.post('/bride-rsvp', async (req, res) => {
  try {
    const { name, email, phone, attending, number_of_guests, relationship, remark } = req.body;

    // Validate required fields
    if (!name || !phone || attending === undefined || !number_of_guests) {
      return res.status(400).json({
        message: "Unable to submit RSVP. Data is incomplete.",
        success: false
      });
    }

    // Check if phone already exists for bride wedding
    const [existing] = await pool.execute(
      'SELECT id FROM rsvps WHERE phone = ? AND wedding_type = ?',
      [phone, 'bride']
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "This phone number has already submitted an RSVP for the bride's wedding.",
        success: false
      });
    }

    // Insert new RSVP
    const [result] = await pool.execute(
      `INSERT INTO rsvps (name, email, phone, attending, number_of_guests, wedding_type, relationship, remark) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email || null, phone, attending, number_of_guests, 'bride', relationship || null, remark || null]
    );

    res.status(201).json({
      message: "RSVP submitted successfully.",
      success: true
    });
  } catch (error) {
    console.error('Bride RSVP error:', error);
    res.status(503).json({
      message: "Unable to submit RSVP.",
      success: false
    });
  }
});

// Submit Groom RSVP
router.post('/groom-rsvp', async (req, res) => {
  try {
    const { name, email, phone, attending, number_of_guests, organization, relationship, remark } = req.body;

    // Validate required fields
    if (!name || !phone || attending === undefined || !number_of_guests) {
      return res.status(400).json({
        message: "Unable to submit RSVP. Data is incomplete.",
        success: false
      });
    }

    // Check if phone already exists for groom wedding
    const [existing] = await pool.execute(
      'SELECT id FROM rsvps WHERE phone = ? AND wedding_type = ?',
      [phone, 'groom']
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "This phone number has already submitted an RSVP for the groom's wedding.",
        success: false
      });
    }

    // Insert new RSVP
    const [result] = await pool.execute(
      `INSERT INTO rsvps (name, email, phone, attending, number_of_guests, wedding_type, organization, relationship, remark) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email || null, phone, attending, number_of_guests, 'groom', organization || null, relationship || null, remark || null]
    );

    res.status(201).json({
      message: "RSVP submitted successfully.",
      success: true
    });
  } catch (error) {
    console.error('Groom RSVP error:', error);
    res.status(503).json({
      message: "Unable to submit RSVP.",
      success: false
    });
  }
});

module.exports = router;

