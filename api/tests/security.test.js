const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildAllowedCorsOrigins,
  createGuestToken,
  extractBearerToken,
  isAllowedUpload,
  isStrongSecret,
  normalizePhone,
  sanitizeText,
  verifyGuestToken,
} = require('../utils/security');

test('extractBearerToken accepts only Authorization Bearer tokens', () => {
  assert.equal(extractBearerToken({ authorization: 'Bearer abc.def.ghi' }), 'abc.def.ghi');
  assert.equal(extractBearerToken({ authorization: 'Basic abc' }), null);
  assert.equal(extractBearerToken({ 'x-admin-email': 'admin@example.com', 'x-admin-id': '1' }), null);
});

test('isStrongSecret rejects missing short and placeholder JWT secrets', () => {
  assert.equal(isStrongSecret(''), false);
  assert.equal(isStrongSecret('change-me'), false);
  assert.equal(isStrongSecret('x'.repeat(31)), false);
  assert.equal(isStrongSecret('x'.repeat(32)), true);
});

test('normalizePhone removes formatting without enabling partial matching', () => {
  assert.equal(normalizePhone('+60 12-345 6789'), '60123456789');
  assert.equal(normalizePhone('abc'), '');
});

test('sanitizeText removes dangerous HTML characters and caps length', () => {
  assert.equal(sanitizeText('<script>alert(1)</script>', 30), 'scriptalert(1)/script');
  assert.equal(sanitizeText('a'.repeat(25), 10), 'a'.repeat(10));
});

test('isAllowedUpload requires allowed mime extension and max size', () => {
  assert.equal(
    isAllowedUpload(
      { originalname: 'clip.mp4', mimetype: 'video/mp4', size: 10 * 1024 * 1024 },
      { allowedExtensions: ['.mp4'], allowedMimeTypes: ['video/mp4'], maxBytes: 50 * 1024 * 1024 }
    ),
    true
  );
  assert.equal(
    isAllowedUpload(
      { originalname: 'clip.svg', mimetype: 'image/svg+xml', size: 10 },
      { allowedExtensions: ['.mp4'], allowedMimeTypes: ['video/mp4'], maxBytes: 50 * 1024 * 1024 }
    ),
    false
  );
  assert.equal(
    isAllowedUpload(
      { originalname: 'clip.mp4', mimetype: 'video/mp4', size: 100 * 1024 * 1024 },
      { allowedExtensions: ['.mp4'], allowedMimeTypes: ['video/mp4'], maxBytes: 50 * 1024 * 1024 }
    ),
    false
  );
});

test('buildAllowedCorsOrigins rejects wildcard production CORS', () => {
  assert.deepEqual(
    buildAllowedCorsOrigins({ NODE_ENV: 'production', CORS_ORIGINS: 'https://wedding.example.com, https://admin.example.com' }),
    ['https://wedding.example.com', 'https://admin.example.com']
  );
  assert.throws(
    () => buildAllowedCorsOrigins({ NODE_ENV: 'production', CORS_ORIGINS: '*' }),
    /CORS_ORIGINS/
  );
});

test('guest tokens bind a normalized phone to a signed guest identity', () => {
  const env = { JWT_SECRET: 'x'.repeat(48) };
  const token = createGuestToken(
    {
      phone: '+60 12-345 6789',
      name: 'Guest Name',
      weddingType: 'bride',
    },
    env
  );

  const guest = verifyGuestToken(token, env);

  assert.equal(guest.phone, '60123456789');
  assert.equal(guest.name, 'Guest Name');
  assert.equal(guest.weddingType, 'bride');
  assert.equal(guest.role, 'guest');
});

test('guest token verification rejects admin-shaped and tampered tokens', () => {
  const env = { JWT_SECRET: 'x'.repeat(48) };
  const adminLikeToken = require('jsonwebtoken').sign(
    { sub: '1', role: 'admin', email: 'admin@example.com' },
    env.JWT_SECRET
  );
  const validToken = createGuestToken(
    { phone: '60123456789', name: 'Guest', weddingType: 'groom' },
    env
  );

  assert.throws(() => verifyGuestToken(adminLikeToken, env), /guest token/i);
  assert.throws(
    () => verifyGuestToken(`${validToken.slice(0, -1)}x`, env),
    /guest token/i
  );
});
