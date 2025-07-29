# Server-Side OIDC with Redis State Storage

> **@ridha.bouazizi/oidc-client-ts-redis v3.3.0-redis.1** - Production Ready 🚀

This guide shows how to use the `@ridha.bouazizi/oidc-client-ts-redis` library on the server side with Redis for session storage, enabling signin callback processing in a Node.js environment.

## Overview

The server-side implementation provides:

1. **RedisStateStore**: A Redis-based implementation of the StateStore interface
2. **ServerSideOidcClient**: A server-side wrapper around OidcClient
3. **ServerSideUserManager**: High-level server-side user management with Redis sessions

## Installation

Install the package and Redis client:

```bash
npm install @ridha.bouazizi/oidc-client-ts-redis redis
```

## Quick Start

### Basic Setup with Redis

```typescript
import { createClient } from 'redis';
import { ServerSideUserManager, RedisStateStore } from '@ridha.bouazizi/oidc-client-ts-redis';

// Create Redis client
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
```

### Express.js Server Example

```typescript
import express from 'express';
import { createClient } from 'redis';
import { ServerSideUserManager } from '@ridha.bouazizi/oidc-client-ts-redis';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const redisClient = createClient({ url: 'redis://localhost:6379' });
await redisClient.connect();

const userManager = new ServerSideUserManager({
    authority: 'https://your-oidc-provider.com',
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    redirect_uri: 'https://your-app.com/auth/callback',
    scope: 'openid profile email',
    redisClient,
    redisConfig: {
        keyPrefix: 'myapp:oidc:',
        ttl: 3600,
    }
});

// Initiate signin
app.get('/auth/signin', async (req, res) => {
    try {
        const signinRequest = await userManager.createSigninRequest({
            state: { returnUrl: req.query.returnUrl || '/' }
        });
        
        res.redirect(signinRequest.url);
    } catch (error) {
        console.error('Signin initiation error:', error);
        res.status(500).send('Authentication error');
    }
});

// Handle signin callback
app.get('/auth/callback', async (req, res) => {
    try {
        const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const user = await userManager.signinCallback(callbackUrl);
        
        // Create session
        const sessionId = uuidv4();
        await userManager.storeUserSession(sessionId, user);
        
        // Set session cookie
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000 // 1 hour
        });
        
        // Redirect to return URL or home
        const returnUrl = user.state?.returnUrl || '/';
        res.redirect(returnUrl);
        
    } catch (error) {
        console.error('Signin callback error:', error);
        res.status(500).send('Authentication callback error');
    }
});

// Middleware to check authentication
app.use(async (req, res, next) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
        const user = await userManager.getUserSession(sessionId);
        if (user && !user.expired) {
            req.user = user;
        }
    }
    next();
});

// Protected route
app.get('/profile', (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/signin');
    }
    
    res.json({
        profile: req.user.profile,
        accessToken: req.user.access_token,
        expiresAt: req.user.expires_at
    });
});

// Signout
app.post('/auth/signout', async (req, res) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
        await userManager.removeUserSession(sessionId);
        res.clearCookie('sessionId');
    }
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
```

### Next.js API Routes Example

```typescript
// pages/api/auth/signin.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getUserManager } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const userManager = await getUserManager();
    
    try {
        const signinRequest = await userManager.createSigninRequest({
            state: { returnUrl: req.query.returnUrl }
        });
        
        res.redirect(signinRequest.url);
    } catch (error) {
        res.status(500).json({ error: 'Authentication error' });
    }
}
```

```typescript
// pages/api/auth/callback.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { v4 as uuidv4 } from 'uuid';
import { getUserManager } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const userManager = await getUserManager();
    
    try {
        const callbackUrl = `${process.env.BASE_URL}${req.url}`;
        const user = await userManager.signinCallback(callbackUrl);
        
        const sessionId = uuidv4();
        await userManager.storeUserSession(sessionId, user);
        
        const sessionCookie = serialize('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600,
            path: '/'
        });
        
        res.setHeader('Set-Cookie', sessionCookie);
        
        const returnUrl = user.state?.returnUrl || '/';
        res.redirect(returnUrl);
        
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).json({ error: 'Authentication callback error' });
    }
}
```

```typescript
// lib/auth.ts
import { createClient } from 'redis';
import { ServerSideUserManager } from '@ridha.bouazizi/oidc-client-ts-redis';

let userManager: ServerSideUserManager;
let redisClient: any;

export async function getUserManager(): Promise<ServerSideUserManager> {
    if (!userManager) {
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        await redisClient.connect();
        
        userManager = new ServerSideUserManager({
            authority: process.env.OIDC_AUTHORITY!,
            client_id: process.env.OIDC_CLIENT_ID!,
            client_secret: process.env.OIDC_CLIENT_SECRET!,
            redirect_uri: `${process.env.BASE_URL}/api/auth/callback`,
            scope: 'openid profile email',
            redisClient,
            redisConfig: {
                keyPrefix: 'nextapp:oidc:',
                ttl: 3600,
            }
        });
    }
    
    return userManager;
}
```

## Advanced Configuration

### Custom Redis Configuration

```typescript
const userManager = new ServerSideUserManager({
    // ... OIDC settings
    redisClient,
    redisConfig: {
        keyPrefix: 'myapp:oidc:',
        ttl: 7200, // 2 hours
        host: 'redis-cluster.example.com',
        port: 6380,
        password: 'secure-password',
        db: 1
    }
});
```

### Using IoRedis

```typescript
import Redis from 'ioredis';

const redisClient = new Redis({
    host: 'localhost',
    port: 6379,
    password: 'your-password',
    db: 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
});

const userManager = new ServerSideUserManager({
    // ... OIDC settings
    redisClient,
    redisConfig: {
        keyPrefix: 'myapp:oidc:',
        ttl: 3600
    }
});
```

### Session Management

```typescript
// Store user with custom TTL
await userManager.storeUserSession('user123', user, 7200); // 2 hours

// Check if session exists
const exists = await userManager.hasUserSession('user123');

// Get user session
const user = await userManager.getUserSession('user123');

// Remove session
await userManager.removeUserSession('user123');

// Direct Redis operations
const stateStore = userManager.serverClient.stateStore;
await stateStore.exists('custom:key');
await stateStore.expire('session:user123', 1800); // 30 minutes
```

## Environment Variables

Create a `.env` file with your configuration:

```env
REDIS_URL=redis://localhost:6379
OIDC_AUTHORITY=https://your-oidc-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
BASE_URL=https://your-app.com
NODE_ENV=production
```

## Error Handling

```typescript
try {
    const user = await userManager.signinCallback(callbackUrl);
    // Handle successful authentication
} catch (error) {
    if (error.message.includes('State does not match')) {
        // Handle state mismatch (possible CSRF attack)
        console.error('State validation failed:', error);
    } else if (error.message.includes('No matching state found')) {
        // Handle expired or missing state
        console.error('State expired or not found:', error);
    } else {
        // Handle other authentication errors
        console.error('Authentication error:', error);
    }
}
```

## Security Considerations

1. **Use HTTPS in production** for all redirects and callbacks
2. **Secure Redis connection** with password and TLS
3. **Set appropriate TTL** for state and session storage
4. **Validate state parameters** to prevent CSRF attacks
5. **Use secure cookies** with `httpOnly` and `secure` flags
6. **Implement proper session cleanup** and rotation

## Benefits of Server-Side Processing

1. **Security**: Sensitive operations happen on the server
2. **State Management**: Redis provides distributed session storage
3. **Scalability**: Multiple server instances can share Redis state
4. **Flexibility**: Full control over the authentication flow
5. **Performance**: Server-side processing with efficient Redis storage

## Troubleshooting

### Common Issues

1. **Redis Connection**: Ensure Redis is running and accessible
2. **State Mismatch**: Check TTL settings and clock synchronization
3. **Missing State**: Verify Redis key prefix and storage
4. **Expired Tokens**: Implement token refresh logic
5. **CORS Issues**: Use server-side processing to avoid browser limitations
