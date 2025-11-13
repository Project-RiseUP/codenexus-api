/**
 * CodeNexus API - Entry Point
 * 
 * Your connection hub for all coding platforms.
 * Unified REST API for competitive programming and development profiles.
 * 
 * Platforms supported:
 * - LeetCode, Codeforces, CodeChef, GeeksforGeeks, HackerRank, GitHub
 */

require('dotenv').config();
const app = require('./src/server');
const { logger } = require('./src/utils/logger');

const PORT = process.env.PORT || 5001;
const ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log();
  console.log('\x1b[36m%s\x1b[0m', '╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('\x1b[36m%s\x1b[0m', '║                                                                               ║');
  console.log('\x1b[36m%s\x1b[0m', '║   \x1b[1m█████╗ █████╗ ██████╗ ███████╗███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗\x1b[0m\x1b[36m   ║');
  console.log('\x1b[36m%s\x1b[0m', '║  \x1b[1m██╔═══╝██╔══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝\x1b[0m\x1b[36m   ║');
  console.log('\x1b[36m%s\x1b[0m', '║  \x1b[1m██║    ██║  ██║██║  ██║█████╗  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗\x1b[0m\x1b[36m   ║');
  console.log('\x1b[36m%s\x1b[0m', '║  \x1b[1m██║    ██║  ██║██║  ██║██╔══╝  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║\x1b[0m\x1b[36m   ║');
  console.log('\x1b[36m%s\x1b[0m', '║  \x1b[1m╚█████╗╚█████╔╝██████╔╝███████╗██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║\x1b[0m\x1b[36m   ║');
  console.log('\x1b[36m%s\x1b[0m', '║   \x1b[1m╚════╝ ╚════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝\x1b[0m\x1b[36m   ║');
  console.log('\x1b[36m%s\x1b[0m', '║                                                                               ║');
  console.log('\x1b[36m%s\x1b[0m', '║                Your Ultimate Connection Hub for Coding Platforms              ║');
  console.log('\x1b[36m%s\x1b[0m', '║                                                                               ║');
  console.log('\x1b[36m%s\x1b[0m', '╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log();
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Server: http://localhost:' + PORT);
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Environment: ' + ENV);
  console.log('\x1b[32m%s\x1b[0m', '  ✓ API Version: v1');
  console.log('\x1b[32m%s\x1b[0m', '  ✓ Logging: errors and warnings only');
  console.log();
  console.log('\x1b[33m%s\x1b[0m', 'RESTful API Endpoints:');
  console.log();
  console.log('\x1b[36m%s\x1b[0m', '  Information:');
  console.log('    • GET  /                                    - API documentation');
  console.log('    • GET  /api/v1/health                       - Health check');
  console.log('    • GET  /api/v1/status                       - System status');
  console.log();
  console.log('\x1b[36m%s\x1b[0m', '  Platforms:');
  console.log('    • GET  /api/v1/platforms                    - List all platforms');
  console.log('    • POST /api/v1/platforms/:platform/profiles - Single platform');
  console.log();
  console.log('\x1b[36m%s\x1b[0m', '  Profiles:');
  console.log('    • POST /api/v1/profiles/aggregate           - All platforms');
  console.log();
  console.log('\x1b[90m%s\x1b[0m', '  Supported: leetcode, codeforces, codechef, geeksforgeeks, hackerrank, github');
  console.log();
  console.log('\x1b[36m%s\x1b[0m', '  📚 Documentation: http://localhost:' + PORT);
  console.log();
  console.log('\x1b[90m%s\x1b[0m', '  Press Ctrl+C to stop the server');
  console.log();
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log('\n\n\x1b[33m%s\x1b[0m', `⚠ ${signal} received: Shutting down gracefully...`);

  server.close((err) => {
    if (err) {
      logger.error(`Error during server shutdown: ${err.message}`);
      process.exit(1);
    }

    console.log('\x1b[32m%s\x1b[0m', '✓ Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    console.error('⚠ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
