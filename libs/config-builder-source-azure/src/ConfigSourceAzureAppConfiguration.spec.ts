/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppConfigurationClient } from "@azure/app-configuration"
import { AzureCliCredential } from "@azure/identity"
import { ConfigSourceAzureAppConfiguration } from "./ConfigSourceAzureAppConfiguration"
import { ContentTypeResolver } from "./ContentTypeResolver"
import { jsonContentType, keyVaultReferenceContentType } from "./contentTypeResolvers"
import { ConfigBuilderAzureSourceContentTypeResolverError } from "./errors"

const BLANK_LABEL = "%00"

type MockConfigStore = Record<string, { label?: string; value: string; contentType?: string }[]>

export class MockAppConfigurationClient {
	public constructor(public configurationStore: MockConfigStore) {}

	public listConfigurationSettings = jest.fn(() => {
		const configStore = this.configurationStore
		async function* iterator() {
			for (const [key, values] of Object.entries(configStore)) {
				for (const value of values) {
					yield { key, ...value }
				}
			}
		}
		return iterator()
	})

	public static newMock() {
		return new MockAppConfigurationClient(MockAppConfigurationClient.mockConfigStore)
	}

	public static readonly mockConfigStore: MockConfigStore = {
		foo: [
			{
				value: "unlabelled"
			},
			{
				label: "dev",
				value: "labelled-dev",
				contentType: "text/plain"
			},
			{
				label: "pr123",
				value: "labelled-pr123",
				contentType: "text/plain"
			},
			{
				label: "prod",
				value: "labelled-prod",
				contentType: "text/plain"
			}
		],
		bar: [
			{
				value: "bar"
			}
		],
		json: [
			{
				value: JSON.stringify({ hey: true, there: 42 }),
				contentType: "application/json"
			},
			{
				label: "dev",
				value: JSON.stringify({ hey: true, there: 42, labelled: "yes" }),
				contentType: "application/json"
			}
		]
	}
}

describe("ConfigSourceAzureAppConfiguration", () => {
	let mockAppConfigClient: MockAppConfigurationClient
	let source: ConfigSourceAzureAppConfiguration

	beforeEach(() => {
		mockAppConfigClient = MockAppConfigurationClient.newMock()
		source = new ConfigSourceAzureAppConfiguration({
			labels: ["dev"],
			client: mockAppConfigClient as any
		})
	})

	it("is defined", () => {
		expect(ConfigSourceAzureAppConfiguration).toBeDefined()
		expect(ConfigSourceAzureAppConfiguration.name).toBe("ConfigSourceAzureAppConfiguration")
	})
	it("has correct default options", () => {
		expect(source["options"]).toEqual({
			fallbackToUnlabelled: true,
			contentTypeResolvers: new Map(),
			labels: ["dev"],
			client: mockAppConfigClient
		})
	})
	it("caches config values correctly", async () => {
		await source.onBuildStart()
		await source.get("foo")

		expect(mockAppConfigClient.listConfigurationSettings.mock.calls.length).toBe(1)

		expect(source["valueCache"].get("foo")?.get(BLANK_LABEL)).toEqual({
			configurationSetting: { key: "foo", value: "unlabelled" },
			resolvedValue: "unlabelled"
		})
		expect(source["valueCache"].get("foo")?.get("dev")).toEqual({
			configurationSetting: {
				key: "foo",
				label: "dev",
				value: "labelled-dev",
				contentType: "text/plain"
			},
			resolvedValue: "labelled-dev"
		})
		expect(source["valueCache"].get("foo")?.get("prod")).toEqual({
			configurationSetting: {
				key: "foo",
				label: "prod",
				value: "labelled-prod",
				contentType: "text/plain"
			},
			resolvedValue: "labelled-prod"
		})

		expect(source["valueCache"].get("bar")?.get(BLANK_LABEL)).toEqual({
			configurationSetting: {
				key: "bar",
				value: "bar"
			},
			resolvedValue: "bar"
		})

		expect(source["valueCache"].get("json")?.get(BLANK_LABEL)).toEqual({
			configurationSetting: {
				key: "json",
				value: JSON.stringify({ hey: true, there: 42 }),
				contentType: "application/json"
			},
			resolvedValue: JSON.stringify({ hey: true, there: 42 })
		})
		expect(source["valueCache"].get("json")?.get("dev")).toEqual({
			configurationSetting: {
				key: "json",
				label: "dev",
				value: JSON.stringify({ hey: true, there: 42, labelled: "yes" }),
				contentType: "application/json"
			},
			resolvedValue: JSON.stringify({ hey: true, there: 42, labelled: "yes" })
		})
	})
	it("creates a shallow equivalent copy on clone", () => {
		const cloneSource = source.clone()
		expect(cloneSource["options"]).not.toBe(source["options"])
		expect(cloneSource["options"]).toEqual(source["options"])
	})
	it("creates a proper default instance", () => {
		const defaultSource = ConfigSourceAzureAppConfiguration.createDefault({
			endpoint: "https://test-endpoint"
		})

		expect(defaultSource).toBeInstanceOf(ConfigSourceAzureAppConfiguration)
		expect(defaultSource["options"].client).toBeInstanceOf(AppConfigurationClient)
		expect(defaultSource["options"].contentTypeResolvers.size).toBe(2)
		expect(defaultSource["options"].contentTypeResolvers.get(jsonContentType)).toBeDefined()
		expect(defaultSource["options"].contentTypeResolvers.get(keyVaultReferenceContentType)).toBeDefined()
	})
	it("supports credentials override on default instance", () => {
		const defaultSource = ConfigSourceAzureAppConfiguration.createDefault({
			endpoint: "https://test-endpoint",
			credential: new AzureCliCredential()
		})

		expect(defaultSource).toBeInstanceOf(ConfigSourceAzureAppConfiguration)
		expect(defaultSource["options"].client).toBeInstanceOf(AppConfigurationClient)
	})
	it("supports overriding default content type resolvers", async () => {
		const defaultSource = ConfigSourceAzureAppConfiguration.createDefault({
			endpoint: "https://test-endpoint"
		})

		const mockJsonResolver = jest.fn(() => "mockValue")
		const defaultSourceWithOverrides = ConfigSourceAzureAppConfiguration.createDefault({
			endpoint: "https://test-endpoint",
			contentTypeResolvers: new Map([["application/json", mockJsonResolver as any]])
		})

		expect(defaultSource).toBeInstanceOf(ConfigSourceAzureAppConfiguration)
		expect(defaultSourceWithOverrides).toBeInstanceOf(ConfigSourceAzureAppConfiguration)

		defaultSource["options"].client = mockAppConfigClient as any
		defaultSourceWithOverrides["options"].client = mockAppConfigClient as any

		await defaultSource.onBuildStart()
		await defaultSourceWithOverrides.onBuildStart()
		await defaultSource.get("foo")
		await defaultSourceWithOverrides.get("foo")

		expect(await defaultSource.get("json")).toEqual({ hey: true, there: 42 })
		expect(await defaultSourceWithOverrides.get("json")).toEqual("mockValue")
		expect(mockJsonResolver).toHaveBeenCalled()
	})

	it("checks labels before falling back to unlabelled", async () => {
		await source.onBuildStart()
		await source.get("foo")

		expect(await source.get("foo")).toEqual("labelled-dev")
		expect(await source.get("not-defined")).not.toBeDefined()
		expect(await source.get("bar")).toEqual("bar")
	})
	it("falls back to first defined label", async () => {
		source = new ConfigSourceAzureAppConfiguration({
			labels: ["int", "pr987", "pr123", "dev"],
			client: mockAppConfigClient as any
		})
		await source.onBuildStart()
		await source.get("foo")

		expect(await source.get("foo")).toEqual("labelled-pr123")
		expect(await source.get("bar")).toEqual("bar")
	})

	it("does not use unlabelled if configured so", async () => {
		source = new ConfigSourceAzureAppConfiguration({
			labels: ["dev"],
			fallbackToUnlabelled: false,
			client: mockAppConfigClient as any
		})

		await source.onBuildStart()
		await source.get("foo")

		expect(await source.get("foo")).toEqual("labelled-dev")
		expect(await source.get("bar")).not.toBeDefined()
	})

	it("supports resolving content types by string", async () => {
		const mockJsonResolver = jest.fn(({ value }) => JSON.parse(value))
		const contentTypeResolvers = new Map([["application/json", mockJsonResolver]])
		source = new ConfigSourceAzureAppConfiguration({
			labels: ["dev"],
			client: mockAppConfigClient as any,
			contentTypeResolvers
		})

		await source.onBuildStart()
		await source.get("foo")
		expect(mockJsonResolver.mock.calls.length).toBe(2)
		expect(mockJsonResolver.mock.calls[0][0]).toEqual({
			key: "json",
			value: JSON.stringify({ hey: true, there: 42 }),
			contentType: "application/json"
		})
		expect(mockJsonResolver.mock.calls[1][0]).toEqual({
			key: "json",
			label: "dev",
			value: JSON.stringify({ hey: true, there: 42, labelled: "yes" }),
			contentType: "application/json"
		})

		expect(await source.get("json")).toEqual({ hey: true, there: 42, labelled: "yes" })
	})
	it("supports resolving content types by regex", async () => {
		const mockJsonResolver = jest.fn(({ value }) => JSON.parse(value))
		const contentTypeResolvers = new Map([[/application\/json/, mockJsonResolver]])
		source = new ConfigSourceAzureAppConfiguration({
			labels: ["dev"],
			client: mockAppConfigClient as any,
			contentTypeResolvers
		})

		await source.onBuildStart()
		await source.get("foo")
		expect(mockJsonResolver.mock.calls.length).toBe(2)
		expect(mockJsonResolver.mock.calls[0][0]).toEqual({
			key: "json",
			value: JSON.stringify({ hey: true, there: 42 }),
			contentType: "application/json"
		})
		expect(mockJsonResolver.mock.calls[1][0]).toEqual({
			key: "json",
			label: "dev",
			value: JSON.stringify({ hey: true, there: 42, labelled: "yes" }),
			contentType: "application/json"
		})

		expect(await source.get("json")).toEqual({ hey: true, there: 42, labelled: "yes" })
	})

	it("throws if config resolver throws", async () => {
		const mockError = new ConfigBuilderAzureSourceContentTypeResolverError("mockError")
		// Because values are preloaded we need to be able to control which resolver throws in order to properly test the resolver error type
		const throwIn = {
			json: true,
			textPlain: true
		}

		const contentTypeResolvers = new Map<string, ContentTypeResolver<any>>([
			[
				"application/json",
				({ value }) => {
					if (throwIn.json) {
						throw mockError
					}
					return value as any
				}
			],
			[
				"text/plain",
				({ value }) => {
					if (throwIn.textPlain) {
						throw new Error("rawError")
					}
					return value as any
				}
			]
		])

		const newSource = new ConfigSourceAzureAppConfiguration({
			labels: ["dev"],
			client: mockAppConfigClient as any,
			contentTypeResolvers
		})

		await expect(async () => newSource.get("foo")).rejects.toThrow(ConfigBuilderAzureSourceContentTypeResolverError)
		throwIn.textPlain = false
		await expect(async () => newSource.get("json")).rejects.toThrow(mockError)
	})
})
