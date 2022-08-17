import { configBuilderSourceAzure } from "./config-builder-source-azure"

describe("configBuilderSourceAzure", () => {
	it("should work", () => {
		expect(configBuilderSourceAzure()).toEqual("config-builder-source-azure")
	})
})
