import { ConfigBuilderAzureSourceError } from "./ConfigBuilderAzureSourceError"

export class ConfigBuilderAzureSourceContentTypeResolverError extends ConfigBuilderAzureSourceError {
	public constructor(message?: string, public innerError?: Error) {
		super(message)
		if (innerError) {
			this.stack = innerError.stack
		}
	}
}
