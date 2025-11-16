## 🧱 Architecture & Project Structure

### Directory Layout

```text
codenexus-api/
├── src/
│   ├── routes/          # API endpoints
│   ├── controllers/     # Business logic
│   ├── scrapers/        # Platform data fetchers
│   ├── middleware/      # Express middleware
│   └── utils/           # Utilities (logger, etc.)
├── docs/                # Markdown documentation
├── logs/                # Rotating error logs
├── tests/               # HTTP/API tests
└── README.md            # Main documentation
```

### Request Flow

```text
HTTP Request
    ↓
Middleware (requestLogger)
    ↓
Routes (health, platforms, combined)
    ↓
Controllers (platformController)
    ↓
Scrapers (leetcode, github, etc.)
    ↓
HTTP Response
```

### Responsibilities

- **Routes (`src/routes/`)**
  - Define endpoints
  - Basic validation
  - Shape HTTP responses

- **Controllers (`src/controllers/`)**
  - Orchestrate scrapers
  - Aggregate and normalize data
  - Handle platform-level errors

- **Scrapers (`src/scrapers/`)**
  - Talk to external platforms (HTTP/HTML/GraphQL)
  - Parse and transform responses
  - Return a standardized schema

- **Middleware (`src/middleware/`)**
  - Log slow requests and errors
  - Centralized error handling

- **Utils (`src/utils/`)**
  - Winston-based logger
  - Shared helpers

### Data Model (High Level)

- **Problem platforms (LeetCode, Codeforces, etc.):**

```json
{
  "platform": "leetcode",
  "username": "john_doe",
  "problemsSolved": { "easy": 150, "medium": 80, "hard": 20 },
  "dailyProblemsSolved": { "2025-11-11": 3 },
  "topicWiseStats": { "dp": 40 },
  "additionalInfo": { "contestRating": 1850 },
  "error": null
}
```

- **GitHub:**

```json
{
  "platform": "github",
  "username": "octocat",
  "profile": { /* name, avatar, bio, etc. */ },
  "stats": { /* repositories, stars, contributions, activity */ },
  "badges": [ /* derived badges */ ],
  "repositories": [ /* recent repos */ ],
  "error": null
}
```


