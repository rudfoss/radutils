/* eslint-disable @typescript-eslint/no-explicit-any */
import { defaultLookupFunction } from "./defaultLookupFunction"
import { JSONConfigSource } from "./JSONConfigSource"
import { JSONConfigSourceError } from "./JSONConfigSourceError"

const consoleWarnSpy = jest.spyOn(console, "warn")
const mockConfigObj = {
	test: "Hello world",
	deep: {
		object: {
			test: "foo",
			anotherSetting: "bar"
		},
		numericValue: 42
	},
	arr: [1, 2, false, true]
}

describe("JSONConfigSource", () => {
	let mockGetter: jest.Mock<any>
	let mockSource: JSONConfigSource
	let mockSourceWithGetter: JSONConfigSource

	beforeEach(() => {
		mockGetter = jest.fn(async () => mockConfigObj)
		mockSource = new JSONConfigSource({ obj: mockConfigObj })
		mockSourceWithGetter = new JSONConfigSource({ get: mockGetter })
		consoleWarnSpy.mockClear()
	})

	it("is defined", () => {
		expect(JSONConfigSource).toBeDefined()
	})
	it("has correct default options", () => {
		expect(mockSource["options"]).toEqual({ lookup: defaultLookupFunction, obj: mockConfigObj })
		expect(mockSource["objRef"]).toEqual(mockConfigObj)

		expect(mockSourceWithGetter["options"]).toEqual({ lookup: defaultLookupFunction, get: mockGetter })
		expect(mockSourceWithGetter["objRef"]).not.toBeDefined()

		expect(consoleWarnSpy).not.toHaveBeenCalled()
	})
	it("keeps options when cloned", () => {
		const clonedEnvSource = mockSource.clone()
		expect(clonedEnvSource).not.toBe(mockSource)
		expect(clonedEnvSource["options"]).not.toBe(mockSource["options"])
		expect(clonedEnvSource["options"]).toEqual(mockSource["options"])
	})

	it("it warns using console if both obj and get options are defined", () => {
		new JSONConfigSource({ obj: {}, get: mockGetter } as any)
		expect(consoleWarnSpy.mock.calls.length).toBe(1)
		expect(consoleWarnSpy.mock.calls[0][0]).toEqual(
			"JSONConfigSource: Specifying both options.get and options.obj is redundant as only the obj option will be used."
		)
	})
	it("populates objRef on build start if getter is defined", async () => {
		expect(mockSourceWithGetter["objRef"]).not.toBeDefined()
		await mockSourceWithGetter.onBuildStart()
		expect(mockSourceWithGetter["objRef"]).toEqual(mockConfigObj)
	})

	it("resolves config values", async () => {
		await mockSource.onBuildStart()
		await mockSourceWithGetter.onBuildStart()

		expect({
			test: await mockSource.get("test"),
			deep: {
				object: {
					test: await mockSource.get("deep.object.test"),
					anotherSetting: await mockSource.get("deep.object.anotherSetting")
				},
				numericValue: await mockSource.get("deep.numericValue")
			},
			arr: [1, await mockSource.get("arr[1]"), false, true]
		}).toEqual(mockConfigObj)
		expect({
			test: await mockSourceWithGetter.get("test"),
			deep: {
				object: {
					test: await mockSourceWithGetter.get("deep.object.test"),
					anotherSetting: await mockSourceWithGetter.get("deep.object.anotherSetting")
				},
				numericValue: await mockSourceWithGetter.get("deep.numericValue")
			},
			arr: [1, await mockSourceWithGetter.get("arr[1]"), false, true]
		}).toEqual(mockConfigObj)
	})

	it("throws if getter throws", async () => {
		mockGetter = jest.fn(async () => {
			throw new Error("oops")
		})
		mockSourceWithGetter = new JSONConfigSource({ get: mockGetter })
		await expect(() => mockSourceWithGetter.onBuildStart()).rejects.toThrow(
			new JSONConfigSourceError("", new Error("oops"))
		)

		mockGetter = jest.fn(async () => {
			throw "oops"
		})
		mockSourceWithGetter = new JSONConfigSource({ get: mockGetter })
		await expect(() => mockSourceWithGetter.onBuildStart()).rejects.toThrow(
			new JSONConfigSourceError(
				"An error occurred while attempting to call getter for JSON configuration. See innerError for more information.",
				"oops"
			)
		)
	})
	it("throws if getter does not return an object", async () => {
		mockGetter = jest.fn(async () => undefined)
		mockSourceWithGetter = new JSONConfigSource({ get: mockGetter })
		await mockSourceWithGetter.onBuildStart()

		await expect(() => mockSourceWithGetter.get("foo")).rejects.toThrow(
			new JSONConfigSourceError(
				'The source object for JSON configurations was not populated. Did you provide an "obj" or "get" option?'
			)
		)
	})
})
