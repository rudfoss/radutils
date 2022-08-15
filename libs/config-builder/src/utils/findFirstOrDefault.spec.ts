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
		expect(findFirstOrDefault(["key"], inKeyValuesMap).value).toEqual("value")
		expect(findFirstOrDefault(["otherKey"], inKeyValuesMap).value).toEqual(true)
		expect(findFirstOrDefault(["undefinedValue"], inKeyValuesMap).value).toEqual(undefined)
		expect(findFirstOrDefault(["nullValue"], inKeyValuesMap).value).toEqual(null)
		expect(findFirstOrDefault(["numeric"], inKeyValuesMap).value).toEqual(42)
		expect(findFirstOrDefault(["objectValue"], inKeyValuesMap).value).toEqual({ hey: true })
		expect(findFirstOrDefault(["arrayValue"], inKeyValuesMap).value).toEqual(["hey", true])

		expect(findFirstOrDefault(["key"], inKeyValuesObj).value).toEqual("value")
		expect(findFirstOrDefault(["otherKey"], inKeyValuesObj).value).toEqual(true)
		expect(findFirstOrDefault(["undefinedValue"], inKeyValuesObj).value).toEqual(undefined)
		expect(findFirstOrDefault(["nullValue"], inKeyValuesObj).value).toEqual(null)
		expect(findFirstOrDefault(["numeric"], inKeyValuesObj).value).toEqual(42)
		expect(findFirstOrDefault(["objectValue"], inKeyValuesObj).value).toEqual({ hey: true })
		expect(findFirstOrDefault(["arrayValue"], inKeyValuesObj).value).toEqual(["hey", true])
	})

	it("returns the first defined value or undefined if not found", () => {
		expect(findFirstOrDefault(["notFound", "alsoNotFound", "key"], inKeyValuesMap).value).toEqual("value")
		expect(findFirstOrDefault(["notFound", "alsoNotFound"], inKeyValuesMap).value).toEqual(undefined)

		expect(findFirstOrDefault(["notFound", "alsoNotFound", "key"], inKeyValuesObj).value).toEqual("value")
		expect(findFirstOrDefault(["notFound", "alsoNotFound"], inKeyValuesObj).value).toEqual(undefined)
	})

	it("returns the first defined key", () => {
		expect(findFirstOrDefault(["notFound", "alsoNotFound", "key"], inKeyValuesMap).key).toEqual("key")
		expect(findFirstOrDefault(["notFound", "alsoNotFound"], inKeyValuesMap).key).toEqual(undefined)

		expect(findFirstOrDefault(["notFound", "alsoNotFound", "key"], inKeyValuesObj).key).toEqual("key")
		expect(findFirstOrDefault(["notFound", "alsoNotFound"], inKeyValuesObj).key).toEqual(undefined)
	})
})
