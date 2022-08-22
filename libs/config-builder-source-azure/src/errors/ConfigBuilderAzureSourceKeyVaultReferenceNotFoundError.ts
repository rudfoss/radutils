import { ConfigBuilderAzureSourceError } from "./ConfigBuilderAzureSourceError"

export class ConfigBuilderAzureSourceKeyVaultReferenceNotFoundError extends ConfigBuilderAzureSourceError {
	public constructor(public secretName: string, public vaultUrl: string, public innerError: Error) {
		super(`Secret "${secretName}" does not exist in vault "${vaultUrl}"`)
		this.stack = innerError.stack
	}
}
