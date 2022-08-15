import { createIDGenerator } from "./createIDGenerator"

describe("createIDGenerator", () => {
	it("is defined", () => {
		expect(typeof createIDGenerator).toBe("function")
	})
	it("instantiates to a generator function", () => {
		const generator = createIDGenerator()
		expect(typeof generator).toBe("function")
	})

	it("generates non-repeating IDs", () => {
		const generator = createIDGenerator("prefix")
		expect(generator()).toEqual("prefix0")
		expect(generator()).toEqual("prefix1")
		expect(generator()).toEqual("prefix2")
		expect(generator()).toEqual("prefix3")
	})
	it("supports custom prefix", () => {
		expect(createIDGenerator("foo")()).toEqual("foo0")
		expect(createIDGenerator("bar")()).toEqual("bar0")
		expect(createIDGenerator("fooBar")()).toEqual("fooBar0")
		expect(createIDGenerator("lkdsafyoehføsahfø_")()).toEqual("lkdsafyoehføsahfø_0")
	})
	it("supports custom suffixes", () => {
		const generator = createIDGenerator("prefix")
		expect(generator("suffix")).toEqual("prefix0suffix")
		expect(generator("foo")).toEqual("prefix1foo")
		expect(generator("bar")).toEqual("prefix2bar")
		expect(generator("fooBar")).toEqual("prefix3fooBar")
		expect(generator("__suffix__")).toEqual("prefix4__suffix__")
	})
})
