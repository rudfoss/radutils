import { defaultLookupFunction } from "./defaultLookupFunction"

const mockObj = {
	test: "Hello world",
	"dash-test": "dashValue",
	lodash_test: "lodashValue",
	dash: {
		test: "anotherDashValue"
	},
	lodash: {
		test: "anotherLodashValue"
	},
	deep: {
		object: {
			test: "foo",
			anotherSetting: "bar"
		},
		numericValue: 42
	},
	arr: [1, 2, false, true]
}

describe("defaultLookupFunction", () => {
	it("is defined", () => {
		expect(typeof defaultLookupFunction).toEqual("function")
	})
	it("looks up values using lodash get", () => {
		expect(defaultLookupFunction(mockObj, "test")).toEqual("Hello world")
		expect(defaultLookupFunction(mockObj, "dash-test")).toEqual("dashValue")
		expect(defaultLookupFunction(mockObj, "dash.test")).toEqual("anotherDashValue")
		expect(defaultLookupFunction(mockObj, "lodash_test")).toEqual("lodashValue")
		expect(defaultLookupFunction(mockObj, "lodash.test")).toEqual("anotherLodashValue")
		expect(defaultLookupFunction(mockObj, "deep.object.test")).toEqual("foo")
		expect(defaultLookupFunction(mockObj, "deep.object.anotherSetting")).toEqual("bar")
		expect(defaultLookupFunction(mockObj, "deep.numericValue")).toEqual(42)
		expect(defaultLookupFunction(mockObj, "arr")).toBe(mockObj.arr)
		expect(defaultLookupFunction(mockObj, "arr[1]")).toEqual(2)
		expect(defaultLookupFunction(mockObj, "arr.1")).toEqual(2)
	})

	it("returns undefined if key not found", () => {
		expect(defaultLookupFunction(mockObj, "not-found")).toEqual(undefined)
		expect(defaultLookupFunction(mockObj, "deep.object.notFound")).toEqual(undefined)
	})

	it("replaces - with . if no dash value is found", () => {
		expect(defaultLookupFunction(mockObj, "dash-test")).toEqual("dashValue")
		expect(defaultLookupFunction(mockObj, "lodash-test")).toEqual("anotherLodashValue")
		expect(defaultLookupFunction(mockObj, "deep-object-test")).toEqual("foo")
		expect(defaultLookupFunction(mockObj, "deep-object-anotherSetting")).toEqual("bar")
		expect(defaultLookupFunction(mockObj, "deep_object-anotherSetting")).toEqual("bar")
		expect(defaultLookupFunction(mockObj, "deep-numericValue")).toEqual(42)
		expect(defaultLookupFunction(mockObj, "arr-1")).toEqual(2)
	})
	it("replaces _ with . if no dash value is found", () => {
		expect(defaultLookupFunction(mockObj, "lodash_test")).toEqual("lodashValue")
		expect(defaultLookupFunction(mockObj, "dash_test")).toEqual("anotherDashValue")
		expect(defaultLookupFunction(mockObj, "deep_object_test")).toEqual("foo")
		expect(defaultLookupFunction(mockObj, "deep_object_anotherSetting")).toEqual("bar")
		expect(defaultLookupFunction(mockObj, "deep_object-anotherSetting")).toEqual("bar")
		expect(defaultLookupFunction(mockObj, "deep_numericValue")).toEqual(42)
		expect(defaultLookupFunction(mockObj, "arr_1")).toEqual(2)
	})
})
