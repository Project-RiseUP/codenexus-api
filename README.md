<div align="center">

# 🔗 CodeNexus API

### Your Connection Hub for All Coding Platforms

**Unified REST API for competitive programming and developer profiles**

[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()

</div>

---

## ✨ Why CodeNexus API?

<div align="center">

🌐 **One API, 6 Platforms** • ⚡ **Real-time Data** • 📊 **Unified Format**

🔄 **RESTful & Versioned** • 🎯 **Easy to Use** • 🆓 **Free & Open Source**

📖 **Well Documented** • 🤝 **Community Driven**

</div>

---

## 🚀 Quick Start (3 Simple Steps)

### Step 1️⃣: Install

```bash
git clone https://github.com/yourusername/codenexus-api.git
cd codenexus-api
npm install
```

### Step 2️⃣: Configure

Create a `.env` file:

```env
GITHUB_TOKEN=your_github_token_here
```

> **Get GitHub Token**: [Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) (needs `read:user` scope)

### Step 3️⃣: Run

```bash
npm start
```

**Server starts at `http://localhost:5001`** 🎉

---

## 🌐 Supported Platforms

<div align="center">

| <img src="https://img.shields.io/badge/LeetCode-FFA116?style=for-the-badge&logo=leetcode&logoColor=white" alt="LeetCode"/> | <img src="https://img.shields.io/badge/Codeforces-1F8ACB?style=for-the-badge&logo=codeforces&logoColor=white" alt="Codeforces"/> | <img src="https://img.shields.io/badge/CodeChef-5B4638?style=for-the-badge&logo=codechef&logoColor=white" alt="CodeChef"/> |
|:---:|:---:|:---:|
| **`leetcode`** | **`codeforces`** | **`codechef`** |
| Problems solved, contest rating, recent submissions | Rating & rank, problems solved, contest history | Stars & rating, problems solved, contest stats |
| <img src="https://img.shields.io/badge/GeeksforGeeks-2F8D46?style=for-the-badge&logo=geeksforgeeks&logoColor=white" alt="GeeksforGeeks"/> | <img src="https://img.shields.io/badge/HackerRank-00EA64?style=for-the-badge&logo=hackerrank&logoColor=white" alt="HackerRank"/> | <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/> |
| **`geeksforgeeks`** | **`hackerrank`** | **`github`** |
| Coding score, problems solved, streaks & badges | Badges earned, skills verified, certifications | Repositories, contributions, languages used |

</div>

---

## 📖 API Usage

### Single Platform

Get data from one platform:

```bash
curl -X POST http://localhost:5001/api/v1/platforms/leetcode/profiles \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username"}'
```

### All Platforms at Once

Get data from all platforms in one call:

```bash
curl -X POST http://localhost:5001/api/v1/profiles/aggregate \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username"}'
```

### Using JavaScript

```javascript
const response = await fetch('http://localhost:5001/api/v1/platforms/leetcode/profiles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'your_username' })
});

const data = await response.json();
console.log(data);
```

---

## 📚 Available Endpoints

### ✅ Health & Info

- `GET /` - API information
- `GET /api/v1/health` - Health check
- `GET /api/v1/status` - System status
- `GET /api/v1/platforms` - List all platforms

### 📊 Data Endpoints

- `POST /api/v1/platforms/:platform/profiles` - Get single platform profile
- `POST /api/v1/profiles/aggregate` - Get all platform profiles at once

📖 **[Full API Documentation →](./docs/API_ENDPOINTS.md)**

---

## 📦 Response Format

```json
{
  "success": true,
  "platform": "leetcode",
  "username": "john_doe",
  "data": {
    "problemsSolved": {
      "easy": 150,
      "medium": 80,
      "hard": 20
    },
    "dailyProblemsSolved": { "2025-11-11": 3 },
    "additionalInfo": { "contestRating": 1850 }
  },
  "fetchedAt": "2025-11-11T13:30:00.000Z"
}
```

---

## 🛠️ Tech Stack

**Backend:** Node.js • Express • Winston

**Scraping:** Axios • Cheerio • Puppeteer

**Data Parsing:** JSON • HTML • DOM Manipulation

---

## 📁 Project Structure

```
codenexus-api/
├── src/
│   ├── routes/          # API endpoints
│   ├── controllers/     # Business logic
│   ├── scrapers/        # Platform data fetchers
│   ├── middleware/      # Express middleware
│   └── utils/           # Utilities
├── docs/                # Documentation
├── logs/                # Log files
└── tests/               # Tests
```

📖 **[Detailed Structure](./docs/STRUCTURE.md)**

---

## 🔧 Development

### Setup

```bash
# Install dependencies
npm install

# Create .env file
echo "GITHUB_TOKEN=your_token_here" > .env

# Run in development mode (auto-reload)
npm run dev
```

### Environment Variables

```env
# Required
GITHUB_TOKEN=your_github_personal_access_token

# Optional
CODECHEF_COOKIE=your_codechef_session_cookie  # Improves reliability
LOG_LEVEL=warn                                 # warn or error
NODE_ENV=development                           # development or production
PORT=5001                                      # Server port
```

---

## ⚠️ Important Notes

### 🚦 Rate Limits

- **GitHub**: 5000 requests/hour (with token)
- **Other Platforms**: Respect their rate limits and use caching
- **Recommendation**: Max 60 requests/minute, cache results when possible

### 🔐 Authentication

- ✅ **GitHub**: Requires personal access token
- 🔧 **CodeChef**: May need session cookie for some users
- 🆓 **Others**: No authentication required

---

## 🐛 Troubleshooting

**❌ GitHub 401 Error?**  
→ Check your `GITHUB_TOKEN` in `.env` file  
→ Ensure token has `read:user` scope

**🔌 Port Already in Use?**  
→ Change `PORT` in `.env` file  
→ Or stop the other process: `lsof -ti:5001 | xargs kill`

**👤 User Not Found?**  
→ Verify username is correct for that platform  
→ Check if profile is public

**🐌 Slow Response?**  
→ Platform servers might be slow  
→ Check logs: `tail -f logs/error-*.log`

**More issues?** Check our [documentation](./docs) or [open an issue](https://github.com/yourusername/codenexus-api/issues)

---

## 🤝 Contributing

We love contributions! Whether it's bug reports, feature requests, or code improvements - all contributions are welcome!

🐛 **Report Bugs** • 💡 **Suggest Features** • 🚀 **Add Platforms** • 📖 **Improve Docs**

### Quick Contributing Steps:

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

📖 **[Read Full Contributing Guide →](CONTRIBUTING.md)**

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 💬 Support & Community

- 💡 **Questions?** [Open an issue](https://github.com/yourusername/codenexus-api/issues)
- 🐛 **Found a bug?** [Report it](https://github.com/yourusername/codenexus-api/issues/new)
- ✨ **Want to contribute?** Check [CONTRIBUTING.md](CONTRIBUTING.md)
- ⭐ **Like it?** Give us a star on GitHub!

---

<div align="center">

### 💙 CodeNexus API

**Your connection hub for all coding platforms**

Built with ❤️ to help developers showcase their coding journey

⭐ Star this repo | 🐛 Report issues | 🤝 Contribute | 📖 Read docs

</div>
