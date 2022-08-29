/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigurationSetting } from "@azure/app-configuration"
import { KeyVaultSecret } from "@azure/keyvault-secrets"
import { ConfigBuilderAzureSourceKeyVaultReferenceNotFoundError } from "../errors"
import { keyVaultReferenceContentType, keyVaultResolver } from "./keyVaultResolver"

const credential = {} as any

const mockKVSetting = (name: string, key = "key"): ConfigurationSetting => ({
	key,
	contentType: keyVaultReferenceContentType,
	isReadOnly: false,
	value: `{"uri":"https://test-key-vault.vault.azure.net/secrets/${name}"}`
})

class MockSecretClient {
	public constructor(public mockValues: Record<string, string | undefined>) {}

	public getSecret = jest.fn(async (name: string): Promise<KeyVaultSecret | undefined> => {
		// Mock value for testing blank values
		if (name === "blankValue") {
			return undefined
		}
		if (name === "throwUnknownError") {
			throw new Error("Unknown error")
		}

		const value = this.mockValues[name]

		if (!value) {
			const err: any = new Error(`"${name}" secret not found`)
			err.statusCode = 404
			throw err
		}

		return {
			name,
			properties: {} as any,
			value: this.mockValues[name]
		}
	})

	public static mockValues = {
		foo: "bar",
		baz: "42"
	}
}

describe("keyVaultResolver", () => {
	let resolver: ReturnType<typeof keyVaultResolver>
	const mockSecretClient = new MockSecretClient(MockSecretClient.mockValues)

	// Prevents tuple error in tests inspecting arguments
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const secretClientConstructor = jest.fn((_, _2) => {
		return mockSecretClient
	})
	beforeEach(() => {
		mockSecretClient.getSecret.mockClear()
		secretClientConstructor.mockClear()
		resolver = keyVaultResolver({ credential, secretClientConstructor: secretClientConstructor as any })
	})

	it("is defined", () => {
		expect(typeof keyVaultResolver).toEqual("function")
	})
	it("chains constructor with implementation", () => {
		expect(typeof keyVaultResolver({ credential })).toEqual("function")
	})

	it("uses SecretClient constructor function provided", async () => {
		expect(await resolver(mockKVSetting("foo"))).toEqual("bar")
		expect(secretClientConstructor.mock.calls.length).toBe(1)
		expect(secretClientConstructor.mock.calls[0][0]).toEqual("https://test-key-vault.vault.azure.net")
		expect(secretClientConstructor.mock.calls[0][1]).toBe(credential)

		expect(mockSecretClient.getSecret.mock.calls.length).toBe(1)
		expect(mockSecretClient.getSecret.mock.calls[0][0]).toEqual("foo")
	})

	it("returns defined secrets from secret client", async () => {
		expect(await resolver(mockKVSetting("foo"))).toEqual("bar")
		expect(await resolver(mockKVSetting("baz"))).toEqual("42")
	})

	it("returns undefined if the config has no value", async () => {
		expect(await resolver({ key: "key", isReadOnly: false })).not.toBeDefined()
	})
	it("returns undefined if secret value is undefined", async () => {
		expect(await resolver(mockKVSetting("blankValue"))).not.toBeDefined()
	})

	it("rethrows error if secret client throws non-404 error", async () => {
		await expect(() => resolver(mockKVSetting("throwUnknownError"))).rejects.toThrow(new Error("Unknown error"))
	})

	it("throws if config setting is not valid JSON", async () => {
		await expect(() => resolver({ key: "key", isReadOnly: true, value: `{"uri":` })).rejects.toThrow(Error)
	})
	it("throws when not found (if configured to do so)", async () => {
		await expect(() => resolver(mockKVSetting("non-existent"))).rejects.toThrow(
			ConfigBuilderAzureSourceKeyVaultReferenceNotFoundError
		)
		expect(await resolver(mockKVSetting("baz"))).toEqual("42")
	})
	it("returns undefined if not found and not configured to throw", async () => {
		const nonThrowingResolver = keyVaultResolver({
			credential,
			throwIfValuleNotFound: false,
			secretClientConstructor: secretClientConstructor as any
		})
		expect(await nonThrowingResolver(mockKVSetting("non-existent"))).toEqual(undefined)
		expect(await nonThrowingResolver(mockKVSetting("baz"))).toEqual("42")
	})
})
