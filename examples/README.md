# OIDC Redis Integration Examples

This directory contains working examples demonstrating the OIDC client with Redis server-side support.

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js 18+** installed
- **Redis** running locally or accessible remotely
- **OIDC Provider** (Keycloak, Auth0, Azure AD, etc.)

### 2. Setup Environment

```bash
# Copy the sample environment file
cp .env.sample .env

# Edit .env with your actual values
# - Update OIDC_AUTHORITY, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET
# - Configure Redis connection settings
# - Set redirect URIs in your OIDC provider
```

### 3. Install Dependencies

```bash
# Install example dependencies
npm install

# Build the main package (from parent directory)
cd ..
npm run build
cd examples
```

### 4. Start Redis (if not running)

```bash
# Using Docker (recommended)
docker run -d --name redis-oidc -p 6379:6379 redis:7-alpine

# Or install Redis locally and start it
redis-server
```

### 5. Run Examples

```bash
# Test Redis connection and OIDC components
node test-setup.cjs

# Test RedisStateStore functionality
node test-redis-state-store.cjs

# Start the demo web server
node demo-server.cjs
```

### 6. Test the Integration

1. Open http://localhost:3000 in your browser
2. Click "Start OIDC Login" to test the authentication flow
3. Complete authentication with your OIDC provider
4. Check the profile endpoint to see session data stored in Redis

## 📁 Example Files

### Core Examples

- **`demo-server.cjs`** - Complete Express.js server with OIDC authentication
- **`test-setup.cjs`** - Basic connectivity tests for Redis and OIDC components
- **`test-redis-state-store.cjs`** - Comprehensive RedisStateStore functionality tests

### Configuration

- **`.env.sample`** - Detailed environment configuration with examples
- **`.env.template`** - Simple environment template for quick setup

### Development

- **`package.json`** - Dependencies and scripts for running examples
- **`tsconfig.json`** - TypeScript configuration for examples

## 🔧 Configuration Details

### OIDC Provider Setup

Your OIDC provider must be configured with:

- **Redirect URI**: `http://localhost:3000/auth/callback`
- **Post Logout URI**: `http://localhost:3000/`
- **Client Type**: Confidential (for server-side flows)
- **Grant Types**: Authorization Code
- **Scopes**: `openid profile email`

### Redis Configuration

The examples support various Redis setups:

- **Local Redis**: Default `localhost:6379`
- **Redis Cloud**: Update host, port, and password
- **Redis Cluster**: Use appropriate connection string
- **Authentication**: Set `REDIS_PASSWORD` if required

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OIDC_AUTHORITY` | Your OIDC provider's base URL | `https://auth.example.com/realms/master` |
| `OIDC_CLIENT_ID` | Client ID from your OIDC provider | `my-app-client` |
| `OIDC_CLIENT_SECRET` | Client secret for server-side flows | `secret-key-123` |
| `OIDC_REDIRECT_URI` | Callback URL for authentication | `http://localhost:3000/auth/callback` |
| `REDIS_HOST` | Redis server hostname | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis authentication password | `optional` |
| `REDIS_DB` | Redis database number (0-15) | `0` |

## 🧪 Testing Scenarios

### 1. Basic Redis Connectivity
```bash
node test-setup.cjs
```
Tests Redis connection and verifies OIDC components are available.

### 2. RedisStateStore Functionality
```bash
node test-redis-state-store.cjs
```
Tests all RedisStateStore methods including set, get, expire, remove, and getAllKeys.

### 3. Full OIDC Flow
```bash
node demo-server.cjs
```
Starts a web server for testing the complete authentication flow:
- Signin initiation
- OIDC provider redirect
- Callback processing
- Session management
- Protected resource access
- Signout

## 🌐 Demo Server Features

The demo server (`demo-server.cjs`) provides:

- **🏠 Home Page**: Interactive UI showing authentication status
- **🔐 OIDC Login**: Complete OpenID Connect flow
- **👤 Profile API**: Protected endpoint with user information
- **🏥 Health Check**: System status and configuration
- **🚪 Sign Out**: Session cleanup and logout

### API Endpoints

- `GET /` - Demo home page with UI
- `GET /auth/signin` - Initiate OIDC authentication
- `GET /auth/callback` - Handle OIDC provider callback
- `GET /profile` - Get user profile (protected)
- `POST /auth/signout` - Sign out and clear session
- `GET /health` - System health and configuration

## 🔍 Debugging

### Common Issues

1. **Redis Connection Failed**
   - Ensure Redis is running: `docker ps` or `redis-cli ping`
   - Check REDIS_HOST and REDIS_PORT in .env

2. **OIDC Authority Not Found**
   - Verify OIDC_AUTHORITY URL is correct and accessible
   - Check that your OIDC provider is running

3. **Invalid Redirect URI**
   - Ensure OIDC_REDIRECT_URI matches what's configured in your provider
   - Check that the redirect URI is exactly `http://localhost:3000/auth/callback`

4. **Client Authentication Failed**
   - Verify OIDC_CLIENT_ID and OIDC_CLIENT_SECRET are correct
   - Ensure your client is configured for confidential flows

### Logging

The examples include detailed logging. Check the console output for:
- Redis connection status
- OIDC configuration details
- Authentication flow progress
- Error messages and stack traces

## 📚 Next Steps

After successfully running the examples:

1. **Integrate into your app**: Use the patterns from `demo-server.cjs`
2. **Customize Redis config**: Adjust TTL, key prefixes, etc.
3. **Add error handling**: Implement proper error boundaries
4. **Deploy to production**: Update URLs and use secure Redis
5. **Monitor performance**: Add logging and metrics

## 🔗 Related Documentation

- **Main Package**: `../README.md`
- **Redis StateStore**: `../SERVER_SIDE_REDIS.md`
- **Implementation Details**: `../IMPLEMENTATION_SUMMARY.md`
- **Distribution Guide**: `../REDIS_README.md`
