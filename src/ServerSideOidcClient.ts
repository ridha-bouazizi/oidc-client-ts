import { OidcClient } from "./OidcClient";
import type { OidcClientSettings } from "./OidcClientSettings";
import { RedisStateStore, type RedisConfig } from "./RedisStateStore";
import type { SigninResponse } from "./SigninResponse";
import { User } from "./User";

/**
 * Configuration for server-side OIDC operations with Redis
 * @public
 */
export interface ServerSideOidcConfig extends Omit<OidcClientSettings, "stateStore"> {
    redisClient: any;
    redisConfig?: RedisConfig;
}

/**
 * Server-side OIDC client that uses Redis for state storage
 * Enables signin callback processing on the server side
 * @public
 */
export class ServerSideOidcClient {
    private readonly _client: OidcClient;
    private readonly _redisStateStore: RedisStateStore;

    public constructor(config: ServerSideOidcConfig) {
        const { redisClient, redisConfig, ...oidcSettings } = config;
        
        this._redisStateStore = new RedisStateStore(redisClient, redisConfig);
        
        this._client = new OidcClient({
            stateStore: this._redisStateStore,
            ...oidcSettings
        });
    }

    /**
     * Process signin response from authorization server on the server side
     * @param callbackUrl - The full callback URL including query parameters
     * @returns Promise containing the signin response
     */
    public async processSigninResponse(callbackUrl: string): Promise<SigninResponse> {
        return await this._client.processSigninResponse(callbackUrl);
    }

    /**
     * Create a signin request and store state in Redis
     * This would typically be called on the server to initiate the OIDC flow
     */
    public async createSigninRequest(args: Parameters<OidcClient['createSigninRequest']>[0] = {}) {
        return await this._client.createSigninRequest(args);
    }

    /**
     * Build a User object from the signin response
     * @param signinResponse - The validated signin response
     * @returns User object
     */
    public buildUser(signinResponse: SigninResponse): User {
        return new User(signinResponse);
    }

    /**
     * Get the Redis state store instance for advanced operations
     */
    public get stateStore(): RedisStateStore {
        return this._redisStateStore;
    }

    /**
     * Get the underlying OidcClient instance
     */
    public get client(): OidcClient {
        return this._client;
    }

    /**
     * Clean up expired state entries from Redis
     */
    public async cleanupExpiredState(): Promise<void> {
        await this._client.clearStaleState();
    }
}

/**
 * Server-side UserManager that works with Redis for session storage
 * @public
 */
export class ServerSideUserManager {
    private readonly _serverClient: ServerSideOidcClient;

    public constructor(config: ServerSideOidcConfig) {
        this._serverClient = new ServerSideOidcClient(config);
    }

    /**
     * Process signin callback on the server side
     * @param callbackUrl - The callback URL from the authorization server
     * @returns Promise containing the authenticated User
     */
    public async signinCallback(callbackUrl: string): Promise<User> {
        const signinResponse = await this._serverClient.processSigninResponse(callbackUrl);
        return this._serverClient.buildUser(signinResponse);
    }

    /**
     * Create signin request for server-side initiation
     */
    public async createSigninRequest(args: Parameters<OidcClient['createSigninRequest']>[0] = {}) {
        return await this._serverClient.createSigninRequest(args);
    }

    /**
     * Store user session in Redis
     * @param sessionKey - Unique session identifier
     * @param user - User object to store
     * @param ttl - Time to live in seconds (optional, uses Redis store default)
     */
    public async storeUserSession(sessionKey: string, user: User, ttl?: number): Promise<void> {
        const userJson = JSON.stringify({
            access_token: user.access_token,
            token_type: user.token_type,
            id_token: user.id_token,
            refresh_token: user.refresh_token,
            scope: user.scope,
            profile: user.profile,
            expires_at: user.expires_at,
            state: user.state
        });

        await this._serverClient.stateStore.set(`session:${sessionKey}`, userJson);
        
        if (ttl) {
            await this._serverClient.stateStore.expire(`session:${sessionKey}`, ttl);
        }
    }

    /**
     * Retrieve user session from Redis
     * @param sessionKey - Unique session identifier
     * @returns User object or null if not found
     */
    public async getUserSession(sessionKey: string): Promise<User | null> {
        const userJson = await this._serverClient.stateStore.get(`session:${sessionKey}`);
        if (!userJson) {
            return null;
        }

        try {
            const userData = JSON.parse(userJson);
            return new User(userData);
        } catch (error) {
            // Invalid JSON in storage
            return null;
        }
    }

    /**
     * Remove user session from Redis
     * @param sessionKey - Unique session identifier
     */
    public async removeUserSession(sessionKey: string): Promise<void> {
        await this._serverClient.stateStore.remove(`session:${sessionKey}`);
    }

    /**
     * Check if user session exists
     * @param sessionKey - Unique session identifier
     */
    public async hasUserSession(sessionKey: string): Promise<boolean> {
        return await this._serverClient.stateStore.exists(`session:${sessionKey}`);
    }

    /**
     * Get the underlying server-side client
     */
    public get serverClient(): ServerSideOidcClient {
        return this._serverClient;
    }
}
