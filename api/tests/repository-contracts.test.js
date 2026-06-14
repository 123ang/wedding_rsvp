const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('API request handlers do not execute schema-changing SQL', () => {
  for (const relativePath of [
    'api/routes/photos.js',
    'api/routes/videos.js',
    'api/routes/collections.js',
  ]) {
    const source = read(relativePath);
    assert.doesNotMatch(source, /\bALTER\s+TABLE\b/i, relativePath);
    assert.doesNotMatch(source, /\bCREATE\s+TABLE\b/i, relativePath);
  }
});

test('database migration owns legacy photo video and collection schema changes', () => {
  const migration = read('database/migration_secure_guest_media.sql');

  assert.match(migration, /ALTER TABLE photos/i);
  assert.match(migration, /ALTER TABLE videos/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS collections/i);
});

test('video uploads use private storage and authenticated content delivery', () => {
  const videoRoutes = read('api/routes/videos.js');

  assert.match(videoRoutes, /PRIVATE_VIDEO_DIR/);
  assert.match(videoRoutes, /router\.get\(['"]\/:id\/content['"]/);
  assert.doesNotMatch(
    videoRoutes,
    /const\s+videoUrl\s*=\s*`\/uploads\/videos\//
  );
});

test('guest-owned mutations derive identity from authenticated guest session', () => {
  for (const relativePath of [
    'api/routes/comments.js',
    'api/routes/likes.js',
    'api/routes/collections.js',
    'api/routes/photos.js',
    'api/routes/videos.js',
  ]) {
    const source = read(relativePath);
    assert.match(source, /req\.guest\.phone/, relativePath);
  }
});

test('comment clients render text without HTML injection APIs', () => {
  const websiteSource = read('website/src/pages/GalleryPage.jsx');
  const mobileSource = read('mobile_app/App.js');

  assert.doesNotMatch(websiteSource, /dangerouslySetInnerHTML|\.innerHTML\s*=/);
  assert.doesNotMatch(mobileSource, /WebView|dangerouslySetInnerHTML|\.innerHTML\s*=/);
  assert.match(mobileSource, /\{comment\.text\}/);
});

test('mobile guest mutations rely on bearer session instead of submitted phone identity', () => {
  const mobileApi = read('mobile_app/src/services/realApi.js');

  assert.match(mobileApi, /AsyncStorage\.getItem\('guest_token'\)/);
  assert.doesNotMatch(mobileApi, /data:\s*\{\s*user_phone:\s*userPhone\s*\}/);
  assert.doesNotMatch(mobileApi, /user_phone:\s*userPhone/);
  assert.doesNotMatch(mobileApi, /params:\s*\{\s*user_phone:\s*userPhone\s*\}/);
});
