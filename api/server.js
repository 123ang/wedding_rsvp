require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rsvpRoutes = require('./routes/rsvp');
const adminRoutes = require('./routes/admin');
const photosRoutes = require('./routes/photos');
const commentsRoutes = require('./routes/comments');
const likesRoutes = require('./routes/likes');
const collectionsRoutes = require('./routes/collections');
const videosRoutes = require('./routes/videos');
const seatsRoutes = require('./routes/seats');
const timelineRoutes = require('./routes/timeline');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

