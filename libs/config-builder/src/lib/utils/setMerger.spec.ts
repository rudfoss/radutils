import { setMerger } from "./setMerger"

describe("setMerger", () => {
	it("is defined", () => {
		expect(typeof setMerger).toBe("function")
	})

	it("merges into a new set", () => {
		const result = setMerger()(["foo", "bar"])(["baz"])
		expect(result.set).toEqual(new Set(["foo", "bar", "baz"]))
	})

	it("mutates the set referenced in the set property", () => {
		const merger = setMerger()
		const initialSet = merger.set

		merger(["foo", "bar"])
		expect(initialSet).toEqual(new Set(["foo", "bar"]))

		merger(["baz", "bat"])
		expect(initialSet).toEqual(new Set(["foo", "bar", "baz", "bat"]))
		expect(initialSet).toBe(merger.set)
	})

	it("mutates the given set if one is provided", () => {
		const set = new Set(["a", "b", "c"])
		setMerger(set)(["foo", "bar"])
		expect(set).toEqual(new Set(["a", "b", "c", "foo", "bar"]))
	})

	it("leaves the set untouched if no additions are made", () => {
		const set = new Set(["a"])
		expect(setMerger(set)().set).toEqual(new Set(["a"]))
		expect(setMerger(set)()()()().set).toEqual(new Set(["a"]))
	})
})
