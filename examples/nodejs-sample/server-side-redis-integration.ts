/**
 * Example integration showing how to use the server-side OIDC with Redis
 * This example uses your existing .env configuration
 */

import dotenv from 'dotenv';
import { ServerSideUserManager, RedisStateStore } from '../../src/index.js';

// Load environment variables from .env file
dotenv.config();

// Example: Node.js Express server integration
async function expressIntegrationExample() {
    // This would typically be in your Express app setup
    const express = require('express');
    const { createClient } = require('redis');
    const cookieParser = require('cookie-parser');
    const { v4: uuidv4 } = require('uuid');

    const app = express();
    app.use(cookieParser());

    // Redis client setup using your .env configuration
    const redisClient = createClient({
        socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0'),
    });

    await redisClient.connect();

    // Server-side user manager configuration using your .env values
    const userManager = new ServerSideUserManager({
        authority: process.env.OIDC_AUTHORITY!,
        client_id: process.env.OIDC_CLIENT_ID!,
        client_secret: process.env.OIDC_CLIENT_SECRET!,
        redirect_uri: process.env.OIDC_REDIRECT_URI!,
        post_logout_redirect_uri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI,
        scope: 'openid profile email',
        redisClient,
        redisConfig: {
            keyPrefix: 'oidc:auth:',
            ttl: 3600, // 1 hour
        }
    });

    // Route: Initiate OIDC signin
    app.get('/auth/signin', async (req: any, res: any) => {
        try {
            const signinRequest = await userManager.createSigninRequest({
                state: { 
                    returnUrl: req.query.returnUrl || '/',
                    timestamp: Date.now()
                }
            });
            
            console.log('Redirecting to OIDC provider:', signinRequest.url);
            res.redirect(signinRequest.url);
        } catch (error) {
            console.error('Signin initiation error:', error);
            res.status(500).json({ error: 'Authentication initialization failed' });
        }
    });

    // Route: Handle OIDC callback
    app.get('/auth/callback', async (req: any, res: any) => {
        try {
            const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            console.log('Processing callback URL:', callbackUrl);
            
            // Process the signin response and get the authenticated user
            const user = await userManager.signinCallback(callbackUrl);
            
            console.log('User authenticated:', {
                sub: user.profile?.sub,
                email: user.profile?.email,
                name: user.profile?.name,
                expiresAt: new Date(user.expires_at! * 1000)
            });

            // Create a session ID and store the user session in Redis
            const sessionId = uuidv4();
            await userManager.storeUserSession(sessionId, user);
            
            // Set secure session cookie
            res.cookie('sessionId', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000, // 1 hour
                sameSite: 'lax'
            });

            // Redirect to the original return URL or home page
            const returnUrl = user.state?.returnUrl || '/dashboard';
            console.log('Redirecting to:', returnUrl);
            res.redirect(returnUrl);
            
        } catch (error) {
            console.error('Signin callback error:', error);
            res.status(500).json({ 
                error: 'Authentication callback failed',
                details: error.message 
            });
        }
    });

    // Middleware: Check authentication status
    app.use(async (req: any, res: any, next: any) => {
        const sessionId = req.cookies?.sessionId;
        
        if (sessionId) {
            try {
                const user = await userManager.getUserSession(sessionId);
                
                if (user && !user.expired) {
                    req.user = user;
                    req.sessionId = sessionId;
                } else if (user?.expired) {
                    // Session expired, clean up
                    await userManager.removeUserSession(sessionId);
                    res.clearCookie('sessionId');
                }
            } catch (error) {
                console.error('Session validation error:', error);
                res.clearCookie('sessionId');
            }
        }
        
        next();
    });

    // Route: Protected profile endpoint
    app.get('/profile', (req: any, res: any) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                redirectTo: '/auth/signin?returnUrl=' + encodeURIComponent(req.originalUrl)
            });
        }
        
        res.json({
            profile: req.user.profile,
            sessionInfo: {
                expiresAt: new Date(req.user.expires_at * 1000),
                isExpired: req.user.expired,
                tokenType: req.user.token_type
            }
        });
    });

    // Route: Sign out
    app.post('/auth/signout', async (req: any, res: any) => {
        const sessionId = req.sessionId;
        
        if (sessionId) {
            try {
                await userManager.removeUserSession(sessionId);
                console.log('Session removed:', sessionId);
            } catch (error) {
                console.error('Signout error:', error);
            }
        }
        
        res.clearCookie('sessionId');
        res.json({ success: true, message: 'Signed out successfully' });
    });

    // Route: Health check
    app.get('/health', async (req: any, res: any) => {
        try {
            // Check Redis connectivity
            const ping = await redisClient.ping();
            
            res.json({
                status: 'healthy',
                redis: ping === 'PONG' ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log('Available endpoints:');
        console.log('  GET  /auth/signin     - Initiate OIDC authentication');
        console.log('  GET  /auth/callback   - Handle OIDC callback');
        console.log('  GET  /profile         - Get user profile (protected)');
        console.log('  POST /auth/signout    - Sign out user');
        console.log('  GET  /health          - Health check');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('Shutting down gracefully...');
        await redisClient.quit();
        process.exit(0);
    });
}

// Example: Manual Redis state operations
async function redisStateExample() {
    const { createClient } = require('redis');
    
    const redisClient = createClient({
        url: 'redis://localhost:6379'
    });
    
    await redisClient.connect();

    // Create a Redis state store
    const stateStore = new RedisStateStore(redisClient, {
        keyPrefix: 'example:oidc:',
        ttl: 1800 // 30 minutes
    });

    // Simulate OIDC state operations
    console.log('=== Redis State Store Example ===');

    // Store state
    const stateId = 'state_' + Date.now();
    const stateData = JSON.stringify({
        id: stateId,
        authority: 'https://example.com',
        client_id: 'test_client',
        redirect_uri: 'https://app.com/callback',
        scope: 'openid profile email',
        created: Date.now(),
        code_verifier: 'random_code_verifier_value'
    });

    await stateStore.set(stateId, stateData);
    console.log('✓ State stored with ID:', stateId);

    // Check if state exists
    const exists = await stateStore.exists(stateId);
    console.log('✓ State exists:', exists);

    // Retrieve state
    const retrievedState = await stateStore.get(stateId);
    console.log('✓ Retrieved state:', JSON.parse(retrievedState!));

    // List all keys
    const allKeys = await stateStore.getAllKeys();
    console.log('✓ All OIDC keys:', allKeys);

    // Set custom expiration
    await stateStore.expire(stateId, 300); // 5 minutes
    console.log('✓ Updated expiration to 5 minutes');

    // Clean up
    const removedValue = await stateStore.remove(stateId);
    console.log('✓ Removed state:', removedValue ? 'success' : 'failed');

    await redisClient.quit();
    console.log('✓ Redis connection closed');
}

// Example: Session management
async function sessionManagementExample() {
    const { createClient } = require('redis');
    
    const redisClient = createClient();
    await redisClient.connect();

    const userManager = new ServerSideUserManager({
        authority: 'https://example.com',
        client_id: 'test_client',
        client_secret: 'test_secret',
        redirect_uri: 'https://app.com/callback',
        scope: 'openid profile email',
        redisClient,
        redisConfig: {
            keyPrefix: 'sessions:',
            ttl: 7200 // 2 hours
        }
    });

    console.log('=== Session Management Example ===');

    // Create a mock user object (this would normally come from signinCallback)
    const mockUser = {
        access_token: 'mock_access_token',
        token_type: 'Bearer',
        id_token: 'mock_id_token',
        refresh_token: 'mock_refresh_token',
        scope: 'openid profile email',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        profile: {
            sub: '12345',
            name: 'John Doe',
            email: 'john.doe@example.com',
            given_name: 'John',
            family_name: 'Doe'
        },
        state: {
            returnUrl: '/dashboard'
        }
    } as any;

    // Store user session
    const sessionId = 'session_' + Date.now();
    await userManager.storeUserSession(sessionId, mockUser);
    console.log('✓ User session stored with ID:', sessionId);

    // Check if session exists
    const hasSession = await userManager.hasUserSession(sessionId);
    console.log('✓ Session exists:', hasSession);

    // Retrieve user session
    const retrievedUser = await userManager.getUserSession(sessionId);
    console.log('✓ Retrieved user session:', {
        sub: retrievedUser?.profile?.sub,
        email: retrievedUser?.profile?.email,
        expiresAt: retrievedUser?.expires_at
    });

    // Remove session
    await userManager.removeUserSession(sessionId);
    console.log('✓ Session removed');

    // Verify removal
    const sessionAfterRemoval = await userManager.getUserSession(sessionId);
    console.log('✓ Session after removal:', sessionAfterRemoval);

    await redisClient.quit();
    console.log('✓ Redis connection closed');
}

// Export examples for testing
export {
    expressIntegrationExample,
    redisStateExample,
    sessionManagementExample
};

// If running this file directly
if (require.main === module) {
    (async () => {
        console.log('🚀 Starting OIDC Redis Integration Examples...\n');
        
        try {
            await redisStateExample();
            console.log('\n---\n');
            await sessionManagementExample();
            console.log('\n✅ All examples completed successfully!');
        } catch (error) {
            console.error('❌ Example failed:', error);
            process.exit(1);
        }
    })();
}
