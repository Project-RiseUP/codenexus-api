## 📖 API Reference

**Base URL**: `http://localhost:5001`  
**Version**: `v1`  
**Format**: JSON

### 🔹 Overview

| Method | Endpoint                                   | Description                |
|--------|--------------------------------------------|----------------------------|
| GET    | `/`                                        | API info                   |
| GET    | `/api/v1/health`                           | Health check               |
| GET    | `/api/v1/status`                           | System status              |
| GET    | `/api/v1/platforms`                        | List supported platforms   |
| POST   | `/api/v1/platforms/:platform/profiles`     | Single platform profile    |
| POST   | `/api/v1/profiles/aggregate`               | All platforms in one call  |

### 🔍 Health

```http
GET /api/v1/health
```

Sample response:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T13:30:00.000Z",
  "uptime": 3600
}
```

### 👤 Single Platform Profile

```http
POST /api/v1/platforms/:platform/profiles
```

**Path parameter:**

- `platform` ∈ `["leetcode","codeforces","codechef","geeksforgeeks","hackerrank","github"]`

**Body:**

```json
{ "username": "john_doe" }
```

### 🌐 Aggregate Profiles

```http
POST /api/v1/profiles/aggregate
```

**Body (same username everywhere):**

```json
{ "username": "john_doe" }
```

**Body (per-platform usernames):**

```json
{
  "platformUsernames": {
    "leetcode": "john_leetcode",
    "github": "john_github",
    "codeforces": "john_cf"
  }
}
```

Response includes:

- `platforms` — per-platform data or error
- `summary` — high-level aggregation info
- `metadata` — number of successful/failed fetches

### ❗ Error Format

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common status codes: `200, 400, 404, 500`.


