## ➕ Adding a New Platform

This project is designed so adding new platforms is straightforward.

### 1️⃣ Create a Scraper

Create `src/scrapers/<platform>.scraper.js`:

```javascript
// src/scrapers/myplatform.scraper.js
async function fetchMyPlatformData(username) {
  // Fetch and parse data from the platform
  return {
    problemsSolved: { /* ... */ },
    dailyProblemsSolved: { /* ... */ },
    recentProblemsByDay: { /* ... */ },
    topicWiseStats: { /* ... */ },
    additionalInfo: { /* ... */ },
    error: null
  };
}

module.exports = { fetchMyPlatformData };
```

For GitHub-like platforms, you may return a more profile-oriented schema.

### 2️⃣ Wire It into the Controller

Update `src/controllers/platformController.js`:

- Import your scraper
- Add it to `platformFetchers`

```javascript
const { fetchMyPlatformData } = require('../scrapers/myplatform.scraper');

const platformFetchers = {
  // ... existing platforms ...
  myplatform: fetchMyPlatformData,
};
```

It will automatically be available via:

```http
POST /api/v1/platforms/myplatform/profiles
```

### 3️⃣ Keep the Schema Consistent

For problem-solving platforms, try to return:

- `problemsSolved`
- `dailyProblemsSolved`
- `recentProblemsByDay`
- `topicWiseStats`
- `additionalInfo`
- `error` (if something goes wrong)

### 4️⃣ Logging & Errors

- Use `logger.error()` for failures
- Do **not** spam logs; only log real issues and slow calls
- Return error info in the response body instead of throwing where possible


