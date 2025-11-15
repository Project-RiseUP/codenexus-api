/**
 * Main API Router
 * 
 * Professional RESTful API structure with versioning
 * Version: v1
 * 
 * Route Structure:
 * - /                                     - API information
 * - /api/v1/health                        - Health check
 * - /api/v1/status                        - Detailed status
 * - /api/v1/platforms                     - List all platforms
 * - /api/v1/platforms/:platform/profiles  - Get profile from specific platform
 * - /api/v1/profiles/aggregate            - Get profiles from all platforms
 */
require('dotenv').config();
const express = require('express');
const router = express.Router();

// Import route modules
const healthRoutes = require('./health');
const platformRoutes = require('./platforms');
const combinedRoutes = require('./combined');

// Mount routes
router.use('/', healthRoutes);           // Health, status & root
router.use('/', platformRoutes);         // Platform-specific endpoints
router.use('/', combinedRoutes);         // Aggregate profile endpoints

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist',
    requestedEndpoint: {
      method: req.method,
      path: req.originalUrl,
    },
    availableEndpoints: {
      root: {
        method: 'GET',
        path: '/',
        description: 'API information and documentation',
      },
      health: {
        method: 'GET',
        path: '/api/v1/health',
        description: 'Basic health check',
      },
      status: {
        method: 'GET',
        path: '/api/v1/status',
        description: 'Detailed system status',
      },
      platforms: {
        method: 'GET',
        path: '/api/v1/platforms',
        description: 'List all supported platforms',
      },
      singlePlatform: {
        method: 'POST',
        path: '/api/v1/platforms/:platform/profiles',
        description: 'Fetch profile from specific platform',
        example: '/api/v1/platforms/leetcode/profiles',
      },
      aggregate: {
        method: 'POST',
        path: '/api/v1/profiles/aggregate',
        description: 'Fetch profiles from all platforms',
      },
    },
    documentation: 'See GET / for full API documentation',
  });
});

module.exports = router;
