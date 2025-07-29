# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.0-redis.1] - 2025-01-29

### Added

#### Server-Side Redis Support
- **RedisStateStore**: Redis-backed implementation of the StateStore interface
  - Compatible with Redis 4.x, 5.x, 6.x, 7.x
  - Supports both `redis` and `ioredis` client libraries
  - Automatic key prefixing and TTL management
  - Additional methods: `expire()`, `exists()`, `flushAll()`
  - Comprehensive error handling and logging

- **ServerSideOidcClient**: Server-side OIDC client wrapper
  - Process OIDC signin callbacks on the server side
  - Redis-backed state storage for distributed sessions
  - Clean API maintaining oidc-client-ts patterns

- **ServerSideUserManager**: High-level session management
  - Store and retrieve user sessions in Redis
  - Automatic JSON serialization/deserialization
  - Session lifecycle management (create, validate, remove)
  - Custom TTL support per session

#### Documentation
- **SERVER_SIDE_REDIS.md**: Comprehensive server-side integration guide
- **REDIS_README.md**: Quick start guide and feature overview
- **IMPLEMENTATION_SUMMARY.md**: Technical implementation details
- **examples/README.md**: Detailed setup and usage instructions

#### Examples & Testing
- **examples/demo-server.cjs**: Full Express.js server with beautiful UI
- **examples/test-setup.cjs**: Connectivity and component validation
- **examples/test-redis-state-store.cjs**: Comprehensive RedisStateStore tests
- **examples/setup.js**: Automated project setup script
- **examples/.env.sample**: Comprehensive configuration template
- **examples/.env.template**: Simple configuration template

#### Build & Distribution
- **package-redis.json**: Separate package configuration for Redis-enabled distribution
- Updated package.json with Redis-specific metadata
- Added Redis documentation to npm package files

### Changed

#### Package Identity
- Package name: `@ridha.bouazizi/oidc-client-ts-redis`
- Version: `3.3.0-redis.1`
- Updated repository URLs and documentation links
- Added Redis-specific keywords and metadata

#### Core Library Extensions
- **src/index.ts**: Added exports for Redis functionality
  - `RedisStateStore`
  - `ServerSideOidcClient`
  - `ServerSideUserManager`
  - `RedisClientLike` interface

#### Documentation Updates
- **README.md**: Updated to reflect Redis server-side capabilities
  - Added Redis installation instructions
  - Updated clone URL and build instructions
  - Added table of contents with Redis documentation links
  - Updated badges to reflect new package name

### Technical Details

#### Redis API Compatibility
- Uses Redis 4.x+ API methods (`setEx` instead of deprecated `setex`)
- Proper array handling for `del` operations
- Boolean return values for `expire` operations
- Compatible with both callback and promise-based Redis clients

#### Architecture
- **Non-breaking changes**: Maintains full backward compatibility
- **Extension pattern**: Builds on existing oidc-client-ts without modifications
- **Interface compliance**: RedisStateStore implements StateStore interface exactly
- **Type safety**: Full TypeScript support with proper type definitions

#### Production Features
- Distributed session management across multiple server instances
- Automatic session cleanup with configurable TTL
- Connection pooling and error recovery guidance
- Security best practices for server-side OIDC flows
- Performance optimization for high-traffic scenarios

### Dependencies

#### Peer Dependencies
- `redis ^4.0.0` OR `ioredis ^5.0.0`
- Node.js 16.0.0+

#### Development Dependencies
- Updated build tools for dual package support
- Enhanced TypeScript configuration for server-side code

### Use Cases

This release enables:
- **Microservices**: Share authentication state across Node.js services
- **Load Balancing**: Maintain sessions across multiple server instances  
- **Distributed Systems**: Centralized authentication state management
- **High Availability**: Redis clustering for fault-tolerant session storage
- **Session Persistence**: Survive server restarts and deployments

### Migration Guide

For existing oidc-client-ts users:
1. Install the new package: `npm install @ridha.bouazizi/oidc-client-ts-redis`
2. All existing client-side code remains unchanged
3. Add server-side functionality as needed using the new classes
4. Follow the examples in `examples/` directory for integration patterns

### Examples

See the `examples/` directory for:
- Complete Express.js integration
- Redis connection setup
- OIDC provider configuration
- Error handling patterns
- Production deployment guidance

---

## [3.3.0] - Upstream Base

This release extends [oidc-client-ts@3.3.0](https://github.com/authts/oidc-client-ts) with server-side Redis capabilities while maintaining full backward compatibility with the original library.
