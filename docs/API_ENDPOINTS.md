# 🚀 API Reference

**Base URL**: `http://localhost:5001`  
**Version**: `v1`  
**Format**: JSON

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/status` | System status |
| GET | `/api/v1/platforms` | List platforms |
| POST | `/api/v1/platforms/:platform/profiles` | Single platform profile |
| POST | `/api/v1/profiles/aggregate` | All platforms profile |

---

## 1. API Information

Get API metadata and available endpoints.

```http
GET /
```

**Response:**
```json
{
  "name": "CodeNexus API",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /api/v1/health",
    "status": "GET /api/v1/status",
    "platforms": "GET /api/v1/platforms",
    "singlePlatform": "POST /api/v1/platforms/:platform/profiles",
    "aggregateProfiles": "POST /api/v1/profiles/aggregate"
  },
  "supportedPlatforms": ["leetcode", "codeforces", "codechef", "geeksforgeeks", "hackerrank", "github"]
}
```

---

## 2. Health Check

Simple health check for monitoring.

```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T13:30:00.000Z",
  "uptime": 3600
}
```

---

## 3. System Status

Detailed system metrics.

```http
GET /api/v1/status
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "environment": "development",
  "platforms": {
    "supported": ["leetcode", "codeforces", "codechef", "geeksforgeeks", "hackerrank", "github"],
    "count": 6
  },
  "system": {
    "node": { "version": "v22.14.0" },
    "memory": {
      "heapUsed": "45.23 MB",
      "heapTotal": "67.89 MB"
    }
  }
}
```

---

## 4. List Platforms

Get metadata about all supported platforms.

```http
GET /api/v1/platforms
```

**Response:**
```json
{
  "success": true,
  "count": 6,
  "platforms": [
    {
      "id": "leetcode",
      "name": "LeetCode",
      "description": "Leading online programming learning platform",
      "website": "https://leetcode.com",
      "endpoint": "/api/v1/platforms/leetcode/profiles"
    }
    // ... other platforms
  ]
}
```

---

## 5. Single Platform Profile

Fetch user profile from a specific platform.

```http
POST /api/v1/platforms/:platform/profiles
```

**Path Parameters:**
- `platform`: `leetcode`, `codeforces`, `codechef`, `geeksforgeeks`, `hackerrank`, or `github`

**Request Body:**
```json
{
  "username": "john_doe"
}
```

**Example:**
```bash
curl -X POST http://localhost:5001/api/v1/platforms/leetcode/profiles \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'
```

**Success Response:**
```json
{
  "success": true,
  "platform": "leetcode",
  "username": "john_doe",
  "data": {
    "problemsSolved": {
      "easy": 150,
      "medium": 200,
      "hard": 50
    },
    "dailyProblemsSolved": {
      "2025-11-11": 3
    },
    "additionalInfo": {
      "contestRating": 1850
    }
  },
  "fetchedAt": "2025-11-11T13:30:00.000Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Unsupported platform",
  "message": "Platform 'invalid' is not supported",
  "supportedPlatforms": ["leetcode", "codeforces", "codechef", "geeksforgeeks", "hackerrank", "github"]
}
```

---

## 6. Aggregate Profiles

Fetch profiles from all platforms simultaneously.

```http
POST /api/v1/profiles/aggregate
```

**Request Body (Same username across platforms):**
```json
{
  "username": "john_doe"
}
```

**Request Body (Different usernames):**
```json
{
  "platformUsernames": {
    "leetcode": "john_leetcode",
    "github": "john_github",
    "codeforces": "john_cf"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:5001/api/v1/profiles/aggregate \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'
```

**Success Response:**
```json
{
  "success": true,
  "username": "john_doe",
  "platforms": {
    "leetcode": { /* profile data */ },
    "codeforces": { /* profile data */ },
    "github": { /* profile data */ }
  },
  "summary": {
    "totalProblems": 750,
    "platformsWithData": 5,
    "platforms": {
      "leetcode": { "status": "success", "problemsSolved": 400 },
      "codeforces": { "status": "success", "problemsSolved": 350 }
    }
  },
  "metadata": {
    "totalPlatforms": 6,
    "successfulFetches": 5,
    "failedFetches": 1
  },
  "fetchedAt": "2025-11-11T13:30:00.000Z"
}
```

---

## Supported Platforms

| Platform | ID | Website |
|----------|----|---------| 
| LeetCode | `leetcode` | https://leetcode.com |
| Codeforces | `codeforces` | https://codeforces.com |
| CodeChef | `codechef` | https://www.codechef.com |
| GeeksforGeeks | `geeksforgeeks` | https://www.geeksforgeeks.org |
| HackerRank | `hackerrank` | https://www.hackerrank.com |
| GitHub | `github` | https://github.com |

---

## Error Responses

All errors follow this structure:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (invalid endpoint) |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Recommended**: Max 60 requests/minute
- **Aggregate endpoint**: Takes 5-15 seconds (fetches 6 platforms)
- **Caching**: Implement client-side caching (profiles don't change often)

---

## Examples

### JavaScript/Fetch

```javascript
// Single platform
const response = await fetch('http://localhost:5001/api/v1/platforms/leetcode/profiles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'john_doe' })
});
const data = await response.json();
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:5001/api/v1/platforms/leetcode/profiles',
    json={'username': 'john_doe'}
)
data = response.json()
```

### cURL

```bash
# Health check
curl http://localhost:5001/api/v1/health

# List platforms
curl http://localhost:5001/api/v1/platforms

# Single platform
curl -X POST http://localhost:5001/api/v1/platforms/leetcode/profiles \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'

# All platforms
curl -X POST http://localhost:5001/api/v1/profiles/aggregate \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'
```

---

## Notes

- All responses include `success` boolean field
- Timestamps are in ISO 8601 format
- GitHub requires `GITHUB_TOKEN` in `.env`
- CodeChef may require `CODECHEF_COOKIE` for some users
