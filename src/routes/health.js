/**
 * Health & Status Routes
 * 
 * Professional health monitoring endpoints
 * Follows industry-standard health check patterns
 */

const express = require('express');
const router = express.Router();
const { getSupportedPlatforms } = require('../controllers/platformController');

/**
 * API Root - Information endpoint
 * GET /
 */
router.get('/', (req, res) => {
  res.json({
    name: 'CodeNexus API',
    version: require('../../package.json').version || '1.0.0',
    description: 'Your connection hub for all coding platforms. Unified REST API for competitive programming and developer profiles.',
    tagline: 'All coding platforms, one API',
    documentation: {
      swagger: '/api-docs',
      postman: '/api-docs/postman',
    },
    endpoints: {
      health: 'GET /api/v1/health',
      status: 'GET /api/v1/status',
      platforms: 'GET /api/v1/platforms',
      singlePlatform: 'POST /api/v1/platforms/:platform/profiles',
      aggregateProfiles: 'POST /api/v1/profiles/aggregate',
    },
    supportedPlatforms: getSupportedPlatforms(),
    contact: {
      github: 'https://github.com/yourusername/codenexus-api',
      docs: 'https://github.com/yourusername/codenexus-api/blob/main/README.md',
    },
  });
});

/**
 * Basic health check
 * GET /api/v1/health
 * 
 * Returns simple health status for load balancers and monitoring tools
 */
router.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

/**
 * Detailed status check
 * GET /api/v1/status
 * 
 * Returns comprehensive system status and metrics
 */
router.get('/api/v1/status', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: formatUptime(process.uptime()),
    },
    environment: process.env.NODE_ENV || 'development',
    version: require('../../package.json').version || '1.0.0',
    platforms: {
      supported: getSupportedPlatforms(),
      count: getSupportedPlatforms().length,
    },
    system: {
      node: {
        version: process.version,
      },
      memory: {
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        rss: formatBytes(memoryUsage.rss),
        external: formatBytes(memoryUsage.external),
      },
      cpu: {
        usage: process.cpuUsage(),
      },
    },
  });
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Format bytes in human-readable format
 */
function formatBytes(bytes) {
  const mb = (bytes / 1024 / 1024).toFixed(2);
  return `${mb} MB`;
}

module.exports = router;
