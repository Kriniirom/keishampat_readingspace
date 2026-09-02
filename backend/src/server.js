/**
 * @file server.js
 * @description Main Express application entry point for Keishampat Reading Space API.
 * Configures middleware, security CORS rules, REST routers, and global error handling.
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const planRoutes = require('./routes/planRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) for frontend client requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express built-in middleware to parse JSON request bodies
app.use(express.json());

// Request logger middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root API welcome endpoint
app.get('/api', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Welcome to Keishampat Reading Space Backend API',
    facility: 'Keishampat Reading Space',
    location: 'Keishampat Keisham Leikai',
    timings: '5:00 AM – 11:00 PM (Everyday)',
    capacity: '18 Seats',
    price: '₹900 per month',
    contact: '+91 98634 29955',
    endpoints: {
      seats: 'GET /api/seats',
      bookings: 'POST /api/bookings',
      plans: 'GET /api/plans',
      contact: 'POST /api/contact'
    }
  });
});

// Register feature modular routers
app.use('/api', bookingRoutes);
app.use('/api', contactRoutes);
app.use('/api', planRoutes);

// 404 Route Not Found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// Global central error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.'
  });
});

// Start Express HTTP server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Keishampat Reading Space Express API Server`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`=================================================`);
});
