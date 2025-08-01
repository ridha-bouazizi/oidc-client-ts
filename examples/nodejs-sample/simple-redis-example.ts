/**
 * Simple Redis State Store Example
 * Tests the basic functionality of RedisStateStore
 */

import dotenv from 'dotenv';
import { createClient } from 'redis';
import { RedisStateStore } from '../../src/RedisStateStore.js';

// Load environment variables
dotenv.config();

async function runSimpleExample() {
    console.log('🚀 Starting Simple Redis State Store Example...\n');

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
        console.log('Connecting to Redis...');
        await redisClient.connect();
        console.log('✅ Connected to Redis successfully');

        // Test Redis connection
        const pingResult = await redisClient.ping();
        console.log('📡 Redis ping result:', pingResult);

        // Create Redis state store
        const stateStore = new RedisStateStore(redisClient, {
            keyPrefix: 'oidc:example:',
            ttl: 300 // 5 minutes
        });

        console.log('\n🔧 Testing RedisStateStore functionality...\n');

        // Test 1: Store and retrieve state
        const stateId = 'test_state_' + Date.now();
        const stateData = JSON.stringify({
            authority: process.env.OIDC_AUTHORITY,
            client_id: process.env.OIDC_CLIENT_ID,
            redirect_uri: process.env.OIDC_REDIRECT_URI,
            scope: 'openid profile email',
            code_verifier: 'test_code_verifier_' + Math.random(),
            created: new Date().toISOString()
        });

        console.log('1️⃣ Storing state with ID:', stateId);
        await stateStore.set(stateId, stateData);
        console.log('✅ State stored successfully');

        console.log('2️⃣ Retrieving state...');
        const retrievedState = await stateStore.get(stateId);
        console.log('✅ State retrieved:', retrievedState ? 'Success' : 'Failed');
        
        if (retrievedState) {
            const parsedState = JSON.parse(retrievedState);
            console.log('📄 State data preview:', {
                authority: parsedState.authority,
                client_id: parsedState.client_id,
                created: parsedState.created
            });
        }

        // Test 2: Check existence
        console.log('3️⃣ Checking if state exists...');
        const exists = await stateStore.exists(stateId);
        console.log('✅ State exists:', exists);

        // Test 3: List all keys
        console.log('4️⃣ Getting all OIDC keys...');
        const allKeys = await stateStore.getAllKeys();
        console.log('✅ Found', allKeys.length, 'OIDC keys:', allKeys);

        // Test 4: Set custom expiration
        console.log('5️⃣ Setting custom expiration (60 seconds)...');
        await stateStore.expire(stateId, 60);
        console.log('✅ Expiration updated');

        // Test 5: Remove state
        console.log('6️⃣ Removing state...');
        const removedData = await stateStore.remove(stateId);
        console.log('✅ State removed:', removedData ? 'Success' : 'Failed');

        // Test 6: Verify removal
        console.log('7️⃣ Verifying removal...');
        const stateAfterRemoval = await stateStore.get(stateId);
        console.log('✅ State after removal:', stateAfterRemoval ? 'Still exists (unexpected)' : 'Properly removed');

        // Test 7: Bulk operations
        console.log('8️⃣ Testing bulk operations...');
        
        // Store multiple states
        const bulkStates = ['bulk1', 'bulk2', 'bulk3'];
        for (const id of bulkStates) {
            await stateStore.set(id, JSON.stringify({ id, timestamp: Date.now() }));
        }
        console.log('✅ Stored 3 bulk states');

        // List keys again
        const keysAfterBulk = await stateStore.getAllKeys();
        console.log('✅ Keys after bulk insert:', keysAfterBulk);

        // Flush all OIDC states
        console.log('9️⃣ Flushing all OIDC states...');
        await stateStore.flushAll();
        console.log('✅ All OIDC states flushed');

        // Verify flush
        const keysAfterFlush = await stateStore.getAllKeys();
        console.log('✅ Keys after flush:', keysAfterFlush.length, 'remaining');

        console.log('\n🎉 All tests completed successfully!\n');

    } catch (error) {
        console.error('❌ Error during example execution:', error);
        process.exit(1);
    } finally {
        // Clean up
        console.log('🧹 Cleaning up...');
        await redisClient.quit();
        console.log('✅ Redis connection closed');
    }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
    runSimpleExample()
        .then(() => {
            console.log('✅ Example completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Example failed:', error);
            process.exit(1);
        });
}

export { runSimpleExample };
