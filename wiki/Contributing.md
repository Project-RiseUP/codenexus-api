## 🤝 Contributing

We welcome contributions of all kinds:

- 🐛 Bug fixes
- ✨ New platforms
- 📖 Documentation improvements
- ⚙️ Internal refactors

### 1️⃣ Setup

```bash
git clone https://github.com/yourusername/codenexus-api.git
cd codenexus-api
npm install
cp .env.example .env   # or create .env manually
```

### 2️⃣ Branch & Commit

```bash
git checkout -b feat/my-feature
# ... make changes ...
git commit -m "feat: add my feature"
git push origin feat/my-feature
```

Then open a Pull Request.

### 3️⃣ Guidelines

- Keep routes thin; put logic in controllers/scrapers
- Follow the existing response schema
- Use `logger.error` / `logger.warn` instead of `console.log`
- Add or update docs if you change behavior or add features

For more details, see the repository `CONTRIBUTING.md`.


