import { findFirstOrDefault } from "./findFirstOrDefault"

describe("findFirstOrDefault", () => {
	let inKeyValuesMap: Map<string, unknown>
	let inKeyValuesObj: Record<string, unknown>

	beforeEach(() => {
		inKeyValuesMap = new Map<string, unknown>([
			["key", "value"],
			["otherKey", true],
			["undefinedValue", undefined],
			["nullValue", null],
			["numeric", 42],
			["objectValue", { hey: true }],
			["arrayValue", ["hey", true]]
		])

		inKeyValuesObj = {
			key: "value",
			otherKey: true,
			undefinedValue: undefined,
			nullValue: null,
			numeric: 42,
			objectValue: { hey: true },
			arrayValue: ["hey", true]
		}
	})

	it("is defined", () => {
		expect(typeof findFirstOrDefault).toBe("function")
	})

	it("returns values where defined", () => {
		expect(findFirstOrDefault(["key"], inKeyValuesMap)).toEqual("value")
		expect(findFirstOrDefault(["otherKey"], inKeyValuesMap)).toEqual(true)
		expect(findFirstOrDefault(["undefinedValue"], inKeyValuesMap)).toEqual(undefined)
		expect(findFirstOrDefault(["nullValue"], inKeyValuesMap)).toEqual(null)
		expect(findFirstOrDefault(["numeric"], inKeyValuesMap)).toEqual(42)
		expect(findFirstOrDefault(["objectValue"], inKeyValuesMap)).toEqual({ hey: true })
		expect(findFirstOrDefault(["arrayValue"], inKeyValuesMap)).toEqual(["hey", true])

		expect(findFirstOrDefault(["key"], inKeyValuesObj)).toEqual("value")
		expect(findFirstOrDefault(["otherKey"], inKeyValuesObj)).toEqual(true)
		expect(findFirstOrDefault(["undefinedValue"], inKeyValuesObj)).toEqual(undefined)
		expect(findFirstOrDefault(["nullValue"], inKeyValuesObj)).toEqual(null)
		expect(findFirstOrDefault(["numeric"], inKeyValuesObj)).toEqual(42)
		expect(findFirstOrDefault(["objectValue"], inKeyValuesObj)).toEqual({ hey: true })
		expect(findFirstOrDefault(["arrayValue"], inKeyValuesObj)).toEqual(["hey", true])
	})

	it("returns the first defined value or undefined if not found", () => {
		expect(findFirstOrDefault(["notFound", "alsoNotFound", "key"], inKeyValuesMap)).toEqual("value")
		expect(findFirstOrDefault(["notFound", "alsoNotFound"], inKeyValuesMap)).toEqual(undefined)

		expect(findFirstOrDefault(["notFound", "alsoNotFound", "key"], inKeyValuesObj)).toEqual("value")
		expect(findFirstOrDefault(["notFound", "alsoNotFound"], inKeyValuesObj)).toEqual(undefined)
	})
})
