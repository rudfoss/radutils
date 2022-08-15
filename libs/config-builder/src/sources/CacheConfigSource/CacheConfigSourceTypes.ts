/**
 * Describes a simple cache service with basic operations used by the Cache Config Source. The data type for the value to cache will allways be a string regardless of the internal data structure used by CacheConfigSource. It should not be altered unless the alteration is reversed when the value is retrieved.
 */
export interface CacheService {
	get: (cacheKey: string) => string | undefined | Promise<string | undefined>
	set: (cacheKey: string, data: string, ttl: number) => boolean | Promise<boolean>
	del: (cacheKey: string) => boolean | Promise<boolean>
}

export interface CacheConfigSourceOptions {
	/**
	 * Specify an optional prefix for all cache keys before they are passed to the cache mechanism.
	 * @default "cacheConfigSource_"
	 */
	keyPrefix?: string

	/**
	 * Specify whether caching is enabled or not. If a function is provided the function is executed on build start to determine if caching is enabled for this specific run.
	 */
	enabled?: (() => boolean | Promise<boolean>) | boolean

	/**
	 * The cache time to live in milliseconds. Is sent as a parameter to the cache service when a value is set. The cache service may determine what type of strategy to use with the timer.
	 * @default 3600000 (1 hour)
	 */
	ttl?: number

	/**
	 * Specify the cache service to use when caching data. Defaults to an in-memory cache if not specified.
	 */
	cache?: CacheService
}
