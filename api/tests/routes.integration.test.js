const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

process.env.JWT_SECRET = 'integration-test-secret-that-is-longer-than-32-characters';

const databasePath = require.resolve('../config/database');
const authPath = require.resolve('../middleware/auth');
const adminPath = require.resolve('../routes/admin');
const commentsPath = require.resolve('../routes/comments');
const likesPath = require.resolve('../routes/likes');
const photosPath = require.resolve('../routes/photos');
const rsvpPath = require.resolve('../routes/rsvp');
const videosPath = require.resolve('../routes/videos');

const calls = [];
let databaseHandler = async () => [[], []];

const fakePool = {
  execute(sql, params = []) {
    calls.push({ method: 'execute', sql, params });
    return databaseHandler(sql, params, 'execute');
  },
  query(sql, params = []) {
    calls.push({ method: 'query', sql, params });
    return databaseHandler(sql, params, 'query');
  },
};

require.cache[databasePath] = {
  id: databasePath,
  filename: databasePath,
  loaded: true,
  exports: fakePool,
};

for (const modulePath of [
  authPath,
  adminPath,
  commentsPath,
  likesPath,
  photosPath,
  rsvpPath,
  videosPath,
]) {
  delete require.cache[modulePath];
}

const { createGuestToken } = require('../utils/security');
const { signAdminToken } = require('../middleware/auth');
const adminRouter = require('../routes/admin');
const commentsRouter = require('../routes/comments');
const likesRouter = require('../routes/likes');
const photosRouter = require('../routes/photos');
const rsvpRouter = require('../routes/rsvp');
const videosRouter = require('../routes/videos');

const app = express();
app.use(express.json());
app.use('/admin', adminRouter);
app.use('/comments', commentsRouter);
app.use('/likes', likesRouter);
app.use('/photos', photosRouter);
app.use('/', rsvpRouter);
app.use('/videos', videosRouter);

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test.beforeEach(() => {
  calls.length = 0;
  databaseHandler = async () => [[], []];
});

function guestToken(phone = '60123456789', name = 'Verified Guest') {
  return createGuestToken({ phone, name, weddingType: 'groom' });
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

test('comment creation requires a guest session and ignores submitted identity', async () => {
  const unauthorized = await request('/comments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ photo_id: 7, text: 'Hello' }),
  });
  assert.equal(unauthorized.response.status, 401);
  assert.equal(calls.length, 0);

  let insertParams;
  databaseHandler = async (sql, params) => {
    if (sql.includes('SELECT id FROM photos')) return [[{ id: 7 }], []];
    if (sql.includes('INSERT INTO comments')) {
      insertParams = params;
      return [{ insertId: 42 }, []];
    }
    if (sql.includes('FROM comments') && sql.includes('WHERE id = ?')) {
      return [[{
        id: 42,
        photo_id: 7,
        user_name: 'Verified Guest',
        text: 'Hello',
        created_at: new Date().toISOString(),
      }], []];
    }
    return [[], []];
  };

  const created = await request('/comments', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${guestToken()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      photo_id: 7,
      text: '<b>Hello</b>',
      user_name: 'Impersonated Name',
      user_phone: '60999999999',
    }),
  });

  assert.equal(created.response.status, 201);
  assert.deepEqual(insertParams, [7, 'Verified Guest', '60123456789', 'bHello/b']);
  assert.equal(Object.hasOwn(created.body.comment, 'user_phone'), false);
});

test('guest tokens cannot access admin role changes', async () => {
  const result = await request('/admin/update-role', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${guestToken()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ id: 1, role: 'admin' }),
  });

  assert.equal(result.response.status, 401);
  assert.equal(calls.length, 0);
});

test('role changes require a current database-backed admin role', async () => {
  databaseHandler = async (sql, params) => {
    if (sql.includes('SELECT id, email, role FROM admin_users')) {
      const role = String(params[0]) === '1' ? 'admin' : 'photographer';
      return [[{
        id: Number(params[0]),
        email: `${role}@example.com`,
        role,
      }], []];
    }
    if (sql.includes('UPDATE admin_users SET role')) {
      return [{ affectedRows: 1 }, []];
    }
    return [[], []];
  };

  const photographer = await request('/admin/update-role', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${signAdminToken({
        id: 2,
        email: 'photographer@example.com',
        role: 'photographer',
      })}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ id: 3, role: 'admin' }),
  });
  assert.equal(photographer.response.status, 403);
  assert.equal(
    calls.some(({ sql }) => sql.includes('UPDATE admin_users SET role')),
    false
  );

  calls.length = 0;
  const admin = await request('/admin/update-role', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${signAdminToken({
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
      })}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ id: 3, role: 'photographer' }),
  });
  assert.equal(admin.response.status, 200);
  assert.equal(
    calls.some(({ sql }) => sql.includes('UPDATE admin_users SET role')),
    true
  );
});

test('photo and video uploads reject unauthenticated requests before file handling', async () => {
  const photo = await request('/photos/upload', { method: 'POST' });
  assert.equal(photo.response.status, 401);

  const video = await request('/videos/upload', { method: 'POST' });
  assert.equal(video.response.status, 401);
  assert.equal(calls.length, 0);
});

test('phone verification performs exact normalized lookup and returns minimal guest data', async () => {
  let lookupParams;
  databaseHandler = async (sql, params) => {
    if (sql.includes('FROM rsvps')) {
      lookupParams = params;
      return [[{
        name: 'Verified Guest',
        wedding_type: 'groom',
        attending: 1,
        seat_table: 'A3',
        phone: '60123456789',
        email: 'private@example.com',
      }], []];
    }
    return [[], []];
  };

  const result = await request('/verify-phone/+60%2012-345%206789');

  assert.equal(result.response.status, 200);
  assert.deepEqual(lookupParams, ['60123456789']);
  assert.equal(result.body.guest.name, 'Verified Guest');
  assert.equal(Object.hasOwn(result.body.guest, 'phone'), false);
  assert.equal(Object.hasOwn(result.body.guest, 'email'), false);
  assert.equal(typeof result.body.token, 'string');
});

test('comment reads use the signed guest for liked state and omit phone numbers', async () => {
  let likedLookupParams;
  databaseHandler = async (sql, params, method) => {
    if (method === 'query' && sql.includes('FROM comments c')) {
      return [[{
        id: 5,
        photo_id: 7,
        user_name: 'Guest',
        user_phone: '60111111111',
        text: 'Nice photo',
        likes_count: 1,
      }], []];
    }
    if (sql.includes('SELECT id FROM likes WHERE comment_id')) {
      likedLookupParams = params;
      return [[{ id: 9 }], []];
    }
    if (sql.includes('SELECT COUNT(*) as total FROM comments')) {
      return [[{ total: 1 }], []];
    }
    return [[], []];
  };

  const result = await request('/comments/photo/7?user_phone=60999999999', {
    headers: { authorization: `Bearer ${guestToken()}` },
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.body.comments[0].liked, true);
  assert.equal(Object.hasOwn(result.body.comments[0], 'user_phone'), false);
  assert.deepEqual(likedLookupParams, [5, '60123456789']);
});

test('public media and like summaries do not disclose guest phone numbers', async () => {
  databaseHandler = async (sql) => {
    if (sql.includes('FROM videos')) {
      return [[{
        id: 3,
        title: 'Highlights',
        user_phone: '60111111111',
        video_url: 'private:clip.mp4',
      }], []];
    }
    if (sql.includes('COUNT(*) as count FROM likes WHERE photo_id')) {
      return [[{ count: 2 }], []];
    }
    return [[], []];
  };

  const videos = await request('/videos');
  assert.equal(videos.response.status, 200);
  assert.equal(Object.hasOwn(videos.body.videos[0], 'user_phone'), false);

  const likes = await request('/likes/photo/3');
  assert.equal(likes.response.status, 200);
  assert.equal(likes.body.count, 2);
  assert.equal(Object.hasOwn(likes.body, 'likes'), false);
});

test('photo reads use the signed guest for liked state and omit owner phone numbers', async () => {
  let likedLookupParams;
  databaseHandler = async (sql, params, method) => {
    if (method === 'query' && sql.includes('FROM photos p')) {
      return [[{
        id: 8,
        user_name: 'Guest',
        user_phone: '60111111111',
        image_url: '/uploads/photos/example.jpg',
        likes_count: 1,
        comments_count: 0,
      }], []];
    }
    if (sql.includes('FROM tags t')) return [[], []];
    if (sql.includes('SELECT id FROM likes WHERE photo_id')) {
      likedLookupParams = params;
      return [[{ id: 2 }], []];
    }
    if (sql.includes('SELECT COUNT(*) as total FROM photos')) {
      return [[{ total: 1 }], []];
    }
    return [[], []];
  };

  const result = await request('/photos?user_phone=60999999999', {
    headers: { authorization: `Bearer ${guestToken()}` },
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.body.photos[0].liked, true);
  assert.equal(Object.hasOwn(result.body.photos[0], 'user_phone'), false);
  assert.deepEqual(likedLookupParams, [8, '60123456789']);
});

test('private video content requires authentication', async () => {
  const result = await request('/videos/3/content');
  assert.equal(result.response.status, 401);
  assert.equal(calls.length, 0);
});

test('video deletion uses token ownership rather than a submitted phone', async () => {
  databaseHandler = async (sql) => {
    if (sql.includes('SELECT user_phone, video_url FROM videos')) {
      return [[{
        user_phone: '60123456789',
        video_url: 'https://cdn.example.com/video.mp4',
      }], []];
    }
    if (sql.includes('DELETE FROM videos')) return [{ affectedRows: 1 }, []];
    return [[], []];
  };

  const denied = await request('/videos/9', {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${guestToken('60122222222', 'Other Guest')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ user_phone: '60123456789' }),
  });
  assert.equal(denied.response.status, 403);

  calls.length = 0;
  const deleted = await request('/videos/9', {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${guestToken()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ user_phone: '60999999999' }),
  });
  assert.equal(deleted.response.status, 200);
  assert.equal(calls.some(({ sql }) => sql.includes('DELETE FROM videos')), true);
});
