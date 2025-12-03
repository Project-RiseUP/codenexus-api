/**
 * Express Server Configuration
 * 
 * Sets up the Express application with:
 * - Middleware (JSON parsing, CORS, logging)
 * - Routes (imported from routes directory)
 * - Error handling
 */
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { logger } = require("./utils/logger");
const { requestLogger, errorLogger } = require("./middleware/requestLogger");

// Import routes
const routes = require("./routes");

// Initialize Express app
const app = express();

// ==========================================
// MIDDLEWARE SETUP
// ==========================================

// CORS - Enable cross-origin requests
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser - Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (logs only errors and slow requests)
app.use(requestLogger);

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(60000); // 60 seconds timeout
  res.setTimeout(60000);
  next();
});

// ==========================================
// ROUTES
// ==========================================

// Mount all application routes
app.use('/', routes);

// ==========================================
// ERROR HANDLING
// ==========================================

// Error logging middleware (must be after all routes)
app.use(errorLogger);

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${req.method} ${req.originalUrl} - ${err.message}`);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Export app for use in index.js
module.exports = app;
