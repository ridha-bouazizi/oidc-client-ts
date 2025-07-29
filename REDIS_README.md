# Redis State Store for OIDC Client TS

> **Version 3.3.0-redis.1** - Production Ready 🚀

This package extends the oidc-client-ts library with server-side Redis support, enabling signin callback processing in Node.js environments with distributed session storage.

## 🚀 Quick Start

### Installation

```bash
npm install @ridha.bouazizi/oidc-client-ts-redis redis
```

### Basic Usage

```typescript
import { ServerSideUserManager } from '@ridha.bouazizi/oidc-client-ts-redis';
import { createClient } from 'redis';

// Create and connect Redis client
const redisClient = createClient({
    socket: {
        host: 'localhost',
        port: 6379,
    },
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB || '0'),
});
await redisClient.connect();

// Configure server-side user manager
const userManager = new ServerSideUserManager({
    authority: 'https://your-oidc-provider.com',
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    redirect_uri: 'https://your-app.com/auth/callback',
    scope: 'openid profile email',
    redisClient,
    redisConfig: {
        keyPrefix: 'myapp:oidc:',
        ttl: 3600, // 1 hour
    }
});

// Handle signin callback
const user = await userManager.signinCallback(callbackUrl);

// Store user session in Redis
const sessionId = 'session_' + Date.now();
await userManager.storeUserSession(sessionId, user);

// Retrieve user session from Redis
const retrievedUser = await userManager.getUserSession(sessionId);
```

## 📦 What's Included

### `RedisStateStore`
- **Redis-backed StateStore**: Implements the `StateStore` interface using Redis
- **Automatic key management**: Key prefixing and TTL management
- **Redis 4.x/5.x compatible**: Works with modern Redis client API (`setEx`, proper array handling)
- **Multiple Redis clients**: Support for both `redis` and `ioredis` packages

### `ServerSideOidcClient`
- **Server-side OIDC client**: Redis-backed state storage for OIDC flows
- **Signin callback processing**: Handle OIDC provider responses server-side

### `ServerSideUserManager`
- **High-level session management**: User session storage and retrieval
- **Session lifecycle**: Create, validate, and remove user sessions
- **Automatic cleanup**: Handle expired sessions and TTL management

## 🎯 Use Cases

- **Microservices**: Share authentication state across multiple Node.js services
- **Load Balancing**: Maintain sessions across multiple server instances
- **Distributed Systems**: Centralized authentication state management
- **High Availability**: Redis clustering for fault-tolerant session storage
- **Session Persistence**: Survive server restarts and deployments

## 🚦 Getting Started

### 1. Try the Examples

```bash
# Install the package
npm install @ridha.bouazizi/oidc-client-ts-redis

# Clone the repository for examples
git clone https://github.com/ridha-bouazizi/oidc-client-ts.git
cd oidc-client-ts/examples

# Quick setup
npm run setup

# Start the demo server
npm run server

# Open http://localhost:3000 to test
```

### 2. Redis Configuration

The package supports various Redis setups:

```typescript
// Local Redis
const redisClient = createClient({
    socket: { host: 'localhost', port: 6379 }
});

// Redis with authentication
const redisClient = createClient({
    socket: { host: 'redis.example.com', port: 6379 },
    password: 'your-password',
    database: 1
});

// Redis Cloud/Cluster
const redisClient = createClient({
    url: 'redis://username:password@host:port/database'
});
```

### 3. OIDC Provider Setup

Configure your OIDC provider to allow your redirect URI:

```typescript
const userManager = new ServerSideUserManager({
    // Your OIDC provider (Keycloak, Auth0, Azure AD, etc.)
    authority: 'https://auth.dataconformity.fr/realms/master',
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    
    // Must match your OIDC provider configuration
    redirect_uri: 'http://localhost:3000/auth/callback',
    post_logout_redirect_uri: 'http://localhost:3000/',
    
    scope: 'openid profile email',
    redisClient,
    redisConfig: {
        keyPrefix: 'myapp:oidc:',
        ttl: 3600, // Session timeout in seconds
    }
});
```

## 🔧 Advanced Configuration

### RedisStateStore Options

```typescript
import { RedisStateStore } from '@ridha.bouazizi/oidc-client-ts-redis';

const stateStore = new RedisStateStore(redisClient, {
    keyPrefix: 'myapp:oidc:',     // Key prefix for Redis keys
    ttl: 3600,                   // Time to live in seconds
});
```

### Session Management

```typescript
// Create signin request
const signinRequest = await userManager.createSigninRequest({
    state: { returnUrl: '/dashboard' }
});

// Handle callback
const user = await userManager.signinCallback(callbackUrl);

// Manage sessions
const sessionId = generateSessionId();
await userManager.storeUserSession(sessionId, user);

// Check if session exists
const hasSession = await userManager.hasUserSession(sessionId);

// Get user from session
const user = await userManager.getUserSession(sessionId);

// Remove session
await userManager.removeUserSession(sessionId);
```

## 📚 Documentation & Examples

- **Complete Documentation**: [SERVER_SIDE_REDIS.md](./SERVER_SIDE_REDIS.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Working Examples**: [examples/](./examples/) directory
- **Express.js Demo**: [examples/demo-server.cjs](./examples/demo-server.cjs)
- **Setup Guide**: [examples/README.md](./examples/README.md)

## �️ Compatibility

- **Node.js**: 16.0.0 or higher
- **Redis**: 4.x, 5.x, 6.x, 7.x
- **Redis Clients**: `redis@4.x+`, `redis@5.x+`
- **OIDC Providers**: Any OpenID Connect compliant provider

## 🤝 Contributing

This package extends the original [oidc-client-ts](https://github.com/authts/oidc-client-ts) with server-side Redis capabilities. Issues and contributions are welcome!

## � License

Apache-2.0 - Same as the original oidc-client-ts project.

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
