/* eslint-disable @typescript-eslint/no-explicit-any */
import { NPMCache } from "./NPMCache"
import path from "path"
import { ConfigBuilderError } from "../../../errors"

const STATIC_NOW = 1660539328281
const ONE_MINUTE = 1000 * 60

/*
This test uses the file system
*/

describe("NPMCache", () => {
	let mockCache: NPMCache
	beforeEach(() => {
		mockCache = new NPMCache()
		mockCache["getNow"] = jest.fn(() => STATIC_NOW)
	})
	afterEach(() => {
		mockCache.clear()
	})

	it("is defined", () => {
		expect(typeof NPMCache).toEqual("function")
	})
	it("constructs with default options", () => {
		expect(mockCache["options"]).toEqual({
			cacheFileName: NPMCache.defaultFileName,
			cwd: process.cwd()
		})

		const emptyInst = new NPMCache({})
		expect(emptyInst["options"]).toEqual({
			cacheFileName: NPMCache.defaultFileName,
			cwd: process.cwd()
		})
	})
	it("has a current time function", () => {
		const cache = new NPMCache()
		const now = new Date().getTime()
		const gottenNow = cache["getNow"]()

		// Adds a tiny buffer to ensure we are close
		expect(gottenNow).toBeGreaterThanOrEqual(now - 2)
		expect(gottenNow).toBeLessThanOrEqual(now + 2)
	})

	it("finds cache file", async () => {
		mockCache["init"]()
		expect(mockCache["cacheFile"]).toContain(path.normalize(`${NPMCache.cacheDirName}/${NPMCache.defaultFileName}`))
	})
	it("supports overriding the cache file name only", () => {
		const cache1 = new NPMCache({ cacheFileName: "foo.json" })
		const cache2 = new NPMCache({ cacheFileName: "bar.json" })

		mockCache["init"]()
		cache1["init"]()
		cache2["init"]()

		expect(mockCache["cacheFile"]?.endsWith(NPMCache.defaultFileName)).toBe(true)
		expect(cache1["cacheFile"]?.endsWith("foo.json")).toBe(true)
		expect(cache2["cacheFile"]?.endsWith("bar.json")).toBe(true)
	})
	it("supports overriding cache file location", () => {
		const cachePath = "c:/foo/bar/cache/file.json"
		mockCache = new NPMCache({ cachePath })
		mockCache["init"]()
		expect(mockCache["cacheFile"]).toEqual(path.normalize(cachePath))
	})
	it("returns undefined if cache is empty", async () => {
		expect(await mockCache.get("foo")).toEqual(undefined)
		expect(await mockCache.get("bar")).toEqual(undefined)
		expect(await mockCache.get("baz")).toEqual(undefined)
	})

	it("throws if no cache dir can be found", () => {
		mockCache["findCacheDir"] = jest.fn(() => () => undefined)
		expect(async () => {
			await mockCache.get("foo")
		}).rejects.toThrow(ConfigBuilderError)
		expect(async () => {
			await mockCache.set("foo", "foo", 42)
		}).rejects.toThrow(ConfigBuilderError)
		expect(async () => {
			await mockCache["writeCache"]({ cache: {} })
		}).rejects.toThrow(ConfigBuilderError)
	})

	it("caches data", async () => {
		expect(await mockCache.set("foo", "foo", ONE_MINUTE)).toEqual(true)
		expect(await mockCache.set("bar", JSON.stringify({ bar: 42, hey: true }), ONE_MINUTE)).toEqual(true)

		expect(await mockCache.get("foo")).toEqual("foo")
		expect(JSON.parse((await mockCache.get("bar")) as any)).toEqual({ bar: 42, hey: true })
	})
	it("does not cache data with <= 0 ttl", async () => {
		expect(await mockCache.set("foo", "foo", 0)).toEqual(false)
		expect(await mockCache.set("bar", JSON.stringify({ bar: 42, hey: true }), -0)).toEqual(false)
		expect(await mockCache.set("baz", "baz", -12231)).toEqual(false)

		expect(await mockCache.get("foo")).toEqual(undefined)
		expect(await mockCache.get("bar")).toEqual(undefined)
		expect(await mockCache.get("baz")).toEqual(undefined)
	})
	it("does not return expired entries", async () => {
		expect(await mockCache.set("foo", "foo", ONE_MINUTE)).toEqual(true)
		expect(await mockCache.set("bar", JSON.stringify({ bar: 42, hey: true }), ONE_MINUTE)).toEqual(true)

		expect(await mockCache.get("foo")).toEqual("foo")
		expect(JSON.parse((await mockCache.get("bar")) as any)).toEqual({ bar: 42, hey: true })

		const mockGetNow = mockCache["getNow"] as jest.Mock
		mockGetNow.mockImplementation(() => STATIC_NOW + ONE_MINUTE)

		expect(await mockCache.get("foo")).toEqual(undefined)
		expect(await mockCache.get("bar")).toEqual(undefined)
	})
	it("supports explicit deletes", async () => {
		expect(await mockCache.set("foo", "foo", ONE_MINUTE)).toEqual(true)
		expect(await mockCache.set("bar", JSON.stringify({ bar: 42, hey: true }), ONE_MINUTE)).toEqual(true)
		expect(await mockCache.set("baz", "baz", ONE_MINUTE)).toEqual(true)
		expect(await mockCache.get("foo")).toEqual("foo")
		expect(JSON.parse((await mockCache.get("bar")) as any)).toEqual({ bar: 42, hey: true })

		await mockCache.del("foo")
		await mockCache.del("bar")
		expect(await mockCache.get("foo")).toEqual(undefined)
		expect(await mockCache.get("bar")).toEqual(undefined)
		expect(await mockCache.get("baz")).toEqual("baz")
	})
})
