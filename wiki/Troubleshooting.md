## 🐛 Troubleshooting

### GitHub 401 / Token Issues

- Check `GITHUB_TOKEN` in `.env`
- Ensure token has `read:user` scope
- Restart the server after changing `.env`

### Port Already in Use

```bash
lsof -ti:5001 | xargs kill
# or change PORT in .env
```

### User Not Found

- Verify username is correct for that platform
- Make sure the profile is public
- Some platforms may throttle or block scraping for certain profiles

### Slow Responses

- Aggregate endpoint hits all platforms in parallel and may take 5–15s
- Check logs:

```bash
tail -f logs/error-*.log
```

Slow scrapers will be logged as warnings.

### Where to Look Next

- **API contract**: `API-Reference.md`
- **Architecture**: `Architecture.md`
- **Logging behavior**: `Logging.md`


