# 📋 Logging Guide - CodeNexus API

## 🚀 Quick Start

CodeNexus API uses a **simplified logging system** that logs only errors and warnings - no clutter, just what matters!

### What Gets Logged:
- ✅ **Errors**: 4xx/5xx HTTP responses, scraper failures, exceptions
- ✅ **Warnings**: Slow requests (>3s), slow operations (>5s)
- ❌ **Everything else**: Not logged

### View Logs:
```bash
# Watch live logs
tail -f logs/error-$(date +%Y-%m-%d).log

# Pretty print
tail -f logs/error-*.log | jq '.'
```

### Configuration (.env):
```bash
LOG_LEVEL=warn   # default: errors + warnings
LOG_LEVEL=error  # production: errors only
```

---

## 📁 Log Files

```
logs/
└── error-YYYY-MM-DD.log    # Errors and warnings only
```

**Retention**: 14 days, 10MB max per file, automatic daily rotation

---

## 🎨 Log Format

### Console (Development):
```
14:23:45 [error]: POST /api/leetcode - 404 (123ms) - john_doe
14:24:10 [warn]: Slow request: POST /api/fetch-all - 3542ms - john_doe
```

### File (JSON):
```json
{
  "timestamp": "2025-11-11 14:23:45",
  "level": "error",
  "message": "POST /api/leetcode - 404 (123ms) - john_doe"
}
```

---

## 💻 Using the Logger

### Import:
```javascript
const { logger } = require('./utils/logger');
```

### Log Errors:
```javascript
logger.error('Failed to fetch leetcode for user123: Network timeout');
logger.error(`Database connection failed: ${error.message}`);
```

### Log Warnings:
```javascript
logger.warn(`Slow request: POST /api/fetch-all - 3542ms - john_doe`);
logger.warn(`Slow fetch: codeforces took 6234ms for john_doe`);
```

**Note**: Most logging happens automatically via middleware!

---

## 🔧 Automatic Logging

The system automatically logs:

### Request Errors (4xx/5xx):
```
POST /api/geeksforgeeks - 400 (23ms) - anonymous
POST /api/fetch-all - 500 (1234ms) - john_doe
```

### Slow Requests (>3s):
```
Slow request: POST /api/fetch-all - 4532ms - john_doe
```

### Scraper Errors:
```
Failed to fetch leetcode for john_doe: Network timeout
Unsupported platform: invalid_platform for user john_doe
```

### Slow Scrapers (>5s):
```
Slow fetch: codeforces took 6234ms for john_doe
```

---

## 📊 Monitoring & Analysis

### Search Logs:
```bash
# Find all errors
grep "error" logs/error-*.log

# Find logs for specific user
grep "john_doe" logs/error-*.log

# Find slow operations
grep "Slow" logs/error-*.log
```

### Analyze:
```bash
# Count errors by type
grep "error" logs/error-*.log | awk -F'"message":' '{print $2}' | sort | uniq -c

# Most common errors
grep "Failed to fetch" logs/error-*.log | awk '{print $4}' | sort | uniq -c | sort -rn
```

---

## 🛠️ Custom Logging

### In a New Scraper:
```javascript
const { logger } = require('../utils/logger');

async function fetchPlatformData(username) {
  const startTime = Date.now();
  
  try {
    const data = await fetchData(username);
    const duration = Date.now() - startTime;
    
    // Log only if slow
    if (duration > 5000) {
      logger.warn(`Slow fetch: myplatform took ${duration}ms for ${username}`);
    }
    
    return data;
  } catch (error) {
    logger.error(`Failed to fetch myplatform for ${username}: ${error.message}`);
    throw error;
  }
}
```

### In a Route:
```javascript
// No manual logging needed! Middleware handles it automatically.

app.post('/my-endpoint', async (req, res) => {
  try {
    const result = await processData(req.body.username);
    res.json(result);
  } catch (error) {
    // Error will be automatically logged by middleware
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🚀 Production Setup

### .env Configuration:
```bash
NODE_ENV=production
LOG_LEVEL=error   # Production: errors only (no warnings)
```

### Monitor Disk Space:
```bash
# Check logs size
du -sh logs/

# Automatic cleanup: 14 days, 10MB per file
```

### External Monitoring:
Consider integrating with:
- **Sentry** - Error tracking & monitoring
- **Datadog** - Application monitoring  
- **New Relic** - Performance monitoring
- **Papertrail** - Simple log management

---

## 🐛 Debugging Tips

For temporary debugging, use `console.log()`:

```javascript
console.log('Debug: Request body:', req.body);
console.log('Debug: Response data:', responseData);
```

**Remember to remove after debugging!**

---

## 📈 Benefits

| Before (Verbose) | After (Simplified) |
|-----------------|-------------------|
| 7+ logs per request | 0 logs for success |
| ~40MB per day | ~1-2MB per day |
| 30 days, 20MB files | 14 days, 10MB files |
| 2 log files | 1 log file |

**~98% reduction in log volume!**

---

## 📚 Reference

### Environment Variables:
- `LOG_LEVEL` - `warn` (default) or `error`
- `NODE_ENV` - `development` or `production`

### Middleware:
```javascript
const { requestLogger, errorLogger } = require('./middleware/requestLogger');

app.use(requestLogger);  // Logs errors and slow requests
app.use(errorLogger);    // Logs unhandled errors
```

### Log Levels:
- `error` - Request errors (4xx/5xx), scraper failures, exceptions
- `warn` - Slow requests (>3s), slow operations (>5s)

---

## ✅ Summary

Your logging system is **simple and effective**:

✓ Only errors and warnings logged  
✓ Automatic via middleware  
✓ Minimal disk space  
✓ Easy to debug  
✓ Clean console output  

**Just focus on your code - logging handles itself!** 🎯

---

**Last Updated**: November 11, 2025
