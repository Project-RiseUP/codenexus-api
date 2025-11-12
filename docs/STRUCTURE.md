# 📁 Project Structure

## Directory Layout

```
codenexus-api/
├── src/
│   ├── routes/              # API endpoints
│   │   ├── index.js         # Main router
│   │   ├── health.js        # Health & status
│   │   ├── platforms.js     # Platform profiles
│   │   └── combined.js      # Aggregate endpoint
│   │
│   ├── controllers/         # Business logic
│   │   └── platformController.js
│   │
│   ├── scrapers/            # Platform data fetchers
│   │   ├── geeksforgeeks.scraper.js
│   │   ├── leetcode.scraper.js
│   │   ├── codechef.scraper.js
│   │   ├── codeforces.scraper.js
│   │   ├── github.scraper.js
│   │   └── hackerrank.scraper.js
│   │
│   ├── middleware/          # Express middleware
│   │   └── requestLogger.js
│   │
│   ├── utils/               # Utilities
│   │   └── logger.js        # Winston logger
│   │
│   └── server.js            # Express app config
│
├── docs/                    # Documentation
│   ├── API_ENDPOINTS.md     # API reference
│   ├── API_MIGRATION.md     # Migration guide
│   ├── LOGGING.md           # Logging guide
│   └── STRUCTURE.md         # This file
│
├── logs/                    # Log files
│   └── error-*.log          # Error logs
│
├── tests/                   # Tests
│   └── api-tests.http
│
├── index.js                 # Entry point
├── package.json             # Dependencies
├── .env                     # Environment variables
└── README.md                # Main documentation
```

## Architecture Flow

```
HTTP Request
    ↓
Middleware (requestLogger)
    ↓
Routes (health.js, platforms.js, combined.js)
    ↓
Controllers (platformController.js)
    ↓
Scrapers (leetcode.scraper.js, geeksforgeeks.scraper.js, etc.)
    ↓
HTTP Response
```

## Key Components

### Routes (`src/routes/`)
- Define API endpoints
- Handle HTTP requests/responses
- Input validation
- Response formatting

### Controllers (`src/controllers/`)
- Business logic
- Data aggregation
- Error handling
- Platform coordination

### Scrapers (`src/scrapers/`)
- Fetch data from external platforms
- Parse HTML/JSON responses
- Transform data to standard format
- Handle platform-specific logic

### Middleware (`src/middleware/`)
- Request logging (errors & slow requests only)
- Error handling
- Request timing

### Utils (`src/utils/`)
- Logger (Winston-based)
- Shared utilities

## Adding a New Platform

1. Create scraper in `src/scrapers/newplatform.scraper.js`
2. Export `fetchNewPlatformData()` function
3. Add to `platformFetchers` in `src/controllers/platformController.js`
4. Platform automatically available via API

Example:
```javascript
// src/scrapers/newplatform.scraper.js
async function fetchNewPlatformData(username) {
  // Fetch and parse data
  return {
    problemsSolved: { /* data */ },
    additionalInfo: { /* data */ }
  };
}

module.exports = { fetchNewPlatformData };
```

## Configuration

### Environment Variables (`.env`)
```bash
GITHUB_TOKEN=your_token          # Required for GitHub
CODECHEF_COOKIE=your_cookie      # Optional for CodeChef
LOG_LEVEL=warn                   # warn or error
NODE_ENV=development             # development or production
PORT=5001                        # Server port
```

## Best Practices

1. **Separation of Concerns**: Routes → Controllers → Scrapers
2. **Error Handling**: All scrapers return error in response, not throw
3. **Logging**: Only errors and warnings (>3s requests, >5s scrapers)
4. **Consistent Format**: All scrapers return same structure
5. **No Business Logic in Routes**: Keep routes thin

## Data Flow Example

```javascript
// 1. Request comes to route
POST /api/v1/platforms/leetcode/profiles
Body: { "username": "john_doe" }

// 2. Route validates and calls controller
platformController.fetchPlatformData('leetcode', 'john_doe')

// 3. Controller calls appropriate scraper
leetcodeScraper.fetchLeetCodeData('john_doe')

// 4. Scraper fetches and returns data
{ problemsSolved: {...}, additionalInfo: {...} }

// 5. Controller formats response
{ success: true, platform: "leetcode", data: {...}, fetchedAt: "..." }

// 6. Route sends response
HTTP 200 OK
```

## Performance

- **Parallel Fetching**: Aggregate endpoint fetches all platforms simultaneously
- **Minimal Logging**: Only errors/warnings to reduce I/O
- **No Caching**: Fresh data on every request (implement in your client)
- **Timeout**: 60s per request

## Error Handling

All errors are caught and returned in response:
```json
{
  "success": false,
  "error": "Failed to fetch profile",
  "message": "User not found"
}
```

Errors are also logged to `logs/error-*.log`
