/* eslint-disable @typescript-eslint/no-explicit-any */
import { BuildRunContext } from "../../ConfigBuilderTypes"
import { CacheConfigSource } from "./CacheConfigSource"
import { CacheService } from "./CacheConfigSourceTypes"
import { MemoryCache } from "./cacheServices"

class MockCache implements CacheService {
	public store = new Map<string, string>()
	public timeouts = new Map<string, number>()

	public get = jest.fn((cacheKey: string) => {
		return this.store.get(cacheKey)
	})
	public set = jest.fn((cacheKey: string, data: string, ttl: number) => {
		this.store.set(cacheKey, data)
		if (this.timeouts.has(cacheKey)) {
			clearTimeout(this.timeouts.get(cacheKey) as any)
		}
		this.timeouts.set(cacheKey, setTimeout(() => this.store.delete(cacheKey), ttl) as any)
		return true
	})
	public del = jest.fn((cacheKey: string) => {
		if (this.timeouts.has(cacheKey)) {
			clearTimeout(this.timeouts.get(cacheKey) as any)
			this.timeouts.delete(cacheKey)
		}
		return this.store.delete(cacheKey)
	})
}

describe("CacheConfigSource", () => {
	let mockCache: MockCache
	let source: CacheConfigSource
	let mockContext: BuildRunContext

	beforeEach(() => {
		mockContext = { buildFnRef: jest.fn(), sharedData: new Map() }
		mockCache = new MockCache()
		source = new CacheConfigSource({
			cache: mockCache
		})
	})

	it("is defined", () => {
		expect(CacheConfigSource).toBeDefined()
	})
	it("sets default options correctly", () => {
		expect(source["options"]).toEqual({
			enabled: true,
			keyPrefix: "cacheConfigSource_",
			cache: mockCache,
			ttl: 1000 * 60 * 60
		})

		const newSource = new CacheConfigSource()
		expect(newSource["options"]).toEqual({
			enabled: true,
			keyPrefix: "cacheConfigSource_",
			cache: new MemoryCache(),
			ttl: 1000 * 60 * 60
		})
	})
	it("clones with the same optons as new object", () => {
		const source2 = source.clone()
		expect(source2["options"]).not.toBe(source["options"])
		expect(source2["options"]).toEqual(source["options"])
	})

	it("generates cache keys based on buildFn instance", async () => {
		await source.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		expect(typeof source["cacheKey"]).toBe("string")

		const source2 = source.clone()
		expect(source).not.toBe(source2)
		await source2.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		expect(source2["cacheKey"]).toEqual(source["cacheKey"])

		const source3 = source2.clone()
		expect(source3).not.toBe(source2)
		expect(source3).not.toBe(source)

		const buildFn2 = jest.fn()
		expect(mockContext.buildFnRef).not.toBe(buildFn2)
		await source3.onBuildStart({
			context: { ...mockContext, buildFnRef: buildFn2 },
			optionalKeys: new Set(),
			requiredKeys: new Set()
		})
		expect(source3["cacheKey"]).not.toEqual(source2["cacheKey"])
		expect(source3["cacheKey"]).not.toEqual(source["cacheKey"])
	})
	it("can override cache key using context property", async () => {
		const sharedData = new Map<string, unknown>()
		sharedData.set(CacheConfigSource.propNameCacheKeySuffix, "fooBarBaz")
		await source.onBuildStart({
			context: { ...mockContext, sharedData },
			optionalKeys: new Set(),
			requiredKeys: new Set()
		})

		expect(source["cacheKey"]).toBeDefined()
		expect(source["cacheKey"]).toEqual(`${source["options"].keyPrefix}fooBarBaz`)

		sharedData.set(CacheConfigSource.propNameCacheKeySuffix, "anotherCacheKey")
		await source.onBuildStart({
			context: { ...mockContext, sharedData },
			optionalKeys: new Set(),
			requiredKeys: new Set()
		})

		expect(source["cacheKey"]).toBeDefined()
		expect(source["cacheKey"]).toEqual(`${source["options"].keyPrefix}anotherCacheKey`)
	})

	it("caches values when build succeeeds", async () => {
		expect(mockCache.get).not.toHaveBeenCalled()
		await source.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		const getCallLength = mockCache.get.mock.calls.length
		expect(getCallLength).toBeGreaterThan(0)

		const keyValues = new Map<string, unknown>()
		keyValues.set("foo", "foo")
		keyValues.set("bar", true)
		keyValues.set("baz", 42)
		keyValues.set("foo-bar-baz", { hey: true })

		expect(mockCache.set).not.toHaveBeenCalled()
		await source.onBuildSuccess({ keyValues, context: mockContext, config: {} })
		expect(mockCache.set).toHaveBeenCalled()

		await source.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		expect(mockCache.get.mock.calls.length).toBeGreaterThan(getCallLength)
	})

	it("returns cached values on subsequent runs", async () => {
		await source.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		const keyValues = new Map<string, unknown>()
		keyValues.set("foo", "foo")
		keyValues.set("bar", true)
		keyValues.set("baz", 42)
		keyValues.set("foo-bar-baz", { hey: true })
		await source.onBuildSuccess({ keyValues, context: mockContext, config: {} })

		const source2 = source.clone()
		expect(await source2.get("foo")).toEqual(undefined)
		expect(await source2.get("bar")).toEqual(undefined)
		expect(await source2.get("baz")).toEqual(undefined)
		expect(await source2.get("foo-bar-baz")).toEqual(undefined)

		await source2.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		expect(await source2.get("foo")).toEqual("foo")
		expect(await source2.get("bar")).toEqual(true)
		expect(await source2.get("baz")).toEqual(42)
		expect(await source2.get("foo-bar-baz")).toEqual({ hey: true })
	})

	it("caches based on buildFn instance", async () => {
		const keyValues1 = new Map<string, unknown>()
		keyValues1.set("foo", "foo")
		keyValues1.set("bar", true)

		const keyValues2 = new Map<string, unknown>()
		keyValues2.set("baz", 42)
		keyValues2.set("foo-bar-baz", { hey: true })

		await source.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		expect(await source.get("foo")).toEqual(undefined)
		expect(await source.get("bar")).toEqual(undefined)
		expect(await source.get("baz")).toEqual(undefined)
		expect(await source.get("foo-bar-baz")).toEqual(undefined)
		await source.onBuildSuccess({ keyValues: keyValues1, context: mockContext, config: {} })

		const source2 = source.clone()
		expect(await source2.get("foo")).toEqual(undefined)
		expect(await source2.get("bar")).toEqual(undefined)
		expect(await source2.get("baz")).toEqual(undefined)
		expect(await source2.get("foo-bar-baz")).toEqual(undefined)
		await source2.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		expect(await source2.get("foo")).toEqual("foo")
		expect(await source2.get("bar")).toEqual(true)
		expect(await source2.get("baz")).toEqual(undefined)
		expect(await source2.get("foo-bar-baz")).toEqual(undefined)

		const buildFn2 = jest.fn()
		const source3 = source.clone()
		await source3.onBuildStart({
			context: { ...mockContext, buildFnRef: buildFn2 },
			optionalKeys: new Set(),
			requiredKeys: new Set()
		})
		expect(await source3.get("foo")).toEqual(undefined)
		expect(await source3.get("bar")).toEqual(undefined)
		expect(await source3.get("baz")).toEqual(undefined)
		expect(await source3.get("foo-bar-baz")).toEqual(undefined)
		await source3.onBuildSuccess({ keyValues: keyValues2, context: mockContext, config: {} })

		const source4 = source3.clone()
		expect(await source4.get("foo")).toEqual(undefined)
		expect(await source4.get("bar")).toEqual(undefined)
		expect(await source4.get("baz")).toEqual(undefined)
		expect(await source4.get("foo-bar-baz")).toEqual(undefined)
		await source4.onBuildStart({
			context: { ...mockContext, buildFnRef: buildFn2 },
			optionalKeys: new Set(),
			requiredKeys: new Set()
		})
		expect(await source4.get("foo")).toEqual(undefined)
		expect(await source4.get("bar")).toEqual(undefined)
		expect(await source4.get("baz")).toEqual(42)
		expect(await source4.get("foo-bar-baz")).toEqual({ hey: true })
	})

	it("does not return values if disabled", async () => {
		let enabled = true
		const keyValues = new Map<string, unknown>()
		keyValues.set("foo", "foo")
		keyValues.set("bar", true)
		keyValues.set("baz", 42)
		keyValues.set("foo-bar-baz", { hey: true })

		source = new CacheConfigSource({ enabled: () => enabled })
		await source.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		await source.onBuildSuccess({ context: mockContext, keyValues, config: {} })

		const source2 = source.clone()
		await source2.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		expect(await source2.get("foo")).toEqual("foo")
		expect(await source2.get("bar")).toEqual(true)
		expect(await source2.get("baz")).toEqual(42)
		expect(await source2.get("foo-bar-baz")).toEqual({ hey: true })

		enabled = false
		await source2.onBuildStart({ context: mockContext, optionalKeys: new Set(), requiredKeys: new Set() })
		expect(await source2.get("foo")).toEqual(undefined)
		expect(await source2.get("bar")).toEqual(undefined)
		expect(await source2.get("baz")).toEqual(undefined)
		expect(await source2.get("foo-bar-baz")).toEqual(undefined)
	})
})
