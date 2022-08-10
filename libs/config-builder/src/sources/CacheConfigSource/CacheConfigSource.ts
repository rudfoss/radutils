import { ConfigSource } from "../../ConfigBuilderTypes"
import { CacheConfigSourceOptions } from "./CacheConfigSourceTypes"
import { MemoryCache } from "./cacheServices"

/**
 * This source does not immediately provide any configuration values. Instead it will cache the result of the first successfull run of a build and serve those keys immediately on the next run. It supports any cache mechanism that matches its expected interface as well as multiple build functions as long as they are allways executed in the same order.
 */
export class CacheConfigSource implements ConfigSource {
	protected readonly options: Required<CacheConfigSourceOptions>
	protected cachedValues = new Map<string, unknown>()

	public constructor(options: CacheConfigSourceOptions = {}) {
		this.options = {
			enabled: true,
			keyPrefix: "cacheConfigSource_",
			cache: new MemoryCache(),
			ttl: 1000 * 60 * 60, // 1 hour
			...options
		}
	}

	public async onBuildStart() {}

	public async get<TValue>(key: string): Promise<TValue | undefined> {
		return this.cachedValues.get(key) as TValue
	}

	public clone() {
		return new CacheConfigSource(this.options)
	}
}
