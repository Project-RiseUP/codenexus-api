## 🚀 Getting Started

### 1️⃣ Clone & Install

```bash
git clone https://github.com/yourusername/codenexus-api.git
cd codenexus-api
npm install
```

### 2️⃣ Configure Environment

Create a `.env` file in the project root:

```env
# Required
GITHUB_TOKEN=your_github_personal_access_token

# Optional
CODECHEF_COOKIE=your_codechef_session_cookie
LOG_LEVEL=warn          # warn or error
NODE_ENV=development    # development or production
PORT=5001               # default: 5001
```

> Get a GitHub token from: GitHub → Settings → Developer settings → Personal access tokens (needs `read:user` scope).

### 3️⃣ Run the Server

```bash
# Production-style
npm start

# Development (auto-reload, if configured)
npm run dev
```

Server runs at: `http://localhost:${PORT || 5001}`

### 4️⃣ Quick Health Check

```bash
curl http://localhost:5001/api/v1/health
```

You should see a JSON response with `"status": "healthy"`.


