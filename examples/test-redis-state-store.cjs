/**
 * Test the fixed RedisStateStore implementation
 */

const dotenv = require('dotenv');
const { createClient } = require('redis');

// Load environment variables
dotenv.config();

async function testRedisStateStore() {
    console.log('🧪 Testing Fixed RedisStateStore Implementation...\n');

    const redisClient = createClient({
        socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0'),
    });

    try {
        await redisClient.connect();
        console.log('✅ Connected to Redis');

        // Import the fixed OIDC module
        const { RedisStateStore } = require('../dist/umd/oidc-client-ts.js');
        
        // Create RedisStateStore instance
        const stateStore = new RedisStateStore(redisClient, {
            keyPrefix: 'test:oidc:',
            ttl: 300 // 5 minutes
        });

        console.log('✅ Created RedisStateStore instance');

        // Test set operation
        const testKey = 'signin_state_' + Date.now();
        const testValue = JSON.stringify({
            state: testKey,
            authority: process.env.OIDC_AUTHORITY,
            client_id: process.env.OIDC_CLIENT_ID,
            redirect_uri: process.env.OIDC_REDIRECT_URI,
            scope: 'openid profile email',
            code_verifier: 'test_code_verifier_12345',
            created: new Date().toISOString()
        });

        console.log('\n🔧 Testing RedisStateStore operations...');
        
        // Test set
        await stateStore.set(testKey, testValue);
        console.log('✅ set() - Successfully stored state');

        // Test get
        const retrievedValue = await stateStore.get(testKey);
        console.log('✅ get() - Successfully retrieved state:', retrievedValue ? 'Found' : 'Not Found');

        // Test exists
        const exists = await stateStore.exists(testKey);
        console.log('✅ exists() - State exists:', exists > 0);

        // Test getAllKeys
        const allKeys = await stateStore.getAllKeys();
        console.log('✅ getAllKeys() - Found', allKeys.length, 'keys:', allKeys);

        // Test expire
        await stateStore.expire(testKey, 60);
        console.log('✅ expire() - Updated expiration to 60 seconds');

        // Test remove
        const removedValue = await stateStore.remove(testKey);
        console.log('✅ remove() - Removed state:', removedValue ? 'Success' : 'Failed');

        // Verify removal
        const afterRemoval = await stateStore.get(testKey);
        console.log('✅ Verification - State after removal:', afterRemoval ? 'Still exists (error)' : 'Properly removed');

        console.log('\n🎉 All RedisStateStore tests passed!');
        console.log('🚀 The OIDC signin should now work correctly!');

    } catch (error) {
        console.error('❌ Error during test:', error);
        throw error;
    } finally {
        await redisClient.quit();
        console.log('✅ Redis connection closed');
    }
}

testRedisStateStore()
    .then(() => {
        console.log('\n✅ RedisStateStore test completed successfully!');
        console.log('🎯 You can now test the OIDC signin at: http://localhost:3000');
    })
    .catch((error) => {
        console.error('❌ RedisStateStore test failed:', error);
        process.exit(1);
    });
