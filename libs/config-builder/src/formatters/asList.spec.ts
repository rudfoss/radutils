import { asList } from "./asList"

describe("asList", () => {
	it("is defined", () => {
		expect(typeof asList).toBe("function")
	})
	it("chains constructor with implementation", () => {
		expect(typeof asList()).toBe("function")
	})

	it("splits a string on ; or , by default", () => {
		expect(asList()("hello;world,how,are;you")).toEqual(["hello", "world", "how", "are", "you"])
	})

	it("supports a limit option", () => {
		expect(asList({ limit: 3 })("hello;world,how,are;you")).toEqual(["hello", "world", "how"])
	})

	it("passes through non-string values", () => {
		expect(asList()(true)).toEqual(true)
		expect(asList()(42)).toEqual(42)
		expect(asList()(123.123)).toEqual(123.123)
		expect(asList()({})).toEqual({})
		expect(asList()([])).toEqual([])
		expect(asList()(undefined)).toEqual(undefined)
		expect(asList()(null)).toEqual(null)
	})

	it("supports custom separator option", () => {
		expect(asList({ separator: " " })("hello world,how,are you")).toEqual(["hello", "world,how,are", "you"])
		expect(asList({ separator: " " })("hello  world,how,   are you")).toEqual([
			"hello",
			"",
			"world,how,",
			"",
			"",
			"are",
			"you"
		])
		expect(asList({ separator: /\s+/ })("hello     world,how,are      you")).toEqual(["hello", "world,how,are", "you"])
	})
})
