import { asNumber, asInt } from "./asNumber"

describe("asNumber", () => {
	it("is defined", () => {
		expect(typeof asNumber).toBe("function")
		expect(typeof asInt).toBe("function")
	})
	it("chains constructor with implementation", () => {
		expect(typeof asNumber()).toBe("function")
		expect(typeof asInt()).toBe("function")
	})

	it("parses numeric strings", () => {
		expect(asNumber()("123")).toBe(123)
		expect(asNumber()("123.123")).toBe(123.123)
		expect(asNumber()("123123123123123123123123")).toBe(1.2312312312312312e23)
		expect(asNumber()("1412 safsa")).toBe(1412)
		expect(asNumber()("asda 123")).toBe(NaN)
	})

	it("parses hex values", () => {
		expect(asNumber()("0x1f")).toBe(31)
		expect(asNumber()("0xaaf3")).toBe(0xaaf3)
	})

	it("leaves numbers unchanged", () => {
		expect(asNumber()(123)).toBe(123)
		expect(asNumber()(123.123)).toBe(123.123)
		expect(asNumber()(0x1f3d)).toBe(0x1f3d)
		expect(asNumber()(123213213)).toBe(123213213)
	})

	it("returns NaN for non-string values", () => {
		expect(asNumber()({})).toBe(NaN)
		expect(asNumber()([])).toBe(NaN)
		expect(asNumber()(false)).toBe(NaN)
		expect(asNumber()(true)).toBe(NaN)
		expect(asNumber()(() => "hey")).toBe(NaN)
	})

	it("rounds decimals using toFixed option", () => {
		expect(asNumber({ toFixed: 3 })(123)).toBe(123)
		expect(asNumber({ toFixed: 3 })(123.123)).toBe(123.123)
		expect(asNumber({ toFixed: 3 })(123.12345)).toBe(123.123)
		expect(asNumber({ toFixed: 3 })(123.12399)).toBe(123.124)
		expect(asNumber({ toFixed: 3 })(123.12359)).toBe(123.124)
		expect(asNumber({ toFixed: 2 })(123.12399)).toBe(123.12)
		expect(asNumber({ toFixed: 0 })(123.12399)).toBe(123)

		expect(asNumber({ toFixed: 3 })("123")).toBe(123)
		expect(asNumber({ toFixed: 3 })("123.123")).toBe(123.123)
		expect(asNumber({ toFixed: 3 })("123.12345")).toBe(123.123)
		expect(asNumber({ toFixed: 3 })("123.12399")).toBe(123.124)
		expect(asNumber({ toFixed: 3 })("123.12359")).toBe(123.124)
		expect(asNumber({ toFixed: 2 })("123.12399")).toBe(123.12)
		expect(asNumber({ toFixed: 0 })("123.12399")).toBe(123)
	})

	it("supports asInt for convenienet integer parsing", () => {
		expect(asInt()(123)).toBe(123)
		expect(asInt()(123.123)).toBe(123)
		expect(asInt()(123.12345)).toBe(123)
		expect(asInt()(123.92399)).toBe(124)
		expect(asInt()(123.52399)).toBe(124)
		expect(asInt()(123.12399213213)).toBe(123)

		expect(asInt()("123")).toBe(123)
		expect(asInt()("123.123")).toBe(123)
		expect(asInt()("123.12345")).toBe(123)
		expect(asInt()("123.92399")).toBe(124)
		expect(asInt()("123.52399")).toBe(124)
		expect(asInt()("123.12399213213")).toBe(123)
	})
})
