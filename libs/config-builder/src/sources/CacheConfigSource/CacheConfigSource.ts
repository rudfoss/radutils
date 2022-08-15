import { createIDGenerator } from "@radutils/config-builder/utils/createIDGenerator"
import { BuildRunContext, ConfigSource, OnBuildStartOptions, OnBuildSuccessOptions } from "../../ConfigBuilderTypes"
import { CacheConfigSourceOptions } from "./CacheConfigSourceTypes"
import { MemoryCache } from "./cacheServices"

interface CacheData {
	dataTuples: [string, unknown][]
}

export class CacheConfigSource implements ConfigSource {
	protected readonly options: Required<CacheConfigSourceOptions>

	protected isEnabled: boolean
	protected cacheKey: string
	protected keyValues = new Map<string, unknown>()

	public constructor(options: CacheConfigSourceOptions = {}) {
		this.options = {
			enabled: true,
			keyPrefix: "cacheConfigSource_",
			cache: new MemoryCache(),
			ttl: 1000 * 60 * 60, // 1 hour
			...options
		}

		this.isEnabled = false
		this.cacheKey = this.updateCacheKey()
	}

	protected updateCacheKey(contextKeyValues?: Map<string, unknown>, buildFn?: BuildRunContext["buildFnRef"]) {
		let keySuffix = contextKeyValues?.get(CacheConfigSource.propNameCacheKeySuffix) as string
		if (!keySuffix) {
			if (buildFn) {
				keySuffix = CacheConfigSource.buildFnKeySuffixes.get(buildFn) ?? CacheConfigSource.buildFnKeySuffixGenerator()
				CacheConfigSource.buildFnKeySuffixes.set(buildFn, keySuffix)
			} else {
				keySuffix = "global"
			}
		}

		this.cacheKey = `${this.options.keyPrefix}${keySuffix}`
		return this.cacheKey
	}
	protected async updateEnabled() {
		if (typeof this.options.enabled === "function") {
			this.isEnabled = await this.options.enabled()
			return
		}
		this.isEnabled = Boolean(this.options.enabled)
	}
	protected async updateKeyValues() {
		const cachedValue = await this.options.cache.get(this.cacheKey)
		if (!cachedValue) return

		const cacheData: CacheData = JSON.parse(cachedValue)
		this.keyValues = new Map(cacheData.dataTuples)
	}

	public async onBuildStart({ context }: OnBuildStartOptions) {
		this.keyValues = new Map()

		this.updateCacheKey(context.sharedData, context.buildFnRef)
		await this.updateEnabled()
		if (this.isEnabled) {
			await this.updateKeyValues()
		}
	}
	public async onBuildSuccess({ keyValues }: OnBuildSuccessOptions) {
		const dataToCache: CacheData = {
			dataTuples: Array.from(keyValues)
		}
		await this.options.cache.set(this.cacheKey, JSON.stringify(dataToCache), this.options.ttl)
	}

	public async get<TValue>(key: string) {
		if (!this.isEnabled) return undefined
		return this.keyValues.get(key) as TValue
	}

	public clone() {
		return new CacheConfigSource(this.options)
	}

	// We only need the function to serve as a key, nothing else. Thus we can disable this lint rule here.
	// eslint-disable-next-line @typescript-eslint/ban-types
	protected static buildFnKeySuffixes = new WeakMap<Function, string>()
	protected static buildFnKeySuffixGenerator = createIDGenerator()

	/**
	 * Contains the property name that the cache config source will look for in shared data when assigning a unique cache key suffix to the run.
	 */
	public static readonly propNameCacheKeySuffix = "cacheConfigSource.cacheKeySuffix"
}
