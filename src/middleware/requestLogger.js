/**
 * Simplified Request Logging Middleware
 * 
 * Logs only errors and slow requests
 */

const { logger } = require('../utils/logger');

/**
 * Simple request logger - logs only errors and slow requests (>3s)
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, originalUrl } = req;
  const username = req.body?.username || 'anonymous';

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log errors (status >= 400)
    if (res.statusCode >= 400) {
      logger.error(`${method} ${originalUrl} - ${res.statusCode} (${duration}ms) - ${username}`);
    }
    // Log slow requests (>3s)
    else if (duration > 3000) {
      logger.warn(`Slow request: ${method} ${originalUrl} - ${duration}ms - ${username}`);
    }
  });

  next();
};

/**
 * Error logging middleware
 */
const errorLogger = (err, req, res, next) => {
  logger.error(`Unhandled error: ${req.method} ${req.originalUrl} - ${err.message}`);
  next(err);
};

module.exports = {
  requestLogger,
  errorLogger,
};

