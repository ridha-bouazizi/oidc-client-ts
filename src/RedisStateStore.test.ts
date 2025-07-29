// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { RedisStateStore } from "./RedisStateStore";

// Mock Redis client for testing
const createMockRedisClient = () => {
    const store = new Map<string, string>();
    const ttls = new Map<string, number>();

    return {
        setex: jest.fn(async (key: string, ttl: number, value: string) => {
            store.set(key, value);
            ttls.set(key, ttl);
            return 'OK';
        }),
        get: jest.fn(async (key: string) => {
            return store.get(key) || null;
        }),
        del: jest.fn(async (...keys: string[]) => {
            let deleted = 0;
            for (const key of keys) {
                if (store.delete(key)) {
                    ttls.delete(key);
                    deleted++;
                }
            }
            return deleted;
        }),
        keys: jest.fn(async (pattern: string) => {
            const regex = new RegExp(pattern.replace('*', '.*'));
            return Array.from(store.keys()).filter(key => regex.test(key));
        }),
        expire: jest.fn(async (key: string, seconds: number) => {
            if (store.has(key)) {
                ttls.set(key, seconds);
                return 1;
            }
            return 0;
        }),
        exists: jest.fn(async (key: string) => {
            return store.has(key) ? 1 : 0;
        }),
        // Helper methods for testing
        _getStore: () => store,
        _getTtls: () => ttls,
        _clear: () => {
            store.clear();
            ttls.clear();
        }
    };
};

describe("RedisStateStore", () => {
    let mockRedis: ReturnType<typeof createMockRedisClient>;
    let subject: RedisStateStore;
    const prefix = "test_prefix:";

    beforeEach(() => {
        mockRedis = createMockRedisClient();
        subject = new RedisStateStore(mockRedis, { keyPrefix: prefix });
    });

    afterEach(() => {
        mockRedis._clear();
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should use default prefix when none provided", () => {
            const store = new RedisStateStore(mockRedis);
            expect(store).toBeDefined();
        });

        it("should use custom prefix when provided", () => {
            const store = new RedisStateStore(mockRedis, { keyPrefix: "custom:" });
            expect(store).toBeDefined();
        });

        it("should use default TTL when none provided", () => {
            const store = new RedisStateStore(mockRedis);
            expect(store).toBeDefined();
        });
    });

    describe("set", () => {
        it("should store value with prefixed key", async () => {
            // act
            await subject.set("key", "value");

            // assert
            expect(mockRedis.setex).toHaveBeenCalledWith(prefix + "key", 3600, "value");
        });

        it("should use custom TTL when provided", async () => {
            // arrange
            const customStore = new RedisStateStore(mockRedis, { keyPrefix: prefix, ttl: 7200 });

            // act
            await customStore.set("key", "value");

            // assert
            expect(mockRedis.setex).toHaveBeenCalledWith(prefix + "key", 7200, "value");
        });

        it("should handle Redis errors", async () => {
            // arrange
            mockRedis.setex.mockRejectedValue(new Error("Redis error"));

            // act & assert
            await expect(subject.set("key", "value")).rejects.toThrow("Redis error");
        });
    });

    describe("get", () => {
        it("should retrieve value with prefixed key", async () => {
            // arrange
            await subject.set("key", "value");

            // act
            const result = await subject.get("key");

            // assert
            expect(mockRedis.get).toHaveBeenCalledWith(prefix + "key");
            expect(result).toEqual("value");
        });

        it("should return null for non-existent key", async () => {
            // act
            const result = await subject.get("nonexistent");

            // assert
            expect(result).toBeNull();
        });

        it("should handle Redis errors", async () => {
            // arrange
            mockRedis.get.mockRejectedValue(new Error("Redis error"));

            // act & assert
            await expect(subject.get("key")).rejects.toThrow("Redis error");
        });
    });

    describe("remove", () => {
        it("should remove and return value", async () => {
            // arrange
            await subject.set("key", "value");

            // act
            const result = await subject.remove("key");

            // assert
            expect(mockRedis.get).toHaveBeenCalledWith(prefix + "key");
            expect(mockRedis.del).toHaveBeenCalledWith(prefix + "key");
            expect(result).toEqual("value");
        });

        it("should return null for non-existent key", async () => {
            // act
            const result = await subject.remove("nonexistent");

            // assert
            expect(result).toBeNull();
        });

        it("should handle Redis errors", async () => {
            // arrange
            mockRedis.get.mockRejectedValue(new Error("Redis error"));

            // act & assert
            await expect(subject.remove("key")).rejects.toThrow("Redis error");
        });
    });

    describe("getAllKeys", () => {
        it("should return all keys with prefix stripped", async () => {
            // arrange
            await subject.set("key1", "value1");
            await subject.set("key2", "value2");

            // act
            const keys = await subject.getAllKeys();

            // assert
            expect(mockRedis.keys).toHaveBeenCalledWith(prefix + "*");
            expect(keys).toEqual(expect.arrayContaining(["key1", "key2"]));
        });

        it("should return empty array when no keys exist", async () => {
            // act
            const keys = await subject.getAllKeys();

            // assert
            expect(keys).toEqual([]);
        });

        it("should handle Redis errors", async () => {
            // arrange
            mockRedis.keys.mockRejectedValue(new Error("Redis error"));

            // act & assert
            await expect(subject.getAllKeys()).rejects.toThrow("Redis error");
        });
    });

    describe("expire", () => {
        it("should set expiration on prefixed key", async () => {
            // arrange
            await subject.set("key", "value");

            // act
            await subject.expire("key", 300);

            // assert
            expect(mockRedis.expire).toHaveBeenCalledWith(prefix + "key", 300);
        });

        it("should handle Redis errors", async () => {
            // arrange
            mockRedis.expire.mockRejectedValue(new Error("Redis error"));

            // act & assert
            await expect(subject.expire("key", 300)).rejects.toThrow("Redis error");
        });
    });

    describe("exists", () => {
        it("should return true for existing key", async () => {
            // arrange
            await subject.set("key", "value");

            // act
            const result = await subject.exists("key");

            // assert
            expect(mockRedis.exists).toHaveBeenCalledWith(prefix + "key");
            expect(result).toBe(true);
        });

        it("should return false for non-existent key", async () => {
            // act
            const result = await subject.exists("nonexistent");

            // assert
            expect(result).toBe(false);
        });

        it("should handle Redis errors", async () => {
            // arrange
            mockRedis.exists.mockRejectedValue(new Error("Redis error"));

            // act & assert
            await expect(subject.exists("key")).rejects.toThrow("Redis error");
        });
    });

    describe("flushAll", () => {
        it("should delete all keys with prefix", async () => {
            // arrange
            await subject.set("key1", "value1");
            await subject.set("key2", "value2");

            // act
            await subject.flushAll();

            // assert
            expect(mockRedis.keys).toHaveBeenCalledWith(prefix + "*");
            expect(mockRedis.del).toHaveBeenCalledWith(prefix + "key1", prefix + "key2");
        });

        it("should handle empty key set", async () => {
            // act
            await subject.flushAll();

            // assert
            expect(mockRedis.keys).toHaveBeenCalledWith(prefix + "*");
            expect(mockRedis.del).not.toHaveBeenCalled();
        });

        it("should handle Redis errors", async () => {
            // arrange
            mockRedis.keys.mockRejectedValue(new Error("Redis error"));

            // act & assert
            await expect(subject.flushAll()).rejects.toThrow("Redis error");
        });
    });

    describe("integration scenarios", () => {
        it("should handle OIDC state flow", async () => {
            // Simulate OIDC state storage and retrieval
            const stateId = "state_12345";
            const stateData = JSON.stringify({
                id: stateId,
                authority: "https://example.com",
                client_id: "test_client",
                redirect_uri: "https://app.com/callback",
                scope: "openid profile",
                created: Date.now()
            });

            // Store state
            await subject.set(stateId, stateData);

            // Verify storage
            expect(await subject.exists(stateId)).toBe(true);

            // Retrieve state
            const retrievedData = await subject.get(stateId);
            expect(retrievedData).toEqual(stateData);

            // Clean up
            const removed = await subject.remove(stateId);
            expect(removed).toEqual(stateData);
            expect(await subject.exists(stateId)).toBe(false);
        });

        it("should handle concurrent operations", async () => {
            // Simulate multiple concurrent operations
            const operations = Array.from({ length: 10 }, (_, i) => 
                subject.set(`key_${i}`, `value_${i}`)
            );

            await Promise.all(operations);

            const keys = await subject.getAllKeys();
            expect(keys).toHaveLength(10);

            // Verify all values
            for (let i = 0; i < 10; i++) {
                const value = await subject.get(`key_${i}`);
                expect(value).toEqual(`value_${i}`);
            }
        });
    });
});
