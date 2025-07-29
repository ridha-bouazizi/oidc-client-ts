/**
 * Express Server Example using your .env configuration
 * This uses the built distribution files
 */

const dotenv = require('dotenv');
const express = require('express');
const { createClient } = require('redis');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// Import from built distribution
const { ServerSideUserManager } = require('../dist/umd/oidc-client-ts.js');

const app = express();
app.use(cookieParser());
app.use(express.json());

let redisClient;
let userManager;

async function initializeServer() {
    try {
        // Create Redis client using your .env configuration
        redisClient = createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
            },
            password: process.env.REDIS_PASSWORD || undefined,
            database: parseInt(process.env.REDIS_DB || '0'),
        });

        // Connect to Redis
        console.log('🔌 Connecting to Redis...');
        await redisClient.connect();
        console.log('✅ Connected to Redis successfully');

        // Test Redis connection
        const pingResult = await redisClient.ping();
        console.log('📡 Redis ping result:', pingResult);

        // Initialize server-side user manager with your .env configuration
        userManager = new ServerSideUserManager({
            authority: process.env.OIDC_AUTHORITY,
            client_id: process.env.OIDC_CLIENT_ID,
            client_secret: process.env.OIDC_CLIENT_SECRET,
            redirect_uri: process.env.OIDC_REDIRECT_URI,
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
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    max-width: 1000px; 
                    margin: 0 auto; 
                    padding: 20px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    color: #333;
                }
                .container {
                    background: white;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .status { 
                    padding: 15px; 
                    border-radius: 8px; 
                    margin: 15px 0; 
                    font-weight: bold;
                }
                .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
                button { 
                    padding: 12px 24px; 
                    margin: 8px; 
                    border: none; 
                    border-radius: 6px; 
                    cursor: pointer; 
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
                .btn-primary { background-color: #007bff; color: white; }
                .btn-secondary { background-color: #6c757d; color: white; }
                .btn-danger { background-color: #dc3545; color: white; }
                .btn-success { background-color: #28a745; color: white; }
                .config-item { 
                    background: #f8f9fa; 
                    padding: 10px; 
                    margin: 5px 0; 
                    border-radius: 5px; 
                    border-left: 4px solid #007bff;
                }
                h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
                h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                .endpoint { 
                    background: #e8f4f8; 
                    padding: 8px 12px; 
                    margin: 4px 0; 
                    border-radius: 4px; 
                    font-family: monospace;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 OIDC Redis Integration Demo</h1>
                
                <div class="status ${isAuthenticated ? 'success' : 'info'}">
                    <span style="font-size: 20px;">${isAuthenticated ? '✅' : '❌'}</span>
                    <strong>Authentication Status:</strong> ${isAuthenticated ? 'Authenticated & Session Active' : 'Not Authenticated'}
                </div>
                
                <h2>🎮 Available Actions</h2>
                <div style="text-align: center;">
                    <button class="btn-primary" onclick="location.href='/auth/signin'">🔐 Start OIDC Login</button>
                    <button class="btn-secondary" onclick="location.href='/profile'">👤 View Profile</button>
                    <button class="btn-success" onclick="location.href='/health'">🏥 Health Check</button>
                    ${isAuthenticated ? '<button class="btn-danger" onclick="signOut()">🚪 Sign Out</button>' : ''}
                </div>
                
                <h2>⚙️ Configuration</h2>
                <div class="config-item"><strong>🔐 Authority:</strong> ${process.env.OIDC_AUTHORITY}</div>
                <div class="config-item"><strong>🆔 Client ID:</strong> ${process.env.OIDC_CLIENT_ID}</div>
                <div class="config-item"><strong>🔄 Redirect URI:</strong> ${process.env.OIDC_REDIRECT_URI}</div>
                <div class="config-item"><strong>🗄️ Redis:</strong> ${process.env.REDIS_HOST}:${process.env.REDIS_PORT} (DB: ${process.env.REDIS_DB})</div>
                
                <h2>🌐 API Endpoints</h2>
                <div class="endpoint">GET  /                 - This demo page</div>
                <div class="endpoint">GET  /auth/signin      - Initiate OIDC authentication</div>
                <div class="endpoint">GET  /auth/callback    - Handle OIDC callback (${process.env.OIDC_REDIRECT_URI})</div>
                <div class="endpoint">GET  /profile          - Get user profile (protected)</div>
                <div class="endpoint">POST /auth/signout     - Sign out user</div>
                <div class="endpoint">GET  /health           - System health check</div>
                
                <div style="margin-top: 30px; padding: 20px; background: #f1f3f4; border-radius: 8px;">
                    <h3>🔍 How it works:</h3>
                    <ol>
                        <li><strong>Click "Start OIDC Login"</strong> - Initiates the OpenID Connect flow</li>
                        <li><strong>Authenticate</strong> - You'll be redirected to your OIDC provider (${process.env.OIDC_AUTHORITY})</li>
                        <li><strong>Callback Processing</strong> - After login, you'll return to this app with tokens</li>
                        <li><strong>Session Storage</strong> - Your session is stored in Redis with a secure cookie</li>
                        <li><strong>Protected Access</strong> - Access protected resources while authenticated</li>
                    </ol>
                </div>
            </div>
            
            <script>
                async function signOut() {
                    if (!confirm('Are you sure you want to sign out?')) return;
                    
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
                returnUrl: req.query.returnUrl || '/',
                timestamp: Date.now()
            }
        });
        
        console.log('📤 Redirecting to OIDC provider:', signinRequest.url);
        res.redirect(signinRequest.url);
        
    } catch (error) {
        console.error('❌ Signin initiation error:', error);
        res.status(500).json({ 
            error: 'Authentication initialization failed',
            details: error.message
        });
    }
});

// Route: Handle OIDC callback
app.get('/auth/callback', async (req, res) => {
    try {
        const callbackUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        console.log('📥 Processing callback URL:', callbackUrl);
        
        // Process the signin response and get the authenticated user
        const user = await userManager.signinCallback(callbackUrl);
        
        console.log('✅ User authenticated:', {
            sub: user.profile?.sub,
            email: user.profile?.email,
            name: user.profile?.name,
            expiresAt: new Date(user.expires_at * 1000)
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
        const returnUrl = user.state?.returnUrl || '/';
        console.log('🔄 Redirecting to:', returnUrl);
        res.redirect(returnUrl);
        
    } catch (error) {
        console.error('❌ Signin callback error:', error);
        res.status(500).json({ 
            error: 'Authentication callback failed',
            details: error.message
        });
    }
});

// Middleware: Check authentication status
app.use(async (req, res, next) => {
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
app.get('/profile', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Please sign in to access this resource',
            redirectTo: '/auth/signin?returnUrl=' + encodeURIComponent(req.originalUrl)
        });
    }
    
    res.json({
        message: '✅ Profile accessed successfully!',
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
app.post('/auth/signout', async (req, res) => {
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
            status: '✅ System Healthy',
            timestamp: new Date().toISOString(),
            redis: {
                status: ping === 'PONG' ? '✅ Connected' : '❌ Disconnected',
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                database: process.env.REDIS_DB,
                ping: ping
            },
            oidc: {
                authority: process.env.OIDC_AUTHORITY,
                client_id: process.env.OIDC_CLIENT_ID,
                redirect_uri: process.env.OIDC_REDIRECT_URI,
                post_logout_redirect_uri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI
            },
            package: {
                name: '@ridhabouazizi/oidc-client-ts-redis',
                features: ['RedisStateStore', 'ServerSideUserManager', 'Server-side OIDC']
            }
        });
    } catch (error) {
        res.status(500).json({
            status: '❌ System Unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Start server
async function startServer() {
    await initializeServer();
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log('\\n🌟━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 OIDC Redis Integration Demo Server is Running!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 Server URL: http://localhost:' + port);
        console.log('🏠 Home Page:  http://localhost:' + port);
        console.log('🔐 Sign In:    http://localhost:' + port + '/auth/signin');
        console.log('👤 Profile:    http://localhost:' + port + '/profile');
        console.log('🏥 Health:     http://localhost:' + port + '/health');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 Your OIDC Provider: ' + process.env.OIDC_AUTHORITY);
        console.log('🆔 Client ID: ' + process.env.OIDC_CLIENT_ID);
        console.log('🔄 Callback URL: ' + process.env.OIDC_REDIRECT_URI);
        console.log('🗄️ Redis: ' + process.env.REDIS_HOST + ':' + process.env.REDIS_PORT);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 Open http://localhost:' + port + ' in your browser to test!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
    });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\\n🛑 Shutting down gracefully...');
    if (redisClient) await redisClient.quit();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\\n🛑 Shutting down gracefully...');
    if (redisClient) await redisClient.quit();
    process.exit(0);
});

// Start the server
startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
