# 📚 Documentation

## Quick Links

- **[API Reference](API_ENDPOINTS.md)** - Complete REST API documentation
- **[Project Structure](STRUCTURE.md)** - Codebase organization
- **[Logging](LOGGING.md)** - Logging system guide

---

## Getting Started

1. **Setup**: See [main README](../README.md) for installation
2. **API Usage**: See [API_ENDPOINTS.md](API_ENDPOINTS.md) for all endpoints

---

## Documentation Files

### API_ENDPOINTS.md
Complete REST API reference with examples, request/response formats, and error handling.

**Use for**: Understanding available endpoints and how to use them

### STRUCTURE.md
Project architecture, folder structure, and development guide.

**Use for**: Understanding codebase organization and adding features

### LOGGING.md
Logging system configuration and usage.

**Use for**: Monitoring and debugging

---

## Quick Examples

### Health Check
```bash
curl http://localhost:5001/api/v1/health
```

### Single Platform
```bash
curl -X POST http://localhost:5001/api/v1/platforms/leetcode/profiles \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'
```

### All Platforms
```bash
curl -X POST http://localhost:5001/api/v1/profiles/aggregate \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'
```

---

## Support

- **Issues**: Open an issue on GitHub
- **Questions**: See [API_ENDPOINTS.md](API_ENDPOINTS.md) first
- **Contributing**: See [main README](../README.md)

