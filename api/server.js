require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createRateLimiter } = require('./middleware/rateLimit');
const { buildAllowedCorsOrigins, requireStrongSecret } = require('./utils/security');

const app = express();
const PORT = process.env.PORT || 3002;
const allowedCorsOrigins = buildAllowedCorsOrigins(process.env);

requireStrongSecret(process.env, 'JWT_SECRET');

const rsvpRoutes = require('./routes/rsvp');
const adminRoutes = require('./routes/admin');
const photosRoutes = require('./routes/photos');
const commentsRoutes = require('./routes/comments');
const likesRoutes = require('./routes/likes');
const collectionsRoutes = require('./routes/collections');
const videosRoutes = require('./routes/videos');
const seatsRoutes = require('./routes/seats');
const timelineRoutes = require('./routes/timeline');
const songsRoutes = require('./routes/songs');

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedCorsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const loginLimiter = createRateLimiter({
  keyPrefix: 'login',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.',
});
const phoneLookupLimiter = createRateLimiter({
  keyPrefix: 'phone-lookup',
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many phone verification attempts. Please try again later.',
});
const uploadLimiter = createRateLimiter({
  keyPrefix: 'upload',
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many upload attempts. Please try again later.',
});
const interactionLimiter = createRateLimiter({
  keyPrefix: 'interaction',
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests. Please slow down and try again later.',
});

app.use('/api/admin/login', loginLimiter);
app.use('/api/verify-phone', phoneLookupLimiter);
app.use('/api/photos/upload', uploadLimiter);
app.use('/api/photos/upload-zip', uploadLimiter);
app.use('/api/videos/upload', uploadLimiter);
app.use('/api/comments', interactionLimiter);
app.use('/api/videos', interactionLimiter);

// Serve only validated public image/audio directories. Videos use authenticated API streaming.
app.use(
  '/uploads/photos',
  express.static(path.join(__dirname, '../uploads/photos'), {
    fallthrough: false,
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);
app.use(
  '/uploads/song',
  express.static(path.join(__dirname, '../uploads/song'), {
    fallthrough: false,
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', rsvpRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/seats', seatsRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/songs', songsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Wedding RSVP API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
    success: false
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: "Internal server error.",
    success: false
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Wedding RSVP API Server`);
  console.log(`========================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`========================================\n`);
});

module.exports = app;
