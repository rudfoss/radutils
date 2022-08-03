import { configBuilder } from "./config-builder"

describe("configBuilder", () => {
	it("should work", () => {
		expect(configBuilder()).toEqual("config-builder")
	})
})
