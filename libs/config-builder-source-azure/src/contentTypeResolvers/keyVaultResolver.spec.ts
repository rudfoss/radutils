/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigurationSetting } from "@azure/app-configuration"
import { KeyVaultSecret } from "@azure/keyvault-secrets"
import { ConfigBuilderAzureSourceKeyVaultReferenceNotFoundError } from "../errors"
import { keyVaultReferenceContentType, keyVaultResolver } from "./keyVaultResolver"

const credential = {} as any

const mockKVSetting = (name: string): ConfigurationSetting => ({
	key: "key",
	contentType: keyVaultReferenceContentType,
	isReadOnly: false,
	value: `{"uri":"https://test-key-vault.vault.azure.net/secrets/${name}"}`
})

class MockSecretClient {
	public constructor(public mockValues: Record<string, string>) {}

	public getSecret = jest.fn(async (name: string): Promise<KeyVaultSecret> => {
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
	const secretClientConstructor = jest.fn(() => {
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

	it("returns undefined if the config has no value", async () => {
		expect(await resolver({ key: "key", isReadOnly: false })).not.toBeDefined()
	})

	it("throws if config setting is not valid JSON", async () => {
		expect(() => resolver({ key: "key", isReadOnly: true, value: `{"uri":` })).rejects.toThrow(Error)
	})
	it("throws when not found (if configured to do so)", async () => {
		expect(() => resolver(mockKVSetting("non-existent"))).rejects.toThrow(
			ConfigBuilderAzureSourceKeyVaultReferenceNotFoundError
		)
		// expect(await resolver(mockKVSetting("baz"))).toEqual("42")

		// const nonThrowingResolver = keyVaultResolver({
		// 	credential,
		// 	throwIfValuleNotFound: false,
		// 	secretClientConstructor: secretClientConstructor as any
		// })
		// expect(await nonThrowingResolver(mockKVSetting("baz"))).toEqual("42")
		// expect(await nonThrowingResolver(mockKVSetting("non-existent"))).toEqual(undefined)
	})
})
