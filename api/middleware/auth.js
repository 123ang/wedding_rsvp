const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const {
  extractBearerToken,
  requireStrongSecret,
  verifyGuestToken,
} = require('../utils/security');

const TOKEN_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '12h';

function jwtSecret() {
  return requireStrongSecret(process.env, 'JWT_SECRET');
}

function signAdminToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      kind: 'admin',
      email: user.email,
      role: user.role || 'admin',
    },
    jwtSecret(),
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

async function findAdminById(id) {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, role FROM admin_users WHERE id = ? LIMIT 1',
      [id]
    );
    if (users.length === 0) {
      return null;
    }
    return {
      id: users[0].id,
      email: users[0].email,
      role: users[0].role || 'admin',
    };
  } catch (err) {
    if (err.code !== 'ER_BAD_FIELD_ERROR' || !String(err.sqlMessage || '').includes('role')) {
      throw err;
    }
    const [users] = await pool.execute(
      'SELECT id, email FROM admin_users WHERE id = ? LIMIT 1',
      [id]
    );
    if (users.length === 0) {
      return null;
    }
    return {
      id: users[0].id,
      email: users[0].email,
      role: 'admin',
    };
  }
}

async function loadAdminFromRequest(req) {
  const token = extractBearerToken(req.headers);
  if (!token) {
    const error = new Error('Missing bearer token');
    error.statusCode = 401;
    throw error;
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret());
  } catch (err) {
    const error = new Error('Invalid bearer token');
    error.statusCode = 401;
    throw error;
  }

  if (
    payload.kind !== 'admin' ||
    !['admin', 'photographer'].includes(payload.role) ||
    !/^\d+$/.test(String(payload.sub || ''))
  ) {
    const error = new Error('Invalid admin token');
    error.statusCode = 401;
    throw error;
  }

  const admin = await findAdminById(payload.sub);
  if (!admin) {
    const error = new Error('Admin account not found');
    error.statusCode = 401;
    throw error;
  }
  return admin;
}

async function loadOptionalAdmin(req) {
  if (!extractBearerToken(req.headers)) {
    return null;
  }
  return loadAdminFromRequest(req);
}

function loadGuestFromRequest(req) {
  const token = extractBearerToken(req.headers);
  if (!token) {
    const error = new Error('Missing bearer token');
    error.statusCode = 401;
    throw error;
  }

  try {
    return verifyGuestToken(token);
  } catch (cause) {
    const error = new Error('Invalid guest token');
    error.statusCode = 401;
    throw error;
  }
}

function attachOptionalGuest(req, res, next) {
  req.guest = null;
  const token = extractBearerToken(req.headers);
  if (token) {
    try {
      req.guest = verifyGuestToken(token);
    } catch (error) {
      // Public reads remain available for expired, invalid, or admin tokens.
    }
  }
  next();
}

async function loadActorFromRequest(req) {
  const token = extractBearerToken(req.headers);
  if (!token) {
    const error = new Error('Missing bearer token');
    error.statusCode = 401;
    throw error;
  }

  try {
    return { type: 'guest', guest: verifyGuestToken(token) };
  } catch (guestError) {
    return { type: 'admin', admin: await loadAdminFromRequest(req) };
  }
}

const authenticateAdmin = async (req, res, next) => {
  try {
    req.admin = await loadAdminFromRequest(req);
    next();
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) {
      console.error('Auth middleware error:', error);
    }
    return res.status(status).json({
      message: status === 401 ? 'Unauthorized access.' : 'Authentication error.',
      success: false,
    });
  }
};

const authenticateGuest = (req, res, next) => {
  try {
    req.guest = loadGuestFromRequest(req);
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Unauthorized access.',
      success: false,
    });
  }
};

const authenticateGuestOrAdmin = async (req, res, next) => {
  try {
    const actor = await loadActorFromRequest(req);
    req.guest = actor.guest || null;
    req.admin = actor.admin || null;
    next();
  } catch (error) {
    const status = error.statusCode || 401;
    if (status >= 500) {
      console.error('Actor authentication error:', error);
    }
    return res.status(status).json({
      message: status === 401 ? 'Unauthorized access.' : 'Authentication error.',
      success: false,
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required.',
      success: false,
    });
  }
  next();
};

const authenticateAdminOrPhotographer = authenticateAdmin;

module.exports = {
  attachOptionalGuest,
  authenticateAdmin,
  authenticateAdminOrPhotographer,
  authenticateGuest,
  authenticateGuestOrAdmin,
  loadActorFromRequest,
  loadGuestFromRequest,
  loadOptionalAdmin,
  requireAdmin,
  signAdminToken,
};
