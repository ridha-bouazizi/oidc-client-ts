# Redis State Store for OIDC Client TS

This extension adds server-side Redis support to the oidc-client-ts library, enabling signin callback processing in Node.js environments with distributed session storage.

## 🚀 Quick Start

```bash
npm install oidc-client-ts redis
```

```typescript
import { ServerSideUserManager } from 'oidc-client-ts';
import { createClient } from 'redis';

const redisClient = createClient({ url: 'redis://localhost:6379' });
await redisClient.connect();

const userManager = new ServerSideUserManager({
    authority: 'https://your-oidc-provider.com',
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    redirect_uri: 'https://your-app.com/callback',
    scope: 'openid profile email',
    redisClient,
    redisConfig: {
        keyPrefix: 'myapp:oidc:',
        ttl: 3600, // 1 hour
    }
});

// Handle signin callback
const user = await userManager.signinCallback(callbackUrl);

// Store user session
await userManager.storeUserSession('user123', user);

// Retrieve user session
const user = await userManager.getUserSession('user123');
```

## 📦 What's Included

### `RedisStateStore`
- Implements the `StateStore` interface using Redis
- Automatic key prefixing and TTL management
- Support for both `redis` and `ioredis` clients

### `ServerSideOidcClient`
- Server-side wrapper around `OidcClient`
- Redis-backed state storage for OIDC flows
- Clean API for signin callback processing

### `ServerSideUserManager`
- High-level server-side user management
- Session storage and retrieval in Redis
- Built-in user session lifecycle management

## 🔧 Configuration Options

```typescript
interface RedisConfig {
    host?: string;          // Redis host
    port?: number;          // Redis port
    password?: string;      // Redis password
    db?: number;           // Redis database number
    keyPrefix?: string;    // Key prefix (default: "oidc:")
    ttl?: number;          // Time to live in seconds (default: 3600)
}
```

## 🎯 Use Cases

- **Server-Side Rendering (SSR)**: Process OIDC callbacks on the server
- **Microservices**: Shared authentication state across services
- **Load Balancing**: Distributed session storage for multiple instances
- **API Servers**: Stateless authentication with Redis persistence

## 📋 Requirements

- Node.js 16+
- Redis 6+
- A Redis client (`redis` or `ioredis`)

## 📚 Documentation

See [SERVER_SIDE_REDIS.md](./SERVER_SIDE_REDIS.md) for complete documentation and examples.

## 🤝 Contributing

This Redis support is designed to be backwards-compatible and follows the existing oidc-client-ts patterns. Contributions welcome!

## ⚡ Performance

- **Fast**: Redis operations are optimized for speed
- **Scalable**: Supports clustering and replication
- **Reliable**: Automatic cleanup of expired state

## 🔒 Security

- Secure key prefixing prevents conflicts
- TTL-based automatic cleanup
- Support for Redis AUTH and TLS
- Server-side processing eliminates browser exposure
