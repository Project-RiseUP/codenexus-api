## 📋 Logging

CodeNexus uses a **minimal, production-focused logging system** based on Winston.

### What Gets Logged

- **Errors**:
  - 4xx/5xx responses
  - Scraper failures and exceptions
- **Warnings**:
  - Slow requests > 3s
  - Slow scrapers > 5s
- **Not logged**: normal successful requests

### Log Files

- Directory: `logs/`
- File pattern: `error-YYYY-MM-DD.log`
- Retention: 14 days
- Max size: 10 MB per file

### Configuration

```env
LOG_LEVEL=warn   # warn (errors + warnings) or error (errors only)
NODE_ENV=production
```

### Using the Logger

```javascript
const { logger } = require('../src/utils/logger');

logger.error('Failed to fetch leetcode for john_doe: Network timeout');
logger.warn('Slow fetch: codeforces took 6234ms for john_doe');
```

Most of the important logging is already handled by:

- `requestLogger` middleware (slow requests + HTTP errors)
- Error handling layer


