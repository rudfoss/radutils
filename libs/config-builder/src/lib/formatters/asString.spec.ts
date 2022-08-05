import { asString } from "./asString"

describe("asString", () => {
	it("is defined", () => {
		expect(typeof asString).toBe("function")
	})
	it("chains constructor with implementation", () => {
		expect(typeof asString()).toBe("function")
	})

	it("passes through strings untouched", () => {
		expect(asString()("foo")).toBe("foo")
		expect(asString()("{afbe3ffd-822c-49fe-9888-5b3323665839}")).toBe("{afbe3ffd-822c-49fe-9888-5b3323665839}")
		expect(asString()("aæøåæ&%#%¤")).toBe("aæøåæ&%#%¤")
		expect(asString()("")).toBe("")
		expect(asString()("             ")).toBe("             ")
		expect(asString()(`test:${5 + 5}`)).toBe(`test:10`)
	})

	it("stringifies primitive types", () => {
		expect(asString()(true)).toBe("true")
		expect(asString()(false)).toBe("false")
		expect(asString()(0)).toBe("0")
		expect(asString()(123.123)).toBe("123.123")
		expect(asString()(0x123)).toBe("291") // Hex numbers are converted directly.
		expect(asString()({})).toBe("[object Object]")
		expect(asString()([])).toBe("")
		expect(asString()(["foo"])).toBe("foo")
		expect(asString()(["foo", "bar"])).toBe("foo,bar")
	})

	it("passes through nullish types", () => {
		expect(asString()(undefined)).toBe(undefined)
		expect(asString()(null)).toBe(undefined)
	})

	it("supports custom serializers", () => {
		expect(asString({ serializer: () => "intercepted" })({})).toBe("intercepted")
		expect(asString({ serializer: () => "intercepted" })(true)).toBe("intercepted")
		expect(asString({ serializer: () => "intercepted" })(["foo"])).toBe("intercepted")

		expect(asString({ serializer: (value) => JSON.stringify(value) })({})).toBe("{}")
		expect(asString({ serializer: (value) => JSON.stringify(value) })([])).toBe("[]")
		expect(asString({ serializer: (value) => JSON.stringify(value) })(["foo"])).toBe('["foo"]')
	})
})
