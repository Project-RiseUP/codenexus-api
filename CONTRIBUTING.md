<div align="center">

# 🤝 Contributing to CodeNexus API

### Thank you for being here! Every contribution makes this project better. 💙

</div>

---

## 🎯 How Can You Help?

<table>
<tr>
<td width="33%" align="center">

### 🐛 Report Bugs
Found something broken?<br/>
Let us know!

</td>
<td width="33%" align="center">

### 💡 Suggest Features
Have a cool idea?<br/>
We'd love to hear it!

</td>
<td width="33%" align="center">

### 🚀 Add Platforms
Build a scraper for<br/>
a new coding platform!

</td>
</tr>
</table>

---

## 🚀 Quick Start (3 Simple Steps)

```bash
# 1️⃣ Fork & Clone
git clone https://github.com/yourusername/codenexus-api.git
cd codenexus-api && npm install

# 2️⃣ Create Your Branch
git checkout -b feature/awesome-feature

# 3️⃣ Make Changes & Push
git commit -m "Add: awesome feature"
git push origin feature/awesome-feature
```

**Then open a Pull Request!** 🎉

---

## 🛠️ Adding a New Platform

> Want to add support for HackerEarth, Atcoder, or another platform? Follow these 4 steps:

### Step 1️⃣: Create Scraper

Create `src/scrapers/yourplatform.scraper.js`:

```javascript
async function fetchYourPlatformData(username) {
  try {
    const response = await fetch(`https://platform.com/api/users/${username}`);
    const data = await response.json();
    
    return {
      platform: 'yourplatform',
      username,
      problemsSolved: {
        easy: data.easy_count,
        medium: data.medium_count,
        hard: data.hard_count
      }
    };
  } catch (error) {
    return { error: 'Failed to fetch data' };
  }
}

module.exports = { fetchYourPlatformData };
```

### Step 2️⃣: Register It

Add to `src/controllers/platformController.js`:

```javascript
const { fetchYourPlatformData } = require('../scrapers/yourplatform.scraper');

const platformFetchers = {
  leetcode: fetchLeetCodeData,
  codeforces: fetchCodeforcesData,
  yourplatform: fetchYourPlatformData, // 👈 Add this
};
```

### Step 3️⃣: Test It

```bash
curl -X POST http://localhost:5001/api/v1/platforms/yourplatform/profiles \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'
```

### Step 4️⃣: Update Docs

Update `README.md` and `docs/API_ENDPOINTS.md` with your new platform.

---

## 📝 Development Guidelines

### ✨ Code Style
- ✅ 2 spaces for indentation
- ✅ Meaningful variable names
- ✅ Comments for complex logic
- ✅ Follow existing patterns

### 💬 Commit Messages

Keep it simple:

```
Add: Support for Atcoder platform
Fix: GitHub scraper timeout
Docs: Update API documentation
Refactor: Simplify error handling
```

### ✅ Before Submitting

- [ ] Test locally with `npm run dev`
- [ ] Check all existing features still work
- [ ] Remove any `console.log` statements
- [ ] Update documentation
- [ ] Write clear commit messages

---

## 📝 Using the Logger

> Our project uses a **smart logging system** that only logs what matters - errors and warnings!

### 🚀 Quick Usage

Import the logger in your file:

```javascript
const { logger } = require('../utils/logger');
```

### When to Log

<table>
<tr>
<td width="50%">

**❌ Log Errors**
```javascript
// Scraper failures
logger.error(`Failed to fetch leetcode for ${username}: ${error.message}`);

// API errors
logger.error('Database connection failed');
```

</td>
<td width="50%">

**⚠️ Log Warnings**
```javascript
// Slow operations
logger.warn(`Slow fetch: codeforces took ${duration}ms`);

// Unusual behavior
logger.warn('Rate limit approaching for GitHub API');
```

</td>
</tr>
</table>

### 💡 Example in a Scraper

```javascript
const { logger } = require('../utils/logger');

async function fetchPlatformData(username) {
  const startTime = Date.now();
  
  try {
    const data = await fetchData(username);
    const duration = Date.now() - startTime;
    
    // Log if slow (>5 seconds)
    if (duration > 5000) {
      logger.warn(`Slow fetch: myplatform took ${duration}ms for ${username}`);
    }
    
    return data;
  } catch (error) {
    // Always log errors
    logger.error(`Failed to fetch myplatform for ${username}: ${error.message}`);
    throw error;
  }
}
```

### ✅ Good Practices

- ✅ Log errors with context (username, platform, etc.)
- ✅ Log warnings for slow operations (>5s)
- ✅ Remove `console.log()` statements before submitting
- ❌ Don't log successful operations
- ❌ Don't log every request (middleware handles this!)

### 📊 View Logs

```bash
# Watch live logs
tail -f logs/error-$(date +%Y-%m-%d).log

# Pretty print with jq
tail -f logs/error-*.log | jq '.'
```

> **Note**: Most logging happens automatically! The middleware logs errors, slow requests, and failures for you. You only need to add logging in scrapers or custom logic.

---

## 🐛 Reporting Bugs

**Found a bug?** Open an issue with:

- 📝 What happened (actual behavior)
- 🎯 What should happen (expected behavior)  
- 🔄 Steps to reproduce
- 💻 Your environment (Node version, OS)
- 📸 Screenshots (if applicable)

---

## 💡 Suggesting Features

**Have an idea?** Open an issue with:

- 🎯 What feature you want
- 🤔 Why it would be useful
- 💭 How it might work

---

## ⚡ Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/codenexus-api.git
cd codenexus-api

# Install dependencies
npm install

# Setup environment (for GitHub scraper)
echo "GITHUB_TOKEN=your_token_here" > .env

# Start development server
npm run dev
```

---

## 📋 Pull Request Checklist

Before submitting your PR:

- [ ] 🧪 Tested locally
- [ ] 📚 Documentation updated
- [ ] 🎯 One feature per PR
- [ ] 💬 Clear PR description
- [ ] 🧹 Code is clean and follows style guide
- [ ] ✅ No console.log or debug code left

---

## 🤝 Code of Conduct

**Be kind. Be respectful. Be helpful.**

We're building this together! Treat everyone with respect and patience.

---

## 🎉 Recognition

All contributors get:

- ✨ Credit in README.md
- 📝 Mention in release notes  
- 🏆 GitHub contributor badge

---

<div align="center">

### 💙 Thank You for Contributing!

Your time and effort make CodeNexus API better for everyone.

**Questions?** Open an issue or discussion anytime!

</div>

