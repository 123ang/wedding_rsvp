// Simple session-based authentication middleware
// In production, consider using JWT tokens

const authenticateAdmin = (req, res, next) => {
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
  
  // Attach admin info to request
  req.admin = {
    email: adminEmail,
    id: adminId
  };
  
  next();
};

module.exports = {
  authenticateAdmin
};

