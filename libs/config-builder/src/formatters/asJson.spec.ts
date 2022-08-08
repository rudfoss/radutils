/* eslint-disable @typescript-eslint/no-explicit-any */
import { asJson } from "./asJson"

describe("asJson", () => {
	it("is defined", () => {
		expect(typeof asJson).toBe("function")
	})
	it("chains constructor with implementation", () => {
		expect(typeof asJson()).toBe("function")
	})

	it("passes through non-string values as is", () => {
		expect(asJson()(undefined)).toBe(undefined)
		expect(asJson()(false)).toBe(false)
		expect(asJson()(true)).toBe(true)
		expect(asJson()(4)).toBe(4)
		expect(asJson()(132.123)).toBe(132.123)
		expect(asJson()(0x1f)).toBe(0x1f)

		const obj = {}
		expect(asJson()(obj)).toBe(obj)

		const arr: unknown[] = []
		expect(asJson()(arr)).toBe(arr)
	})

	it("parses json strings", () => {
		let testValue: any = { foo: true, sub: [1, 2, true, false] }
		expect(asJson()(JSON.stringify(testValue))).toEqual(testValue)

		testValue = [true, false, "test", { foo: true }]
		expect(asJson()(JSON.stringify(testValue))).toEqual(testValue)

		testValue = true
		expect(asJson()(JSON.stringify(testValue))).toEqual(testValue)

		testValue = 123.123
		expect(asJson()(JSON.stringify(testValue))).toEqual(testValue)
	})

	it("throws if string is not valid json", () => {
		expect(() => asJson()("{foo:")).toThrow(SyntaxError)
		expect(() => asJson()("[")).toThrow(SyntaxError)
		expect(() => asJson()("]")).toThrow(SyntaxError)
		expect(() => asJson()("{")).toThrow(SyntaxError)
		expect(() => asJson()("}")).toThrow(SyntaxError)
		expect(() => asJson()("{'foo'}")).toThrow(SyntaxError)
	})
})
