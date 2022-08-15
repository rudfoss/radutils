/* eslint-disable @typescript-eslint/no-explicit-any */
import { defaultKeyTransformer } from "./defaultKeyTransformer"
import { EnvConfigSource } from "./EnvConfigSource"

describe("EnvConfigSource", () => {
	beforeAll(() => {
		// Set some dummy env vars
		process.env["ENV_CONFIG_TEST_A"] = "Alpha"
		process.env["ENV_CONFIG_TEST_B"] = "Bravo"
		process.env["ENV_CONFIG_TEST_OBJ"] = JSON.stringify({ foo: true })
		process.env["ENV_CONFIG_TEST_ARR"] = JSON.stringify([true, false])
	})

	let envSource: EnvConfigSource
	beforeEach(() => {
		envSource = new EnvConfigSource()
		envSource.onBuildStart()
	})
	afterEach(() => {
		process.env["ENV_CONFIG_TEST_A"] = "Alpha"
		process.env["ENV_CONFIG_TEST_B"] = "Bravo"
		delete process.env["ENV_CONFIG_TEST_C"]
	})

	it("is defined", () => {
		expect(EnvConfigSource).toBeDefined()
		expect(EnvConfigSource.name).toBe("EnvConfigSource")
	})

	it("has correct option defaults", () => {
		expect(envSource["options"].cacheMode).toBe("perBuild")
		expect(envSource["options"].keyTransform).toBe(defaultKeyTransformer)
	})
	it("keeps options when cloned", () => {
		const clonedEnvSource = envSource.clone()
		expect(clonedEnvSource).not.toBe(envSource)
		expect(clonedEnvSource["options"]).not.toBe(envSource["options"])
		expect(clonedEnvSource["options"]).toEqual(envSource["options"])
	})

	it("returns env variable values with default key transforms applied", () => {
		expect(envSource.get("ENV_CONFIG_TEST_A")).toEqual("Alpha")
		expect(envSource.get("ENV_CONFIG_TEST_B")).toEqual("Bravo")
		expect(envSource.get("ENV_CONFIG_TEST_OBJ")).toEqual(JSON.stringify({ foo: true }))
		expect(envSource.get("ENV_CONFIG_TEST_ARR")).toEqual(JSON.stringify([true, false]))
	})

	it("returns undefined for unknown keys", () => {
		expect(envSource.get("ENV_CONFIG_TEST_C")).toEqual(undefined)
		expect(envSource.get("test")).toEqual(undefined)
		expect(envSource.get("env config test c")).toEqual(undefined)
	})

	it("transforms common keys and returns their respective values", () => {
		expect(envSource.get("env-config-test-a")).toEqual("Alpha")
		expect(envSource.get("ENV config test a")).toEqual("Alpha")
		expect(envSource.get("env/config/test/a")).toEqual("Alpha")
		expect(envSource.get("env\\config\\test\\a")).toEqual("Alpha")
		expect(envSource.get("env config/test\\a")).toEqual("Alpha")
	})

	it("does not reflect live changes to environment variables unless a new build is started", () => {
		expect(process.env["ENV_CONFIG_TEST_A"]).toEqual("Alpha")
		expect(process.env["ENV_CONFIG_TEST_B"]).toEqual("Bravo")
		expect(process.env["ENV_CONFIG_TEST_C"]).not.toBeDefined()
		expect(envSource.get("ENV_CONFIG_TEST_A")).toEqual("Alpha")
		expect(envSource.get("ENV_CONFIG_TEST_B")).toEqual("Bravo")
		expect(envSource.get("ENV_CONFIG_TEST_C")).toEqual(undefined)

		process.env["ENV_CONFIG_TEST_A"] = "Charlie"
		process.env["ENV_CONFIG_TEST_B"] = "Charlie"
		process.env["ENV_CONFIG_TEST_C"] = "Charlie"

		expect(process.env["ENV_CONFIG_TEST_A"]).toEqual("Charlie")
		expect(process.env["ENV_CONFIG_TEST_B"]).toEqual("Charlie")
		expect(process.env["ENV_CONFIG_TEST_C"]).toEqual("Charlie")

		expect(envSource.get("ENV_CONFIG_TEST_A")).toEqual("Alpha")
		expect(envSource.get("ENV_CONFIG_TEST_B")).toEqual("Bravo")
		expect(envSource.get("ENV_CONFIG_TEST_C")).toEqual(undefined)
	})

	it("reflects changes to environment variables between builds", () => {
		expect(process.env["ENV_CONFIG_TEST_A"]).toEqual("Alpha")
		expect(process.env["ENV_CONFIG_TEST_B"]).toEqual("Bravo")
		expect(process.env["ENV_CONFIG_TEST_C"]).not.toBeDefined()
		expect(envSource.get("ENV_CONFIG_TEST_A")).toEqual("Alpha")
		expect(envSource.get("ENV_CONFIG_TEST_B")).toEqual("Bravo")
		expect(envSource.get("ENV_CONFIG_TEST_C")).toEqual(undefined)

		process.env["ENV_CONFIG_TEST_A"] = "Charlie"
		process.env["ENV_CONFIG_TEST_B"] = "Charlie"
		process.env["ENV_CONFIG_TEST_C"] = "Charlie"
		expect(process.env["ENV_CONFIG_TEST_A"]).toEqual("Charlie")
		expect(process.env["ENV_CONFIG_TEST_B"]).toEqual("Charlie")
		expect(process.env["ENV_CONFIG_TEST_C"]).toEqual("Charlie")
		envSource.onBuildStart() // Simulate another build call

		expect(envSource.get("ENV_CONFIG_TEST_A")).toEqual("Charlie")
		expect(envSource.get("ENV_CONFIG_TEST_B")).toEqual("Charlie")
		expect(envSource.get("ENV_CONFIG_TEST_C")).toEqual("Charlie")
	})

	it("supports custom key transformer function", () => {
		process.env["A_TSET_GIFNOC_VNE"] = "ahplA"
		const mockKeyTransform = jest.fn((key) => key.split("").reverse().join(""))
		envSource = new EnvConfigSource({ keyTransform: mockKeyTransform as any })
		envSource.onBuildStart()

		const result = envSource.get("ENV_CONFIG_TEST_A")
		expect(mockKeyTransform.mock.calls.length).toBe(1)
		expect(mockKeyTransform.mock.calls[0][0]).toEqual("ENV_CONFIG_TEST_A")
		expect(result).toBe("ahplA")
	})

	it("works for mixed-case variables", () => {
		// Path is a known variable that exists on windows and linux
		expect(envSource.get("PATH")).toBeDefined()
	})

	describe("cacheMode = noCache", () => {
		beforeEach(() => {
			envSource = new EnvConfigSource({ cacheMode: "noCache" })
			envSource.onBuildStart()
		})
		it("has correctly set options", () => {
			expect(envSource["options"].cacheMode).toBe("noCache")
			expect(envSource["options"].keyTransform).toBe(defaultKeyTransformer)
		})

		it("reflects live changes to environment variables", () => {
			expect(process.env["ENV_CONFIG_TEST_A"]).toEqual("Alpha")
			expect(process.env["ENV_CONFIG_TEST_B"]).toEqual("Bravo")
			expect(process.env["ENV_CONFIG_TEST_C"]).not.toBeDefined()

			expect(envSource.get("ENV_CONFIG_TEST_A")).toEqual("Alpha")
			expect(envSource.get("ENV_CONFIG_TEST_B")).toEqual("Bravo")
			expect(envSource.get("ENV_CONFIG_TEST_C")).toEqual(undefined)

			process.env["ENV_CONFIG_TEST_A"] = "Charlie"
			process.env["ENV_CONFIG_TEST_B"] = "Charlie"
			process.env["ENV_CONFIG_TEST_C"] = "Charlie"

			expect(process.env["ENV_CONFIG_TEST_A"]).toEqual("Charlie")
			expect(process.env["ENV_CONFIG_TEST_B"]).toEqual("Charlie")
			expect(process.env["ENV_CONFIG_TEST_C"]).toEqual("Charlie")

			expect(envSource.get("ENV_CONFIG_TEST_A")).toEqual("Charlie")
			expect(envSource.get("ENV_CONFIG_TEST_B")).toEqual("Charlie")
			expect(envSource.get("ENV_CONFIG_TEST_C")).toEqual("Charlie")
		})
	})

	describe("cacheMode = perInstance", () => {
		beforeEach(() => {
			envSource = new EnvConfigSource({ cacheMode: "perInstance" })
			envSource.onBuildStart()
		})
		it("has correctly set options", () => {
			expect(envSource["options"].cacheMode).toBe("perInstance")
			expect(envSource["options"].keyTransform).toBe(defaultKeyTransformer)
		})

		it("does not reflect any changes to environment variables", () => {
			expect(process.env["ENV_CONFIG_TEST_A"]).toEqual("Alpha")
			expect(process.env["ENV_CONFIG_TEST_B"]).toEqual("Bravo")
			expect(process.env["ENV_CONFIG_TEST_C"]).not.toBeDefined()

			expect(envSource.get("ENV_CONFIG_TEST_A")).toEqual("Alpha")
			expect(envSource.get("ENV_CONFIG_TEST_B")).toEqual("Bravo")
			expect(envSource.get("ENV_CONFIG_TEST_C")).toEqual(undefined)

			process.env["ENV_CONFIG_TEST_A"] = "Charlie"
			process.env["ENV_CONFIG_TEST_B"] = "Charlie"
			process.env["ENV_CONFIG_TEST_C"] = "Charlie"

			expect(envSource.get("ENV_CONFIG_TEST_A")).toEqual("Alpha")
			expect(envSource.get("ENV_CONFIG_TEST_B")).toEqual("Bravo")
			expect(envSource.get("ENV_CONFIG_TEST_C")).toEqual(undefined)

			envSource.onBuildStart() // Simulate another build call
			expect(envSource.get("ENV_CONFIG_TEST_A")).toEqual("Alpha")
			expect(envSource.get("ENV_CONFIG_TEST_B")).toEqual("Bravo")
			expect(envSource.get("ENV_CONFIG_TEST_C")).toEqual(undefined)
		})

		it("reuses env cache when cloning for performance", () => {
			const clonedSource = envSource.clone()
			expect(clonedSource["envCache"]).toBe(envSource["envCache"])
		})
	})
})
