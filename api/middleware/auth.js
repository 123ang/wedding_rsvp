// Simple session-based authentication middleware
// In production, consider using JWT tokens

const pool = require('../config/database');

const authenticateAdmin = async (req, res, next) => {
  // Check if admin session exists
  // For now, we'll use a simple check - in production use proper session management
  const adminEmail = req.headers['x-admin-email'];
  const adminId = req.headers['x-admin-id'];
  
  if (!adminEmail || !adminId) {
    return res.status(401).json({
      message: "Unauthorized access.",
      success: false
    });
  }
  
  try {
    // Get user role from database (handle case where role column doesn't exist yet)
    let query = 'SELECT id, email FROM admin_users WHERE email = ? AND id = ? LIMIT 1';
    let queryParams = [adminEmail, adminId];
    
    try {
      // Try to get role column
      const [users] = await pool.execute(
        'SELECT id, email, role FROM admin_users WHERE email = ? AND id = ? LIMIT 1',
        queryParams
      );
      
      if (users.length === 0) {
        return res.status(401).json({
          message: "Unauthorized access.",
          success: false
        });
      }
      
      // Attach admin info to request
      req.admin = {
        email: users[0].email,
        id: users[0].id,
        role: users[0].role || 'admin' // Default to admin if role is null
      };
    } catch (err) {
      // If role column doesn't exist, use fallback query
      if (err.code === 'ER_BAD_FIELD_ERROR' && err.sqlMessage.includes('role')) {
        const [users] = await pool.execute(query, queryParams);
        
        if (users.length === 0) {
          return res.status(401).json({
            message: "Unauthorized access.",
            success: false
          });
        }
        
        // Default to admin if role column doesn't exist
        req.admin = {
          email: users[0].email,
          id: users[0].id,
          role: 'admin'
        };
      } else {
        throw err; // Re-throw if it's a different error
      }
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      message: "Authentication error.",
      success: false
    });
  }
};

// Middleware to check if user is admin (not photographer)
const requireAdmin = (req, res, next) => {
  if (req.admin.role !== 'admin') {
    return res.status(403).json({
      message: "Admin access required.",
      success: false
    });
  }
  next();
};

// Middleware to allow both admin and photographer
const authenticateAdminOrPhotographer = authenticateAdmin;

module.exports = {
  authenticateAdmin,
  requireAdmin,
  authenticateAdminOrPhotographer
};

