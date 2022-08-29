import { jsonResolver } from "./jsonResolver"

describe("jsonResolver", () => {
	it("is defined", () => {
		expect(typeof jsonResolver).toEqual("function")
	})
	it("chains constructor with implementation", () => {
		expect(typeof jsonResolver()).toEqual("function")
	})

	it("parses strings to JSON", () => {
		expect(jsonResolver()({ value: JSON.stringify({ hey: true }), key: "", isReadOnly: true })).toEqual({ hey: true })
		expect(jsonResolver()({ value: JSON.stringify([1, 2, 3]), key: "", isReadOnly: true })).toEqual([1, 2, 3])
	})
	it("leaves undefined as undefined", () => {
		expect(jsonResolver()({ value: undefined, key: "", isReadOnly: true })).not.toBeDefined()
	})
})
