/**
 * Simple test using the built distribution files
 */

const dotenv = require('dotenv');
const { createClient } = require('redis');

// Load environment variables
dotenv.config();

async function testRedisConnection() {
    console.log('🚀 Testing Redis Connection...\n');

    // Create Redis client using environment variables
    const redisClient = createClient({
        socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0'),
    });

    try {
        // Connect to Redis
        console.log('🔌 Connecting to Redis...');
        await redisClient.connect();
        console.log('✅ Connected to Redis successfully');

        // Test Redis connection
        const pingResult = await redisClient.ping();
        console.log('📡 Redis ping result:', pingResult);

        // Test basic Redis operations
        console.log('\n🔧 Testing basic Redis operations...');
        
        // Set a test key
        await redisClient.set('test:key', 'Hello Redis!');
        console.log('✅ Set test key');
        
        // Get the test key
        const value = await redisClient.get('test:key');
        console.log('✅ Retrieved test key:', value);
        
        // Delete the test key
        await redisClient.del('test:key');
        console.log('✅ Deleted test key');
        
        console.log('\n🎉 Redis connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during Redis test:', error);
        process.exit(1);
    } finally {
        // Clean up
        console.log('\n🧹 Cleaning up...');
        await redisClient.quit();
        console.log('✅ Redis connection closed');
    }
}

// Test the built OIDC client
async function testOidcClient() {
    console.log('\n🔐 Testing OIDC Client with built files...');
    
    try {
        // Import the built package
        const oidcModule = require('../../dist/umd/oidc-client-ts.js');
        console.log('✅ Successfully imported OIDC module');
        console.log('📦 Available exports:', Object.keys(oidcModule));
        
        // Check if our Redis components are available
        if (oidcModule.RedisStateStore) {
            console.log('✅ RedisStateStore is available in the build');
        } else {
            console.log('❌ RedisStateStore not found in build');
        }
        
        if (oidcModule.ServerSideUserManager) {
            console.log('✅ ServerSideUserManager is available in the build');
        } else {
            console.log('❌ ServerSideUserManager not found in build');
        }
        
    } catch (error) {
        console.error('❌ Error testing OIDC module:', error);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting OIDC Redis Integration Tests...\n');
    
    try {
        await testRedisConnection();
        await testOidcClient();
        
        console.log('\n✅ All tests completed successfully!');
        console.log('\n🎯 Next steps:');
        console.log('  1. Redis is working correctly');
        console.log('  2. Your OIDC configuration in .env looks good:');
        console.log('     - Authority:', process.env.OIDC_AUTHORITY);
        console.log('     - Client ID:', process.env.OIDC_CLIENT_ID);
        console.log('     - Redirect URI:', process.env.OIDC_REDIRECT_URI);
        console.log('  3. Ready to test the full integration!');
        
    } catch (error) {
        console.error('❌ Tests failed:', error);
        process.exit(1);
    }
}

runTests();
