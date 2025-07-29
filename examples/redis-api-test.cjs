/**
 * Test Redis client methods to understand the API
 */

const dotenv = require('dotenv');
const { createClient } = require('redis');

// Load environment variables
dotenv.config();

async function inspectRedisClient() {
    console.log('🔍 Inspecting Redis Client API...\n');

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

        // Inspect the client methods
        console.log('\n📋 Available Redis client methods:');
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(redisClient))
            .filter(name => typeof redisClient[name] === 'function')
            .sort();
        
        console.log('Methods:', methods.slice(0, 20)); // Show first 20 methods
        
        // Test if specific methods exist
        console.log('\n🔧 Testing method availability:');
        console.log('setex method exists:', typeof redisClient.setex === 'function');
        console.log('setEx method exists:', typeof redisClient.setEx === 'function');
        console.log('set method exists:', typeof redisClient.set === 'function');
        console.log('expire method exists:', typeof redisClient.expire === 'function');
        console.log('get method exists:', typeof redisClient.get === 'function');
        console.log('del method exists:', typeof redisClient.del === 'function');
        console.log('keys method exists:', typeof redisClient.keys === 'function');
        console.log('exists method exists:', typeof redisClient.exists === 'function');

        // Test the actual API
        console.log('\n🧪 Testing Redis operations:');
        
        // Try different ways to set with expiration
        try {
            await redisClient.set('test:key1', 'value1', { EX: 60 });
            console.log('✅ set with options worked');
        } catch (e) {
            console.log('❌ set with options failed:', e.message);
        }

        try {
            await redisClient.setEx('test:key2', 60, 'value2');
            console.log('✅ setEx worked');
        } catch (e) {
            console.log('❌ setEx failed:', e.message);
        }

        try {
            if (typeof redisClient.setex === 'function') {
                await redisClient.setex('test:key3', 60, 'value3');
                console.log('✅ setex worked');
            } else {
                console.log('❌ setex method not available');
            }
        } catch (e) {
            console.log('❌ setex failed:', e.message);
        }

        // Test get
        const val1 = await redisClient.get('test:key1');
        console.log('✅ Retrieved test:key1:', val1);

        // Test keys
        const keys = await redisClient.keys('test:*');
        console.log('✅ Found keys:', keys);

        // Test del
        const delCount = await redisClient.del(['test:key1', 'test:key2', 'test:key3']);
        console.log('✅ Deleted keys count:', delCount);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await redisClient.quit();
        console.log('✅ Redis connection closed');
    }
}

inspectRedisClient();
