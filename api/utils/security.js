const path = require('path');
const jwt = require('jsonwebtoken');

const PLACEHOLDER_SECRETS = new Set([
  'change-me',
  'change_me',
  'generate-a-strong-random-key-here',
  'replace-with-at-least-32-random-characters',
  'wedding-rsvp-secret',
]);

function isStrongSecret(secret, minLength = 32) {
  return Boolean(secret && secret.length >= minLength && !PLACEHOLDER_SECRETS.has(secret));
}

function requireStrongSecret(env = process.env, name = 'JWT_SECRET') {
  const secret = env[name] || env.ADMIN_JWT_SECRET;
  if (!isStrongSecret(secret)) {
    throw new Error(`${name} must be set to a strong random value with at least 32 characters`);
  }
  return secret;
}

function extractBearerToken(headers = {}) {
  const authorization = headers.authorization || headers.Authorization;
  if (!authorization || typeof authorization !== 'string') {
    return null;
  }
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function sanitizeText(value, maxLength = 500) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function isAllowedUpload(file, options) {
  if (!file || !options) {
    return false;
  }
  const extension = path.extname(file.originalname || '').toLowerCase();
  const mimetype = String(file.mimetype || '').toLowerCase();
  const allowedExtensions = new Set(options.allowedExtensions || []);
  const allowedMimeTypes = new Set(options.allowedMimeTypes || []);
  const size = typeof file.size === 'number' ? file.size : 0;

  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(mimetype)) {
    return false;
  }
  if (options.maxBytes && size > options.maxBytes) {
    return false;
  }
  return true;
}

function parseOriginList(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildAllowedCorsOrigins(env = process.env) {
  const isProduction = String(env.NODE_ENV || 'development').toLowerCase() === 'production';
  const configured = parseOriginList(env.CORS_ORIGINS || env.FRONTEND_URL || env.WEB_ORIGIN);

  if (isProduction) {
    if (configured.length === 0 || configured.includes('*')) {
      throw new Error('CORS_ORIGINS must list explicit HTTPS origins in production');
    }
    return [...new Set(configured)];
  }

  return [
    ...new Set([
      ...configured,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ]),
  ];
}

function normalizedPhoneSql(columnName) {
  return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${columnName}, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '')`;
}

function createGuestToken(guest, env = process.env) {
  const phone = normalizePhone(guest && guest.phone);
  if (phone.length < 7) {
    throw new Error('Guest phone is required');
  }

  return jwt.sign(
    {
      sub: `guest:${phone}`,
      kind: 'guest',
      role: 'guest',
      phone,
      name: sanitizeText(guest.name || 'Guest', 120),
      weddingType: sanitizeText(guest.weddingType || '', 20) || null,
    },
    requireStrongSecret(env, 'JWT_SECRET'),
    { expiresIn: env.GUEST_JWT_EXPIRES_IN || '30d' }
  );
}

function verifyGuestToken(token, env = process.env) {
  let payload;
  try {
    payload = jwt.verify(token, requireStrongSecret(env, 'JWT_SECRET'));
  } catch (error) {
    throw new Error('Invalid guest token');
  }

  const phone = normalizePhone(payload && payload.phone);
  if (
    !payload ||
    payload.kind !== 'guest' ||
    payload.role !== 'guest' ||
    phone.length < 7 ||
    payload.sub !== `guest:${phone}`
  ) {
    throw new Error('Invalid guest token');
  }

  return {
    phone,
    name: sanitizeText(payload.name || 'Guest', 120),
    weddingType: payload.weddingType || null,
    role: 'guest',
  };
}

module.exports = {
  buildAllowedCorsOrigins,
  createGuestToken,
  extractBearerToken,
  isAllowedUpload,
  isStrongSecret,
  normalizePhone,
  normalizedPhoneSql,
  requireStrongSecret,
  sanitizeText,
  verifyGuestToken,
};
