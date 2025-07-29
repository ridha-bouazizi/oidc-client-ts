# Documentation Index

Welcome to the `@ridha.bouazizi/oidc-client-ts-redis` documentation! This package extends the popular oidc-client-ts library with Redis server-side support for distributed session management.

## 📚 Documentation Guide

### 🚀 Getting Started
1. **[Quick Start Guide](REDIS_README.md)** - Get up and running in minutes
2. **[Working Examples](examples/README.md)** - Copy-paste examples for Express, Next.js
3. **[Environment Setup](examples/.env.sample)** - Configuration templates

### 🔧 Implementation Guides  
4. **[Server-Side Integration](SERVER_SIDE_REDIS.md)** - Complete integration guide
5. **[Implementation Details](IMPLEMENTATION_SUMMARY.md)** - Technical deep dive
6. **[Changelog](CHANGELOG.md)** - What's new and changed

### 💡 Examples & Testing
7. **[Demo Server](examples/demo-server.cjs)** - Full Express.js server
8. **[Test Suite](examples/test-redis-state-store.cjs)** - RedisStateStore tests
9. **[Setup Automation](examples/setup.js)** - Automated project setup

## 🎯 Choose Your Path

### For New Users
👋 **New to this library?** Start here:
1. [REDIS_README.md](REDIS_README.md) - Overview and quick start
2. [examples/README.md](examples/README.md) - Working examples
3. [SERVER_SIDE_REDIS.md](SERVER_SIDE_REDIS.md) - Complete guide

### For Developers  
🔨 **Want to understand the implementation?** Check out:
1. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Technical details
2. [CHANGELOG.md](CHANGELOG.md) - All changes and additions
3. [examples/test-redis-state-store.cjs](examples/test-redis-state-store.cjs) - Test suite

### For Integration
⚙️ **Ready to integrate?** Use these resources:
1. [examples/demo-server.cjs](examples/demo-server.cjs) - Express.js example
2. [examples/.env.sample](examples/.env.sample) - Configuration template
3. [SERVER_SIDE_REDIS.md](SERVER_SIDE_REDIS.md) - Integration patterns

## 🔍 Quick Reference

### Package Information
- **Name**: `@ridha.bouazizi/oidc-client-ts-redis`
- **Version**: `3.3.0-redis.1`
- **License**: Apache-2.0
- **Node.js**: 16.0.0+ required
- **Redis**: 4.x, 5.x, 6.x, 7.x supported

### Installation
```bash
npm install @ridha.bouazizi/oidc-client-ts-redis redis
```

### Key Features
- ✅ Redis-backed state storage
- ✅ Server-side OIDC callback processing  
- ✅ Distributed session management
- ✅ Production-ready architecture
- ✅ Framework agnostic (Express, Next.js, Fastify, etc.)

### Main Classes
- `RedisStateStore` - Redis implementation of StateStore interface
- `ServerSideOidcClient` - Server-side OIDC client wrapper
- `ServerSideUserManager` - High-level session management

## 🆘 Need Help?

1. **Getting Started Issues**: See [examples/README.md](examples/README.md)
2. **Configuration Problems**: Check [examples/.env.sample](examples/.env.sample)  
3. **Integration Questions**: Review [SERVER_SIDE_REDIS.md](SERVER_SIDE_REDIS.md)
4. **Technical Details**: Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

## 🎉 Ready to Start?

Jump to the [REDIS_README.md](REDIS_README.md) for a quick start, or explore the [examples](examples/) directory for working code!

---

*This documentation covers version 3.3.0-redis.1 of @ridha.bouazizi/oidc-client-ts-redis*
