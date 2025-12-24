const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateAdmin, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
        success: false
      });
    }

    // Get user from database (including role)
    const [users] = await pool.execute(
      'SELECT id, email, password, role FROM admin_users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid credentials.",
        success: false
      });
    }

    const user = users[0];

    // Verify password (simple comparison for demo, in production use bcrypt)
    // For now, checking against specific credentials
    if (
      (email === 'angjinsheng@gmail.com' && password === '920214') ||
      (email === 'psong32@hotmail.com' && password === '921119') ||
      (email === 'jasonang1668@gmail.com' && password === '123456')
    ) {
      res.json({
        message: "Login successful.",
        success: true,
        email: user.email,
        id: user.id,
        role: user.role || 'admin' // Default to admin if role is null
      });
    } else {
      res.status(401).json({
        message: "Invalid credentials.",
        success: false
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      message: "Login failed.",
      success: false
    });
  }
});

// Check Admin Authentication
router.get('/check-auth', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    email: req.admin.email,
    id: req.admin.id
  });
});

// Get All RSVPs (Admin Only)
router.get('/rsvps', authenticateAdmin, async (req, res) => {
  try {
    const [rsvps] = await pool.execute(
      `SELECT wedding_type as type, id, name, email, phone, attending, 
              number_of_guests, payment_amount, seat_table, created_at, organization, relationship, remark
       FROM rsvps
       ORDER BY created_at DESC`
    );

    // Format RSVPs
    const formattedRsvps = rsvps.map(rsvp => ({
      type: rsvp.type,
      id: rsvp.id,
      name: rsvp.name,
      email: rsvp.email,
      phone: rsvp.phone,
      attending: Boolean(rsvp.attending),
      number_of_guests: rsvp.number_of_guests,
      seat_table: rsvp.seat_table || '',
      payment_amount: parseFloat(rsvp.payment_amount || 0),
      organization: rsvp.organization || '',
      relationship: rsvp.relationship || '',
      remark: rsvp.remark || '',
      created_at: rsvp.created_at
    }));

    // Calculate totals
    const totalAttending = formattedRsvps.filter(r => r.attending).length;
    const totalNotAttending = formattedRsvps.filter(r => !r.attending).length;
    const totalGuests = formattedRsvps
      .filter(r => r.attending)
      .reduce((sum, r) => sum + r.number_of_guests, 0);
    const totalPayment = formattedRsvps.reduce((sum, r) => sum + r.payment_amount, 0);

    res.json({
      success: true,
      rsvps: formattedRsvps,
      summary: {
        total_rsvps: formattedRsvps.length,
        total_attending: totalAttending,
        total_not_attending: totalNotAttending,
        total_guests: totalGuests,
        total_payment: totalPayment
      }
    });
  } catch (error) {
    console.error('Get RSVPs error:', error);
    res.status(500).json({
      message: "Failed to fetch RSVPs.",
      success: false
    });
  }
});

// Update Payment Amount (Admin Only)
router.post('/update-payment', authenticateAdmin, async (req, res) => {
  try {
    const { id, payment_amount } = req.body;

    if (!id || payment_amount === undefined) {
      return res.status(400).json({
        message: "ID and payment amount are required.",
        success: false
      });
    }

    await pool.execute(
      'UPDATE rsvps SET payment_amount = ? WHERE id = ?',
      [parseFloat(payment_amount), id]
    );

    res.json({
      message: "Payment updated successfully.",
      success: true
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      message: "Unable to update payment.",
      success: false
    });
  }
});

// Update Seat Table (Admin Only)
router.post('/update-seat', authenticateAdmin, async (req, res) => {
  try {
    const { id, seat_table } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "ID is required.",
        success: false
      });
    }

    await pool.execute(
      'UPDATE rsvps SET seat_table = ? WHERE id = ?',
      [seat_table || null, id]
    );

    res.json({
      message: "Seat table updated successfully.",
      success: true
    });
  } catch (error) {
    console.error('Update seat table error:', error);
    res.status(500).json({
      message: "Unable to update seat table.",
      success: false
    });
  }
});

// Update Relationship (Admin Only)
router.post('/update-relationship', authenticateAdmin, async (req, res) => {
  try {
    const { id, relationship } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "ID is required.",
        success: false
      });
    }

    await pool.execute(
      'UPDATE rsvps SET relationship = ? WHERE id = ?',
      [relationship || null, id]
    );

    res.json({
      message: "Relationship updated successfully.",
      success: true
    });
  } catch (error) {
    console.error('Update relationship error:', error);
    res.status(500).json({
      message: "Unable to update relationship.",
      success: false
    });
  }
});

// Update Remark (Admin Only)
router.post('/update-remark', authenticateAdmin, async (req, res) => {
  try {
    const { id, remark } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "ID is required.",
        success: false
      });
    }

    await pool.execute(
      'UPDATE rsvps SET remark = ? WHERE id = ?',
      [remark || null, id]
    );

    res.json({
      message: "Remark updated successfully.",
      success: true
    });
  } catch (error) {
    console.error('Update remark error:', error);
    res.status(500).json({
      message: "Unable to update remark.",
      success: false
    });
  }
});

// Get Unique Relationships (Admin Only)
router.get('/relationships', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.execute(
      `SELECT DISTINCT relationship 
       FROM rsvps 
       WHERE relationship IS NOT NULL AND relationship != '' 
       ORDER BY relationship ASC`
    );

    const relationships = results.map(row => row.relationship).filter(Boolean);
    
    res.json({
      success: true,
      relationships
    });
  } catch (error) {
    console.error('Get relationships error:', error);
    res.status(500).json({
      message: "Failed to fetch relationships.",
      success: false
    });
  }
});

// Get All Users (Admin Only) - for managing roles
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, role, created_at FROM admin_users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role || 'admin',
        created_at: user.created_at
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: "Failed to fetch users.",
      success: false
    });
  }
});

// Update User Role (Admin Only)
router.post('/update-role', authenticateAdmin, async (req, res) => {
  try {
    const { id, role } = req.body;

    if (!id || !role) {
      return res.status(400).json({
        message: "ID and role are required.",
        success: false
      });
    }

    if (role !== 'admin' && role !== 'photographer') {
      return res.status(400).json({
        message: "Role must be 'admin' or 'photographer'.",
        success: false
      });
    }

    await pool.execute(
      'UPDATE admin_users SET role = ? WHERE id = ?',
      [role, id]
    );

    res.json({
      message: "User role updated successfully.",
      success: true
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      message: "Unable to update user role.",
      success: false
    });
  }
});

// Create New User (Admin Only)
router.post('/create-user', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
        success: false
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format.",
        success: false
      });
    }

    // Validate role
    const validRole = role === 'photographer' ? 'photographer' : 'admin';

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM admin_users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        message: "User with this email already exists.",
        success: false
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO admin_users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, validRole]
    );

    res.json({
      message: "User created successfully.",
      success: true,
      user: {
        id: result.insertId,
        email: email,
        role: validRole
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      message: "Failed to create user.",
      success: false,
      error: error.message
    });
  }
});

// Delete User (Admin Only)
router.delete('/users/:id', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.admin.id;

    // Prevent deleting yourself
    if (parseInt(id) === parseInt(currentUserId)) {
      return res.status(400).json({
        message: "You cannot delete your own account.",
        success: false
      });
    }

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, email FROM admin_users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found.",
        success: false
      });
    }

    // Delete user
    await pool.execute('DELETE FROM admin_users WHERE id = ?', [id]);

    res.json({
      message: "User deleted successfully.",
      success: true
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: "Failed to delete user.",
      success: false,
      error: error.message
    });
  }
});

// Admin Logout
router.post('/logout', (req, res) => {
  res.json({
    message: "Logged out successfully.",
    success: true
  });
});

module.exports = router;

