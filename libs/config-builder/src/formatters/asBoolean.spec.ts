import { asBoolean } from "./asBoolean"

describe("asBoolean", () => {
	it("is defined", () => {
		expect(typeof asBoolean).toBe("function")
	})
	it("chains constructor with implementation", () => {
		expect(typeof asBoolean()).toBe("function")
	})

	it("parses known strings", () => {
		expect(asBoolean()("true")).toBe(true)
		expect(asBoolean()("false")).toBe(false)
		expect(asBoolean()("1")).toBe(true)
		expect(asBoolean()("0")).toBe(false)
	})

	it("handles actual booleans", () => {
		expect(asBoolean()(true)).toBe(true)
		expect(asBoolean()(false)).toBe(false)
	})
	it("coerces falsy values to false", () => {
		expect(asBoolean()(false)).toBe(false)
		expect(asBoolean()(0)).toBe(false)
		expect(asBoolean()(-0)).toBe(false)
		expect(asBoolean()("")).toBe(false)
		expect(asBoolean()(null)).toBe(false)
		expect(asBoolean()(undefined)).toBe(false)
		expect(asBoolean()(NaN)).toBe(false)
	})
	it("coerces other values to true", () => {
		// Add cases as needed
		expect(asBoolean()("foo")).toBe(true)
		expect(asBoolean()("c9114b52ffc34b6bb92538b74fac0868")).toBe(true)
		expect(asBoolean()({})).toBe(true)
		expect(asBoolean()([])).toBe(true)
		expect(asBoolean()({ false: false })).toBe(true)
		expect(asBoolean()([false])).toBe(true)
		expect(asBoolean()(123)).toBe(true)
		expect(asBoolean()(123.123)).toBe(true)
		expect(asBoolean()(0xf0)).toBe(true)
	})
})
