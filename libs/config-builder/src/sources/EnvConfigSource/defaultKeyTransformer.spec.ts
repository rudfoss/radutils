import { defaultKeyTransformer } from "./defaultKeyTransformer"

describe("defaultKeyTransformer", () => {
	it("is defined", () => {
		expect(typeof defaultKeyTransformer).toBe("function")
	})

	it("transforms to upper case", () => {
		expect(defaultKeyTransformer("foo")).toEqual(["foo", "FOO", "foo", "FOO"])
		expect(defaultKeyTransformer("fooBar")).toEqual(["fooBar", "FOOBAR", "fooBar", "FOOBAR"])
		expect(defaultKeyTransformer("FOO")).toEqual(["FOO", "FOO", "FOO", "FOO"])
	})
	it("replaces common characters with underscore", () => {
		expect(defaultKeyTransformer("foo-bar")).toEqual(["foo-bar", "FOO-BAR", "foo_bar", "FOO_BAR"])
		expect(defaultKeyTransformer("foo/bar")).toEqual(["foo/bar", "FOO/BAR", "foo_bar", "FOO_BAR"])
		expect(defaultKeyTransformer("foo bar")).toEqual(["foo bar", "FOO BAR", "foo_bar", "FOO_BAR"])
		expect(defaultKeyTransformer("foo\\bar")).toEqual(["foo\\bar", "FOO\\BAR", "foo_bar", "FOO_BAR"])

		expect(defaultKeyTransformer("foo-bar-bAz-BaT-lastValue")).toEqual([
			"foo-bar-bAz-BaT-lastValue",
			"FOO-BAR-BAZ-BAT-LASTVALUE",
			"foo_bar_bAz_BaT_lastValue",
			"FOO_BAR_BAZ_BAT_LASTVALUE"
		])
		expect(defaultKeyTransformer("foo/bar/bAz/BaT/lastValue")).toEqual([
			"foo/bar/bAz/BaT/lastValue",
			"FOO/BAR/BAZ/BAT/LASTVALUE",
			"foo_bar_bAz_BaT_lastValue",
			"FOO_BAR_BAZ_BAT_LASTVALUE"
		])
		expect(defaultKeyTransformer("foo bar bAz BaT lastValue")).toEqual([
			"foo bar bAz BaT lastValue",
			"FOO BAR BAZ BAT LASTVALUE",
			"foo_bar_bAz_BaT_lastValue",
			"FOO_BAR_BAZ_BAT_LASTVALUE"
		])
		expect(defaultKeyTransformer("foo\\bar\\bAz\\BaT\\lastValue")).toEqual([
			"foo\\bar\\bAz\\BaT\\lastValue",
			"FOO\\BAR\\BAZ\\BAT\\LASTVALUE",
			"foo_bar_bAz_BaT_lastValue",
			"FOO_BAR_BAZ_BAT_LASTVALUE"
		])
	})
})
