import { MemoryCache } from "./MemoryCache"

jest.useFakeTimers()

describe("MemoryCache", () => {
	let mockCache: MemoryCache
	beforeEach(() => {
		mockCache = new MemoryCache()
	})

	it("is defined", () => {
		expect(MemoryCache).toBeDefined()
	})
	it("caches values and returns them", async () => {
		await mockCache.set("foo", "foo", 1000)
		await mockCache.set("bar", "bar", 1000)
		await mockCache.set("baz", "baz", 1000)
		await mockCache.set("guid", "e138df00-98eb-46af-9774-02c629cfb00d", 1000)

		expect(await mockCache.get("foo")).toEqual("foo")
		expect(await mockCache.get("bar")).toEqual("bar")
		expect(await mockCache.get("baz")).toEqual("baz")
		expect(await mockCache.get("guid")).toEqual("e138df00-98eb-46af-9774-02c629cfb00d")
	})

	it("expires values when timer expires", async () => {
		await mockCache.set("foo", "foo", 1000)
		await mockCache.set("bar", "bar", 1000)
		await mockCache.set("baz", "baz", 1000)
		await mockCache.set("guid", "e138df00-98eb-46af-9774-02c629cfb00d", 1000)

		expect(await mockCache.get("foo")).toEqual("foo")
		expect(await mockCache.get("bar")).toEqual("bar")
		expect(await mockCache.get("baz")).toEqual("baz")
		expect(await mockCache.get("guid")).toEqual("e138df00-98eb-46af-9774-02c629cfb00d")
		jest.runAllTimers()
		expect(await mockCache.get("foo")).toEqual(undefined)
		expect(await mockCache.get("bar")).toEqual(undefined)
		expect(await mockCache.get("baz")).toEqual(undefined)
		expect(await mockCache.get("guid")).toEqual(undefined)
	})

	it("does not cache when ttl is <= 0", async () => {
		await mockCache.set("foo", "foo", 0)
		await mockCache.set("bar", "bar", -0)
		await mockCache.set("baz", "baz", -1000)
		await mockCache.set("guid", "e138df00-98eb-46af-9774-02c629cfb00d", 0)

		expect(await mockCache.get("foo")).toEqual(undefined)
		expect(await mockCache.get("bar")).toEqual(undefined)
		expect(await mockCache.get("baz")).toEqual(undefined)
		expect(await mockCache.get("guid")).toEqual(undefined)
	})

	it("caches forever if ttl is Infinity", async () => {
		await mockCache.set("foo", "foo", Infinity)
		expect(await mockCache.get("foo")).toEqual("foo")
		jest.runAllTimers()
		expect(await mockCache.get("foo")).toEqual("foo")
	})

	it("supports deleting of cached values", async () => {
		await mockCache.set("foo", "foo", 1000)
		await mockCache.set("bar", "bar", 1000)
		await mockCache.set("baz", "baz", 1000)
		await mockCache.set("guid", "e138df00-98eb-46af-9774-02c629cfb00d", 1000)
		await mockCache.set("infinite", "infinite", Infinity)

		await mockCache.del("foo")
		await mockCache.del("bar")
		await mockCache.del("infinite")

		expect(await mockCache.get("foo")).toEqual(undefined)
		expect(await mockCache.get("bar")).toEqual(undefined)
		expect(await mockCache.get("baz")).toEqual("baz")
		expect(await mockCache.get("guid")).toEqual("e138df00-98eb-46af-9774-02c629cfb00d")
		expect(await mockCache.get("infinite")).toEqual(undefined)

		jest.runAllTimers()
		expect(await mockCache.get("foo")).toEqual(undefined)
		expect(await mockCache.get("bar")).toEqual(undefined)
		expect(await mockCache.get("baz")).toEqual(undefined)
		expect(await mockCache.get("guid")).toEqual(undefined)
		expect(await mockCache.get("infinite")).toEqual(undefined)
	})

	it("resets timeout window when updating a previously set value", async () => {
		await mockCache.set("foo", "foo", 1000)
		expect(await mockCache.get("foo")).toEqual("foo")
		await mockCache.set("foo", "bar", 2000)
		expect(await mockCache.get("foo")).toEqual("bar")
		jest.runAllTimers()
		expect(await mockCache.get("foo")).toEqual(undefined)
	})
})
