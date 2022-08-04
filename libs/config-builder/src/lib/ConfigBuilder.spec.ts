import { ConfigBuilder } from "./ConfigBuilder"
import { ConfigSource } from "./ConfigBuilderTypes"
import { asJson } from "./formatters"

class MockConfigSource implements ConfigSource {
	constructor(public data: Record<string, unknown>) {}

	public async get<TValue>(key: string) {
		return this.data[key] as TValue
	}

	public static readonly configData = {
		foo: "foo",
		bar: "bar",
		numeric: 42,
		bool: true,
		stringBool: "true",
		stringBoolFalse: "false",
		numBool: "1",
		numBoolFalse: "0",
		json: JSON.stringify({ foo: true, bar: false }),
		object: { foo: true, bar: false },
		arr: ["a", "b", 3, "c"]
	}
	public static fromTestData() {
		return new MockConfigSource(MockConfigSource.configData)
	}
}

describe("ConfigBuilder", () => {
	it("is defined", () => {
		expect(ConfigBuilder).toBeDefined()
	})

	it("resolves basic config keys", async () => {
		const builder = new ConfigBuilder([MockConfigSource.fromTestData()])
		const config = await builder.build((req) => ({
			hello: req("foo"),
			world: req("bar"),
			sub: {
				object: req<{ foo: boolean; bar: boolean }>("object"),
				json: req("json", asJson<{ foo: boolean; bar: boolean }>())
			}
		}))

		expect(config).toMatchObject({
			hello: "foo",
			world: "bar",
			sub: {
				object: { foo: true, bar: false },
				json: { foo: true, bar: false }
			}
		})
	})

	it("throws if required keys are missing", async () => {
		const builder = new ConfigBuilder([MockConfigSource.fromTestData()])

		await expect(() =>
			builder.build((req) => ({
				hello: req("foo2"),
				sub: {
					world: req("bar2")
				}
			}))
		).toThrow()
	})

	describe("ConfigBuilder lifecycle onBuildStart", () => {
		it("runs onBuildStart with expected keys", () => {})
	})
})
