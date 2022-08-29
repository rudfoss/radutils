import type { TokenCredential } from "@azure/identity"
import { SecretClient } from "@azure/keyvault-secrets"
import { ContentTypeResolver } from "../ContentTypeResolver"
import { ConfigBuilderAzureSourceKeyVaultReferenceNotFoundError } from "../errors/ConfigBuilderAzureSourceKeyVaultReferenceNotFoundError"

export interface KeyVaultResolverOptions {
	/**
	 * The credential to use when connecting to the referenced key vault.
	 */
	credential: TokenCredential
	/**
	 * If true will throw if the referenced key vault value does not exist. If false will return undefined.
	 * @default true
	 */
	throwIfValuleNotFound?: boolean

	/**
	 * Override how a SecretClient is constructed. Defaults to `new SecretClient()`
	 */
	secretClientConstructor?: (keyVaultUri: string, credential: TokenCredential) => SecretClient
}

interface KeyVaultReferenceValue {
	uri: string
}

/**
 * The content type string for a key vault reference.
 */
export const keyVaultReferenceContentType = "application/vnd.microsoft.appconfig.keyvaultref+json;charset=utf-8"

export const keyVaultResolver =
	({
		credential,
		throwIfValuleNotFound = true,
		secretClientConstructor = (keyVaultUri, credential) => new SecretClient(keyVaultUri, credential)
	}: KeyVaultResolverOptions): ContentTypeResolver<string> =>
	async (configSetting) => {
		const { key, label, value } = configSetting
		if (!value) return undefined

		let keyVaultRef: KeyVaultReferenceValue
		try {
			keyVaultRef = JSON.parse(value)
		} catch (error) {
			throw new Error(
				`Failed to parse JSON value of key "${key}@${label}". Expected JSON format for key vault reference.`,
				error as Error
			)
		}

		const [keyVaultSecretUri, secretName] = keyVaultRef.uri.split("/secrets/")
		try {
			const secretClient = secretClientConstructor(keyVaultSecretUri, credential)
			const secretValue = await secretClient.getSecret(secretName)
			return secretValue?.value
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error.statusCode === 404) {
				if (!throwIfValuleNotFound) {
					return undefined
				}

				throw new ConfigBuilderAzureSourceKeyVaultReferenceNotFoundError(secretName, keyVaultSecretUri, error)
			}
			throw error
		}
	}
