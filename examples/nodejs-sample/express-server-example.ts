/**
 * Express Server Example using your .env configuration
 * Run this to test the full OIDC flow with Redis
 */

import dotenv from 'dotenv';
import express from 'express';
import { createClient } from 'redis';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { ServerSideUserManager } from '../src/index.js';

// Load environment variables
dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json());

// Create Redis client using your .env configuration
const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB || '0'),
});

let userManager: ServerSideUserManager;

async function initializeServer() {
    try {
        // Connect to Redis
        console.log('🔌 Connecting to Redis...');
        await redisClient.connect();
        console.log('✅ Connected to Redis successfully');

        // Test Redis connection
        const pingResult = await redisClient.ping();
        console.log('📡 Redis ping result:', pingResult);

        // Initialize server-side user manager with your .env configuration
        userManager = new ServerSideUserManager({
            authority: process.env.OIDC_AUTHORITY!,
            client_id: process.env.OIDC_CLIENT_ID!,
            client_secret: process.env.OIDC_CLIENT_SECRET!,
            redirect_uri: process.env.OIDC_REDIRECT_URI!,
            post_logout_redirect_uri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI,
            scope: 'openid profile email',
            redisClient,
            redisConfig: {
                keyPrefix: 'oidc:demo:',
                ttl: 3600, // 1 hour
            }
        });

        console.log('🎯 OIDC Configuration:');
        console.log('  Authority:', process.env.OIDC_AUTHORITY);
        console.log('  Client ID:', process.env.OIDC_CLIENT_ID);
        console.log('  Redirect URI:', process.env.OIDC_REDIRECT_URI);
        console.log('  Post Logout URI:', process.env.OIDC_POST_LOGOUT_REDIRECT_URI);

    } catch (error) {
        console.error('❌ Failed to initialize server:', error);
        process.exit(1);
    }
}

// Route: Home page
app.get('/', (req, res) => {
    const isAuthenticated = !!req.cookies?.sessionId;
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>OIDC Redis Demo</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
                .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
                button { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
                .btn-primary { background-color: #007bff; color: white; }
                .btn-secondary { background-color: #6c757d; color: white; }
                .btn-danger { background-color: #dc3545; color: white; }
            </style>
        </head>
        <body>
            <h1>🚀 OIDC Redis Integration Demo</h1>
            
            <div class="status ${isAuthenticated ? 'success' : 'info'}">
                <strong>Status:</strong> ${isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
            </div>
            
            <h2>Available Actions:</h2>
            <div>
                <button class="btn-primary" onclick="location.href='/auth/signin'">🔐 Sign In</button>
                <button class="btn-secondary" onclick="location.href='/profile'">👤 View Profile</button>
                <button class="btn-secondary" onclick="location.href='/health'">🏥 Health Check</button>
                ${isAuthenticated ? '<button class="btn-danger" onclick="signOut()">🚪 Sign Out</button>' : ''}
            </div>
            
            <h2>Configuration:</h2>
            <ul>
                <li><strong>Authority:</strong> ${process.env.OIDC_AUTHORITY}</li>
                <li><strong>Client ID:</strong> ${process.env.OIDC_CLIENT_ID}</li>
                <li><strong>Redirect URI:</strong> ${process.env.OIDC_REDIRECT_URI}</li>
                <li><strong>Redis Host:</strong> ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}</li>
            </ul>
            
            <script>
                async function signOut() {
                    try {
                        const response = await fetch('/auth/signout', { method: 'POST' });
                        const result = await response.json();
                        alert(result.message);
                        location.reload();
                    } catch (error) {
                        alert('Sign out failed: ' + error.message);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Route: Initiate OIDC signin
app.get('/auth/signin', async (req, res) => {
    try {
        console.log('🔐 Initiating OIDC signin...');
        
        const signinRequest = await userManager.createSigninRequest({
            state: { 
                returnUrl: (req.query.returnUrl as string) || '/',
                timestamp: Date.now()
            }
        });
        
        console.log('📤 Redirecting to OIDC provider:', signinRequest.url);
        res.redirect(signinRequest.url);
        
    } catch (error) {
        console.error('❌ Signin initiation error:', error);
        res.status(500).json({ 
            error: 'Authentication initialization failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// Route: Handle OIDC callback
app.get('/auth/callback', async (req, res) => {
    try {
        const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        console.log('📥 Processing callback URL:', callbackUrl);
        
        // Process the signin response and get the authenticated user
        const user = await userManager.signinCallback(callbackUrl);
        
        console.log('✅ User authenticated:', {
            sub: user.profile?.sub,
            email: user.profile?.email,
            name: user.profile?.name,
            expiresAt: new Date(user.expires_at! * 1000)
        });

        // Create a session ID and store the user session in Redis
        const sessionId = uuidv4();
        await userManager.storeUserSession(sessionId, user);
        
        console.log('💾 User session stored with ID:', sessionId);
        
        // Set secure session cookie
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000, // 1 hour
            sameSite: 'lax'
        });

        // Redirect to the original return URL or home page
        const returnUrl = (user.state as any)?.returnUrl || '/';
        console.log('🔄 Redirecting to:', returnUrl);
        res.redirect(returnUrl);
        
    } catch (error) {
        console.error('❌ Signin callback error:', error);
        res.status(500).json({ 
            error: 'Authentication callback failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// Middleware: Check authentication status
app.use(async (req: any, res, next) => {
    const sessionId = req.cookies?.sessionId;
    
    if (sessionId) {
        try {
            const user = await userManager.getUserSession(sessionId);
            
            if (user && !user.expired) {
                req.user = user;
                req.sessionId = sessionId;
            } else if (user?.expired) {
                // Session expired, clean up
                console.log('⏰ Session expired, cleaning up:', sessionId);
                await userManager.removeUserSession(sessionId);
                res.clearCookie('sessionId');
            }
        } catch (error) {
            console.error('❌ Session validation error:', error);
            res.clearCookie('sessionId');
        }
    }
    
    next();
});

// Route: Protected profile endpoint
app.get('/profile', (req: any, res) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required',
            redirectTo: '/auth/signin?returnUrl=' + encodeURIComponent(req.originalUrl)
        });
    }
    
    res.json({
        profile: req.user.profile,
        sessionInfo: {
            sessionId: req.sessionId,
            expiresAt: new Date(req.user.expires_at * 1000),
            isExpired: req.user.expired,
            tokenType: req.user.token_type,
            scope: req.user.scope
        },
        tokens: {
            hasAccessToken: !!req.user.access_token,
            hasIdToken: !!req.user.id_token,
            hasRefreshToken: !!req.user.refresh_token
        }
    });
});

// Route: Sign out
app.post('/auth/signout', async (req: any, res) => {
    const sessionId = req.sessionId;
    
    if (sessionId) {
        try {
            await userManager.removeUserSession(sessionId);
            console.log('🚪 Session removed:', sessionId);
        } catch (error) {
            console.error('❌ Signout error:', error);
        }
    }
    
    res.clearCookie('sessionId');
    res.json({ success: true, message: '✅ Signed out successfully' });
});

// Route: Health check
app.get('/health', async (req, res) => {
    try {
        // Check Redis connectivity
        const ping = await redisClient.ping();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            redis: {
                status: ping === 'PONG' ? 'connected' : 'disconnected',
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                database: process.env.REDIS_DB
            },
            oidc: {
                authority: process.env.OIDC_AUTHORITY,
                client_id: process.env.OIDC_CLIENT_ID,
                redirect_uri: process.env.OIDC_REDIRECT_URI
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
        });
    }
});

// Start server
async function startServer() {
    await initializeServer();
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`\n🌟 Server running on http://localhost:${port}`);
        console.log('\n📋 Available endpoints:');
        console.log('  🏠 GET  /                 - Home page with demo UI');
        console.log('  🔐 GET  /auth/signin      - Initiate OIDC authentication');
        console.log('  📥 GET  /auth/callback    - Handle OIDC callback');
        console.log('  👤 GET  /profile          - Get user profile (protected)');
        console.log('  🚪 POST /auth/signout     - Sign out user');
        console.log('  🏥 GET  /health           - Health check');
        console.log('\n🚀 Open http://localhost:' + port + ' in your browser to test!');
    });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await redisClient.quit();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await redisClient.quit();
    process.exit(0);
});

// Start the server
startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

export { app, userManager };
