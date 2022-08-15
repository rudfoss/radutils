/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CacheService } from "../CacheConfigSourceTypes"
import findCacheDir from "find-cache-dir"
import { ConfigBuilderError } from "@radutils/config-builder/errors"
import path from "path"
import fs from "fs"

/**
 * Specify options for the NPMCache instance.
 */
export interface NPMCacheOptions {
	/**
	 * Override the default cache file name. Set this if you have multiple applications using the same cache folder and don't want them to collide.
	 * @default NPMCache.defaultFileName
	 */
	cacheFileName?: string
	/**
	 * Override the cache folder and file name with a specific path and file name. This option should specify a full path and file name for the new location. Cache data is stored as a json string so you may want to add the `.json` extension.
	 * @default [autodetect cache directory]
	 */
	cachePath?: string
	/**
	 * Directory to start searching for a `package.json` from.
	 * @default process.cwd()
	 */
	cwd?: string
}

interface CacheEntry {
	key: string
	timestamp: number
	ttl: number
	exp: number
	data: string
}

interface CacheData {
	cache: Record<string, CacheEntry>
}

/**
 * This cache service stores data on disk in the `node_modules` `cache` directory (using npm module `find-cache-dir`). This allows cache values to survive application restarts (unline MemoryCache). This cache mechansim is primarily meant for development environments to speed up testing.
 */
export class NPMCache implements CacheService {
	protected readonly options: Required<Omit<NPMCacheOptions, "cachePath">> & Pick<NPMCacheOptions, "cachePath">

	protected cacheFile: string | undefined

	public constructor(options: NPMCacheOptions = {}) {
		this.options = {
			cacheFileName: NPMCache.defaultFileName,
			cwd: process.cwd(),
			...options
		}
	}

	protected getNow() {
		return new Date().getTime()
	}
	protected findCacheDir() {
		return findCacheDir
	}

	protected init() {
		if (this.cacheFile) return
		if (this.options.cachePath) {
			this.cacheFile = path.resolve(this.options.cachePath)
		} else {
			this.cacheFile = this.findCacheDir()({
				name: NPMCache.cacheDirName,
				create: true,
				thunk: true,
				cwd: this.options.cwd
			})?.(this.options.cacheFileName)
		}
	}

	protected async readCache() {
		this.init()
		if (!this.cacheFile) {
			throw new ConfigBuilderError(
				`findCacheDir was unable to locate a cache directory. There may not be a suitable node_modules path present. Use "cachePath" option to specify one manually.`
			)
		}

		return new Promise<CacheData>((resolve, reject) =>
			fs.readFile(this.cacheFile!, "utf-8", (err, data) => {
				if (err) {
					if (err.code === "ENOENT") {
						resolve({ cache: {} })
						return
					}
					reject(err)
					return
				}
				resolve(JSON.parse(data))
			})
		)
	}
	protected async writeCache(cacheData: CacheData) {
		this.init()
		if (!this.cacheFile) {
			throw new ConfigBuilderError(
				`findCacheDir was unable to locate a cache directory. There may not be a suitable node_modules path present. Use "cachePath" option to specify one manually.`
			)
		}

		return new Promise<CacheData>((resolve, reject) =>
			fs.writeFile(this.cacheFile!, JSON.stringify(cacheData), "utf-8", (err) => {
				if (err) {
					reject(err)
					return
				}
				resolve(cacheData)
			})
		)
	}

	public async get(cacheKey: string) {
		const cache = await this.readCache()
		const entry = cache.cache[cacheKey]
		const now = this.getNow()

		if (!entry) {
			return undefined
		}

		if (entry.exp <= now) {
			delete cache.cache[cacheKey]
			await this.writeCache(cache)
			return undefined
		}

		return entry.data
	}
	public async set(cacheKey: string, data: string, ttl: number) {
		if (ttl <= 0) return false

		const cache: CacheData = await this.readCache()
		const entry: CacheEntry = {
			data,
			key: cacheKey,
			ttl,
			exp: this.getNow() + ttl,
			timestamp: this.getNow()
		}
		cache.cache[cacheKey] = entry
		await this.writeCache(cache)
		return true
	}
	public async del(cacheKey: string) {
		const cache = await this.readCache()
		delete cache.cache[cacheKey]
		await this.writeCache(cache)
		return true
	}

	/**
	 * Deletes the cache file from the cache dir (if one exists). This is done synchronously and the directory is not removed.
	 */
	public clear() {
		this.init()
		if (!this.cacheFile) return
		if (fs.existsSync(this.cacheFile)) {
			fs.unlinkSync(this.cacheFile)
		}
	}

	public static readonly cacheDirName = "config-builder-npm-cache"
	public static readonly defaultFileName = "configBuilderNPMCache.json"
}
