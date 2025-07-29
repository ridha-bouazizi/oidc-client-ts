# oidc-client-ts with Redis Server-Side Support

[![Stable Release](https://img.shields.io/npm/v/@ridha.bouazizi/oidc-client-ts-redis.svg)](https://npm.im/@ridha.bouazizi/oidc-client-ts-redis)
[![Original CI](https://github.com/authts/oidc-client-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/authts/oidc-client-ts/actions/workflows/ci.yml)
[![Codecov](https://img.shields.io/codecov/c/github/authts/oidc-client-ts)](https://app.codecov.io/gh/authts/oidc-client-ts)

Library to provide OpenID Connect (OIDC) and OAuth2 protocol support for
client-side, browser-based JavaScript client applications **with additional 
server-side Redis support** for distributed session management. Also included is
support for user session and access token management.

This project is a fork of
[IdentityModel/oidc-client-js](https://github.com/IdentityModel/oidc-client-js)
which halted its development in June 2021. It has since been ported to
TypeScript here with a similar API for the initial 2.0 release. 

**This fork extends the original with Redis server-side support** for distributed
session management, enabling server-side OIDC flows in Node.js environments.

Going forward, this library will focus only on protocols that continue to have support in
[OAuth 2.1](https://oauth.net/2.1/). As such, the implicit grant is not
supported by this client. Additional migration notes from `oidc-client` are
available [here](docs/migration.md).

**Contributions and help are greatly appreciated!**

Implements the following OAuth 2.0 protocols and supports
[OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html):

- [Authorization Code Grant with Proof Key for Code Exchange (PKCE)](docs/protocols/authorization-code-grant-with-pkce.md)
- [Authorization Code Grant](docs/protocols/authorization-code-grant.md)
- [Resource Owner Password Credentials (ROPC) Grant](docs/protocols/resource-owner-password-credentials-grant.md)
- [Refresh Token Grant](docs/protocols/refresh-token-grant.md)
- [Silent Refresh Token in iframe Flow](docs/protocols/silent-refresh-token-in-iframe-flow.md)

## ✨ New: Server-Side Redis Support

This fork adds powerful server-side capabilities:

- **RedisStateStore**: Redis-backed state storage for distributed sessions
- **ServerSideOidcClient**: Process OIDC callbacks on the server side
- **ServerSideUserManager**: High-level session management with Redis
- **Distributed Sessions**: Share authentication state across multiple server instances
- **Production Ready**: Built for microservices and load-balanced environments

### Quick Start with Redis

```bash
npm install @ridha.bouazizi/oidc-client-ts-redis redis
```

```typescript
import { ServerSideUserManager } from '@ridha.bouazizi/oidc-client-ts-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: 'redis://localhost:6379' });
await redisClient.connect();

const userManager = new ServerSideUserManager({
    authority: 'https://your-oidc-provider.com',
    client_id: 'your-client-id', 
    client_secret: 'your-client-secret',
    redirect_uri: 'https://your-app.com/auth/callback',
    scope: 'openid profile email',
    redisClient,
    redisConfig: { keyPrefix: 'app:oidc:', ttl: 3600 }
});

// Handle signin callback
const user = await userManager.signinCallback(callbackUrl);

// Store user session in Redis
await userManager.storeUserSession(sessionId, user);
```

📖 **[Complete Server-Side Guide](SERVER_SIDE_REDIS.md)**

## Table of Contents

- [📚 **Documentation Index**](DOCUMENTATION_INDEX.md) - Complete documentation guide
- [Documentation](https://authts.github.io/oidc-client-ts/)
- [Server-Side Redis Guide](SERVER_SIDE_REDIS.md)
- [Redis State Store Documentation](REDIS_README.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Working Examples](examples/README.md)
- [Changelog](CHANGELOG.md)
- [Installation](#installation)
- [Building the Source](#building-the-source)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Client-Side (Browser)

Using [npm](https://npmjs.org/)

```sh
$ npm install oidc-client-ts --save
```

### Server-Side with Redis

Using [npm](https://npmjs.org/)

```sh
$ npm install @ridha.bouazizi/oidc-client-ts-redis redis --save
```

Or with ioredis:

```sh
$ npm install @ridha.bouazizi/oidc-client-ts-redis ioredis --save
```

## Building the Source

```sh
$ git clone https://github.com/ridha-bouazizi/oidc-client-ts.git
$ cd oidc-client-ts
$ npm install
$ npm run build
```

### Running the Redis Examples

**Server-side examples with Redis**

```sh
$ cd examples
$ npm install
$ cp .env.sample .env
# Edit .env with your OIDC provider and Redis settings
$ npm run setup    # Test setup
$ npm run server   # Start demo server
```

Browse to [http://localhost:3000](http://localhost:3000) to test the server-side OIDC flow.

### Running the Sample

**Parcel project**

```sh
$ cd samples/Parcel
$ npm install
$ npm run start
```

and then browse to [http://localhost:1234](http://localhost:1234).

**Angular app**

can be found [here](https://github.com/authts/sample-angular-oidc-client-ts).

### Running the Tests

```sh
$ npm test
```

## What's New in This Fork

This Redis-enabled fork adds powerful server-side capabilities while maintaining 100% backward compatibility:

### 🔥 Key Features
- **Distributed Sessions**: Share authentication state across multiple server instances
- **Redis Integration**: Production-ready Redis state storage with automatic cleanup
- **Server-Side OIDC**: Process signin callbacks on the server side for enhanced security
- **Framework Agnostic**: Works with Express, Next.js, Fastify, and any Node.js framework
- **Production Ready**: Built for microservices and load-balanced environments

### 🚀 Quick Example
```typescript
// Install the Redis-enabled package
npm install @ridha.bouazizi/oidc-client-ts-redis redis

// Use server-side session management
const userManager = new ServerSideUserManager({
    authority: 'https://your-oidc-provider.com',
    client_id: 'your-client-id',
    client_secret: 'your-client-secret', 
    redisClient: createClient({ url: 'redis://localhost:6379' }),
    redisConfig: { keyPrefix: 'app:oidc:', ttl: 3600 }
});

// Handle signin callback on server
const user = await userManager.signinCallback(req.url);
await userManager.storeUserSession(sessionId, user);
```

### 📚 Complete Documentation
- [🔧 **Server-Side Setup Guide**](SERVER_SIDE_REDIS.md) - Complete integration guide
- [⚡ **Quick Start**](REDIS_README.md) - Get up and running in minutes  
- [💡 **Working Examples**](examples/README.md) - Copy-paste examples for Express, Next.js
- [🔍 **Implementation Details**](IMPLEMENTATION_SUMMARY.md) - Technical deep dive
- [📝 **Changelog**](CHANGELOG.md) - What's new and changed

---

## Contributing

We appreciate feedback and contribution to this repo!

## License

This project is licensed under the Apache-2.0 license. See the
[LICENSE](https://github.com/authts/oidc-client-ts/blob/main/LICENSE) file for
more info.

