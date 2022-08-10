/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheService } from "../CacheConfigSourceTypes"

/**
 * A very simple memory cache with a fixed window timeout.
 */
export class MemoryCache implements CacheService {
	protected cache = new Map<string, string>()
	protected timeouts = new Map<string, number>()

	public get(cacheKey: string) {
		return this.cache.get(cacheKey)
	}
	public set(cacheKey: string, data: string, ttl: number) {
		if (ttl <= 0) {
			return true
		}

		this.cache.set(cacheKey, data)
		if (ttl !== Infinity) {
			if (this.timeouts.get(cacheKey)) {
				clearTimeout(this.timeouts.get(cacheKey) as any)
			}
			this.timeouts.set(cacheKey, setTimeout(() => this.del(cacheKey), ttl) as any)
		}

		return true
	}
	public del(cacheKey: string) {
		return this.cache.delete(cacheKey)
	}
}
