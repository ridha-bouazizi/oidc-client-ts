import type { StateStore } from "./StateStore";
import { Logger } from "./utils";

/**
 * Configuration options for Redis connection and behavior
 * @public
 */
export interface RedisConfig {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    ttl?: number; // Time to live in seconds
}

/**
 * Interface for Redis client compatibility
 * @public
 */
export interface RedisClientLike {
    setEx(key: string, seconds: number, value: string): Promise<void>;
    set(key: string, value: string, options?: { EX?: number }): Promise<void>;
    get(key: string): Promise<string | null>;
    del(keys: string | string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    expire(key: string, seconds: number): Promise<boolean>;
    exists(key: string): Promise<number>;
}

/**
 * Redis-backed implementation of StateStore for server-side session storage
 * @public
 */
export class RedisStateStore implements StateStore {
    private readonly _logger = new Logger("RedisStateStore");
    private readonly _redis: RedisClientLike;
    private readonly _prefix: string;
    private readonly _ttl: number;

    public constructor(redisClient: RedisClientLike, config: RedisConfig = {}) {
        this._redis = redisClient;
        this._prefix = config.keyPrefix || "oidc:";
        this._ttl = config.ttl || 3600; // Default 1 hour TTL
    }

    public async set(key: string, value: string): Promise<void> {
        this._logger.create(`set('${key}')`);
        const prefixedKey = this._prefix + key;
        await this._redis.setEx(prefixedKey, this._ttl, value);
    }

    public async get(key: string): Promise<string | null> {
        this._logger.create(`get('${key}')`);
        const prefixedKey = this._prefix + key;
        return await this._redis.get(prefixedKey);
    }

    public async remove(key: string): Promise<string | null> {
        this._logger.create(`remove('${key}')`);
        const prefixedKey = this._prefix + key;
        const value = await this._redis.get(prefixedKey);
        await this._redis.del(prefixedKey);
        return value;
    }

    public async getAllKeys(): Promise<string[]> {
        this._logger.create("getAllKeys");
        const pattern = this._prefix + "*";
        const keys = await this._redis.keys(pattern);
        return keys.map((key: string) => key.substring(this._prefix.length));
    }

    // Redis-specific methods
    public async expire(key: string, seconds: number): Promise<void> {
        this._logger.create(`expire('${key}', ${seconds})`);
        const prefixedKey = this._prefix + key;
        const result = await this._redis.expire(prefixedKey, seconds);
        if (!result) {
            this._logger.warn(`Failed to set expiration for key: ${key}`);
        }
    }

    public async exists(key: string): Promise<boolean> {
        this._logger.create(`exists('${key}')`);
        const prefixedKey = this._prefix + key;
        const result = await this._redis.exists(prefixedKey);
        return result === 1;
    }

    public async flushAll(): Promise<void> {
        this._logger.create("flushAll");
        const pattern = this._prefix + "*";
        const keys = await this._redis.keys(pattern);
        if (keys.length > 0) {
            await this._redis.del(keys);
        }
    }
}
