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

    // Normalize email (trim whitespace, convert empty string to null)
    const emailValue = email && email.trim() ? email.trim() : null;

    // Insert new RSVP
    const [result] = await pool.execute(
      `INSERT INTO rsvps (name, email, phone, attending, number_of_guests, wedding_type, relationship, remark) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, emailValue, phone, attending, number_of_guests, 'bride', relationship || null, remark || null]
    );

    res.status(201).json({
      message: "RSVP submitted successfully.",
      success: true
    });
  } catch (error) {
    console.error('Bride RSVP error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // Return more specific error for database connection issues
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection error detected');
      return res.status(503).json({
        message: "Database connection failed. Please check server configuration.",
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(503).json({
      message: "Unable to submit RSVP.",
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // Normalize email (trim whitespace, convert empty string to null)
    const emailValue = email && email.trim() ? email.trim() : null;

    // Insert new RSVP
    const [result] = await pool.execute(
      `INSERT INTO rsvps (name, email, phone, attending, number_of_guests, wedding_type, organization, relationship, remark) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, emailValue, phone, attending, number_of_guests, 'groom', organization || null, relationship || null, remark || null]
    );

    res.status(201).json({
      message: "RSVP submitted successfully.",
      success: true
    });
  } catch (error) {
    console.error('Groom RSVP error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // Return more specific error for database connection issues
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection error detected');
      return res.status(503).json({
        message: "Database connection failed. Please check server configuration.",
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(503).json({
      message: "Unable to submit RSVP.",
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Public endpoint: Get wedding info (bride or groom)
router.get('/wedding-info', async (req, res) => {
  try {
    const rawType = req.query.wedding_type || '';
    const wedding_type = rawType.toString().trim().toLowerCase();
    
    // Return wedding info based on type
    if (wedding_type === 'bride') {
      return res.json({
        groomShortName: 'JS',
        brideShortName: 'PS',
        date: '2026-01-02',
        venue: 'Fu Hotel',
        time: '18:00'
      });
    } else {
      // Default to groom wedding
      return res.json({
        groomShortName: 'JS',
        brideShortName: 'PS',
        date: '2026-01-04',
        venue: 'Starview Restaurant',
        time: '18:00'
      });
    }
  } catch (error) {
    console.error('Wedding info error:', error);
    res.status(500).json({
      message: "Unable to get wedding info.",
      success: false
    });
  }
});

// Public endpoint: Verify phone number for guest login (no auth required)
router.get('/verify-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required.",
        success: false
      });
    }

    // Normalize phone (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');

    // Search for phone in RSVPs (check both bride and groom)
    const [rsvps] = await pool.execute(
      'SELECT id, name, email, phone, wedding_type, attending, seat_table FROM rsvps WHERE phone = ? OR phone LIKE ?',
      [normalizedPhone, `%${normalizedPhone}%`]
    );

    if (rsvps.length === 0) {
      return res.status(404).json({
        message: "Phone number not found in RSVPs.",
        success: false,
        found: false
      });
    }

    // Prefer bride wedding_type if multiple records exist
    let primaryGuest = rsvps[0];
    const brideRecord = rsvps.find(r => r.wedding_type === 'bride');
    if (brideRecord) {
      primaryGuest = brideRecord;
    }

    // Return the primary match (and all matches for debugging/use if needed)
    res.json({
      message: "Phone number found.",
      success: true,
      found: true,
      guest: {
        name: primaryGuest.name,
        phone: primaryGuest.phone,
        wedding_type: primaryGuest.wedding_type
      },
      // Return all RSVPs for this phone in case they have multiple
      rsvps: rsvps.map(r => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        wedding_type: r.wedding_type,
        attending: r.attending,
        seat_table: r.seat_table
      }))
    });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      message: "Unable to verify phone number.",
      success: false
    });
  }
});

module.exports = router;

